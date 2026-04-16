import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AgentsService } from './agents.service';

@Controller('api/agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  /**
   * Get Playwright browser automation status and capabilities
   * GET /api/agents/playwright/status
   */
  @Get('playwright/status')
  async getPlaywrightStatus() {
    return await this.agentsService.getPlaywrightStatus();
  }

  /**
   * Test Playwright action
   * POST /api/agents/playwright/test/:action
   * 
   * Example actions: restart_service, scale_up, clear_cache, failover, kill_process
   */
  @Post('playwright/test/:action')
  async testPlaywrightAction(
    @Param('action') action: string,
    @Body() body?: any,
  ) {
    return await this.agentsService.testPlaywrightAction(action, body?.parameters);
  }

  /**
   * Execute Playwright action with custom parameters
   * POST /api/agents/playwright/execute
   */
  @Post('playwright/execute')
  async executePlaywrightAction(@Body() body: { action: string; parameters?: any }) {
    return await this.agentsService.testPlaywrightAction(body.action, body.parameters);
  }
}
