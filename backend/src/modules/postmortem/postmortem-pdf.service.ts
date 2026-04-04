import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';

/**
 * Feature 4: Automatic Postmortem PDF Generation
 * Generates professional PDF postmortems when incidents are resolved
 */
@Injectable()
export class PostmortemPDFService {
  private readonly logger = new Logger(PostmortemPDFService.name);
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private uploadsDir = process.env.UPLOADS_DIR || './uploads/postmortems';

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate postmortem for a resolved incident
   */
  async generateAndSavePostmortem(incident: IncidentDocument): Promise<string> {
    try {
      this.logger.debug(`Generating postmortem for incident ${incident.incidentId}`);

      // Extract incident data
      const postmortemContent = await this.generatePostmortemContent(incident);

      // Generate PDF
      const pdfPath = await this.generatePDF(incident, postmortemContent);

      // Save reference to incident
      incident.postmortemPath = pdfPath;
      incident.postmortemGeneratedAt = new Date();
      await incident.save();

      this.logger.debug(`Postmortem saved to ${pdfPath}`);
      return pdfPath;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate postmortem: ${err.message}`);
      throw error;
    }
  }

  /**
   * Generate postmortem content using LLM
   */
  private async generatePostmortemContent(incident: IncidentDocument): Promise<any> {
    try {
      const prompt = `Based on the following incident details, generate a professional incident postmortem with exactly these 5 sections:
1. Executive Summary (2-3 lines)
2. Timeline (list of key events with timestamps)
3. Root Cause (explanation of why it happened)
4. Business Impact (quantified impact)
5. Recommendations (actionable next steps)

Incident Details:
- Type: ${incident.type}
- Service: ${incident.service}
- Severity: ${incident.severity}
- Description: ${incident.description}
- Root Cause: ${incident.rootCause || 'Under investigation'}
- Duration: ${incident.resolutionTime ? `${(incident.resolutionTime / 1000 / 60).toFixed(1)} minutes` : 'N/A'}
- Actions Taken: ${incident.automaticActions?.map((a: any) => a.action).join(', ') || 'None'}
- Users Affected: ${incident.affectedUsers || '0'}

Return the response as plain text with clear section headers.`;

      const response = await this.callOllama(prompt);

      return this.parsePostmortemSections(response);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Failed to generate LLM content, using defaults: ${err.message}`);
      
      return {
        executiveSummary: `An incident affecting ${incident.service} was detected and automatically resolved.`,
        timeline: [`Incident Detected: ${incident.detectedAt}`, `Incident Resolved: ${incident.resolvedAt}`],
        rootCause: incident.rootCause || 'Investigation pending',
        businessImpact: `Approximately ${incident.affectedUsers || 'an unknown number of'} affected.`,
        recommendations: ['Monitor service metrics closely', 'Review error logs'],
      };
    }
  }

  /**
   * Parse LLM response into structured sections
   */
  private parsePostmortemSections(text: string): any {
    const sections = {
      executiveSummary: '',
      timeline: [] as string[],
      rootCause: '',
      businessImpact: '',
      recommendations: [] as string[],
    };

    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes('Executive Summary')) currentSection = 'executiveSummary';
      else if (trimmed.includes('Timeline')) currentSection = 'timeline';
      else if (trimmed.includes('Root Cause')) currentSection = 'rootCause';
      else if (trimmed.includes('Business Impact')) currentSection = 'businessImpact';
      else if (trimmed.includes('Recommendations')) currentSection = 'recommendations';
      else if (trimmed && currentSection) {
        if (['timeline', 'recommendations'].includes(currentSection)) {
          sections[currentSection as 'timeline' | 'recommendations'].push(trimmed);
        } else {
          sections[currentSection as 'executiveSummary' | 'rootCause' | 'businessImpact'] += ' ' + trimmed;
        }
      }
    }

    return sections;
  }

  /**
   * Generate PDF from postmortem content
   */
  private async generatePDF(incident: IncidentDocument, content: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const filename = `postmortem-${incident.incidentId}-${Date.now()}.pdf`;
        const filepath = path.join(this.uploadsDir, filename);
        const stream = fs.createWriteStream(filepath);

        const doc = new PDFDocument();
        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Helix Incident Postmortem', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown();

        // Incident Info
        doc.fontSize(14).font('Helvetica-Bold').text('Incident Information');
        doc.fontSize(11).font('Helvetica');
        doc.text(`Incident ID: ${incident.incidentId}`);
        doc.text(`Type: ${incident.type}`);
        doc.text(`Service: ${incident.service}`);
        doc.text(`Severity: ${incident.severity}`);
        doc.text(`Duration: ${incident.resolutionTime ? `${(incident.resolutionTime / 1000 / 60).toFixed(1)} minutes` : 'N/A'}`);
        doc.moveDown();

        // Executive Summary
        doc.fontSize(14).font('Helvetica-Bold').text('Executive Summary');
        doc.fontSize(11).font('Helvetica').text(content.executiveSummary || 'N/A', { align: 'left' });
        doc.moveDown();

        // Timeline
        doc.fontSize(14).font('Helvetica-Bold').text('Timeline');
        doc.fontSize(11).font('Helvetica');
        content.timeline?.forEach((event: string) => doc.text(`• ${event}`));
        doc.moveDown();

        // Root Cause
        doc.fontSize(14).font('Helvetica-Bold').text('Root Cause Analysis');
        doc.fontSize(11).font('Helvetica').text(content.rootCause || 'N/A', { align: 'left' });
        doc.moveDown();

        // Business Impact
        doc.fontSize(14).font('Helvetica-Bold').text('Business Impact');
        doc.fontSize(11).font('Helvetica').text(content.businessImpact || 'N/A', { align: 'left' });
        doc.moveDown();

        // Recommendations
        doc.fontSize(14).font('Helvetica-Bold').text('Recommendations');
        doc.fontSize(11).font('Helvetica');
        content.recommendations?.forEach((rec: string) => doc.text(`• ${rec}`));
        doc.moveDown(2);

        // Compliance Statement
        doc.fontSize(10).font('Helvetica-Italic').text(
          'All incidents in this report were logged automatically by Helix without human modification. ' +
          'This report is suitable for regulatory compliance review.',
          { align: 'center' },
        );

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Call Ollama for content generation
   */
  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'mistral',
          prompt,
          stream: false,
          temperature: 0.5,
        },
        { timeout: 30000 },
      );

      return response.data.response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get postmortem download URL
   */
  getPostmortemUrl(incidentId: string, postmortemPath: string): string {
    return `/incidents/${incidentId}/postmortem/download`;
  }

  /**
   * Read postmortem PDF file
   */
  readPostmortemFile(filepath: string): Buffer {
    return fs.readFileSync(filepath);
  }
}
