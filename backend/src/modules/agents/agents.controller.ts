import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AgentsService } from './agents.service';
import { ChaosService } from './chaos.service';
import { CanaryService } from './canary.service';
import { KnowledgeService } from './knowledge.service';
import { ImpactService } from './impact.service';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly chaosService: ChaosService,
    private readonly canaryService: CanaryService,
    private readonly knowledgeService: KnowledgeService,
    private readonly impactService: ImpactService,
  ) {}

  @Get('playwright/status')
  async getPlaywrightStatus() {
    return await this.agentsService.getPlaywrightStatus();
  }

  // Feature 2: Chaos Mode Simulation
  @Post('chaos/simulate')
  async simulateChaos(@Body('service') service: string) {
    return await this.chaosService.simulateFailure(service);
  }

  // Feature 5: Silent Canary
  @Post('canary/run')
  async runCanary(
    @Body('url') url: string,
    @Body('targetUrl') targetUrl: string,
    @Body('flow') flow: 'hotel'|'hospital',
    @Body('dryRun') dryRun: boolean = false
  ) {
    const effectiveUrl = url || targetUrl;
    return await this.canaryService.runCanary(effectiveUrl, flow, dryRun);
  }

  // Feature 4: Knowledge Base Search
  @Get('knowledge/search')
  async searchKnowledge(@Query('query') query: string) {
    return await this.knowledgeService.queryKnowledge(query);
  }

  // Feature 10: Crystallize Knowledge
  @Post('knowledge/crystallize/:incidentId')
  async crystallizeKnowledge(@Param('incidentId') incidentId: string) {
    return await this.knowledgeService.crystallizeKnowledge(incidentId);
  }

  // Feature 7: Benchmarking
  @Get('benchmarking/:projectId')
  async getBenchmarking(@Param('projectId') projectId: string) {
    return await this.impactService.getAnonymousBenchmarking(projectId);
  }

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
