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

@Entity('support_tickets')
@Index(['userId'])
@Index(['status'])
@Index(['category'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 200 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 50 })
  category: string; // technical, payment, account, game, other

  @Column({ default: 'normal', length: 20 })
  priority: string; // low, normal, high, urgent

  @Column({ default: 'open', length: 20 })
  status: string; // open, in_progress, resolved, closed

  @Column({ name: 'admin_user_id', nullable: true })
  adminUserId?: string;

  @Column({ name: 'admin_response', type: 'text', nullable: true })
  adminResponse?: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.supportTickets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_user_id' })
  adminUser?: User;
}
