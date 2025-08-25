import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('table/create')
  @ApiOperation({ summary: 'Create new poker table' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  async createTable(
    @Body() body: {
      name: string;
      maxPlayers: number;
      minBet: number;
      maxBet: number;
      isPrivate?: boolean;
      password?: string;
    },
  ) {
    return await this.gameService.createTable(
      body.name,
      body.maxPlayers,
      body.minBet,
      body.maxBet,
      body.isPrivate,
      body.password,
    );
  }

  @Get('tables')
  @ApiOperation({ summary: 'Get all active tables' })
  @ApiResponse({ status: 200, description: 'Active tables retrieved successfully' })
  async getActiveTables() {
    return await this.gameService.getActiveTables();
  }

  @Get('table/:id')
  @ApiOperation({ summary: 'Get table by ID' })
  @ApiResponse({ status: 200, description: 'Table retrieved successfully' })
  async getTableById(@Param('id') id: string) {
    return await this.gameService.getTableById(id);
  }

  @Post('table/join')
  @ApiOperation({ summary: 'Join a poker table' })
  @ApiResponse({ status: 201, description: 'Successfully joined table' })
  async joinTable(
    @Body() body: {
      tableId: string;
      userId: string;
      chipsToPlay: number;
    },
  ) {
    return await this.gameService.joinTable(
      body.tableId,
      body.userId,
      body.chipsToPlay,
    );
  }

  @Post('table/leave')
  @ApiOperation({ summary: 'Leave a poker table' })
  @ApiResponse({ status: 201, description: 'Successfully left table' })
  async leaveTable(
    @Body() body: {
      tableId: string;
      userId: string;
    },
  ) {
    return await this.gameService.leaveTable(body.tableId, body.userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start new game at table' })
  @ApiResponse({ status: 201, description: 'Game started successfully' })
  async startGame(@Body() body: { tableId: string }) {
    return await this.gameService.startGame(body.tableId);
  }

  @Post('action')
  @ApiOperation({ summary: 'Player action in game' })
  @ApiResponse({ status: 201, description: 'Action processed successfully' })
  async playerAction(
    @Body() body: {
      gameId: string;
      userId: string;
      actionType: string;
      amount?: number;
    },
  ) {
    return await this.gameService.playerAction(
      body.gameId,
      body.userId,
      body.actionType,
      body.amount || 0,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get game statistics' })
  @ApiResponse({ status: 200, description: 'Game statistics retrieved successfully' })
  async getGameStats() {
    return await this.gameService.getGameStats();
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get user game history' })
  @ApiResponse({ status: 200, description: 'Game history retrieved successfully' })
  async getUserGameHistory(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.gameService.getUserGameHistory(userId, page, limit);
  }

  @Post('table/delete')
  @ApiOperation({ summary: 'Delete table (admin only)' })
  @ApiResponse({ status: 201, description: 'Table deleted successfully' })
  async deleteTable(
    @Body() body: {
      tableId: string;
      adminId: string;
    },
  ) {
    return await this.gameService.deleteTable(body.tableId, body.adminId);
  }
}
