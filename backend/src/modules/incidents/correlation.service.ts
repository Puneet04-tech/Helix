import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

interface CorrelatedGroup {
  incidentIds: string[];
  commonService: string;
  commonType: string;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  correlationScore: number;
  potentialRootCause?: string;
}

@Injectable()
export class CorrelationService {
  private readonly logger = new Logger(CorrelationService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  /**
   * Find correlated incident groups within a time window.
   * Uses time-based clustering (incidents within 4 hours of each other)
   * combined with service/type similarity.
   */
  async findCorrelatedGroups(projectId: string, timeWindowHours = 4): Promise<CorrelatedGroup[]> {
    const since = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    // Fetch recent incidents for the project
    const incidents = await this.incidentModel
      .find({
        projectId,
        detectedAt: { $gte: since },
      })
      .sort({ detectedAt: 1 })
      .lean();

    if (incidents.length < 2) {
      return [];
    }

    const groups: CorrelatedGroup[] = [];
    const processed = new Set<string>();

    for (const incident of incidents) {
      if (processed.has(incident.incidentId || incident._id?.toString())) continue;

      const incidentId = incident.incidentId || incident._id?.toString();
      const cluster: string[] = [incidentId];
      const clusterTimeStart = incident.detectedAt || incident.createdAt;
      const clusterTimeEnd = new Date(
        (clusterTimeStart as Date).getTime() + timeWindowHours * 60 * 60 * 1000,
      );

      // Find other incidents in the same time window on the same service
      for (const other of incidents) {
        const otherId = other.incidentId || other._id?.toString();
        if (otherId === incidentId || processed.has(otherId)) continue;

        const otherTime = other.detectedAt || other.createdAt;
        if (!otherTime) continue;

        // Check time window overlap
        if (
          new Date(otherTime) >= clusterTimeStart &&
          new Date(otherTime) <= clusterTimeEnd
        ) {
          // Check service/type similarity
          if (
            other.service === incident.service ||
            other.type === incident.type
          ) {
            cluster.push(otherId);
            processed.add(otherId);
          }
        }
      }

      if (cluster.length >= 2) {
        // Calculate correlation score based on:
        // - Time proximity (closer = higher)
        // - Service match (same service = higher)
        // - Type match (same type = higher)
        const timeSpan =
          Math.max(...cluster.map(id => {
            const inc = incidents.find(i => (i.incidentId || i._id?.toString()) === id);
            return inc ? new Date(inc.detectedAt || inc.createdAt || 0).getTime() : 0;
          })) -
          Math.min(...cluster.map(id => {
            const inc = incidents.find(i => (i.incidentId || i._id?.toString()) === id);
            return inc ? new Date(inc.detectedAt || inc.createdAt || 0).getTime() : 0;
          }));

        const maxTimeSpan = timeWindowHours * 60 * 60 * 1000;
        const timeScore = 1 - timeSpan / maxTimeSpan;

        const serviceMatches = cluster.filter(id => {
          const inc = incidents.find(i => (i.incidentId || i._id?.toString()) === id);
          return inc?.service === incident.service;
        }).length;
        const typeMatches = cluster.filter(id => {
          const inc = incidents.find(i => (i.incidentId || i._id?.toString()) === id);
          return inc?.type === incident.type;
        }).length;

        const serviceScore = serviceMatches / cluster.length;
        const typeScore = typeMatches / cluster.length;

        const correlationScore = (timeScore + serviceScore + typeScore) / 3;

        // Infer potential root cause from the earliest incident
        const sortedByTime = cluster
          .map(id => incidents.find(i => (i.incidentId || i._id?.toString()) === id))
          .filter(Boolean)
          .sort((a: any, b: any) =>
            new Date(a.detectedAt || a.createdAt || 0).getTime() -
            new Date(b.detectedAt || b.createdAt || 0).getTime(),
          );

        const earliest = sortedByTime[0];

        groups.push({
          incidentIds: cluster,
          commonService: incident.service,
          commonType: incident.type,
          timeWindowStart: clusterTimeStart as Date,
          timeWindowEnd: clusterTimeEnd,
          correlationScore: Math.round(correlationScore * 100) / 100,
          potentialRootCause: earliest?.type || incident.type,
        });

        cluster.forEach(id => processed.add(id));
      }
    }

    // Sort by correlation score descending
    return groups.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  /**
   * Analyze and store correlations for a new incident.
   * Called when a new incident is created.
   */
  async analyzeNewIncident(projectId: string, incidentId: string): Promise<CorrelatedGroup[]> {
    const groups = await this.findCorrelatedGroups(projectId);
    const relevantGroups = groups.filter(g => g.incidentIds.includes(incidentId));

    // Optionally update the incident with correlation note
    for (const group of relevantGroups) {
      await this.incidentModel.updateOne(
        { incidentId },
        {
          $set: {
            correlationNote: `Correlated with ${group.incidentIds.length - 1} other incident(s) on ${group.commonService} (score: ${group.correlationScore})`,
            correlatedIncidentIds: group.incidentIds.filter(id => id !== incidentId),
          },
        },
      );
    }

    return relevantGroups;
  }

  /**
   * Get all correlation groups for a project (for dashboard display).
   */
  async getProjectCorrelations(projectId: string): Promise<CorrelatedGroup[]> {
    return this.findCorrelatedGroups(projectId);
  }
}