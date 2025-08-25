import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { TablePlayer } from './entities/table-player.entity';
import { Game } from './entities/game.entity';
import { GameAction } from './entities/game-action.entity';
import { User } from '../users/entities/user.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';
import { ActivityLog } from '../analytics/entities/activity-log.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(TablePlayer)
    private tablePlayerRepository: Repository<TablePlayer>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GameAction)
    private gameActionRepository: Repository<GameAction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChipsWallet)
    private chipsWalletRepository: Repository<ChipsWallet>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  // Create new table
  async createTable(
    name: string,
    maxPlayers: number,
    minBet: number,
    maxBet: number,
    isPrivate: boolean = false,
    password?: string,
  ) {
    const table = this.tableRepository.create({
      name,
      maxPlayers,
      minBet,
      maxBet,
      isPrivate,
      passwordHash: password ? password : undefined, // In real app, hash the password
    });

    const savedTable = await this.tableRepository.save(table);

    await this.activityLogRepository.save({
      activityType: 'table_created',
      description: `Table "${name}" created`,
      metadata: { tableId: savedTable.id, maxPlayers, minBet, maxBet, isPrivate },
    });

    return savedTable;
  }

  // Get all active tables
  async getActiveTables() {
    return await this.tableRepository.find({
      where: { isActive: true },
      relations: ['players', 'players.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get table by ID
  async getTableById(tableId: string) {
    return await this.tableRepository.findOne({
      where: { id: tableId },
      relations: ['players', 'players.user'],
    });
  }

  // Join table
  async joinTable(tableId: string, userId: string, chipsToPlay: number) {
    const table = await this.getTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    if (!table.isActive) {
      throw new Error('Table is not active');
    }

    if (table.currentPlayers >= table.maxPlayers) {
      throw new Error('Table is full');
    }

    // Check if user already at table
    const existingPlayer = await this.tablePlayerRepository.findOne({
      where: { tableId, userId },
    });

    if (existingPlayer) {
      throw new Error('User already at this table');
    }

    // Check user's chip balance
    const wallet = await this.chipsWalletRepository.findOne({
      where: { userId },
    });

    if (!wallet || wallet.balance < chipsToPlay) {
      throw new Error('Insufficient chips');
    }

    if (chipsToPlay < table.minBet) {
      throw new Error(`Minimum chips required: ${table.minBet}`);
    }

    // Find available position
    const occupiedPositions = table.players.map(p => p.position);
    let position = 0;
    for (let i = 0; i < table.maxPlayers; i++) {
      if (!occupiedPositions.includes(i)) {
        position = i;
        break;
      }
    }

    // Create table player
    const tablePlayer = this.tablePlayerRepository.create({
      tableId,
      userId,
      position,
      chipsInPlay: chipsToPlay,
      isReady: true,
    });

    await this.tablePlayerRepository.save(tablePlayer);

    // Update table player count
    await this.tableRepository.update(tableId, {
      currentPlayers: () => 'current_players + 1',
    });

    // Deduct chips from wallet (reserve for game)
    await this.chipsWalletRepository.update(
      { userId },
      {
        balance: () => `balance - ${chipsToPlay}`,
      },
    );

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'joined_table',
      description: `Joined table "${table.name}" with ${chipsToPlay} chips`,
      metadata: { tableId, chipsToPlay, position },
      tableId,
    });

    return {
      success: true,
      message: 'Successfully joined table',
      position,
      chipsInPlay: chipsToPlay,
    };
  }

  // Leave table
  async leaveTable(tableId: string, userId: string) {
    const tablePlayer = await this.tablePlayerRepository.findOne({
      where: { tableId, userId },
    });

    if (!tablePlayer) {
      throw new Error('User not at this table');
    }

    const table = await this.getTableById(tableId);

    // Return chips to wallet
    await this.chipsWalletRepository.update(
      { userId },
      {
        balance: () => `balance + ${tablePlayer.chipsInPlay}`,
      },
    );

    // Remove player from table
    await this.tablePlayerRepository.remove(tablePlayer);

    // Update table player count
    await this.tableRepository.update(tableId, {
      currentPlayers: () => 'current_players - 1',
    });

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'left_table',
      description: `Left table "${table.name}" with ${tablePlayer.chipsInPlay} chips`,
      metadata: { tableId, chipsReturned: tablePlayer.chipsInPlay },
      tableId,
    });

    return {
      success: true,
      message: 'Successfully left table',
      chipsReturned: tablePlayer.chipsInPlay,
    };
  }

  // Start new game at table
  async startGame(tableId: string) {
    const table = await this.getTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    if (table.players.length < 2) {
      throw new Error('Need at least 2 players to start game');
    }

    if (table.isGameInProgress) {
      throw new Error('Game already in progress');
    }

    // Create new game
    const game = this.gameRepository.create({
      tableId,
      gameNumber: 1, // In real app, increment based on previous games
      dealerPosition: table.currentDealerPosition,
      smallBlind: table.minBet,
      bigBlind: table.minBet * 2,
      communityCards: [],
      deckState: this.generateDeck(), // Generate shuffled deck
      currentRound: 'preflop',
      status: 'active',
    });

    const savedGame = await this.gameRepository.save(game);

    // Update table status
    await this.tableRepository.query(
      'UPDATE tables SET is_game_in_progress = $1, game_state = $2 WHERE id = $3',
      [true, JSON.stringify({ currentGameId: savedGame.id }), tableId]
    );

    // Deal hole cards to players
    await this.dealHoleCards(savedGame.id);

    // Log activity
    await this.activityLogRepository.save({
      activityType: 'game_started',
      description: `Game started at table "${table.name}"`,
      metadata: { tableId, gameId: savedGame.id },
      tableId,
    });

    return {
      success: true,
      gameId: savedGame.id,
      message: 'Game started successfully',
    };
  }

  // Deal hole cards to players
  private async dealHoleCards(gameId: string) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['table', 'table.players'],
    });

    if (!game) return;

    const deck = [...game.deckState];
    
    // Deal 2 cards to each player
    for (const player of game.table.players) {
      const holeCards = [deck.pop(), deck.pop()];
      
      await this.tablePlayerRepository.update(
        { id: player.id },
        { holeCards },
      );
    }

    // Update deck state
    await this.gameRepository.update(gameId, {
      deckState: deck,
    });
  }

  // Generate and shuffle deck
  private generateDeck(): string[] {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(`${rank}_${suit}`);
      }
    }

    // Shuffle deck (Fisher-Yates algorithm)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  // Player action (fold, call, raise, check)
  async playerAction(
    gameId: string,
    userId: string,
    actionType: string,
    amount: number = 0,
  ) {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['table', 'table.players'],
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'active') {
      throw new Error('Game is not active');
    }

    const player = game.table.players.find(p => p.userId === userId);
    if (!player) {
      throw new Error('Player not in this game');
    }

    // Validate action based on game state
    // This is simplified - real poker logic would be much more complex
    
    // Record the action
    const gameAction = this.gameActionRepository.create({
      gameId,
      userId,
      actionType,
      amount,
      round: game.currentRound,
      position: player.position,
      potBeforeAction: game.totalPot,
      potAfterAction: game.totalPot + amount,
    });

    await this.gameActionRepository.save(gameAction);

    // Update game state based on action
    if (actionType === 'fold') {
      await this.tablePlayerRepository.update(
        { id: player.id },
        { hasFolded: true },
      );
    } else if (actionType === 'call' || actionType === 'raise') {
      await this.tablePlayerRepository.update(
        { id: player.id },
        { currentBet: amount },
      );
      
      await this.gameRepository.update(gameId, {
        totalPot: () => `total_pot + ${amount}`,
      });
    }

    // Log activity
    await this.activityLogRepository.save({
      userId,
      activityType: 'game_action',
      description: `${actionType.toUpperCase()} ${amount > 0 ? `${amount} chips` : ''}`,
      metadata: { gameId, actionType, amount, round: game.currentRound },
      tableId: game.tableId,
    });

    return {
      success: true,
      action: actionType,
      amount,
      newPot: game.totalPot + amount,
    };
  }

  // Get game statistics
  async getGameStats() {
    const totalGames = await this.gameRepository.count();
    const activeGames = await this.gameRepository.count({
      where: { status: 'active' },
    });
    const completedGames = await this.gameRepository.count({
      where: { status: 'completed' },
    });

    const totalTables = await this.tableRepository.count();
    const activeTables = await this.tableRepository.count({
      where: { isActive: true },
    });

    const totalPlayers = await this.tablePlayerRepository.count();

    const averagePlayersPerTable = activeTables > 0 ? totalPlayers / activeTables : 0;

    return {
      totalGames,
      activeGames,
      completedGames,
      totalTables,
      activeTables,
      totalPlayers,
      averagePlayersPerTable: Math.round(averagePlayersPerTable * 100) / 100,
    };
  }

  // Get user's game history
  async getUserGameHistory(userId: string, page: number = 1, limit: number = 20) {
    const [games, total] = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoin('game.table', 'table')
      .leftJoin('table.players', 'player')
      .where('player.userId = :userId', { userId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('game.startedAt', 'DESC')
      .getManyAndCount();

    return {
      games,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get table state for WebSocket
  async getTableState(tableId: string) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
      relations: ['players', 'players.user', 'games'],
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // Get current active game if any
    const currentGame = await this.gameRepository.findOne({
      where: { tableId, status: 'active' },
      relations: ['actions'],
      order: { startedAt: 'DESC' },
    });

    // Format players data (hide hole cards from other players)
    const players = table.players.map(player => ({
      id: player.id,
      userId: player.userId,
      username: player.user.username,
      position: player.position,
      chipsInPlay: player.chipsInPlay,
      currentBet: player.currentBet,
      isSittingOut: player.isSittingOut,
      isReady: player.isReady,
      hasFolded: player.hasFolded,
      hasActed: player.hasActed,
      isAllIn: player.isAllIn,
      // Only include hole cards for the requesting user (handled in gateway)
      holeCards: player.holeCards,
    }));

    const tableState = {
      id: table.id,
      name: table.name,
      maxPlayers: table.maxPlayers,
      currentPlayers: table.currentPlayers,
      minBet: table.minBet,
      maxBet: table.maxBet,
      isPrivate: table.isPrivate,
      isGameInProgress: table.isGameInProgress,
      currentDealerPosition: table.currentDealerPosition,
      potAmount: table.potAmount,
      players,
      currentGame: currentGame ? {
        id: currentGame.id,
        gameNumber: currentGame.gameNumber,
        dealerPosition: currentGame.dealerPosition,
        smallBlind: currentGame.smallBlind,
        bigBlind: currentGame.bigBlind,
        communityCards: currentGame.communityCards,
        totalPot: currentGame.totalPot,
        currentRound: currentGame.currentRound,
        currentPlayerTurn: currentGame.currentPlayerTurn,
        currentBet: currentGame.currentBet,
        minRaise: currentGame.minRaise,
        status: currentGame.status,
        startedAt: currentGame.startedAt,
      } : null,
    };

    return tableState;
  }

  // Delete table (admin function)
  async deleteTable(tableId: string, adminId: string) {
    const table = await this.getTableById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Return chips to all players
    for (const player of table.players) {
      await this.chipsWalletRepository.update(
        { userId: player.userId },
        {
          balance: () => `balance + ${player.chipsInPlay}`,
        },
      );
    }

    // Remove all players
    await this.tablePlayerRepository.delete({ tableId });

    // Delete table
    await this.tableRepository.delete(tableId);

    // Log activity
    await this.activityLogRepository.save({
      activityType: 'table_deleted_by_admin',
      description: `Table "${table.name}" deleted by admin`,
      metadata: { tableId, adminId },
    });

    return {
      success: true,
      message: 'Table deleted successfully',
    };
  }
}
