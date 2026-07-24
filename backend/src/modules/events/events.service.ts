import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../../common/schemas/event.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';
import { MemoryService } from '../../common/services/memory.service';
import { HuggingFaceService } from '../../common/services/huggingface.service';
import { AuditService } from '../../common/services/audit.service';
import { IncidentsService } from '../incidents/incidents.service';
import { IngestRateLimitService } from '../../common/services/ingest-rate-limit.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private memoryService: MemoryService,
    private huggingFaceService: HuggingFaceService,
    private auditService: AuditService,
    private incidentsService: IncidentsService,
    private rateLimitService: IngestRateLimitService,
  ) {
    // Initialize MemoryService with AuditService to avoid circular dependency
    this.memoryService.setAuditService(this.auditService);
  }

  async ingestEvent(apiKey: string, eventData: any) {
    if (!apiKey) {
      throw new BadRequestException('API key required (x-api-key header)');
    }

    this.rateLimitService.check(apiKey);

    // Step 1: Validate API key and get project/client
    const client = await this.clientModel.findOne({ apiKey });
    if (!client) {
      throw new BadRequestException('Invalid API key');
    }

    // Use appropriate project ID based on service
    let projectId = client._id.toString();
    
    // For hospital-management, use the hospital_001 project ID to match user's project
    if (eventData.service === 'hospital-management') {
      projectId = 'hospital_001';
    }
    
    // For hotel-management, use the hotel_001 project ID to match user's project
    if (eventData.service === 'hotel-management') {
      projectId = 'hotel_001';
    }

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

    // ===== HOTEL MANAGEMENT & HOSPITAL MANAGEMENT INTEGRATION =====
    // Direct incident creation for hotel complaints and hospital incidents (bypass pattern detection)
    if (eventData.service === 'hotel-management' || eventData.service === 'complaint-management' || eventData.service === 'hospital-management') {
      this.logger.log(`Incident detected from ${eventData.service}: ${eventData.message}`);
      
      // Map system severities to incident schema severities
      const severityMap: Record<string, string> = {
        'critical': 'critical',
        'high': 'critical',      // Map high -> critical
        'medium': 'warning',      // Map medium -> warning
        'low': 'info',           // Map low -> info
        'warning': 'warning',
        'info': 'info',
      };
      const mappedSeverity = severityMap[eventData.metadata?.severity] || 'warning';
      
      try {
        // Map incident types to valid enum values
        const typeMap: Record<string, string> = {
          'equipment': 'equipment_failure',
          'medical': 'medical_incident',
          'patient': 'patient_incident',
          'system': 'system_incident',
        };
        
        // Determine incident type based on service
        let incidentType = eventData.service === 'hospital-management' 
          ? eventData.metadata?.incidentType || 'medical_incident'
          : 'guest_complaint';
        
        // Apply type mapping if needed
        incidentType = typeMap[incidentType] || incidentType;
        
        const source = eventData.service === 'hospital-management' 
          ? 'hospital-integration'
          : 'hotel-integration';

        // For hospital incidents, also go through Groq analysis pipeline
        // Add to memory for pattern detection
        this.memoryService.addEvent(projectId, {
          type: eventData.type || 'info',
          timestamp: Date.now(),
          data: eventData,
        });

        // Check for suspicious pattern (hospital incidents may have different thresholds)
        const hasSuspiciousPattern = this.memoryService.hasSuspiciousPattern(
          projectId,
          eventData.type || 'info',
        );

        let analysisResult;
        if (hasSuspiciousPattern) {
          // Use Groq analysis through HuggingFace service
          const eventsForAnalysis = this.memoryService.getAllEventsForAnalysis(
            projectId,
            15,
          );
          analysisResult = await this.huggingFaceService.analyzeEvents(
            projectId,
            eventsForAnalysis,
          );
          this.logger.debug(
            `Groq analysis for hospital incident: ${analysisResult.category} (${(analysisResult.confidence * 100).toFixed(1)}%)`,
          );
        } else {
          // Fallback analysis for single incident
          analysisResult = {
            category: 'operational_issue',
            confidence: 0.8,
            isAnomaly: true,
            reasoning: 'Hospital incident detected - requires investigation',
            source: 'fallback' as const,
          };
        }

        const incident = await this.incidentsService.createIncident(
          projectId,
          {
            type: incidentType,
            severity: mappedSeverity,
            service: eventData.service,
            title: eventData.message || 'Incident Report',
            description: eventData.metadata?.description || eventData.message,
            metadata: {
              ...eventData.metadata,
              incidentId: eventData.metadata?.incidentId,
              complaintId: eventData.metadata?.complaintId,
              guestId: eventData.metadata?.guestId,
              roomNumber: eventData.metadata?.roomNumber,
              unit: eventData.metadata?.unit,
              severity: eventData.metadata?.severity,
            },
            analysis: analysisResult,
            events: [eventData],
          },
        );

        return {
          received: true,
          analyzed: true,
          anomalyDetected: true,
          incidentId: incident.incidentId,
          category: 'operational_issue',
          source: source,
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
      const message = `Event recorded but no suspicious pattern detected for ${projectId}`;
      this.logger.debug(message);

      // Log to audit trail
      this.auditService.logAudit(
        projectId,
        'EventsService',
        'pattern_check_clean',
        { eventType: eventData.type, service: eventData.service },
        message,
        'debug',
      ).catch(err => this.logger.error(`Audit log failed: ${err.message}`));

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
