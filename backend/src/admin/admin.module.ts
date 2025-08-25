import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { SystemSetting } from './entities/system-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SystemSetting]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService, TypeOrmModule],
})
export class AdminModule {}
