import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { User } from '../users/entities/user.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';
import { ActivityLog } from '../analytics/entities/activity-log.entity';
import { Transaction } from '../payments/entities/transaction.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SupportTicket)
    private supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChipsWallet)
    private chipsWalletRepository: Repository<ChipsWallet>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  // Dashboard Statistics
  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    const totalTransactions = await this.transactionRepository.count();
    const pendingTickets = await this.supportTicketRepository.count({
      where: { status: 'open' },
    });

    const totalChipsInCirculation = await this.chipsWalletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.balance)', 'total')
      .getRawOne();

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      pendingTickets,
      totalChipsInCirculation: totalChipsInCirculation?.total || 0,
    };
  }

  // User Management
  async getAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['chipsWallet'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['chipsWallet', 'referrals', 'activityLogs'],
    });
  }

  async suspendUser(id: string, reason: string, adminId: string) {
    await this.userRepository.update(id, {
      isBanned: true,
      banReason: reason,
    });

    // Log activity
    await this.activityLogRepository.save({
      user_id: id,
      activity_type: 'user_suspended',
      description: `User suspended by admin. Reason: ${reason}`,
      metadata: { admin_id: adminId, reason },
    });

    return { success: true, message: 'User suspended successfully' };
  }

  async unsuspendUser(id: string, adminId: string) {
    await this.userRepository.update(id, {
      isBanned: false,
      banReason: null,
      banUntil: null,
    });

    // Log activity
    await this.activityLogRepository.save({
      user_id: id,
      activity_type: 'user_unsuspended',
      description: 'User unsuspended by admin',
      metadata: { admin_id: adminId },
    });

    return { success: true, message: 'User unsuspended successfully' };
  }

  // Chip Management
  async addChipsToUser(userId: string, amount: number, adminId: string, notes?: string) {
    const wallet = await this.chipsWalletRepository.findOne({
      where: { userId: userId },
    });

    if (!wallet) {
      throw new Error('User wallet not found');
    }

    // Update wallet balance
    await this.chipsWalletRepository.update(
      { userId: userId },
      { balance: () => `balance + ${amount}` }
    );

    // Create transaction record
    await this.transactionRepository.save({
      userId: userId,
      transactionType: 'manual_add',
      amount: 0, // No real money involved
      chipsAmount: amount,
      paymentStatus: 'success',
      adminUserId: adminId,
      adminNotes: notes,
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId: userId,
      activityType: 'chips_added_by_admin',
      description: `${amount} chips added by admin`,
      metadata: { admin_id: adminId, amount, notes },
    });

    return { success: true, message: `${amount} chips added successfully` };
  }

  async deductChipsFromUser(userId: string, amount: number, adminId: string, notes?: string) {
    const wallet = await this.chipsWalletRepository.findOne({
      where: { userId: userId },
    });

    if (!wallet) {
      throw new Error('User wallet not found');
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update wallet balance
    await this.chipsWalletRepository.update(
      { userId: userId },
      { balance: () => `balance - ${amount}` }
    );

    // Create transaction record
    await this.transactionRepository.save({
      userId: userId,
      transactionType: 'manual_deduct',
      amount: 0, // No real money involved
      chipsAmount: -amount,
      paymentStatus: 'success',
      adminUserId: adminId,
      adminNotes: notes,
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId: userId,
      activityType: 'chips_deducted_by_admin',
      description: `${amount} chips deducted by admin`,
      metadata: { admin_id: adminId, amount, notes },
    });

    return { success: true, message: `${amount} chips deducted successfully` };
  }

  // Support Tickets
  async getAllTickets(page: number = 1, limit: number = 10, status?: string) {
    const whereCondition = status ? { status } : {};
    
    const [tickets, total] = await this.supportTicketRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'adminUser'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTicketById(id: string) {
    return await this.supportTicketRepository.findOne({
      where: { id },
      relations: ['user', 'adminUser'],
    });
  }

  async respondToTicket(id: string, response: string, adminId: string) {
    await this.supportTicketRepository.update(id, {
      adminResponse: response,
      adminUserId: adminId,
      status: 'in_progress',
      updatedAt: new Date(),
    });

    return { success: true, message: 'Response added successfully' };
  }

  async resolveTicket(id: string, adminId: string) {
    await this.supportTicketRepository.update(id, {
      status: 'resolved',
      adminUserId: adminId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, message: 'Ticket resolved successfully' };
  }

  // System Settings
  async getAllSettings() {
    return await this.systemSettingRepository.find({
      order: { settingKey: 'ASC' },
    });
  }

  async updateSetting(key: string, value: string, adminId: string) {
    await this.systemSettingRepository.update(
      { settingKey: key },
      { 
        settingValue: value,
        updatedAt: new Date(),
      }
    );

    // Log activity
    await this.activityLogRepository.save({
      activityType: 'system_setting_updated',
      description: `System setting ${key} updated`,
      metadata: { admin_id: adminId, key, value },
    });

    return { success: true, message: 'Setting updated successfully' };
  }

  // Activity Logs
  async getActivityLogs(page: number = 1, limit: number = 50, userId?: string, activityType?: string) {
    const whereCondition: any = {};
    if (userId) whereCondition.userId = userId;
    if (activityType) whereCondition.activityType = activityType;

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where: whereCondition,
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Transaction Management
  async getAllTransactions(page: number = 1, limit: number = 20, status?: string) {
    const whereCondition = status ? { paymentStatus: status } : {};
    
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'adminUser'],
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

  async refundTransaction(id: string, adminId: string, reason: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.paymentStatus !== 'success') {
      throw new Error('Only successful transactions can be refunded');
    }

    // Deduct chips from user
    await this.chipsWalletRepository.update(
      { userId: transaction.userId },
      { balance: () => `balance - ${transaction.chipsAmount}` }
    );

    // Create refund transaction record
    await this.transactionRepository.save({
      userId: transaction.userId,
      transactionType: 'refund',
      amount: -transaction.amount,
      chipsAmount: -transaction.chipsAmount,
      paymentStatus: 'success',
      adminUserId: adminId,
      adminNotes: reason,
      completedAt: new Date(),
    });

    // Log activity
    await this.activityLogRepository.save({
      userId: transaction.userId,
      activityType: 'transaction_refunded',
      description: `Transaction refunded by admin. Reason: ${reason}`,
      metadata: { admin_id: adminId, original_transaction_id: id, reason },
    });

    return { success: true, message: 'Transaction refunded successfully' };
  }
}
