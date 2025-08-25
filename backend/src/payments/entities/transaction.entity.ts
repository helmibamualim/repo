import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transactions')
@Index(['userId'])
@Index(['paymentStatus'])
@Index(['transactionType'])
@Index(['midtransOrderId'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'transaction_type', length: 20 })
  transactionType: string; // purchase, bonus, referral, manual_add, manual_deduct

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ name: 'chips_amount', type: 'bigint' })
  chipsAmount: number;

  @Column({ name: 'payment_method', nullable: true, length: 50 })
  paymentMethod?: string;

  @Column({ name: 'payment_status', default: 'pending', length: 20 })
  paymentStatus: string; // pending, success, failed, cancelled

  @Column({ name: 'midtrans_order_id', nullable: true, length: 100 })
  midtransOrderId?: string;

  @Column({ name: 'midtrans_transaction_id', nullable: true, length: 100 })
  midtransTransactionId?: string;

  @Column({ name: 'midtrans_response', type: 'jsonb', nullable: true })
  midtransResponse?: any;

  @Column({ name: 'admin_user_id', nullable: true })
  adminUserId?: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser?: User;
}
