import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Table } from './table.entity';
import { User } from '../../users/entities/user.entity';

@Entity('table_players')
export class TablePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_id' })
  tableId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  position: number;

  @Column({ name: 'chips_in_play', type: 'bigint' })
  chipsInPlay: number;

  @Column({ name: 'is_sitting_out', default: false })
  isSittingOut: boolean;

  @Column({ name: 'is_ready', default: false })
  isReady: boolean;

  @Column({ name: 'current_bet', type: 'bigint', default: 0 })
  currentBet: number;

  @Column({ name: 'has_folded', default: false })
  hasFolded: boolean;

  @Column({ name: 'hole_cards', type: 'jsonb', nullable: true })
  holeCards: any;

  @Column({ name: 'has_acted', default: false })
  hasActed: boolean;

  @Column({ name: 'is_all_in', default: false })
  isAllIn: boolean;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  // Relations
  @ManyToOne(() => Table, table => table.players)
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
