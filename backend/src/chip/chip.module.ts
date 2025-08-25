import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChipService } from './chip.service';
import { ChipController } from './chip.controller';
import { ChipsWallet } from './entities/chips-wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChipsWallet]),
  ],
  controllers: [ChipController],
  providers: [ChipService],
  exports: [ChipService, TypeOrmModule],
})
export class ChipModule {}
