import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyBonus } from './entities/daily-bonus.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from '../analytics/entities/activity-log.entity';
import { Transaction } from '../payments/entities/transaction.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(DailyBonus)
    private dailyBonusRepository: Repository<DailyBonus>,
    @InjectRepository(ChipsWallet)
    private chipsWalletRepository: Repository<ChipsWallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  // Check if user can claim daily bonus
  async canClaimDailyBonus(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBonus = await this.dailyBonusRepository.findOne({
      where: {
        userId,
        bonusDate: today,
      },
    });

    return !todayBonus;
  }

  // Get user's current streak
  async getUserStreak(userId: string): Promise<number> {
    const bonuses = await this.dailyBonusRepository.find({
      where: { userId },
      order: { bonusDate: 'DESC' },
      take: 30, // Check last 30 days
    });

    if (bonuses.length === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user claimed today
    const todayBonus = bonuses.find(bonus => {
      const bonusDate = new Date(bonus.bonusDate);
      bonusDate.setHours(0, 0, 0, 0);
      return bonusDate.getTime() === today.getTime();
    });

    let checkDate = todayBonus ? new Date(today) : new Date(today.getTime() - 24 * 60 * 60 * 1000);
    checkDate.setHours(0, 0, 0, 0);

    for (const bonus of bonuses) {
      const bonusDate = new Date(bonus.bonusDate);
      bonusDate.setHours(0, 0, 0, 0);

      if (bonusDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setTime(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return streak;
  }

  // Claim daily bonus
  async claimDailyBonus(userId: string) {
    const canClaim = await this.canClaimDailyBonus(userId);
    if (!canClaim) {
      throw new Error('Daily bonus already claimed today');
    }

    const currentStreak = await this.getUserStreak(userId);
    const newStreak = currentStreak + 1;

    // Calculate bonus amount based on streak
    const baseBonus = 100000; // 100K base bonus
    const multiplier = Math.min(newStreak * 0.1 + 1, 2.5); // Max 2.5x multiplier
    const bonusAmount = Math.floor(baseBonus * multiplier);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create daily bonus record
    const dailyBonus = this.dailyBonusRepository.create({
      userId,
      dayStreak: newStreak,
      bonusAmount,
      bonusDate: today,
    });

    await this.dailyBonusRepository.save(dailyBonus);

    // Add chips to user wallet
    await this.chipsWalletRepository.update(
      { userId },
      {
        balance: () => `balance + ${bonusAmount}`,
        totalBonusReceived: () => `total_bonus_received + ${bonusAmount}`,
      },
    );

    // Create transaction record
    await this.transactionRepository.save({
      userId,
      transactionType: 'bonus',
      amount: 0,
      chipsAmount: bonusAmount,
      paymentStatus: 'success',
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'daily_bonus_claimed',
      description: `Daily bonus claimed: ${bonusAmount} chips (streak: ${newStreak})`,
      metadata: { bonusAmount, streak: newStreak, multiplier },
    });

    return {
      success: true,
      bonusAmount,
      streak: newStreak,
      multiplier,
      message: `Daily bonus claimed! You received ${bonusAmount} chips.`,
    };
  }

  // Get user's daily bonus history
  async getUserDailyBonusHistory(userId: string, page: number = 1, limit: number = 30) {
    const [bonuses, total] = await this.dailyBonusRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { bonusDate: 'DESC' },
    });

    return {
      bonuses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get daily bonus statistics
  async getDailyBonusStats() {
    const totalBonusesClaimed = await this.dailyBonusRepository.count();
    const totalBonusAmount = await this.dailyBonusRepository
      .createQueryBuilder('daily_bonus')
      .select('SUM(daily_bonus.bonusAmount)', 'total')
      .getRawOne();

    const uniqueUsers = await this.dailyBonusRepository
      .createQueryBuilder('daily_bonus')
      .select('COUNT(DISTINCT daily_bonus.userId)', 'count')
      .getRawOne();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBonuses = await this.dailyBonusRepository.count({
      where: { bonusDate: today },
    });

    const averageBonusAmount = totalBonusesClaimed > 0 
      ? Math.floor((totalBonusAmount?.total || 0) / totalBonusesClaimed)
      : 0;

    // Top streaks
    const topStreaks = await this.dailyBonusRepository
      .createQueryBuilder('daily_bonus')
      .select('daily_bonus.userId', 'userId')
      .addSelect('MAX(daily_bonus.dayStreak)', 'maxStreak')
      .groupBy('daily_bonus.userId')
      .orderBy('maxStreak', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalBonusesClaimed,
      totalBonusAmount: totalBonusAmount?.total || 0,
      uniqueUsers: uniqueUsers?.count || 0,
      todayBonuses,
      averageBonusAmount,
      topStreaks,
    };
  }

  // Reset user streak (admin function)
  async resetUserStreak(userId: string, adminId: string) {
    // This doesn't delete records, just breaks the streak
    // The next bonus claim will start from streak 1
    
    await this.activityLogRepository.save({
      userId,
      activityType: 'streak_reset_by_admin',
      description: 'Daily bonus streak reset by admin',
      metadata: { admin_id: adminId },
    });

    return { success: true, message: 'User streak will be reset on next bonus claim' };
  }

  // Get bonus calendar for user (last 30 days)
  async getUserBonusCalendar(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const bonuses = await this.dailyBonusRepository.find({
      where: {
        userId,
        bonusDate: {
          gte: thirtyDaysAgo,
        } as any,
      },
      order: { bonusDate: 'ASC' },
    });

    const calendar = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const bonus = bonuses.find(b => {
        const bonusDate = new Date(b.bonusDate);
        bonusDate.setHours(0, 0, 0, 0);
        return bonusDate.getTime() === date.getTime();
      });

      calendar.push({
        date: date.toISOString().split('T')[0],
        claimed: !!bonus,
        bonusAmount: bonus?.bonusAmount || 0,
        streak: bonus?.dayStreak || 0,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    return calendar;
  }

  // Create special event bonus
  async createSpecialEventBonus(
    eventName: string,
    bonusAmount: number,
    validUntil: Date,
    adminId: string,
  ) {
    // This would be for special events like holidays, tournaments, etc.
    await this.activityLogRepository.save({
      activityType: 'special_event_created',
      description: `Special event created: ${eventName}`,
      metadata: { 
        admin_id: adminId, 
        eventName, 
        bonusAmount, 
        validUntil: validUntil.toISOString(),
      },
    });

    return {
      success: true,
      message: `Special event "${eventName}" created with ${bonusAmount} chips bonus`,
    };
  }
}
