import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChipsWallet } from './entities/chips-wallet.entity';
import { User } from '../users/entities/user.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { ActivityLog } from '../analytics/entities/activity-log.entity';

@Injectable()
export class ChipService {
  constructor(
    @InjectRepository(ChipsWallet)
    private chipsWalletRepository: Repository<ChipsWallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  // Create wallet for new user
  async createWallet(userId: string, initialBalance: number = 5000000) {
    const existingWallet = await this.chipsWalletRepository.findOne({
      where: { userId },
    });

    if (existingWallet) {
      throw new Error('Wallet already exists for this user');
    }

    const wallet = this.chipsWalletRepository.create({
      userId,
      balance: initialBalance,
      totalBonusReceived: initialBalance, // Initial bonus
    });

    const savedWallet = await this.chipsWalletRepository.save(wallet);

    // Create transaction record for initial bonus
    await this.transactionRepository.save({
      userId,
      transactionType: 'bonus',
      amount: 0,
      chipsAmount: initialBalance,
      paymentStatus: 'success',
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'wallet_created',
      description: `Wallet created with initial bonus: ${initialBalance} chips`,
      metadata: { initialBalance },
    });

    return savedWallet;
  }

  // Get user wallet
  async getUserWallet(userId: string) {
    const wallet = await this.chipsWalletRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }

  // Add chips to wallet (admin function)
  async addChipsManually(
    userId: string,
    amount: number,
    adminId: string,
    reason: string,
  ) {
    const wallet = await this.getUserWallet(userId);

    await this.chipsWalletRepository.update(
      { userId },
      {
        balance: () => `balance + ${amount}`,
        totalBonusReceived: () => `total_bonus_received + ${amount}`,
      },
    );

    // Create transaction record
    await this.transactionRepository.save({
      userId,
      transactionType: 'manual_add',
      amount: 0,
      chipsAmount: amount,
      paymentStatus: 'success',
      adminUserId: adminId,
      adminNotes: reason,
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'chips_added_manually',
      description: `${amount} chips added manually by admin. Reason: ${reason}`,
      metadata: { amount, adminId, reason },
    });

    return {
      success: true,
      message: `${amount} chips added successfully`,
      newBalance: wallet.balance + amount,
    };
  }

  // Deduct chips from wallet (admin function)
  async deductChipsManually(
    userId: string,
    amount: number,
    adminId: string,
    reason: string,
  ) {
    const wallet = await this.getUserWallet(userId);

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.chipsWalletRepository.update(
      { userId },
      {
        balance: () => `balance - ${amount}`,
      },
    );

    // Create transaction record
    await this.transactionRepository.save({
      userId,
      transactionType: 'manual_deduct',
      amount: 0,
      chipsAmount: -amount,
      paymentStatus: 'success',
      adminUserId: adminId,
      adminNotes: reason,
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'chips_deducted_manually',
      description: `${amount} chips deducted manually by admin. Reason: ${reason}`,
      metadata: { amount, adminId, reason },
    });

    return {
      success: true,
      message: `${amount} chips deducted successfully`,
      newBalance: wallet.balance - amount,
    };
  }

  // Transfer chips between users (for game purposes)
  async transferChips(fromUserId: string, toUserId: string, amount: number, reason: string) {
    const fromWallet = await this.getUserWallet(fromUserId);
    const toWallet = await this.getUserWallet(toUserId);

    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from sender
    await this.chipsWalletRepository.update(
      { userId: fromUserId },
      {
        balance: () => `balance - ${amount}`,
      },
    );

    // Add to receiver
    await this.chipsWalletRepository.update(
      { userId: toUserId },
      {
        balance: () => `balance + ${amount}`,
      },
    );

    // Log activities
    await this.activityLogRepository.save([
      {
        userId: fromUserId,
        activityType: 'chips_transferred_out',
        description: `Transferred ${amount} chips to user. Reason: ${reason}`,
        metadata: { amount, toUserId, reason },
      },
      {
        userId: toUserId,
        activityType: 'chips_transferred_in',
        description: `Received ${amount} chips from user. Reason: ${reason}`,
        metadata: { amount, fromUserId, reason },
      },
    ]);

    return {
      success: true,
      message: `${amount} chips transferred successfully`,
      fromBalance: fromWallet.balance - amount,
      toBalance: toWallet.balance + amount,
    };
  }

  // Get wallet statistics
  async getWalletStats() {
    const totalWallets = await this.chipsWalletRepository.count();
    
    const totalChipsInCirculation = await this.chipsWalletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.balance)', 'total')
      .getRawOne();

    const totalChipsPurchased = await this.chipsWalletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.totalPurchased)', 'total')
      .getRawOne();

