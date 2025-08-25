import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ChipsWallet } from '../chip/entities/chips-wallet.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChipsWallet)
    private chipsWalletRepository: Repository<ChipsWallet>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    // Generate referral code
    const referralCode = uuidv4().substring(0, 8).toUpperCase();
    
    const user = this.userRepository.create({
      ...userData,
      referralCode,
    });

    const savedUser = await this.userRepository.save(user);

    // Create chips wallet with 5,000,000 starting chips
    const wallet = this.chipsWalletRepository.create({
      user: savedUser,
      balance: 5000000,
      totalBonusReceived: 5000000,
    });

    await this.chipsWalletRepository.save(wallet);

    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['chipsWallet'],
    });
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['chipsWallet'],
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['chipsWallet'],
    });
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['chipsWallet'],
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      totalGames: user.totalGamesPlayed,
      totalWins: user.totalGamesWon,
      winRate: user.totalGamesPlayed > 0 ? (user.totalGamesWon / user.totalGamesPlayed) * 100 : 0,
      totalChipsWon: user.totalChipsWon,
      totalChipsLost: user.totalChipsLost,
      currentBalance: user.chipsWallet?.balance || 0,
    };
  }
}
