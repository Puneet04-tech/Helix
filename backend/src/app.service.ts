import { Injectable } from '@nestjs/common';
import { HuggingFaceService } from './common/services/huggingface.service';

@Injectable()
export class AppService {
  constructor(private readonly hfService: HuggingFaceService) {}

  getHello(): string {
    return '🛡️ Welcome to Helix - Autonomous Threat Detection Intelligence Platform';
  }

  async checkSystemHealth() {
    const hfStatus = await this.hfService.testHuggingFaceConnection();
    return {
      status: 'ok',
      service: 'Helix Backend',
      timestamp: new Date().toISOString(),
      huggingface: hfStatus,
      features: {
        local_analysis: 'AVAILABLE',
        huggingface_inference: hfStatus.success ? 'AVAILABLE' : 'UNAVAILABLE (Fallback active)',
        caching: 'ENABLED',
        clustering: 'ENABLED',
      },
      message: 'System is operational. Local analysis always available.',
    };
  }
}
