import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../entities/table.entity';
import { Game } from '../entities/game.entity';
import { TablePlayer } from '../entities/table-player.entity';
import { GameAction } from '../entities/game-action.entity';
import { User } from '../../users/entities/user.entity';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  value: number;
}

export interface HandRanking {
  rank: number;
  name: string;
  cards: Card[];
}

export interface GameState {
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';
  pot: number;
  communityCards: Card[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentBet: number;
  minRaise: number;
  players: {
    userId: string;
    position: number;
    chips: number;
    currentBet: number;
    holeCards: Card[];
    hasActed: boolean;
    hasFolded: boolean;
    isAllIn: boolean;
    isSittingOut: boolean;
  }[];
}

@Injectable()
export class PokerGameService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(TablePlayer)
    private tablePlayerRepository: Repository<TablePlayer>,
    @InjectRepository(GameAction)
    private gameActionRepository: Repository<GameAction>,
  ) {}

  // Membuat deck kartu standar
  createDeck(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank);
        if (rank === 'A') value = 14; // Ace high
        if (rank === 'J') value = 11;
        if (rank === 'Q') value = 12;
        if (rank === 'K') value = 13;
        
        deck.push({ suit, rank, value });
      }
    }

    return this.shuffleDeck(deck);
  }

  // Mengacak deck
  shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Memulai game baru
  async startNewGame(tableId: string): Promise<Game> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
      relations: ['players', 'players.user'],
    });

    if (!table) {
      throw new Error('Table not found');
    }

    const activePlayers = table.players.filter(p => !p.isSittingOut && p.chipsInPlay > 0);
    
    if (activePlayers.length < 2) {
      throw new Error('Need at least 2 players to start a game');
    }

    // Buat game baru
    const game = new Game();
    game.table = table;
    game.gameNumber = (table.games?.length || 0) + 1;
    game.dealerPosition = table.currentDealerPosition;
    game.smallBlind = table.minBet;
    game.bigBlind = table.minBet * 2;
    game.status = 'active';
    game.currentRound = 'preflop';

    // Setup deck dan community cards
    const deck = this.createDeck();
    game.deckState = { remaining: deck };
    game.communityCards = [];

    // Deal hole cards
    const holeCards: { [playerId: string]: Card[] } = {};
    let deckIndex = 0;

    // Deal 2 cards to each player
    for (let round = 0; round < 2; round++) {
      for (const player of activePlayers) {
        if (!holeCards[player.userId]) {
          holeCards[player.userId] = [];
        }
        holeCards[player.userId].push(deck[deckIndex++]);
      }
    }

    // Update deck state
    game.deckState = { remaining: deck.slice(deckIndex) };

    // Set hole cards for players
    for (const player of activePlayers) {
      player.holeCards = holeCards[player.userId];
      await this.tablePlayerRepository.save(player);
    }

    // Set blinds
    const smallBlindPlayer = activePlayers[(game.dealerPosition + 1) % activePlayers.length];
    const bigBlindPlayer = activePlayers[(game.dealerPosition + 2) % activePlayers.length];

    smallBlindPlayer.currentBet = game.smallBlind;
    smallBlindPlayer.chipsInPlay -= game.smallBlind;
    
    bigBlindPlayer.currentBet = game.bigBlind;
    bigBlindPlayer.chipsInPlay -= game.bigBlind;

    game.totalPot = game.smallBlind + game.bigBlind;
    game.currentPlayerTurn = activePlayers[(game.dealerPosition + 3) % activePlayers.length].user.id;

    await this.tablePlayerRepository.save(smallBlindPlayer);
    await this.tablePlayerRepository.save(bigBlindPlayer);

    // Update table state
    table.isGameInProgress = true;
    table.potAmount = game.totalPot;
    await this.tableRepository.save(table);

    return await this.gameRepository.save(game);
  }

  // Evaluasi hand poker
  evaluateHand(cards: Card[]): HandRanking {
    if (cards.length < 5) {
      throw new Error('Need at least 5 cards to evaluate hand');
    }

    // Sort cards by value (descending)
    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    
    // Check for flush
    const suitCounts = cards.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const isFlush = Object.values(suitCounts).some(count => count >= 5);
    const flushSuit = isFlush ? Object.keys(suitCounts).find(suit => suitCounts[suit] >= 5) : null;

    // Check for straight
    const uniqueValues = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
    let isStraight = false;
    let straightHigh = 0;

    // Check for regular straight
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true;
        straightHigh = uniqueValues[i];
        break;
      }
    }

    // Check for A-2-3-4-5 straight (wheel)
    if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(5) && 
        uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
      isStraight = true;
      straightHigh = 5; // 5-high straight
    }

    // Count card values
    const valueCounts = cards.reduce((acc, card) => {
      acc[card.value] = (acc[card.value] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    const values = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);

    // Determine hand ranking
    if (isStraight && isFlush) {
      // Royal flush or straight flush
      if (straightHigh === 14) {
        return { rank: 10, name: 'Royal Flush', cards: this.getBestCards(cards, 5) };
      }
      return { rank: 9, name: 'Straight Flush', cards: this.getBestCards(cards, 5) };
    }

    if (counts[0] === 4) {
      return { rank: 8, name: 'Four of a Kind', cards: this.getBestCards(cards, 5) };
    }

    if (counts[0] === 3 && counts[1] === 2) {
      return { rank: 7, name: 'Full House', cards: this.getBestCards(cards, 5) };
    }

    if (isFlush) {
      return { rank: 6, name: 'Flush', cards: this.getBestCards(cards, 5) };
    }

    if (isStraight) {
      return { rank: 5, name: 'Straight', cards: this.getBestCards(cards, 5) };
    }

    if (counts[0] === 3) {
      return { rank: 4, name: 'Three of a Kind', cards: this.getBestCards(cards, 5) };
    }

    if (counts[0] === 2 && counts[1] === 2) {
      return { rank: 3, name: 'Two Pair', cards: this.getBestCards(cards, 5) };
    }

    if (counts[0] === 2) {
      return { rank: 2, name: 'One Pair', cards: this.getBestCards(cards, 5) };
    }

    return { rank: 1, name: 'High Card', cards: this.getBestCards(cards, 5) };
  }

  // Mendapatkan 5 kartu terbaik
  private getBestCards(cards: Card[], count: number): Card[] {
    return cards.sort((a, b) => b.value - a.value).slice(0, count);
  }

  // Menentukan pemenang
  determineWinner(players: { userId: string; cards: Card[] }[]): { userId: string; hand: HandRanking }[] {
    const playerHands = players.map(player => ({
      userId: player.userId,
      hand: this.evaluateHand(player.cards),
    }));

    // Sort by hand ranking (highest first)
    playerHands.sort((a, b) => {
      if (a.hand.rank !== b.hand.rank) {
        return b.hand.rank - a.hand.rank;
      }
      
      // If same rank, compare by card values
      for (let i = 0; i < Math.min(a.hand.cards.length, b.hand.cards.length); i++) {
        if (a.hand.cards[i].value !== b.hand.cards[i].value) {
          return b.hand.cards[i].value - a.hand.cards[i].value;
        }
      }
      
      return 0; // Tie
    });

    // Find all players with the best hand
    const bestRank = playerHands[0].hand.rank;
    const winners = playerHands.filter(p => p.hand.rank === bestRank);

    return winners;
  }

  // Proses aksi pemain
  async processPlayerAction(
    gameId: string,
    userId: string,
    action: 'fold' | 'call' | 'raise' | 'check' | 'all_in',
    amount?: number,
  ): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['table', 'table.players', 'table.players.user'],
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const player = game.table.players.find(p => p.user.id === userId);
    if (!player) {
      throw new Error('Player not found in this game');
    }

    if (game.currentPlayerTurn !== userId) {
      throw new Error('Not your turn');
    }

    // Record the action
    const gameAction = new GameAction();
    gameAction.game = game;
    gameAction.user = player.user;
    gameAction.actionType = action;
    gameAction.amount = amount || 0;
    gameAction.round = game.currentRound;
    gameAction.position = player.position;
    gameAction.potBeforeAction = game.totalPot;

    // Process the action
    switch (action) {
      case 'fold':
        player.hasFolded = true;
        break;

      case 'call':
        const callAmount = game.currentBet - player.currentBet;
        if (callAmount > player.chipsInPlay) {
          // All-in call
          player.currentBet += player.chipsInPlay;
          game.totalPot += player.chipsInPlay;
          player.chipsInPlay = 0;
          player.isAllIn = true;
        } else {
          player.currentBet += callAmount;
          player.chipsInPlay -= callAmount;
          game.totalPot += callAmount;
        }
        break;

      case 'raise':
        if (!amount || amount < game.minRaise) {
          throw new Error('Invalid raise amount');
        }
        const raiseAmount = amount - player.currentBet;
        if (raiseAmount > player.chipsInPlay) {
          throw new Error('Not enough chips');
        }
        player.currentBet = amount;
        player.chipsInPlay -= raiseAmount;
        game.totalPot += raiseAmount;
        game.currentBet = amount;
        break;

      case 'check':
        if (player.currentBet < game.currentBet) {
          throw new Error('Cannot check, must call or fold');
        }
        break;

      case 'all_in':
        game.totalPot += player.chipsInPlay;
        player.currentBet += player.chipsInPlay;
        player.chipsInPlay = 0;
        player.isAllIn = true;
        if (player.currentBet > game.currentBet) {
          game.currentBet = player.currentBet;
        }
        break;
    }

    gameAction.potAfterAction = game.totalPot;
    await this.gameActionRepository.save(gameAction);

    // Move to next player
    const activePlayers = game.table.players.filter(p => !p.hasFolded && !p.isSittingOut);
    const currentIndex = activePlayers.findIndex(p => p.user.id === userId);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    game.currentPlayerTurn = activePlayers[nextIndex].user.id;

    // Check if betting round is complete
    const playersNeedingAction = activePlayers.filter(p => 
      !p.isAllIn && (p.currentBet < game.currentBet || !p.hasActed)
    );

    if (playersNeedingAction.length === 0) {
      // Move to next phase
      await this.advanceGamePhase(game);
    }

    await this.tablePlayerRepository.save(player);
    return await this.gameRepository.save(game);
  }

  // Advance ke fase berikutnya
  private async advanceGamePhase(game: Game): Promise<void> {
    const deck = game.deckState.remaining as Card[];
    let deckIndex = 0;

    switch (game.currentRound) {
      case 'preflop':
        // Deal flop (3 cards)
        game.communityCards = deck.slice(deckIndex, deckIndex + 3);
        deckIndex += 3;
        game.currentRound = 'flop';
        break;

      case 'flop':
        // Deal turn (1 card)
        game.communityCards.push(deck[deckIndex]);
        deckIndex += 1;
        game.currentRound = 'turn';
        break;

      case 'turn':
        // Deal river (1 card)
        game.communityCards.push(deck[deckIndex]);
        deckIndex += 1;
        game.currentRound = 'river';
        break;

      case 'river':
        // Showdown
        game.currentRound = 'showdown';
        await this.processShowdown(game);
        return;
    }

    // Update deck state
    game.deckState = { remaining: deck.slice(deckIndex) };

    // Reset betting for new round
    game.currentBet = 0;
    for (const player of game.table.players) {
      player.currentBet = 0;
      player.hasActed = false;
    }

    // Set first player to act (after dealer)
    const activePlayers = game.table.players.filter(p => !p.hasFolded && !p.isSittingOut);
    game.currentPlayerTurn = activePlayers[(game.dealerPosition + 1) % activePlayers.length].user.id;
  }

  // Proses showdown
  private async processShowdown(game: Game): Promise<void> {
    const activePlayers = game.table.players.filter(p => !p.hasFolded);
    
    if (activePlayers.length === 1) {
      // Only one player left, they win
      const winner = activePlayers[0];
      winner.chipsInPlay += game.totalPot;
      game.winnerUserId = winner.user.id;
      game.status = 'completed';
      game.endedAt = new Date();
      
      await this.tablePlayerRepository.save(winner);
    } else {
      // Multiple players, evaluate hands
      const playerCards = activePlayers.map(player => ({
        userId: player.user.id,
        cards: [...player.holeCards, ...game.communityCards],
      }));

      const winners = this.determineWinner(playerCards);
      const potShare = Math.floor(game.totalPot / winners.length);

      // Distribute pot to winners
      for (const winner of winners) {
        const player = activePlayers.find(p => p.user.id === winner.userId);
        if (player) {
          player.chipsInPlay += potShare;
          await this.tablePlayerRepository.save(player);
        }
      }

      game.winnerUserId = winners[0].userId;
      game.winningHand = winners[0].hand;
      game.status = 'completed';
      game.endedAt = new Date();
    }

    // Update table state
    game.table.isGameInProgress = false;
    game.table.potAmount = 0;
    game.table.currentDealerPosition = (game.dealerPosition + 1) % game.table.players.length;
    
    await this.tableRepository.save(game.table);
  }
}
