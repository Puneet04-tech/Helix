import { Controller, Post, Body, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { IncidentsService } from '../incidents/incidents.service';
import { createHmac, timingSafeEqual } from 'crypto';

interface HelixIncident {
  id: string;
  type: string;
  severity: string;
  service: string;
  message: string;
  projectId: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

@Controller('webhooks')
export class HelixWebhookController {
  private readonly logger = new Logger(HelixWebhookController.name);

  constructor(private readonly incidentsService: IncidentsService) {}

  @Post('helix-incident')
  async receiveIncident(
    @Body() incident: HelixIncident,
    @Headers('x-helix-signature') signature?: string,
  ): Promise<any> {
    this.verifySignature(JSON.stringify(incident), signature);

    const expectedProjectId = process.env.HELIX_PROJECT_ID || 'hospital_001';
    if (incident.projectId !== expectedProjectId) {
      this.logger.warn(`Incident for different project: ${incident.projectId}`);
      return { received: true, processed: false };
    }

    this.logger.warn(`
      ╔══════════════════════════════════════╗
      ║ 🏥 HOSPITAL INCIDENT FROM HELIX     ║
      ╠══════════════════════════════════════╣
      ║ Type: ${incident.type.padEnd(30)} ║
      ║ Severity: ${incident.severity.padEnd(26)} ║
      ║ Service: ${incident.service.padEnd(28)} ║
      ║ ID: ${incident.id.padEnd(32)} ║
      ╚══════════════════════════════════════╝
    `);

    const stored = await this.incidentsService.createFromHelixWebhook({
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      title: incident.message,
      description: incident.message,
      unit: String(incident.context?.unit || 'General'),
      service: incident.service,
      helixTimestamp: incident.timestamp,
      context: incident.context,
    });

    return {
      received: true,
      processed: true,
      incidentId: stored.id,
      helixIncidentId: incident.id,
      alertsDispatched: stored.alertsDispatched,
    };
  }

  private verifySignature(payload: string, signature?: string): void {
    const secret = process.env.HELIX_WEBHOOK_SECRET;
    if (!secret) return;

    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const provided = signature.replace(/^sha256=/, '');

    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(provided);
    if (
      expectedBuf.length !== providedBuf.length ||
      !timingSafeEqual(expectedBuf, providedBuf)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
