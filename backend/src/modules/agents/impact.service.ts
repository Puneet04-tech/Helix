import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  // Benchmarking constants (Mocked industry averages)
  private readonly INDUSTRY_BENCHMARKS = {
    avgResponseTime: 280, // ms
    bookingErrorRate: 0.008, // 0.8%
    patientWaitTime: 450, // seconds
    systemUptime: 0.999
  };

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>
  ) {}

  /**
   * Calculates the Guest/Patient Impact Score for an incident.
   */
  async calculateImpact(incidentId: string, visitCount: number = 50): Promise<any> {
    const incident = await this.incidentModel.findOne({ incidentId }).exec();
    if (!incident) return null;

    // Logic: Revenue at risk = visits * conversion_rate * avg_value
    const conversionRate = 0.25;
    const avgBookingValue = 4500;
    
    const affectedCount = Math.floor(visitCount * (incident.severity === 'critical' ? 0.8 : 0.3));
    const potentialLostBookings = Math.floor(affectedCount * conversionRate);
    const revenueLoss = potentialLostBookings * avgBookingValue;

    const impact = {
      guestImpactScore: incident.severity === 'critical' ? 85 : 35,
      estimatedRevenueAtRisk: revenueLoss,
      affectedGuestCount: affectedCount,
      conversionLossCount: potentialLostBookings,
      experienceScore: incident.severity === 'critical' ? 20 : 70 // Lower is worse
    };

    await this.incidentModel.updateOne(
      { incidentId },
      { $set: { businessImpact: impact } }
    );

    return impact;
  }

  /**
   * Feature 7: Anonymous Benchmarking
   */
  async getAnonymousBenchmarking(projectId: string): Promise<any> {
    const clientIncidents = await this.incidentModel.find({ projectId }).exec();
    
    if (clientIncidents.length === 0) {
      return {
        status: 'no_data',
        message: 'Insufficient data for real-time benchmarking. Resolve at least 3 incidents to activate comparison.'
      };
    }
    
    const totalIncidents = clientIncidents.length;
    const resolvedIncidents = clientIncidents.filter(i => i.status === 'resolved');
    
    const clientPerformance = {
      avgResolutionTime: resolvedIncidents.length > 0 
        ? resolvedIncidents.reduce((acc, i) => acc + (i.resolutionTime || 0), 0) / resolvedIncidents.length 
        : 0,
      stabilityScore: Math.max(0, 100 - (totalIncidents * 10))
    };

    return {
      client: clientPerformance,
      benchmarks: this.INDUSTRY_BENCHMARKS,
      comparison: {
        resolutionDelta: clientPerformance.avgResolutionTime > 0 
          ? ((clientPerformance.avgResolutionTime / 1000) - (this.INDUSTRY_BENCHMARKS.avgResponseTime)) / 100
          : 0,
        isAboveAverage: clientPerformance.stabilityScore > 85
      }
    };
  }
}
