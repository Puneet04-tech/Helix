import { Injectable, Logger, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Audit, AuditDocument } from '../schemas/audit.schema';
import { Incident, IncidentDocument } from '../schemas/incident.schema';
import { EventsGateway } from '../gateways/events.gateway';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(Audit.name) private auditModel: Model<AuditDocument>,
    @Optional() @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  expandProjectIds(user: {
    projectIds?: string[];
    organizationId?: string;
    email?: string;
  }): string[] {
    const ids = new Set<string>();
    (user?.projectIds || []).forEach(id => id && ids.add(String(id)));
    if (user?.organizationId) ids.add(String(user.organizationId));

    const blob = `${user?.organizationId || ''} ${user?.email || ''}`.toLowerCase();
    if (blob.includes('hospital')) ids.add('hospital_001');
    if (blob.includes('hotel')) ids.add('hotel_001');
    return Array.from(ids);
  }

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
      this.logger.debug(`Logging audit: projectId=${projectId}, service=${service}, action=${action}`);
      
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
      this.logger.debug(`Audit log saved successfully: ${saved._id}`);

      try {
        if (this.eventsGateway) {
          this.eventsGateway.broadcastAuditLog(projectId, {
            id: saved._id.toString(),
            _id: saved._id.toString(),
            service,
            action,
            message,
            details,
            timestamp: saved.timestamp,
            level,
            incidentId,
            projectId,
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
    projectIds: string | string[],
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ logs: AuditDocument[]; total: number }> {
    try {
      const ids = Array.isArray(projectIds) ? projectIds.filter(Boolean) : [projectIds].filter(Boolean);
      
      this.logger.debug(`Fetching audit trail for projectIds: ${JSON.stringify(ids)}`);
      
      const filter = ids.length > 1 ? { projectId: { $in: ids } } : { projectId: ids[0] || '__none__' };

      const [logs, total] = await Promise.all([
        this.auditModel.find(filter).sort({ timestamp: -1 }).skip(offset).limit(limit).exec(),
        this.auditModel.countDocuments(filter),
      ]);

      this.logger.debug(`Audit trail query result: ${logs.length} logs, total: ${total}`);
      
      return { logs, total };
    } catch (error) {
      this.logger.error(`Failed to fetch audit trail: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getIncidentAuditTrail(incidentId: string): Promise<AuditDocument[]> {
    try {
      const keys = new Set<string>([incidentId].filter(Boolean));

      if (this.incidentModel) {
        const clauses: Record<string, unknown>[] = [{ incidentId }];
        if (Types.ObjectId.isValid(incidentId)) {
          clauses.push({ _id: incidentId });
        }
        const incident = await this.incidentModel.findOne({ $or: clauses }).select('_id incidentId').lean();
        if (incident) {
          keys.add(String(incident._id));
          if (incident.incidentId) keys.add(String(incident.incidentId));
        }
      }

      return this.auditModel
        .find({ incidentId: { $in: Array.from(keys) } })
        .sort({ timestamp: -1 })
        .exec();
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
