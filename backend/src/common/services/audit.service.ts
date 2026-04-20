import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from '../schemas/audit.schema';
import { EventsGateway } from '../gateways/events.gateway';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(Audit.name) private auditModel: Model<AuditDocument>,
    @Inject(forwardRef(() => EventsGateway)) 
    private eventsGateway: EventsGateway,
  ) {}

  async logAudit(
    projectId: string,
    service: string,
    action: string,
    details?: any,
    message?: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    incidentId?: string,
  ): Promise<AuditDocument> {
    try {
      const audit = new this.auditModel({
        projectId,
        service,
        action,
        message,
        details,
        timestamp: new Date(),
        level,
        incidentId,
      });

      const saved = await audit.save();

      // Emit to connected clients via WebSocket if gateway is available
      try {
        if (this.eventsGateway) {
          this.eventsGateway.broadcastAuditLog(projectId, {
            id: saved._id.toString(),
            service,
            action,
            message,
            details,
            timestamp: saved.timestamp,
            level,
            incidentId,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to broadcast audit log: ${error instanceof Error ? error.message : String(error)}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getAuditTrail(
    projectId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: AuditDocument[]; total: number }> {
    try {
      const [logs, total] = await Promise.all([
        this.auditModel
          .find({ projectId })
          .sort({ timestamp: -1 })
          .skip(offset)
          .limit(limit)
          .exec(),
        this.auditModel.countDocuments({ projectId }),
      ]);

      return { logs, total };
    } catch (error) {
      this.logger.error(`Failed to fetch audit trail: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getIncidentAuditTrail(incidentId: string): Promise<AuditDocument[]> {
    try {
      const logs = await this.auditModel
        .find({ incidentId })
        .sort({ timestamp: -1 })
        .exec();

      return logs;
    } catch (error) {
      this.logger.error(`Failed to fetch incident audit trail: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async clearOldAuditLogs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.auditModel.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error(`Failed to clear old audit logs: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
