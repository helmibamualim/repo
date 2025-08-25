import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { TablePlayer } from './table-player.entity';
import { Game } from './game.entity';

@Entity('tables')
@Index(['isActive'])
@Index(['isPrivate'])
@Check('max_players IN (6, 9)')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'max_players' })
  maxPlayers: number; // 6 or 9

  @Column({ name: 'current_players', default: 0 })
  currentPlayers: number;

  @Column({ name: 'min_bet', type: 'bigint' })
  minBet: number;

  @Column({ name: 'max_bet', type: 'bigint' })
  maxBet: number;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ name: 'password_hash', nullable: true, length: 255 })
  passwordHash?: string;

  @Column({ name: 'game_state', type: 'jsonb', nullable: true })
  gameState?: any;

  @Column({ name: 'current_dealer_position', default: 0 })
  currentDealerPosition: number;

  @Column({ name: 'current_turn_position', nullable: true })
  currentTurnPosition?: number;

  @Column({ name: 'pot_amount', type: 'bigint', default: 0 })
  potAmount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_game_in_progress', default: false })
  isGameInProgress: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TablePlayer, (player) => player.table)
  players: TablePlayer[];

  @OneToMany(() => Game, (game) => game.table)
  games: Game[];
}
