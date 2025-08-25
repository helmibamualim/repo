import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from './user.entity';

@Entity('referrals')
@Check('referrer_user_id != referred_user_id')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'referrer_user_id' })
  referrerUserId: string;

  @Column({ name: 'referred_user_id' })
  referredUserId: string;

  @Column({ name: 'referrer_bonus', type: 'bigint', default: 1000000 })
  referrerBonus: number;

  @Column({ name: 'referred_bonus', type: 'bigint', default: 500000 })
  referredBonus: number;

  @Column({ name: 'bonus_claimed', default: false })
  bonusClaimed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'bonus_claimed_at', nullable: true })
  bonusClaimedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.referrals)
  @JoinColumn({ name: 'referrer_user_id' })
  referrerUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referred_user_id' })
  referredUser: User;
}
