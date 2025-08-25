import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PokerGameService } from './services/poker-game.service';
import { GameService } from './game.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tableId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private tableRooms = new Map<string, Set<string>>(); // tableId -> Set of userIds

  constructor(
    private jwtService: JwtService,
    private pokerGameService: PokerGameService,
    private gameService: GameService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      
      this.connectedUsers.set(client.userId, client);
      
      console.log(`User ${client.userId} connected to game gateway`);
      
      // Send connection success
      client.emit('connected', { userId: client.userId });
      
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      
      // Remove from table room if connected
      if (client.tableId) {
        this.leaveTableRoom(client.userId, client.tableId);
      }
      
      console.log(`User ${client.userId} disconnected from game gateway`);
    }
  }

  @SubscribeMessage('joinTable')
  async handleJoinTable(
    @MessageBody() data: { tableId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { tableId } = data;
      
      // Join table room
      client.join(`table_${tableId}`);
      client.tableId = tableId;
      
      // Add to table room tracking
      if (!this.tableRooms.has(tableId)) {
        this.tableRooms.set(tableId, new Set());
      }
      this.tableRooms.get(tableId)!.add(client.userId);
      
      // Get table state and send to client
      const tableState = await this.gameService.getTableState(tableId);
      client.emit('tableJoined', { tableId, tableState });
      
      // Notify other players
      client.to(`table_${tableId}`).emit('playerJoined', {
        userId: client.userId,
        tableId,
      });
      
      console.log(`User ${client.userId} joined table ${tableId}`);
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leaveTable')
  async handleLeaveTable(
    @MessageBody() data: { tableId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { tableId } = data;
      this.leaveTableRoom(client.userId, tableId);
      
      client.emit('tableLeft', { tableId });
      
      // Notify other players
      client.to(`table_${tableId}`).emit('playerLeft', {
        userId: client.userId,
        tableId,
      });
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @MessageBody() data: { tableId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { tableId } = data;
      
      // Start new game
      const game = await this.pokerGameService.startNewGame(tableId);
      
      // Broadcast game started to all players at table
      this.server.to(`table_${tableId}`).emit('gameStarted', {
        gameId: game.id,
        dealerPosition: game.dealerPosition,
        smallBlind: game.smallBlind,
        bigBlind: game.bigBlind,
        currentRound: game.currentRound,
        currentPlayerTurn: game.currentPlayerTurn,
        totalPot: game.totalPot,
      });
      
      console.log(`Game started at table ${tableId} by user ${client.userId}`);
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('playerAction')
  async handlePlayerAction(
    @MessageBody() data: {
      gameId: string;
      action: 'fold' | 'call' | 'raise' | 'check' | 'all_in';
      amount?: number;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, action, amount } = data;
      
      // Process player action
      const updatedGame = await this.pokerGameService.processPlayerAction(
        gameId,
        client.userId,
        action,
        amount,
      );
      
      // Broadcast action to all players at table
      this.server.to(`table_${client.tableId}`).emit('playerActionProcessed', {
        gameId: updatedGame.id,
        userId: client.userId,
        action,
        amount,
        currentRound: updatedGame.currentRound,
        currentPlayerTurn: updatedGame.currentPlayerTurn,
        totalPot: updatedGame.totalPot,
        communityCards: updatedGame.communityCards,
        status: updatedGame.status,
      });
      
      // If game is completed, send final results
      if (updatedGame.status === 'completed') {
        this.server.to(`table_${client.tableId}`).emit('gameCompleted', {
          gameId: updatedGame.id,
          winnerUserId: updatedGame.winnerUserId,
          winningHand: updatedGame.winningHand,
          totalPot: updatedGame.totalPot,
        });
      }
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { tableId: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { tableId, message } = data;
      
      // Validate message length
      if (!message || message.trim().length === 0 || message.length > 200) {
        client.emit('error', { message: 'Invalid message' });
        return;
      }
      
      // Broadcast message to all players at table
      this.server.to(`table_${tableId}`).emit('messageReceived', {
        userId: client.userId,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('getTableState')
  async handleGetTableState(
    @MessageBody() data: { tableId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { tableId } = data;
      const tableState = await this.gameService.getTableState(tableId);
      
      client.emit('tableState', { tableId, tableState });
      
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Helper method to remove user from table room
  private leaveTableRoom(userId: string, tableId: string) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.leave(`table_${tableId}`);
      client.tableId = undefined;
    }
    
    const tableRoom = this.tableRooms.get(tableId);
    if (tableRoom) {
      tableRoom.delete(userId);
      if (tableRoom.size === 0) {
        this.tableRooms.delete(tableId);
      }
    }
  }

  // Method to broadcast to specific table
  broadcastToTable(tableId: string, event: string, data: any) {
    this.server.to(`table_${tableId}`).emit(event, data);
  }

  // Method to send to specific user
  sendToUser(userId: string, event: string, data: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Get connected users count for a table
  getTableConnectedUsers(tableId: string): number {
    return this.tableRooms.get(tableId)?.size || 0;
  }

  // Get all connected users
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}
