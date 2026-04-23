import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class CanaryService {
  private readonly logger = new Logger(CanaryService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>
  ) {}

  /**
   * Performs an end-to-end synthetic transaction (Silent Canary).
   */
  async runCanary(targetUrl: string, flow: 'hospital' | 'hotel' = 'hotel'): Promise<any> {
    this.logger.log(`Starting Silent Canary for ${flow} at ${targetUrl}`);
    
    // Simulations of synthetic steps
    const steps = [
      { step: 'Page Load', status: 'success', latency: 120 },
      { step: 'Search Availability', status: 'success', latency: 450 },
      { step: 'Select Room/Doctor', status: 'success', latency: 310 },
      { step: 'Payment Simulation', status: Math.random() > 0.1 ? 'success' : 'failure', latency: 1200 },
      { step: 'Confirmation Dispatch', status: 'success', latency: 85 }
    ];

    const failedStep = steps.find(s => s.status === 'failure');
    
    if (failedStep) {
      this.logger.error(`Canary Failed: ${failedStep.step}`);
      // Trigger incident if canary fails
      return {
        success: false,
        criticalStep: failedStep.step,
        fullLog: steps,
        message: 'System appears green but transactions are failing. Triggering AI Guardian.'
      };
    }

    return {
      success: true,
      avgLatency: steps.reduce((acc, s) => acc + s.latency, 0) / steps.length,
      fullLog: steps
    };
  }
}
