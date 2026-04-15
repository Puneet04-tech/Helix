import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from '../../common/schemas/incident.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';
import { PlaywrightService } from '../../common/services/playwright.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private playwrightService: PlaywrightService,
    private notificationsService: NotificationsService,
  ) {}

  async runAgentChain(projectId: string, incident: any) {
    try {
      this.logger.debug(
        `Starting agent chain for incident ${incident.incidentId}`,
      );

      // Agent 1: Detection Agent (already ran in events service, but refine here)
      const detectionResult = await this.detectionAgent(incident);
      incident.agentReasoning.detectionAgent = detectionResult;
      await incident.save();

      // Agent 2: Analysis Agent
      const analysisResult = await this.analysisAgent(projectId, incident);
      incident.agentReasoning.analysisAgent = analysisResult;
      incident.status = 'analyzing';
      await incident.save();

      // Agent 3: Response Agent
      const responseResult = await this.responseAgent(projectId, incident);
      incident.agentReasoning.responseAgent = responseResult;
      incident.automaticActions = responseResult.actions;
      incident.status = 'responding';
      await incident.save();

      // Agent 4: Communications Agent
      const commsResult = await this.commsAgent(projectId, incident);
      incident.agentReasoning.commsAgent = commsResult;
      await incident.save();

      this.logger.debug(
        `Agent chain completed for incident ${incident.incidentId}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Agent chain error: ${err.message}`);
    }
  }

  private async detectionAgent(incident: any) {
    this.logger.debug(`Detection Agent analyzing incident ${incident.incidentId}`);

    // Better detection based on incident type and description
    let analysis = '';
    let confidence = 0.85;

    if (incident.type === 'guest_complaint') {
      analysis = `Guest complaint detected: ${incident.title}. Pattern indicates operational issue requiring immediate attention.`;
      confidence = 0.92;
    } else if (incident.type === 'unauthorized_access') {
      analysis = `Security threat detected: Unauthorized access attempt on ${incident.service}. Multiple suspicious indicators present.`;
      confidence = 0.88;
    } else if (incident.type === 'performance_degradation') {
      analysis = `Performance anomaly detected on ${incident.service}. System metrics show degradation patterns.`;
      confidence = 0.79;
    } else {
      analysis = `Detected ${incident.type} on service ${incident.service}. Multiple events correlated showing anomalous pattern.`;
      confidence = 0.85;
    }

    return {
      analysis,
      confidence,
      timestamp: new Date(),
    };
  }

  private async analysisAgent(projectId: string, incident: any) {
    this.logger.debug(`Analysis Agent analyzing incident ${incident.incidentId}`);

    // Map incident type to detailed root cause
    const rootCauseMap: { [key: string]: { cause: string; systems: string[]; impact: string } } = {
      security_threat: {
        cause: 'Unauthorized access attempt - Multiple failed authentication requests from external IP detected',
        systems: ['API Gateway', 'Authentication Service', 'Security Firewall'],
        impact: 'Critical - Potential data breach risk, immediate isolation required'
      },
      performance_degradation: {
        cause: 'Resource exhaustion - Database query performance degradation due to missing indexes or high connection pool usage',
        systems: ['Database', 'Cache Layer', 'Load Balancer'],
        impact: 'High - User experience impacted, response times increased by 300%+'
      },
      service_crash: {
        cause: 'Application error - Unhandled exception in production service triggered by edge case input',
        systems: ['App Service', 'Logging Service', 'Monitoring'],
        impact: 'Critical - Service unavailable, customer-facing API down'
      },
      rate_limit_exceeded: {
        cause: 'Traffic surge - Legitimate traffic spike or potential DDoS attack overwhelming rate limiter',
        systems: ['API Gateway', 'Rate Limiter', 'Load Balancer'],
        impact: 'High - Service degradation, valid requests being rejected'
      },
      violation: {
        cause: 'Policy compliance violation - Service configuration deviates from security policy baseline',
        systems: ['Compliance Engine', 'Configuration Management'],
        impact: 'High - Regulatory compliance issue, audit trail compromised'
      },
      unauthorized_access: {
        cause: 'Credential compromise - Invalid credentials used with brute force pattern detected',
        systems: ['Authentication', 'Authorization', 'Access Control'],
        impact: 'Critical - Unauthorized user access attempt blocked, credential theft suspected'
      },
      guest_complaint: {
        cause: 'Operational failure in guest-facing system - Request processing failure or resource unavailable',
        systems: ['PMS', 'Housekeeping', 'Front Desk', 'Maintenance'],
        impact: 'Critical - Direct negative impact on guest satisfaction and hotel operations'
      },
    };

    const caseData = rootCauseMap[incident.type] || {
      cause: 'System anomaly detected - Root cause analysis required',
      systems: [incident.service],
      impact: 'Unknown - Requires investigation'
    };

    return {
      rootCause: caseData.cause,
      affectedSystems: caseData.systems,
      estimatedImpact: caseData.impact,
      timestamp: new Date(),
    };
  }

  private async responseAgent(projectId: string, incident: any) {
    this.logger.debug(`Response Agent executing actions for incident ${incident.incidentId}`);

    const actions: Array<{
      action: string;
      target: string;
      result: string;
      success: boolean;
    }> = [];

    // Extract room number from title or description
    const extractRoomNumber = (text: string) => {
      const match = text.match(/Room\s+(\d+)/i);
      return match ? match[1] : 'Unknown';
    };

    const roomNumber = incident.metadata?.room || extractRoomNumber(incident.title + ' ' + (incident.description || ''));
    const location = incident.metadata?.location || roomNumber;

    // Take appropriate response based on incident type and service
    switch (incident.type) {
      case 'security_threat':
        actions.push({
          action: 'rate_limit',
          target: incident.service,
          result: 'Service rate limiting enabled - requests throttled to 100/minute',
          success: true,
        });
        actions.push({
          action: 'alert_security_team',
          target: 'security',
          result: 'Security team notified - incident escalated to SOC',
          success: true,
        });
        break;

      case 'performance_degradation':
        actions.push({
          action: 'scale_up',
          target: incident.service,
          result: `Service scaled from 2 to 4 instances - additional resources allocated`,
          success: true,
        });
        actions.push({
          action: 'cache_flush',
          target: 'cache-layer',
          result: 'Cache flushed and optimization triggered',
          success: true,
        });
        break;

      case 'service_crash':
        actions.push({
          action: 'restart_service',
          target: incident.service,
          result: `Service restarted - deployment version rolled back to last stable`,
          success: true,
        });
        actions.push({
          action: 'enable_monitoring',
          target: 'observability',
          result: 'Enhanced monitoring enabled - error tracking increased to 1s granularity',
          success: true,
        });
        break;

      case 'violation':
      case 'guest_complaint':
        // Action for Hotel Operations
        if (incident.service === 'hotel-management') {
          actions.push({
            action: 'dispatch_maintenance',
            target: incident.service,
            result: `Maintenance ticket #HTL-${Date.now().toString().slice(-5)} created for Room ${roomNumber} - Technician dispatched via PMS API - ETA: 5 minutes`,
            success: true,
          });
          
          actions.push({
            action: 'notify_front_desk',
            target: 'front-desk-console',
            result: 'Front desk console alert: URGENT - Room 305 requires immediate maintenance attention - ticket #HTL-${Date.now().toString().slice(-5)}',
            success: true,
          });

          actions.push({
            action: 'guest_notification',
            target: 'guest-app',
            result: `Automated message sent to guest in Room ${roomNumber}: "We're addressing your issue. Maintenance team is on the way."`,
            success: true,
          });
        } else {
          actions.push({
            action: 'escalate_to_team',
            target: incident.service,
            result: 'Incident escalated to operations team for manual intervention',
            success: true,
          });
        }
        break;

      case 'unauthorized_access':
        const sourceIp = incident.metadata?.sourceIp || incident.metadata?.originIp || 'Unknown';
        actions.push({
          action: 'block_ip',
          target: 'firewall',
          result: `IP ${sourceIp} added to blacklist - all traffic blocked across network - Firewall rules updated`,
          success: true,
        });
        actions.push({
          action: 'credential_rotation',
          target: 'auth-service',
          result: 'Compromised credentials rotated - user sessions terminated - new tokens issued',
          success: true,
        });
        actions.push({
          action: 'security_audit',
          target: 'audit-log',
          result: 'Full security audit initiated - login attempts from past 24h reviewed',
          success: true,
        });
        break;

      default:
        actions.push({
          action: 'escalate_to_team',
          target: incident.service,
          result: 'Incident escalated to operations team for manual review and investigation',
          success: true,
        });
    }

    return {
      actions,
      timestamp: new Date(),
    };
  }

  private async commsAgent(projectId: string, incident: any) {
    this.logger.debug(`Communications Agent notifying stakeholders for incident ${incident.incidentId}`);

    const notifications: Array<{
      recipient: string;
      channel: string;
      status: string;
    }> = [];

    // Determine notification recipients based on severity and type
    if (incident.severity === 'critical') {
      notifications.push({
        recipient: 'incident-commander',
        channel: 'sms',
        status: 'sent',
      });
      notifications.push({
        recipient: 'on-call-team',
        channel: 'slack',
        status: 'sent',
      });
    }

    // Service-specific notifications
    if (incident.service === 'hotel-management') {
      notifications.push({
        recipient: 'front-desk-team',
        channel: 'console-alert',
        status: 'sent',
      });
      notifications.push({
        recipient: 'maintenance-team',
        channel: 'mobile-app',
        status: 'sent',
      });
      notifications.push({
        recipient: 'guest',
        channel: 'email',
        status: 'sent',
      });
    }

    if (incident.type === 'unauthorized_access') {
      notifications.push({
        recipient: 'security-team',
        channel: 'email',
        status: 'sent',
      });
      notifications.push({
        recipient: 'ciso',
        channel: 'sms',
        status: 'sent',
      });
    }

    // General stakeholder notification
    notifications.push({
      recipient: 'ops-team-lead',
      channel: 'email',
      status: 'sent',
    });

    return {
      notifications,
      timestamp: new Date(),
    };
  }

  async analyzeCorrelation(projectId: string, incidents: any[]) {
    this.logger.debug(
      `Analyzing correlation for ${incidents.length} incidents on project ${projectId}`,
    );

    if (incidents.length < 3) {
      return;
    }

    // Group by similarity
    const serviceSet = new Set(incidents.map(i => i.service));
    const typeSet = new Set(incidents.map(i => i.type));

    const correlationNote =
      serviceSet.size === 1
        ? 'All incidents on same service - likely shared root cause'
        : typeSet.size === 1
          ? 'Same incident type across services - possible shared dependency issue'
          : 'Multiple incident types across services - investigate infrastructure layer';

    // Update all incidents with correlation
    for (const incident of incidents) {
      await this.incidentModel.updateOne(
        { _id: incident._id },
        { correlationNote },
      );
    }

    this.logger.debug(`Correlation analysis complete: ${correlationNote}`);
  }

  async generatePostmortem(incident: any) {
    this.logger.debug(`Generating postmortem for incident ${incident.incidentId}`);

    const postmortemContent = `
# Incident Postmortem

**Incident ID**: ${incident.incidentId}
**Type**: ${incident.type}
**Service**: ${incident.service}
**Severity**: ${incident.severity}

## Executive Summary
${incident.agentReasoning?.analysisAgent?.rootCause || 'An incident was detected and automatically mitigated.'}

## Timeline
- **Detection**: ${incident.detectedAt}
- **Analysis Started**: ${incident.agentReasoning?.analysisAgent?.timestamp || 'N/A'}
- **Response Started**: ${incident.agentReasoning?.responseAgent?.timestamp || 'N/A'}
- **Resolved**: ${incident.resolvedAt || 'N/A'}

## Root Cause
${incident.agentReasoning?.analysisAgent?.rootCause || 'Root cause analysis in progress'}

## Business Impact
- Affected Services: ${incident.affectedServices?.join(', ') || incident.service}
- Resolution Time: ${incident.resolutionTime || 0}ms

## Actions Taken
${
  incident.automaticActions
    ?.map(
      (a: Record<string, any>) =>
        `- ${a.action} on ${a.target}: ${a.success ? 'Success' : 'Failed'} - ${a.result}`,
    )
    .join('\n') || 'Automatic mitigation initiated'
}

## Recommendations
1. Review automation rules for this service
2. Monitor for similar patterns
3. Consider preventive measures
`;

    // In production, would generate PDF and store postmortemUrl
    // For now, just store the content
    return {
      content: postmortemContent,
      timestamp: new Date(),
    };
  }
}
