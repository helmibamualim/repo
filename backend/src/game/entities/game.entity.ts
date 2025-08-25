import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Table } from './table.entity';
import { User } from '../../users/entities/user.entity';
import { GameAction } from './game-action.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'table_id' })
  tableId: string;

  @Column({ name: 'game_number' })
  gameNumber: number;

  @Column({ name: 'dealer_position' })
  dealerPosition: number;

  @Column({ name: 'small_blind', type: 'bigint' })
  smallBlind: number;

  @Column({ name: 'big_blind', type: 'bigint' })
  bigBlind: number;

  @Column({ name: 'community_cards', type: 'jsonb', nullable: true })
  communityCards: any;

  @Column({ name: 'deck_state', type: 'jsonb', nullable: true })
  deckState: any;

  @Column({ name: 'total_pot', type: 'bigint', default: 0 })
  totalPot: number;

  @Column({ name: 'side_pots', type: 'jsonb', nullable: true })
  sidePots: any;

  @Column({ name: 'current_round', default: 'preflop' })
  currentRound: string;

  @Column({ name: 'current_player_turn', nullable: true })
  currentPlayerTurn: string;

  @Column({ name: 'current_bet', type: 'bigint', default: 0 })
  currentBet: number;

  @Column({ name: 'min_raise', type: 'bigint', default: 0 })
  minRaise: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'winner_user_id', nullable: true })
  winnerUserId: string;

  @Column({ name: 'winning_hand', type: 'jsonb', nullable: true })
  winningHand: any;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @UpdateDateColumn({ name: 'ended_at', nullable: true })
  endedAt: Date;

  // Relations
  @ManyToOne(() => Table)
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'current_player_turn' })
  currentPlayer: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'winner_user_id' })
  winner: User;

  @OneToMany(() => GameAction, action => action.game)
  actions: GameAction[];
}
