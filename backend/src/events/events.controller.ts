import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('daily-bonus/can-claim/:userId')
  @ApiOperation({ summary: 'Check if user can claim daily bonus' })
  @ApiResponse({ status: 200, description: 'Returns whether user can claim daily bonus' })
  async canClaimDailyBonus(@Param('userId') userId: string) {
    const canClaim = await this.eventsService.canClaimDailyBonus(userId);
    const streak = await this.eventsService.getUserStreak(userId);
    
    return {
      canClaim,
      currentStreak: streak,
    };
  }

  @Post('daily-bonus/claim')
  @ApiOperation({ summary: 'Claim daily bonus' })
  @ApiResponse({ status: 201, description: 'Daily bonus claimed successfully' })
  async claimDailyBonus(@Body() body: { userId: string }) {
    return await this.eventsService.claimDailyBonus(body.userId);
  }

  @Get('daily-bonus/history/:userId')
  @ApiOperation({ summary: 'Get user daily bonus history' })
  async getUserDailyBonusHistory(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 30,
  ) {
    return await this.eventsService.getUserDailyBonusHistory(userId, page, limit);
  }

  @Get('daily-bonus/calendar/:userId')
  @ApiOperation({ summary: 'Get user bonus calendar (last 30 days)' })
  async getUserBonusCalendar(@Param('userId') userId: string) {
    return await this.eventsService.getUserBonusCalendar(userId);
  }

  @Get('daily-bonus/stats')
  @ApiOperation({ summary: 'Get daily bonus statistics' })
  async getDailyBonusStats() {
    return await this.eventsService.getDailyBonusStats();
  }

  @Post('daily-bonus/reset-streak')
  @ApiOperation({ summary: 'Reset user streak (admin only)' })
  async resetUserStreak(
    @Body() body: { userId: string; adminId: string },
  ) {
    return await this.eventsService.resetUserStreak(body.userId, body.adminId);
  }

  @Post('special-event/create')
  @ApiOperation({ summary: 'Create special event bonus (admin only)' })
  async createSpecialEventBonus(
    @Body() body: {
      eventName: string;
      bonusAmount: number;
      validUntil: string;
      adminId: string;
    },
  ) {
    return await this.eventsService.createSpecialEventBonus(
      body.eventName,
      body.bonusAmount,
      new Date(body.validUntil),
      body.adminId,
    );
  }
}
