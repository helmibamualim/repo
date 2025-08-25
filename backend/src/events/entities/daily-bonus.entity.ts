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

@Entity('daily_bonuses')
@Index(['userId'])
@Index(['bonusDate'])
export class DailyBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'day_streak', default: 1 })
  dayStreak: number;

  @Column({ name: 'bonus_amount', type: 'bigint' })
  bonusAmount: number;

  @Column({ name: 'bonus_date', type: 'date', default: () => 'CURRENT_DATE' })
  bonusDate: Date;

  @CreateDateColumn({ name: 'claimed_at' })
  claimedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.dailyBonuses)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
