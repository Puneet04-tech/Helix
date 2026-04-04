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

/**
 * Helix SDK - Autonomous Crisis Detection & Incident Management
 * Includes: Predictive Crisis, NLP Events, Postmortem Tracking,
 * Status Monitoring, Correlation Events, Compliance Logging
 */
export class Helix {
  private config: HelixConfig;
  private client: AxiosInstance;
  private isInitialized = false;

  constructor(config: HelixConfig) {
    this.config = {
      backendUrl: 'https://helix-backend.render.com',
      enabled: true,
      sampleRate: 1.0,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.backendUrl,
      headers: { 'x-api-key': this.config.apiKey, 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    this.isInitialized = true;
    console.log('[Helix] SDK initialized with all 8 features');
  }

  /** Send event to Helix backend */
  private async send(event: EventData): Promise<void> {
    if (!this.config.enabled) return;
    if (Math.random() > this.config.sampleRate!) return;

    try {
      await this.client.post('/events/ingest', {
        type: event.type,
        service: event.service || 'unknown',
        message: event.message || '',
        metadata: event.metadata || {},
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[Helix] Send failed (non-critical)', e);
    }
  }

  /** Intercept unhandled errors */
  public interceptErrors(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (e: ErrorEvent) => this.send({
      type: 'error',
      service: 'frontend',
      message: e.message,
      metadata: { stackTrace: e.error?.stack, file: e.filename, line: e.lineno },
    }));
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => this.send({
      type: 'error',
      service: 'frontend',
      message: String(e.reason),
    }));
  }

  /** Middleware for tracking HTTP requests */
  public createMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const send = res.send;
      res.send = (data: any) => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400 || duration > 5000) {
          this.send({
            type: res.statusCode >= 500 ? 'error' : 'warning',
            service: 'api',
            message: `${res.statusCode} ${req.method} ${req.path}`,
            metadata: { statusCode: res.statusCode, endpoint: req.path, method: req.method, responseTime: duration, userId: req.user?.id, ip: req.ip },
          });
        }
        return send.call(this, data);
      };
      next();
    };
  }

  /** Feature 1: Track predictive crisis patterns */
  public trackCrisisPrediction(service: string, pattern: string, severity: 'low' | 'medium' | 'high'): void {
    this.send({
      type: 'crisis_prediction',
      service,
      message: `Crisis pattern detected: ${pattern}`,
      metadata: { severity, pattern, detectedAt: new Date().toISOString() },
    });
  }

  /** Feature 2: Track NLP incidents */
  public trackNLPEvent(query: string, incidentCount: number): void {
    this.send({
      type: 'info',
      service: 'nlp_query',
      message: query,
      metadata: { incidentsAnalyzed: incidentCount, timestamp: new Date().toISOString() },
    });
  }

  /** Feature 3: Track role-based alert dispatch */
  public trackAlertDispatch(role: 'developer' | 'manager' | 'owner', incidentId: string, severity: string): void {
    this.send({
      type: 'info',
      service: 'alerts',
      message: `Alert sent to ${role}`,
      metadata: { role, incidentId, severity },
    });
  }

  /** Feature 4: Track postmortem generation */
  public trackPostmortemGenerated(incidentId: string, sections: number): void {
    this.send({
      type: 'info',
      service: 'postmortem',
      message: `Postmortem PDF generated`,
      metadata: { incidentId, sections, generatedAt: new Date().toISOString() },
    });
  }

  /** Feature 5: Track public status page updates */
  public trackStatusUpdate(clientId: string, services: { name: string; status: 'operational' | 'degraded' | 'down' }[]): void {
    this.send({
      type: 'info',
      service: 'status_page',
      message: `Status update for ${clientId}`,
      metadata: { clientId, services, updatedAt: new Date().toISOString() },
    });
  }

  /** Feature 6-7: Track incident correlation */
  public trackCorrelation(incidentIds: string[], rootCause: string, confidence: number): void {
    this.send({
      type: 'info',
      service: 'correlation',
      message: `${incidentIds.length} incidents correlated`,
      metadata: { incidentIds, rootCause, confidence, correlatedAt: new Date().toISOString() },
    });
  }

  /** Feature 8: Track compliance events */
  public trackComplianceEvent(eventType: string, incidentId: string, compliance: string): void {
    this.send({
      type: 'compliance_event',
      service: 'compliance',
      message: `Compliance event: ${eventType}`,
      metadata: { eventType, incidentId, compliance, loggedAt: new Date().toISOString() },
    });
  }

  /** Generic event tracking */
  public track(type: EventData['type'], message: string, metadata?: Record<string, any>): void {
    this.send({ type, service: 'custom', message, metadata });
  }

  /** Get SDK status */
  public getStatus(): { initialized: boolean; enabled: boolean; features: string[] } {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled!,
      features: ['crisis_prediction', 'nlp_query', 'role_alerts', 'postmortem', 'status_page', 'correlation', 'compliance'],
    };
  }
}

export default Helix;
