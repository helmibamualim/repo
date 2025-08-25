import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ActivityLog } from './entities/activity-log.entity';
import { IpLog } from './entities/ip-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog, IpLog]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService, TypeOrmModule],
})
export class AnalyticsModule {}
