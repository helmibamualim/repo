import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Game } from './game.entity';
import { User } from '../../users/entities/user.entity';

@Entity('game_actions')
@Index(['gameId'])
@Index(['userId'])
export class GameAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'game_id' })
  gameId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'action_type', length: 20 })
  actionType: string; // fold, call, raise, check, all_in

  @Column({ type: 'bigint', default: 0 })
  amount: number;

  @Column({ length: 20 })
  round: string; // preflop, flop, turn, river

  @Column()
  position: number;

  @Column({ name: 'pot_before_action', type: 'bigint', nullable: true })
  potBeforeAction?: number;

  @Column({ name: 'pot_after_action', type: 'bigint', nullable: true })
  potAfterAction?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Game, (game) => game.actions)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
