import { Controller, Post, Get, Put, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationId: string;
      role?: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.organizationId,
      body.role || 'developer',
    );
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.login(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: any,
    @Body() body: { firstName?: string; lastName?: string; preferences?: any },
  ) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Post('api-key/generate')
  @UseGuards(JwtAuthGuard)
  async generateApiKey(@Req() req: any) {
    return this.authService.generateApiKey(req.user.userId, req.user.organizationId);
  }

  @Post('validate-api-key')
  async validateApiKey(@Body() body: { apiKey: string }) {
    return this.authService.validateApiKey(body.apiKey);
  }
}
