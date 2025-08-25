import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ip_logs')
@Index(['userId'])
@Index(['ipAddress'])
@Index(['lastSeen'])
export class IpLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'ip_address', type: 'inet' })
  ipAddress: string;

  @Column({ nullable: true, length: 100 })
  country?: string;

  @Column({ nullable: true, length: 100 })
  city?: string;

  @Column({ nullable: true, length: 100 })
  region?: string;

  @Column({ nullable: true, length: 50 })
  timezone?: string;

  @Column({ nullable: true, length: 200 })
  isp?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'device_type', nullable: true, length: 50 })
  deviceType?: string;

  @Column({ nullable: true, length: 100 })
  browser?: string;

  @Column({ nullable: true, length: 100 })
  os?: string;

  @CreateDateColumn({ name: 'first_seen' })
  firstSeen: Date;

  @UpdateDateColumn({ name: 'last_seen' })
  lastSeen: Date;

  @Column({ name: 'login_count', default: 1 })
  loginCount: number;

  // Relations
  @ManyToOne(() => User, (user) => user.ipLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
