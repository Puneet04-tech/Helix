import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../../common/schemas/event.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';
import { MemoryService } from '../../common/services/memory.service';
import { HuggingFaceService } from '../../common/services/huggingface.service';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private memoryService: MemoryService,
    private huggingFaceService: HuggingFaceService,
    private incidentsService: IncidentsService,
  ) {}

  async ingestEvent(apiKey: string, eventData: any) {
    // Step 1: Validate API key and get project/client
    const client = await this.clientModel.findOne({ apiKey });
    if (!client) {
      throw new BadRequestException('Invalid API key');
    }

    const projectId = client._id.toString();

    // Step 2: Store event in MongoDB (async, non-blocking)
    const event = new this.eventModel({
      projectId,
      type: eventData.type || 'info',
      service: eventData.service || 'unknown',
      message: eventData.message || '',
      metadata: eventData.metadata || {},
      timestamp: new Date(),
      processed: false,
    });

    event.save().catch(err => {
      this.logger.error(`Failed to save event: ${err.message}`);
    });

    // ===== HOTEL MANAGEMENT INTEGRATION =====
    // Direct incident creation for hotel complaints (bypass pattern detection)
    if (eventData.service === 'hotel-management' || eventData.service === 'complaint-management') {
      this.logger.log(`Hotel complaint detected: ${eventData.message}`);
      
      try {
        const incident = await this.incidentsService.createIncident(
          projectId,
          {
            type: 'guest_complaint',
            severity: eventData.metadata?.severity || 'warning',
            service: 'hotel-management',
            title: eventData.message || 'Guest Complaint',
            description: `Complaint ID: ${eventData.metadata?.complaintId || 'unknown'} - ${eventData.message}`,
            analysis: {
              category: 'operational_issue',
              confidence: 1.0,
              isAnomaly: true,
            },
            events: [eventData],
          },
        );

        return {
          received: true,
          analyzed: true,
          anomalyDetected: true,
          incidentId: incident.incidentId,
          category: 'operational_issue',
          source: 'hotel-integration',
        };
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Failed to create incident from complaint: ${err.message}`);
        return {
          received: true,
          analyzed: true,
          incidentCreated: false,
          error: err.message,
        };
      }
    }

    // ===== STANDARD THREAT DETECTION PIPELINE =====
    // Step 3: Add to in-memory Map for pattern detection
    this.memoryService.addEvent(projectId, {
      type: eventData.type || 'info',
      timestamp: Date.now(),
      data: eventData,
    });

    // Step 4: Check for suspicious pattern (3+ events in 5 minutes)
    const hasSuspiciousPattern = this.memoryService.hasSuspiciousPattern(
      projectId,
      eventData.type || 'info',
    );

    if (!hasSuspiciousPattern) {
      this.logger.debug(
        `Event recorded but no suspicious pattern detected for ${projectId}`,
      );
      return {
        received: true,
        analyzed: false,
        reason: 'Pattern threshold not met',
      };
    }

    // Step 5: Pattern confirmed - call HuggingFace for analysis
    this.logger.debug(`Suspicious pattern detected for ${projectId}`);
    const eventsForAnalysis = this.memoryService.getAllEventsForAnalysis(
      projectId,
      15,
    );

    const analysisResult = await this.huggingFaceService.analyzeEvents(
      projectId,
      eventsForAnalysis,
    );

    this.logger.debug(
      `HuggingFace analysis: ${analysisResult.category} (${(analysisResult.confidence * 100).toFixed(1)}%)`,
    );

    // Step 6: Threshold check - only continue if anomaly confirmed
    if (!analysisResult.isAnomaly) {
      return {
        received: true,
        analyzed: true,
        anomalyDetected: false,
        reason: 'Analysis classified as normal activity',
      };
    }

    // Step 7: Anomaly confirmed - trigger incident creation and agent chain
    this.logger.debug(
      `Anomaly confirmed for ${projectId}: ${analysisResult.category}`,
    );

    // Create incident (asynchronously triggers agent chain)
    try {
      const incident = await this.incidentsService.createIncident(
        projectId,
        {
          type: analysisResult.category,
          severity: analysisResult.category === 'security_threat' ? 'critical' : 'warning',
          service: eventData.service || 'unknown',
          analysis: analysisResult,
          events: eventsForAnalysis,
        },
      );

      return {
        received: true,
        analyzed: true,
        anomalyDetected: true,
        incidentId: incident.incidentId,
        category: analysisResult.category,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create incident: ${err.message}`);
      return {
        received: true,
        analyzed: true,
        anomalyDetected: true,
        error: 'Failed to create incident',
      };
    }
  }

  async getEventsByProjectId(projectId: string, limit: number = 50) {
    return this.eventModel
      .find({ projectId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async getEventsByType(projectId: string, type: string, limit: number = 20) {
    return this.eventModel
      .find({ projectId, type })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  async markEventProcessed(eventId: string) {
    return this.eventModel.findByIdAndUpdate(
      eventId,
      { processed: true },
      { new: true },
    );
  }

  async getUnprocessedEvents(projectId: string) {
    return this.eventModel
      .find({ projectId, processed: false })
      .sort({ timestamp: -1 })
      .lean();
  }

  getMemoryStats() {
    return this.memoryService.getStats();
  }
}
