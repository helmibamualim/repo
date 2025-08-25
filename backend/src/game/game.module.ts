import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { PokerGameService } from './services/poker-game.service';
import { Table } from './entities/table.entity';
import { TablePlayer } from './entities/table-player.entity';
import { Game } from './entities/game.entity';
import { GameAction } from './entities/game-action.entity';
import { User } from '../users/entities/user.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';
import { ActivityLog } from '../analytics/entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Table, 
      TablePlayer, 
      Game, 
      GameAction, 
      User, 
      ChipsWallet, 
      ActivityLog
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway, PokerGameService],
  exports: [GameService, PokerGameService, TypeOrmModule],
})
export class GameModule {}
