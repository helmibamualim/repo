import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create payment transaction' })
  @ApiResponse({ status: 201, description: 'Payment transaction created successfully' })
  async createPaymentTransaction(
    @Body() body: {
      userId: string;
      amount: number;
      chipsAmount: number;
      paymentMethod: string;
    },
  ) {
    return await this.paymentsService.createPaymentTransaction(
      body.userId,
      body.amount,
      body.chipsAmount,
      body.paymentMethod,
    );
  }

  @Post('midtrans/notification')
  @ApiOperation({ summary: 'Handle Midtrans payment notification' })
  async handleMidtransNotification(@Body() notification: any) {
    // Handle Midtrans webhook notification
    const { transaction_status, order_id, transaction_id } = notification;

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      return await this.paymentsService.processSuccessfulPayment(order_id, notification);
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      return await this.paymentsService.processFailedPayment(order_id, transaction_status);
    }

    return { status: 'received' };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user transaction history' })
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.paymentsService.getUserTransactions(userId, page, limit);
  }

  @Get('transaction/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransactionById(@Param('id') id: string) {
    return await this.paymentsService.getTransactionById(id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending transactions' })
  async getPendingTransactions() {
    return await this.paymentsService.getPendingTransactions();
  }

  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel transaction' })
  async cancelTransaction(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return await this.paymentsService.cancelTransaction(id, body.reason);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getPaymentStats() {
    return await this.paymentsService.getPaymentStats();
  }
}
