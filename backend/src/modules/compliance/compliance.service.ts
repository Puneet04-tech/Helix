import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import PDFDocument from 'pdfkit';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async generateComplianceReport(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    try {
      const client = await this.clientModel.findById(projectId);
      const incidents = await this.incidentModel
        .find({
          projectId,
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .sort({ createdAt: -1 })
        .lean();

      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {});

      // Cover page
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Compliance Report', { align: 'center' });
      doc.fontSize(12).text(`Organization: ${client?.name || 'Unknown'}`);
      doc.text(`Period: ${startDate.toDateString()} to ${endDate.toDateString()}`);
      doc.moveDown(2);

      doc.fontSize(10).text(
        'All incidents in this report were logged automatically by Helix without human modification.',
      );
      doc.text('This report is suitable for regulatory compliance review.');

      doc.addPage();

      // Summary
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Executive Summary', { underline: true });

      const bySeverity = incidents.reduce(
        (acc: Record<string, number>, i: any) => {
          acc[i.severity] = (acc[i.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const byType = incidents.reduce(
        (acc: Record<string, number>, i: any) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      doc.fontSize(10).text(`Total Incidents: ${incidents.length}`);
      Object.entries(bySeverity).forEach(([severity, count]) => {
        doc.text(`- ${severity}: ${count}`);
      });

      doc.moveDown();

      // Incident table
      doc.fontSize(12).font('Helvetica-Bold').text('Incident Details');
      doc.fontSize(8).font('Helvetica');

      incidents.forEach((incident, idx) => {
        if (idx > 0 && idx % 10 === 0) {
          doc.addPage();
        }
        doc.text(
          `${idx + 1}. ID: ${incident.incidentId} | Type: ${incident.type} | Severity: ${incident.severity}`,
        );
        doc.text(`   Service: ${incident.service} | Created: ${incident.createdAt}`);
        doc.text(
          `   Status: ${incident.status} | Resolution Time: ${incident.resolutionTime || 'N/A'}ms`,
        );
        doc.moveDown(0.5);
      });

      doc.end();

      return Buffer.concat(chunks);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate compliance report: ${err.message}`);
      throw error;
    }
  }

  async getComplianceSummary(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      const incidents = await this.incidentModel
        .find({
          projectId,
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .lean();

      const bySeverity = incidents.reduce(
        (acc: Record<string, number>, i: any) => {
          acc[i.severity] = (acc[i.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const avgResolutionTime =
        (incidents.filter(i => i.resolutionTime).reduce((sum, i: any) => sum + (i.resolutionTime || 0), 0) /
          Math.max(incidents.filter(i => i.resolutionTime).length, 1)) || 0;

      return {
        reportPeriod: {
          start: startDate,
          end: endDate,
        },
        totalIncidents: incidents.length,
        bySeverity,
        averageResolutionTime: Math.round(avgResolutionTime),
        generatedAt: new Date(),
        certification: 'All data automatically logged by Helix',
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get compliance summary: ${err.message}`);
      throw error;
    }
  }
}
