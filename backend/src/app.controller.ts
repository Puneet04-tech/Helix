import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AI Guardian Backend',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('system-status')
  async getSystemStatus() {
    return await this.appService.checkSystemHealth();
  }
}
