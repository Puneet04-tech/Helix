import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Injectable()
export class ChaosService {
  private readonly logger = new Logger(ChaosService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Simulates a cascade failure by analyzing historical incident dependencies.
   */
  async simulateFailure(seedService: string): Promise<any> {
    this.logger.log(`Starting Chaos Simulation for service: ${seedService}`);
    
    // Find historical incidents where this service was the root cause
    const history = await this.incidentModel.find({
      service: seedService,
      affectedServices: { $exists: true, $not: { $size: 0 } }
    }).exec();

    let cascade: Array<{ service: string; probability: number; impactLevel: string }> = [];

    if (history.length > 0) {
      const dependencyMap = new Map<string, number>();
      history.forEach(incident => {
        incident.affectedServices.forEach(dep => {
          dependencyMap.set(dep, (dependencyMap.get(dep) || 0) + 1);
        });
      });

      cascade = Array.from(dependencyMap.entries())
        .map(([service, count]) => ({
          service,
          probability: count / (history.length || 1),
          impactLevel: this.calculateImpactLevel(count)
        }))
        .sort((a, b) => b.probability - a.probability);
    } else {
      // Return empty cascade if no real history exists
      cascade = [];
    }

    const result = {
      seedService,
      timestamp: new Date(),
      status: history.length > 0 ? 'analysis_complete' : 'no_history_available',
      cascadeChain: cascade,
      riskLevel: cascade.length > 3 ? 'High' : (cascade.length > 0 ? 'Low' : 'None'),
      dependencyRiskMap: this.generateRiskMapMetadata(seedService, cascade)
    };

    if (this.eventsGateway) {
      this.eventsGateway.broadcastChaosUpdate('default', result);
    }

    return result;
  }

  private calculateImpactLevel(frequency: number): string {
    if (frequency > 5) return 'Critical/Fatal';
    if (frequency > 2) return 'Partial Degradation';
    return 'Minor/Latency';
  }

  private generateRiskMapMetadata(seed: string, cascade: any[]): any {
    return {
      nodes: [
        { id: seed, label: seed, group: 'seed' },
        ...cascade.map(c => ({ id: c.service, label: c.service, group: 'affected' }))
      ],
      edges: cascade.map(c => ({ 
        from: seed, 
        to: c.service, 
        value: c.probability,
        title: `Probability: ${(c.probability * 100).toFixed(1)}%`
      }))
    };
  }
}