    const totalBonusGiven = await this.chipsWalletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.totalBonusReceived)', 'total')
      .getRawOne();

    const averageBalance = await this.chipsWalletRepository
      .createQueryBuilder('wallet')
      .select('AVG(wallet.balance)', 'average')
      .getRawOne();

    // Top 10 richest users
    const topUsers = await this.chipsWalletRepository.find({
      relations: ['user'],
      order: { balance: 'DESC' },
      take: 10,
    });

    // Users with low balance (less than 10K)
    const lowBalanceUsers = await this.chipsWalletRepository.count({
      where: {
        balance: {
          lt: 10000,
        } as any,
      },
    });

    return {
      totalWallets,
      totalChipsInCirculation: totalChipsInCirculation?.total || 0,
      totalChipsPurchased: totalChipsPurchased?.total || 0,
      totalBonusGiven: totalBonusGiven?.total || 0,
      averageBalance: Math.floor(averageBalance?.average || 0),
      topUsers: topUsers.map(wallet => ({
        userId: wallet.userId,
        username: wallet.user?.username,
        balance: wallet.balance,
      })),
      lowBalanceUsers,
    };
  }

  // Check if user has enough chips
  async hasEnoughChips(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.getUserWallet(userId);
    return wallet.balance >= amount;
  }

  // Reserve chips for game (temporary hold)
  async reserveChips(userId: string, amount: number, gameId: string) {
    const wallet = await this.getUserWallet(userId);

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance to reserve chips');
    }

    // In a real implementation, you might want to have a separate "reserved" field
    // For now, we'll just log the reservation
    await this.activityLogRepository.save({
      userId,
      activityType: 'chips_reserved',
      description: `${amount} chips reserved for game`,
      metadata: { amount, gameId },
    });

    return {
      success: true,
      message: `${amount} chips reserved for game`,
      availableBalance: wallet.balance - amount,
    };
  }

  // Release reserved chips
  async releaseReservedChips(userId: string, amount: number, gameId: string) {
    await this.activityLogRepository.save({
      userId,
      activityType: 'chips_released',
      description: `${amount} chips released from game reservation`,
      metadata: { amount, gameId },
    });

    return {
      success: true,
      message: `${amount} chips released from reservation`,
    };
  }

  // Get user's chip transaction history
  async getUserChipHistory(userId: string, page: number = 1, limit: number = 20) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Reset user wallet (admin function - dangerous!)
  async resetUserWallet(userId: string, adminId: string, reason: string) {
    const initialBalance = 5000000; // Reset to initial bonus

    await this.chipsWalletRepository.update(
      { userId },
      {
        balance: initialBalance,
        totalPurchased: 0,
        totalBonusReceived: initialBalance,
      },
    );

    // Create transaction record
    await this.transactionRepository.save({
      userId,
      transactionType: 'manual_add',
      amount: 0,
      chipsAmount: initialBalance,
      paymentStatus: 'success',
      adminUserId: adminId,
      adminNotes: `Wallet reset. Reason: ${reason}`,
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'wallet_reset',
      description: `Wallet reset by admin. Reason: ${reason}`,
      metadata: { adminId, reason, newBalance: initialBalance },
    });

    return {
      success: true,
      message: 'Wallet reset successfully',
      newBalance: initialBalance,
    };
  }
}
