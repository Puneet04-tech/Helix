import { Injectable, Logger } from '@nestjs/common';
import { HelixService } from '../../services/helix.service';

export interface HospitalIncidentRecord {
  id: string;
  timestamp: Date;
  type: string;
  severity: string;
  title: string;
  description: string;
  unit: string;
  service: string;
  source: 'local' | 'helix-webhook';
  helixIncidentId?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  alertsDispatched: string[];
}

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);
  private incidents: HospitalIncidentRecord[] = [];

  constructor(private helixService: HelixService) {}

  async create(createIncidentDto: Record<string, unknown>) {
    const incident: HospitalIncidentRecord = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: String(createIncidentDto.type || 'equipment'),
      severity: String(createIncidentDto.severity || 'high'),
      title: String(createIncidentDto.title || 'Hospital incident'),
      description: String(createIncidentDto.description || ''),
      unit: String(createIncidentDto.unit || 'General'),
      service: 'hospital-system',
      source: 'local',
      status: 'open',
      alertsDispatched: [],
    };

    incident.alertsDispatched = this.dispatchStaffAlerts(incident);
    this.incidents.push(incident);

    try {
      await this.helixService.sendIncidentToCentralHelix({
        incidentId: incident.id,
        projectId: process.env.HELIX_PROJECT_ID || 'hospital_001',
        type: incident.type,
        title: incident.title,
        severity: incident.severity as 'low' | 'medium' | 'high' | 'critical',
        description: incident.description,
        unit: incident.unit,
        timestamp: incident.timestamp,
        service: 'hospital-management',
      });
    } catch (error) {
      this.logger.error(`Failed to send incident to Helix: ${error instanceof Error ? error.message : error}`);
    }

    return incident;
  }

  async createFromHelixWebhook(data: {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    unit: string;
    service: string;
    helixTimestamp: string;
    context?: Record<string, unknown>;
  }) {
    const existing = this.incidents.find(i => i.helixIncidentId === data.id);
    if (existing) {
      return { ...existing, alertsDispatched: existing.alertsDispatched };
    }

    const incident: HospitalIncidentRecord = {
      id: `helix-${data.id}`,
      helixIncidentId: data.id,
      timestamp: new Date(data.helixTimestamp || Date.now()),
      type: data.type,
      severity: data.severity,
      title: data.title,
      description: data.description,
      unit: data.unit,
      service: data.service,
      source: 'helix-webhook',
      status: 'acknowledged',
      alertsDispatched: [],
    };

    incident.alertsDispatched = this.dispatchStaffAlerts(incident);
    this.incidents.push(incident);

    this.logger.log(
      `Stored Helix incident ${data.id}; alerts: ${incident.alertsDispatched.join(', ')}`,
    );

    return incident;
  }

  async findAll() {
    return this.incidents.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  private dispatchStaffAlerts(incident: HospitalIncidentRecord): string[] {
    const alerts: string[] = ['engineering-console'];

    if (['critical', 'high'].includes(incident.severity)) {
      alerts.push('on-call-physician', 'nursing-station', 'biomedical-engineering');
    }

    if (incident.type.includes('equipment') || incident.type.includes('medical')) {
      alerts.push('equipment-maintenance');
    }

    if (incident.unit && incident.unit !== 'General') {
      alerts.push(`unit-${incident.unit.toLowerCase().replace(/\s+/g, '-')}`);
    }

    this.logger.warn(
      `Staff alerts dispatched for ${incident.id}: ${alerts.join(', ')}`,
    );

    return alerts;
  }
}
