import axios, { AxiosInstance } from 'axios';

interface HelixConfig {
  apiKey: string;
  backendUrl?: string;
  enabled?: boolean;
  sampleRate?: number;
}

interface EventData {
  type: 'error' | 'warning' | 'info' | 'security_threat' | 'performance_degradation' | 'unauthorized_access' | 'rate_limit_exceeded' | 'crisis_prediction' | 'violation' | 'compliance_event';
  service?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export class Helix {
  private config: HelixConfig;
  private client: AxiosInstance;

  constructor(config: HelixConfig) {
    this.config = { backendUrl: 'https://helix-backend.render.com', enabled: true, sampleRate: 1.0, ...config };
    this.client = axios.create({
      baseURL: this.config.backendUrl,
      headers: { 'x-api-key': this.config.apiKey, 'Content-Type': 'application/json' },
      timeout: 5000,
    });
  }

  private async send(event: EventData): Promise<void> {
    if (!this.config.enabled || Math.random() > this.config.sampleRate!) return;
    try {
      await this.client.post('/events/ingest', {
        ...event,
        service: event.service || 'unknown',
        message: event.message || '',
        metadata: event.metadata || {},
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}
  }

  public trackCrisisPrediction(service: string, pattern: string, severity: 'low' | 'medium' | 'high'): void {
    this.send({ type: 'crisis_prediction', service, message: `Pattern: ${pattern}`, metadata: { severity, pattern } });
  }

  public trackNLPEvent(query: string, incidentCount: number): void {
    this.send({ type: 'info', service: 'nlp_query', message: query, metadata: { incidentsAnalyzed: incidentCount } });
  }

  public trackAlertDispatch(role: 'developer' | 'manager' | 'owner', incidentId: string, severity: string): void {
    this.send({ type: 'info', service: 'alerts', message: `Alert to ${role}`, metadata: { role, incidentId, severity } });
  }

  public trackPostmortemGenerated(incidentId: string, sections: number): void {
    this.send({ type: 'info', service: 'postmortem', message: `Postmortem generated`, metadata: { incidentId, sections } });
  }

  public trackStatusUpdate(clientId: string, services: { name: string; status: 'operational' | 'degraded' | 'down' }[]): void {
    this.send({ type: 'info', service: 'status_page', message: `Status update`, metadata: { clientId, services } });
  }

  public trackCorrelation(incidentIds: string[], rootCause: string, confidence: number): void {
    this.send({ type: 'info', service: 'correlation', message: `${incidentIds.length} incidents correlated`, metadata: { incidentIds, rootCause, confidence } });
  }

  public trackComplianceEvent(eventType: string, incidentId: string, compliance: string): void {
    this.send({ type: 'compliance_event', service: 'compliance', message: `${eventType}`, metadata: { eventType, incidentId, compliance } });
  }

  public track(type: EventData['type'], message: string, metadata?: Record<string, any>): void {
    const service = metadata?.service || 'custom';
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.service; // Remove service from metadata to avoid duplication
    this.send({ type, service, message, metadata: cleanMetadata });
  }

  public getStatus(): { enabled: boolean; features: number } {
    return { enabled: this.config.enabled!, features: 8 };
  }
}

export default Helix;
