import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Referral } from './entities/referral.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Referral, ChipsWallet]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
