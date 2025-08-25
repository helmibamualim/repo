import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats() {
    return await this.adminService.getDashboardStats();
  }

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.adminService.getAllUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return await this.adminService.getUserById(id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  async suspendUser(
    @Param('id') id: string,
    @Body() body: { reason: string; adminId: string },
  ) {
    return await this.adminService.suspendUser(id, body.reason, body.adminId);
  }

  @Post('users/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user' })
  async unsuspendUser(
    @Param('id') id: string,
    @Body() body: { adminId: string },
  ) {
    return await this.adminService.unsuspendUser(id, body.adminId);
  }

  // Chip Management
  @Post('users/:id/chips/add')
  @ApiOperation({ summary: 'Add chips to user' })
  async addChipsToUser(
    @Param('id') userId: string,
    @Body() body: { amount: number; adminId: string; notes?: string },
  ) {
    return await this.adminService.addChipsToUser(
      userId,
      body.amount,
      body.adminId,
      body.notes,
    );
  }

  @Post('users/:id/chips/deduct')
  @ApiOperation({ summary: 'Deduct chips from user' })
  async deductChipsFromUser(
    @Param('id') userId: string,
    @Body() body: { amount: number; adminId: string; notes?: string },
  ) {
    return await this.adminService.deductChipsFromUser(
      userId,
      body.amount,
      body.adminId,
      body.notes,
    );
  }

  // Support Tickets
  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets' })
  async getAllTickets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return await this.adminService.getAllTickets(page, limit, status);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async getTicketById(@Param('id') id: string) {
    return await this.adminService.getTicketById(id);
  }

  @Post('tickets/:id/respond')
  @ApiOperation({ summary: 'Respond to a support ticket' })
  async respondToTicket(
    @Param('id') id: string,
    @Body() body: { response: string; adminId: string },
  ) {
    return await this.adminService.respondToTicket(id, body.response, body.adminId);
  }

  @Post('tickets/:id/resolve')
  @ApiOperation({ summary: 'Resolve a support ticket' })
  async resolveTicket(
    @Param('id') id: string,
    @Body() body: { adminId: string },
  ) {
    return await this.adminService.resolveTicket(id, body.adminId);
  }

  // System Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get all system settings' })
  async getAllSettings() {
    return await this.adminService.getAllSettings();
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update system setting' })
  async updateSetting(
    @Param('key') key: string,
    @Body() body: { value: string; adminId: string },
  ) {
    return await this.adminService.updateSetting(key, body.value, body.adminId);
  }

  // Activity Logs
  @Get('logs/activity')
  @ApiOperation({ summary: 'Get activity logs' })
  async getActivityLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('userId') userId?: string,
    @Query('activityType') activityType?: string,
  ) {
    return await this.adminService.getActivityLogs(page, limit, userId, activityType);
  }

  // Transaction Management
  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  async getAllTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return await this.adminService.getAllTransactions(page, limit, status);
  }

  @Post('transactions/:id/refund')
  @ApiOperation({ summary: 'Refund a transaction' })
  async refundTransaction(
    @Param('id') id: string,
    @Body() body: { adminId: string; reason: string },
  ) {
    return await this.adminService.refundTransaction(id, body.adminId, body.reason);
  }
}
