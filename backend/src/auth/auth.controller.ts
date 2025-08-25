import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        username: { type: 'string', example: 'username123' },
        password: { type: 'string', example: 'password123' },
        fullName: { type: 'string', example: 'John Doe', nullable: true },
      },
    },
  })
  async register(
    @Body() registerData: {
      email: string;
      username: string;
      password: string;
      fullName?: string;
    },
  ) {
    return this.authService.register(registerData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  @ApiOperation({ summary: 'Verify JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
  async verifyToken(@Request() req) {
    return this.authService.verifyToken(req.user.id);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // In a real application, you might want to blacklist the token
    // or handle logout logic on the client side
    return { message: 'Logout successful' };
  }

  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  googleAuth() {
    // This will be handled by the Google strategy
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  googleAuthRedirect(@Request() req) {
    return this.authService.validateOAuthLogin(req.user);
  }

  @Get('facebook')
  @ApiOperation({ summary: 'Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Facebook OAuth' })
  facebookAuth() {
    // This will be handled by the Facebook strategy
  }

  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 200, description: 'Facebook login successful' })
  facebookAuthRedirect(@Request() req) {
    return this.authService.validateOAuthLogin(req.user);
  }
}
