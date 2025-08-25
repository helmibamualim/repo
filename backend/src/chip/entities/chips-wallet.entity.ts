import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chips_wallet')
@Check('balance >= 0')
export class ChipsWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'bigint', default: 5000000 })
  balance: number;

  @Column({ name: 'total_purchased', type: 'bigint', default: 0 })
  totalPurchased: number;

  @Column({ name: 'total_bonus_received', type: 'bigint', default: 5000000 })
  totalBonusReceived: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.chipsWallet)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
