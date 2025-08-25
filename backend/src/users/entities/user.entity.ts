import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { ChipsWallet } from '../../chip/entities/chips-wallet.entity';
import { Referral } from './referral.entity';
import { ActivityLog } from '../../analytics/entities/activity-log.entity';
import { IpLog } from '../../analytics/entities/ip-log.entity';
import { Transaction } from '../../payments/entities/transaction.entity';
import { DailyBonus } from '../../events/entities/daily-bonus.entity';
import { SupportTicket } from '../../admin/entities/support-ticket.entity';

@Entity('users')
@Index(['email'])
@Index(['username'])
@Index(['referralCode'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', nullable: true, length: 255 })
  passwordHash?: string;

  @Column({ name: 'full_name', nullable: true, length: 100 })
  fullName?: string;

  @Column({ name: 'avatar_url', nullable: true, length: 500 })
  avatarUrl?: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true, length: 50 })
  country?: string;

  @Column({ nullable: true, length: 100 })
  city?: string;

  // OAuth fields
  @Column({ name: 'google_id', nullable: true, length: 100 })
  googleId?: string;

  @Column({ name: 'facebook_id', nullable: true, length: 100 })
  facebookId?: string;

  // Game stats
  @Column({ name: 'total_games_played', default: 0 })
  totalGamesPlayed: number;

  @Column({ name: 'total_games_won', default: 0 })
  totalGamesWon: number;

  @Column({ name: 'total_chips_won', type: 'bigint', default: 0 })
  totalChipsWon: number;

  @Column({ name: 'total_chips_lost', type: 'bigint', default: 0 })
  totalChipsLost: number;

  // Account status
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @Column({ name: 'ban_reason', nullable: true, type: 'text' })
  banReason?: string;

  @Column({ name: 'ban_until', nullable: true })
  banUntil?: Date;

  // Referral
  @Column({ name: 'referral_code', unique: true, nullable: true, length: 20 })
  referralCode?: string;

  @Column({ name: 'referred_by', nullable: true })
  referredBy?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login', nullable: true })
  lastLogin?: Date;

  // Relations
  @OneToOne(() => ChipsWallet, (wallet) => wallet.user)
  chipsWallet: ChipsWallet;

  @OneToMany(() => Referral, (referral) => referral.referrerUser)
  referrals: Referral[];

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs: ActivityLog[];

  @OneToMany(() => IpLog, (log) => log.user)
  ipLogs: IpLog[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => DailyBonus, (bonus) => bonus.user)
  dailyBonuses: DailyBonus[];

  @OneToMany(() => SupportTicket, (ticket) => ticket.user)
  supportTickets: SupportTicket[];
}
