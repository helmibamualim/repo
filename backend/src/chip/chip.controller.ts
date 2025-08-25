import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChipService } from './chip.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chip')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chip')
export class ChipController {
  constructor(private readonly chipService: ChipService) {}

  @Post('wallet/create')
  @ApiOperation({ summary: 'Create wallet for new user' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  async createWallet(
    @Body() body: { userId: string; initialBalance?: number },
  ) {
    return await this.chipService.createWallet(body.userId, body.initialBalance);
  }

  @Get('wallet/:userId')
  @ApiOperation({ summary: 'Get user wallet' })
  @ApiResponse({ status: 200, description: 'User wallet retrieved successfully' })
  async getUserWallet(@Param('userId') userId: string) {
    return await this.chipService.getUserWallet(userId);
  }

  @Post('add-manually')
  @ApiOperation({ summary: 'Add chips manually (admin only)' })
  @ApiResponse({ status: 201, description: 'Chips added successfully' })
  async addChipsManually(
    @Body() body: {
      userId: string;
      amount: number;
      adminId: string;
      reason: string;
    },
  ) {
    return await this.chipService.addChipsManually(
      body.userId,
      body.amount,
      body.adminId,
      body.reason,
    );
  }

  @Post('deduct-manually')
  @ApiOperation({ summary: 'Deduct chips manually (admin only)' })
  @ApiResponse({ status: 201, description: 'Chips deducted successfully' })
  async deductChipsManually(
    @Body() body: {
      userId: string;
      amount: number;
      adminId: string;
      reason: string;
    },
  ) {
    return await this.chipService.deductChipsManually(
      body.userId,
      body.amount,
      body.adminId,
      body.reason,
    );
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer chips between users' })
  @ApiResponse({ status: 201, description: 'Chips transferred successfully' })
  async transferChips(
    @Body() body: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      reason: string;
    },
  ) {
    return await this.chipService.transferChips(
      body.fromUserId,
      body.toUserId,
      body.amount,
      body.reason,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get wallet statistics' })
  @ApiResponse({ status: 200, description: 'Wallet statistics retrieved successfully' })
  async getWalletStats() {
    return await this.chipService.getWalletStats();
  }

  @Get('check-balance/:userId/:amount')
  @ApiOperation({ summary: 'Check if user has enough chips' })
  @ApiResponse({ status: 200, description: 'Balance check completed' })
  async hasEnoughChips(
    @Param('userId') userId: string,
    @Param('amount') amount: number,
  ) {
    const hasEnough = await this.chipService.hasEnoughChips(userId, amount);
    return { hasEnoughChips: hasEnough };
  }

  @Post('reserve')
  @ApiOperation({ summary: 'Reserve chips for game' })
  @ApiResponse({ status: 201, description: 'Chips reserved successfully' })
  async reserveChips(
    @Body() body: {
      userId: string;
      amount: number;
      gameId: string;
    },
  ) {
    return await this.chipService.reserveChips(
      body.userId,
      body.amount,
      body.gameId,
    );
  }

  @Post('release')
  @ApiOperation({ summary: 'Release reserved chips' })
  @ApiResponse({ status: 201, description: 'Chips released successfully' })
  async releaseReservedChips(
    @Body() body: {
      userId: string;
      amount: number;
      gameId: string;
    },
  ) {
    return await this.chipService.releaseReservedChips(
      body.userId,
      body.amount,
      body.gameId,
    );
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get user chip transaction history' })
  @ApiResponse({ status: 200, description: 'Chip history retrieved successfully' })
  async getUserChipHistory(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.chipService.getUserChipHistory(userId, page, limit);
  }

  @Post('reset-wallet')
  @ApiOperation({ summary: 'Reset user wallet (admin only)' })
  @ApiResponse({ status: 201, description: 'Wallet reset successfully' })
  async resetUserWallet(
    @Body() body: {
      userId: string;
      adminId: string;
      reason: string;
    },
  ) {
    return await this.chipService.resetUserWallet(
      body.userId,
      body.adminId,
      body.reason,
    );
  }
}
