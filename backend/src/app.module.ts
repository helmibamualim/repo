import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GameModule } from './game/game.module'; // Tambahkan ini

// Entities
import { User } from './users/entities/user.entity';
import { ChipsWallet } from './chip/entities/chips-wallet.entity';
import { Referral } from './users/entities/referral.entity';
import { ActivityLog } from './analytics/entities/activity-log.entity';
import { IpLog } from './analytics/entities/ip-log.entity';
import { Transaction } from './payments/entities/transaction.entity';
import { DailyBonus } from './events/entities/daily-bonus.entity';
import { SupportTicket } from './admin/entities/support-ticket.entity';
import { SystemSetting } from './admin/entities/system-setting.entity';
import { Table } from './game/entities/table.entity';
import { TablePlayer } from './game/entities/table-player.entity';
import { Game } from './game/entities/game.entity';
import { GameAction } from './game/entities/game-action.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseType = configService.get('DATABASE_TYPE') || 'postgres';
        
        if (databaseType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get('DATABASE_NAME') || 'poker_dev.db',
            entities: [
              User,
              ChipsWallet,
              Referral,
              ActivityLog,
              IpLog,
              Transaction,
              DailyBonus,
              SupportTicket,
              SystemSetting,
              Table,
              TablePlayer,
              Game,
              GameAction,
            ],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
          };
        }
        
        // PostgreSQL configuration (default)
        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: configService.get('DATABASE_PORT'),
          username: configService.get('DATABASE_USERNAME'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [
            User,
            ChipsWallet,
            Referral,
            ActivityLog,
            IpLog,
            Transaction,
            DailyBonus,
            SupportTicket,
            SystemSetting,
            Table,
            TablePlayer,
            Game,
            GameAction,
          ],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('RATE_LIMIT_TTL') || 60000,
          limit: configService.get('RATE_LIMIT_LIMIT') || 100,
        },
      ],
      inject: [ConfigService],
    }),

    // JWT Global Configuration
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
    }),

    // Feature Modules - Only include modules that are complete
    AuthModule,
    UsersModule,
    GameModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
