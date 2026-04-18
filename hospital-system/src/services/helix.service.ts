// hospital-system/src/services/helix.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Helix from 'hotel-management-api-helix';
import axios from 'axios';

@Injectable()
export class HelixService {
  private logger = new Logger('HelixService');
  private helix: InstanceType<typeof Helix>;
  private helixUrl = process.env.HELIX_API_URL || 'https://helix-backend.render.com';
  private apiKey = process.env.HELIX_API_KEY;
  private projectId = process.env.HELIX_PROJECT_ID || 'hospital_001';
  private axiosClient = axios.create({
    timeout: 30000,
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Initialize Helix SDK with hospital-specific configuration
    this.helix = new Helix({
      apiKey: this.apiKey || 'pk_hospital_001_default',
      backendUrl: this.helixUrl,
      enabled: true,
      sampleRate: 1.0,
    });

    this.logger.log(`✅ Helix SDK Initialized (hotel-management-api-helix v1.0.0)`);
    this.logger.log(`📍 Project ID: ${this.projectId}`);
    this.logger.log(`🔐 API Key: ${this.apiKey?.substring(0, 15)}...`);
    this.logger.log(`🌐 Backend URL: ${this.helixUrl}`);
  }

  /**
   * Track patient vital anomaly - Critical patient monitoring event
   */
  trackPatientVitalAnomaly(patientId: string, vitalType: string, anomaly: string, severity: 'low' | 'medium' | 'high'): void {
    this.helix.track('warning', `Patient vital anomaly detected: ${vitalType}`, {
      service: 'patient-monitoring',
      patientId,
      vitalType,
      anomaly,
      severity,
      projectId: this.projectId,
    });

    this.logger.warn(`⚠️ Patient vital anomaly: ${patientId} - ${vitalType} (${severity})`);
  }

  /**
   * Track equipment malfunction - Critical equipment alert
   */
  trackEquipmentMalfunction(equipmentId: string, equipmentType: string, error: string, severity: 'low' | 'medium' | 'high'): void {
    this.helix.track('error', `Equipment malfunction detected: ${equipmentType}`, {
      service: 'equipment-monitoring',
      equipmentId,
      equipmentType,
      error,
      severity,
      projectId: this.projectId,
    });

    this.logger.error(`🚨 Equipment malfunction: ${equipmentId} - ${error} (${severity})`);
  }

  /**
   * Track incident dispatch - Alert distribution event
   */
  trackIncidentDispatch(incidentId: string, severity: string, staffRole: string, recipientCount: number): void {
    this.helix.trackAlertDispatch(staffRole as 'developer' | 'manager' | 'owner', incidentId, severity);
    this.helix.track('info', `Incident dispatch: ${incidentId} to ${staffRole}s`, {
      service: 'incident-dispatch',
      incidentId,
      severity,
      staffRole,
      recipientCount,
      projectId: this.projectId,
    });

    this.logger.log(`📢 Incident dispatch: ${incidentId} to ${recipientCount} ${staffRole}s`);
  }

  /**
   * Track hospital crisis prediction
   */
  trackCrisisPrediction(pattern: string, severity: 'low' | 'medium' | 'high'): void {
    this.helix.trackCrisisPrediction('hospital-monitoring', pattern, severity);
    this.helix.track('crisis_prediction', `Crisis pattern detected: ${pattern}`, {
      service: 'crisis-detection',
      pattern,
      severity,
      projectId: this.projectId,
    });

    this.logger.warn(`🔴 Crisis prediction: ${pattern} (${severity})`);
  }

  /**
   * Track compliance event - HIPAA, patient privacy compliance
   */
  trackComplianceEvent(eventType: string, incidentId: string, details: string): void {
    this.helix.trackComplianceEvent(eventType, incidentId, 'HIPAA');
    this.helix.track('compliance_event', `Compliance event: ${eventType}`, {
      service: 'compliance-audit',
      eventType,
      incidentId,
      details,
      compliance: 'HIPAA',
      projectId: this.projectId,
    });

    this.logger.log(`✓ Compliance tracked: ${eventType} - ${incidentId}`);
  }

  /**
   * Track hospital status update
   */
  trackStatusUpdate(services: { name: string; status: 'operational' | 'degraded' | 'down' }[]): void {
    this.helix.trackStatusUpdate(this.projectId, services);
    this.helix.track('info', `Hospital status update`, {
      service: 'status-page',
      services,
      projectId: this.projectId,
    });

    this.logger.log(`📊 Status update: ${services.map(s => `${s.name}=${s.status}`).join(', ')}`);
  }

  /**
   * Send custom tracking event to Helix
   */
  async sendEvent(type: string, message: string, metadata: any = {}): Promise<void> {
    try {
      this.helix.track(type as any, message, {
        ...metadata,
        projectId: this.projectId,
      });

      this.logger.debug(`📤 Event tracked: ${type}`);
    } catch (error: any) {
      this.logger.error(`❌ Error tracking event: ${error.message}`);
    }
  }

  /**
   * Get active incidents for hospital
   */
  async getIncidents(limit = 50): Promise<any> {
    try {
      const response = await this.axiosClient.get(
        `${this.helixUrl}/incidents?projectId=${this.projectId}&limit=${limit}`
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error fetching incidents: ${error.message}`);
      return [];
    }
  }

  /**
   * Get incident details
   */
  async getIncident(incidentId: string): Promise<any> {
    try {
      const response = await this.axiosClient.get(
        `${this.helixUrl}/incidents/${incidentId}`
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error fetching incident: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify hospital account with Helix
   */
  async verifyAccount(): Promise<boolean> {
    try {
      const response = await this.axiosClient.get(`${this.helixUrl}/auth/verify`);

      this.logger.log(`✅ Hospital account verified with Helix`);
      return response.data.valid === true;
    } catch (error: any) {
      this.logger.error(`❌ Account verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get Helix SDK status
   */
  getStatus(): { enabled: boolean; features: number } {
    return this.helix.getStatus();
  }
}
