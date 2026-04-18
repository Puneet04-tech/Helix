// hospital-system/src/services/helix.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface HelixEvent {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  service: string;
  message: string;
  context?: any;
}

@Injectable()
export class HelixService {
  private logger = new Logger('HelixService');
  private helixUrl = process.env.HELIX_API_URL;
  private apiKey = process.env.HELIX_API_KEY;
  private projectId = process.env.HELIX_PROJECT_ID;

  /**
   * Send event to Helix for processing
   */
  async sendEvent(event: HelixEvent): Promise<any> {
    try {
      const payload = {
        ...event,
        projectId: this.projectId,
        timestamp: new Date().toISOString(),
      };

      console.log('📤 Sending event to Helix:', payload);

      const response = await axios.post(
        `${this.helixUrl}/events/ingest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      this.logger.log(`✅ Event sent: ${event.type}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error sending event: ${error.message}`);
      
      // Log but don't throw - incident detection shouldn't crash monitoring
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active incidents for hospital
   */
  async getIncidents(limit = 50): Promise<any> {
    try {
      const response = await axios.get(
        `${this.helixUrl}/incidents?projectId=${this.projectId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
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
      const response = await axios.get(
        `${this.helixUrl}/incidents/${incidentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Error fetching incident: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify hospital account
   */
  async verifyAccount(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.helixUrl}/auth/verify`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log('✅ Hospital account verified:', response.data);
      return response.data.valid === true;
    } catch (error: any) {
      console.error('❌ Account verification failed:', error.message);
      return false;
    }
  }
}
