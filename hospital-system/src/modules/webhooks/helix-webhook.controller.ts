// hospital-system/src/modules/webhooks/helix-webhook.controller.ts
import { Controller, Post, Body, Logger } from '@nestjs/common';

interface HelixIncident {
  id: string;
  type: string;
  severity: string;
  service: string;
  message: string;
  projectId: string;
  context?: any;
  timestamp: string;
}

@Controller('webhooks')
export class HelixWebhookController {
  private logger = new Logger('HelixWebhookController');

  /**
   * Receive incident webhook from Helix
   * This is called when Helix detects an incident from hospital events
   */
  @Post('helix-incident')
  async receiveIncident(@Body() incident: HelixIncident): Promise<any> {
    console.log('🚨 Incident received from Helix:', incident);

    // Verify this is for our hospital
    if (incident.projectId !== process.env.HELIX_PROJECT_ID) {
      console.warn(`⚠️ Incident for different project: ${incident.projectId}`);
      return { received: true, processed: false };
    }

    // Log incident
    this.logger.log(`
      ╔══════════════════════════════════════╗
      ║ 🏥 HOSPITAL INCIDENT DETECTED       ║
      ╠══════════════════════════════════════╣
      ║ Type: ${incident.type.padEnd(30)} ║
      ║ Severity: ${incident.severity.padEnd(26)} ║
      ║ Service: ${incident.service.padEnd(28)} ║
      ║ Message: ${incident.message.substring(0, 28).padEnd(30)} ║
      ║ ID: ${incident.id.padEnd(32)} ║
      ╚══════════════════════════════════════╝
    `);

    // TODO: Implement hospital-specific actions
    // 1. Store incident in hospital DB
    // 2. Send alerts to staff (doctors, nurses, engineers)
    // 3. Update dashboard
    // 4. Trigger automated responses if needed

    return {
      received: true,
      processed: true,
      incidentId: incident.id,
    };
  }
}
