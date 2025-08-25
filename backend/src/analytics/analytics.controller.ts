import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard() {
    return this.analyticsService.getAnalyticsDashboard();
  }

  @Get('user-activity/:userId')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({ status: 200, description: 'User activity logs retrieved successfully' })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('activityType') activityType?: string,
  ) {
    return this.analyticsService.getUserActivityLogs(userId, page, limit, activityType);
  }

  @Get('ip-history/:userId')
  @ApiOperation({ summary: 'Get user IP history' })
  @ApiResponse({ status: 200, description: 'IP history retrieved successfully' })
  async getUserIPHistory(@Param('userId') userId: string) {
    return this.analyticsService.getUserIPHistory(userId);
  }

  @Get('suspicious-activity/:userId')
  @ApiOperation({ summary: 'Detect suspicious activity for user' })
  @ApiResponse({ status: 200, description: 'Suspicious activity analysis completed' })
  async getSuspiciousActivity(@Param('userId') userId: string) {
    return this.analyticsService.detectSuspiciousActivity(userId);
  }

  @Get('same-ip/:ipAddress')
  @ApiOperation({ summary: 'Get users from same IP address' })
  @ApiResponse({ status: 200, description: 'Users from same IP retrieved successfully' })
  async getUsersFromSameIP(@Param('ipAddress') ipAddress: string) {
    return this.analyticsService.getUsersFromSameIP(ipAddress);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get activity trends' })
  @ApiResponse({ status: 200, description: 'Activity trends retrieved successfully' })
  async getActivityTrends(@Query('days') days: number = 7) {
    return this.analyticsService.getActivityTrends(days);
  }

  @Get('security-alerts')
  @ApiOperation({ summary: 'Get security alerts' })
  @ApiResponse({ status: 200, description: 'Security alerts retrieved successfully' })
  async getSecurityAlerts() {
    return this.analyticsService.getSecurityAlerts();
  }
}
