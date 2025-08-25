import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';
import { User } from '../users/entities/user.entity';
import { ActivityLog } from '../analytics/entities/activity-log.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(ChipsWallet)
    private chipsWalletRepository: Repository<ChipsWallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  // Create payment transaction
  async createPaymentTransaction(
    userId: string,
    amount: number,
    chipsAmount: number,
    paymentMethod: string,
  ) {
    const transaction = this.transactionRepository.create({
      userId,
      transactionType: 'purchase',
      amount,
      chipsAmount,
      paymentMethod,
      paymentStatus: 'pending',
      midtransOrderId: `ORDER-${Date.now()}-${userId.slice(-4)}`,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'payment_initiated',
      description: `Payment transaction initiated for ${chipsAmount} chips`,
      metadata: { transactionId: savedTransaction.id, amount, paymentMethod },
    });

    return savedTransaction;
  }

  // Process successful payment
  async processSuccessfulPayment(transactionId: string, midtransResponse: any) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.paymentStatus !== 'pending') {
      throw new Error('Transaction is not in pending status');
    }

    // Update transaction status
    await this.transactionRepository.update(transactionId, {
      paymentStatus: 'success',
      midtransTransactionId: midtransResponse.transaction_id,
      midtransResponse: midtransResponse,
      completedAt: new Date(),
    });

    // Add chips to user wallet
    await this.chipsWalletRepository.update(
      { userId: transaction.userId },
      {
        balance: () => `balance + ${transaction.chipsAmount}`,
        totalPurchased: () => `total_purchased + ${transaction.chipsAmount}`,
      },
    );

    // Log activity
    await this.activityLogRepository.save({
      userId: transaction.userId,
      activityType: 'payment_success',
      description: `Payment successful: ${transaction.chipsAmount} chips added`,
      metadata: { 
        transactionId, 
        amount: transaction.amount,
        chipsAmount: transaction.chipsAmount,
        midtransTransactionId: midtransResponse.transaction_id,
      },
    });

    return { success: true, message: 'Payment processed successfully' };
  }

  // Process failed payment
  async processFailedPayment(transactionId: string, reason: string) {
    await this.transactionRepository.update(transactionId, {
      paymentStatus: 'failed',
      completedAt: new Date(),
    });

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    // Log activity
    await this.activityLogRepository.save({
      userId: transaction.userId,
      activityType: 'payment_failed',
      description: `Payment failed: ${reason}`,
      metadata: { transactionId, reason },
    });

    return { success: false, message: 'Payment failed' };
  }

  // Get user transaction history
  async getUserTransactions(userId: string, page: number = 1, limit: number = 10) {
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

  // Get transaction by ID
  async getTransactionById(id: string) {
    return await this.transactionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  // Get pending transactions
  async getPendingTransactions() {
    return await this.transactionRepository.find({
      where: { paymentStatus: 'pending' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Cancel transaction
  async cancelTransaction(transactionId: string, reason: string) {
    await this.transactionRepository.update(transactionId, {
      paymentStatus: 'cancelled',
      completedAt: new Date(),
    });

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    // Log activity
    await this.activityLogRepository.save({
      userId: transaction.userId,
      activityType: 'payment_cancelled',
      description: `Payment cancelled: ${reason}`,
      metadata: { transactionId, reason },
    });

    return { success: true, message: 'Transaction cancelled' };
  }

  // Get payment statistics
  async getPaymentStats() {
    const totalTransactions = await this.transactionRepository.count();
    const successfulTransactions = await this.transactionRepository.count({
      where: { paymentStatus: 'success' },
    });
    const pendingTransactions = await this.transactionRepository.count({
      where: { paymentStatus: 'pending' },
    });
    const failedTransactions = await this.transactionRepository.count({
      where: { paymentStatus: 'failed' },
    });

    const totalRevenue = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.paymentStatus = :status', { status: 'success' })
      .getRawOne();

    const totalChipsSold = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.chipsAmount)', 'total')
      .where('transaction.paymentStatus = :status', { status: 'success' })
      .getRawOne();

    return {
      totalTransactions,
      successfulTransactions,
      pendingTransactions,
      failedTransactions,
      totalRevenue: totalRevenue?.total || 0,
      totalChipsSold: totalChipsSold?.total || 0,
      successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
    };
  }
}
