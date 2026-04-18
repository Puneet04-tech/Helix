import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import PDFDocument from 'pdfkit';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

@Injectable()
export class PostmortemService {
  private readonly logger = new Logger(PostmortemService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  async generatePostmortemPDF(incidentId: string): Promise<Buffer> {
    try {
      const incident = await this.incidentModel.findOne({ incidentId });
      if (!incident) {
        throw new Error('Incident not found');
      }

      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {});

      // Title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('🛡️ Helix Incident Postmortem', { align: 'center' });

      doc.moveDown();

      // Executive Summary
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Executive Summary', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(
        incident.agentReasoning?.analysisAgent?.rootCause ||
          'Automated incident response executed.',
      );

      doc.moveDown();

      // Timeline
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Timeline', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Detected: ${incident.detectedAt}`);
      doc.text(`Resolved: ${incident.resolvedAt || 'In Progress'}`);
      doc.text(`Resolution Time: ${incident.resolutionTime || 0}ms`);

      doc.moveDown();

      // Root Cause
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Root Cause', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(
        incident.agentReasoning?.analysisAgent?.rootCause ||
          'Root cause analysis pending',
      );

      doc.moveDown();

      // Business Impact
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Business Impact', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Affected Services: ${incident.affectedServices?.join(', ') || incident.service}`);
      doc.text(`Impact Summary: ${incident.impactSummary || 'Unknown'}`);

      doc.moveDown();

      // Recommendations
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Recommendations', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.list([
        'Monitor for similar patterns',
        'Review automation rules',
        'Update alerting thresholds if needed',
        'Document lessons learned',
      ]);

      doc.end();

      return Buffer.concat(chunks);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate postmortem PDF: ${err.message}`);
      throw error;
    }
  }

  async getPostmortemSummary(incidentId: string): Promise<string> {
    try {
      const incident = await this.incidentModel.findOne({ incidentId });
      if (!incident) {
        throw new Error('Incident not found');
      }

      return `
Incident ID: ${incidentId}
Type: ${incident.type}
Service: ${incident.service}
Status: ${incident.status}
Severity: ${incident.severity}

Root Cause: ${incident.agentReasoning?.analysisAgent?.rootCause || 'Analysis pending'}
Resolution Time: ${incident.resolutionTime || 0}ms

Automatic Actions:
${incident.automaticActions?.map(a => `- ${a.action} on ${a.target}: ${a.result}`).join('\n') || 'None'}
      `;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get postmortem summary: ${err.message}`);
      throw error;
    }
  }
}
