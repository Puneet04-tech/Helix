import axios, { AxiosInstance } from 'axios';

interface AIGuardianConfig {
  apiKey: string;
  backendUrl?: string;
  enabled?: boolean;
  sampleRate?: number;
}

interface EventData {
  type:
    | 'error'
    | 'warning'
    | 'info'
    | 'security_threat'
    | 'performance_degradation'
    | 'unauthorized_access'
    | 'rate_limit_exceeded';
  service?: string;
  message?: string;
  metadata?: {
    statusCode?: number;
    endpoint?: string;
    userId?: string;
    ipAddress?: string;
    responseTime?: number;
    stackTrace?: string;
    [key: string]: any;
  };
}

export class AIGuardian {
  private config: AIGuardianConfig;
  private client: AxiosInstance;
  private eventQueue: EventData[] = [];
  private isInitialized = false;

  constructor(config: AIGuardianConfig) {
    this.config = {
      backendUrl: 'https://ai-guardian-backend.render.com',
      enabled: true,
      sampleRate: 1.0,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.backendUrl,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    this.isInitialized = true;
    console.log('[AI Guardian] SDK initialized');
  }

  /**
   * Send a single event to AI Guardian backend
   */
  public async sendEvent(event: EventData): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    // Respect sample rate
    if (Math.random() > this.config.sampleRate!) {
      return;
    }

    try {
      await this.client.post('/events/ingest', {
        type: event.type,
        service: event.service || 'unknown',
        message: event.message || '',
        metadata: event.metadata || {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail - don't interrupt application
      console.debug('[AI Guardian] Event send failed (non-critical)', error);
    }
  }

  /**
   * Intercept errors and send to AI Guardian
   */
  public interceptErrors(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e: ErrorEvent) => {
        this.sendEvent({
          type: 'error',
          service: 'frontend',
          message: e.message,
          metadata: {
            stackTrace: e.error?.stack,
            filename: e.filename,
            lineno: e.lineno,
          },
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        this.sendEvent({
          type: 'error',
          service: 'frontend',
          message: e.reason?.message || String(e.reason),
          metadata: {
            type: 'unhandledRejection',
          },
        });
      });
    }
  }

  /**
   * Track HTTP requests (for Express/NestJS middleware integration)
   */
  public createMiddleware() {
    const self = this;
    return (req: Record<string, any>, res: Record<string, any>, next: () => void) => {
      const startTime = Date.now();
      const originalSend = res.send;

      res.send = function (data: Record<string, any>) {
        const duration = Date.now() - startTime;

        // Send slow requests or errors
        if ((res as Record<string, any>).statusCode >= 400 || duration > 5000) {
          self.sendEvent({
            type: res.statusCode >= 500 ? 'error' : 'warning',
            service: 'api',
            message: `HTTP ${res.statusCode} on ${req.method} ${req.path}`,
            metadata: {
              statusCode: res.statusCode,
              endpoint: req.path,
              method: req.method,
              responseTime: duration,
              userId: req.user?.id,
              ipAddress: req.ip,
            },
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Manual event tracking
   */
  public track(
    type: EventData['type'],
    message: string,
    metadata?: EventData['metadata'],
  ): void {
    this.sendEvent({
      type,
      service: 'custom',
      message,
      metadata,
    });
  }

  /**
   * Get SDK status
   */
  public getStatus(): { initialized: boolean; enabled: boolean; apiKey: string } {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled!,
      apiKey: this.config.apiKey.substring(0, 10) + '***',
    };
  }
}

export default AIGuardian;
