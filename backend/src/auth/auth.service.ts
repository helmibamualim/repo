import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async register(registerData: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is taken
    const existingUsername = await this.usersService.findByUsername(registerData.username);
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerData.password, 12);

    // Create user
    const user = await this.usersService.create({
      email: registerData.email,
      username: registerData.username,
      passwordHash: hashedPassword,
      fullName: registerData.fullName,
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async verifyToken(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async validateOAuthLogin(profile: any) {
    // Implement OAuth login logic here
    // This will be used by Google and Facebook strategies
    let user = await this.usersService.findByEmail(profile.email);
    
    if (!user) {
      // Create new user if not exists
      user = await this.usersService.create({
        email: profile.email,
        username: profile.email.split('@')[0],
        fullName: profile.name,
        avatarUrl: profile.picture,
        googleId: profile.googleId,
        facebookId: profile.facebookId,
        passwordHash: '', // No password for OAuth users
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
