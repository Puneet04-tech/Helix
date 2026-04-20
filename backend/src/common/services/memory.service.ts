import { Injectable, Logger } from '@nestjs/common';

interface ClientEvent {
  type: string;
  timestamp: number;
  data: any;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private clientEvents: Map<string, ClientEvent[]> = new Map();
  private readonly RETENTION_TIME = 5 * 60 * 1000; // 5 minutes window
  private readonly PATTERN_THRESHOLD = 3; // 3+ events trigger pattern
  private auditService: any; // Inject later to avoid circular dependency

  setAuditService(auditService: any) {
    this.auditService = auditService;
  }

  addEvent(projectId: string, event: ClientEvent): void {
    if (!this.clientEvents.has(projectId)) {
      this.clientEvents.set(projectId, []);
    }

    const events = this.clientEvents.get(projectId);
    if (events) {
      events.push(event);

      // Clean old events outside 5-minute window
      const cutoffTime = Date.now() - this.RETENTION_TIME;
      const filtered = events.filter(e => e.timestamp > cutoffTime);
      this.clientEvents.set(projectId, filtered);

      const message = `Event added for ${projectId}. Total events: ${filtered.length}`;
      this.logger.debug(message);

      // Log to audit trail
      if (this.auditService) {
        this.auditService.logAudit(
          projectId,
          'MemoryService',
          'event_added',
          { eventType: event.type, totalEvents: filtered.length, eventData: event.data },
          message,
          'debug',
        ).catch((err: any) => this.logger.error(`Audit log failed: ${err instanceof Error ? err.message : String(err)}`));
      }
    }
  }

  hasSuspiciousPattern(projectId: string, eventType: string): boolean {
    const events = this.clientEvents.get(projectId) || [];
    const now = Date.now();
    const cutoffTime = now - this.RETENTION_TIME;

    const suspiciousEvents = events.filter(
      e => e.type === eventType && e.timestamp > cutoffTime,
    );

    const hasPattern = suspiciousEvents.length >= this.PATTERN_THRESHOLD;
    if (hasPattern) {
      const message = `Suspicious pattern detected for ${projectId}: ${suspiciousEvents.length} events of type ${eventType}`;
      this.logger.debug(message);

      // Log to audit trail
      if (this.auditService) {
        this.auditService.logAudit(
          projectId,
          'MemoryService',
          'suspicious_pattern_detected',
          { eventType, count: suspiciousEvents.length, threshold: this.PATTERN_THRESHOLD },
          message,
          'warn',
        ).catch((err: any) => this.logger.error(`Audit log failed: ${err instanceof Error ? err.message : String(err)}`));
      }
    }

    return hasPattern;
  }

  getClientEvents(projectId: string): ClientEvent[] {
    const events = this.clientEvents.get(projectId) || [];
    const cutoffTime = Date.now() - this.RETENTION_TIME;
    return events.filter(e => e.timestamp > cutoffTime);
  }

  getAllEventsForAnalysis(projectId: string, limit: number = 15): string {
    const events = this.getClientEvents(projectId);
    const sortedEvents = events.sort((a, b) => b.timestamp - a.timestamp);
    const recentEvents = sortedEvents.slice(0, limit);

    return recentEvents
      .map(
        e =>
          `[${new Date(e.timestamp).toISOString()}] Type: ${e.type}, Data: ${JSON.stringify(e.data)}`,
      )
      .join('\n');
  }

  clearProjectEvents(projectId: string): void {
    this.clientEvents.delete(projectId);
    const message = `Cleared events for ${projectId}`;
    this.logger.debug(message);

    // Log to audit trail
    if (this.auditService) {
      this.auditService.logAudit(
        projectId,
        'MemoryService',
        'events_cleared',
        {},
        message,
        'debug',
      ).catch((err: any) => this.logger.error(`Audit log failed: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  getStats(): { projectsTracked: number; totalEvents: number } {
    let totalEvents = 0;
    this.clientEvents.forEach(events => {
      totalEvents += events.length;
    });

    return {
      projectsTracked: this.clientEvents.size,
      totalEvents,
    };
  }
}
