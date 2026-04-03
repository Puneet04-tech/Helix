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

    // Refine detection using LangChain (would be more sophisticated in production)
    const analysis = `Detected ${incident.type} on service ${incident.service}. 
    Multiple events correlated showing anomalous pattern.
    Confidence: high. Recommended action: investigate and respond.`;

    return {
      analysis,
      confidence: 0.85,
      timestamp: new Date(),
    };
  }

  private async analysisAgent(projectId: string, incident: any) {
    this.logger.debug(`Analysis Agent analyzing incident ${incident.incidentId}`);

    // Analyze root cause
    const rootCauses: { [key: string]: string } = {
      security_threat: 'Unauthorized access attempt detected',
      performance_degradation: 'Resource utilization spike or external dependency failure',
      service_crash: 'Unhandled exception or out-of-memory condition',
      rate_limit_exceeded: 'Traffic surge or broken retry logic',
    };

    const rootCause =
      rootCauses[incident.type] || 'Unknown root cause, requires manual investigation';

    return {
      rootCause,
      affectedSystems: [incident.service],
      estimatedImpact: 'Automatic analysis in progress - impact depends on service criticality',
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

    // Take appropriate response based on incident type
    switch (incident.type) {
      case 'security_threat':
        // Rate limit the service
        const securityAction = await this.playwrightService.executeAction(
          'rate_limit',
          'https://your-dashboard.example.com/auth/dashboard',
          { serviceId: incident.service },
        );
        actions.push({
          action: 'rate_limit',
          target: incident.service,
          result: securityAction.result,
          success: securityAction.success,
        });
        break;

      case 'performance_degradation':
        const scaleAction = await this.playwrightService.executeAction(
          'scale_up',
          'https://your-dashboard.example.com/dashboard',
          { instances: 2, serviceId: incident.service },
        );
        actions.push({
          action: 'scale_up',
          target: incident.service,
          result: scaleAction.result,
          success: scaleAction.success,
        });
        break;

      case 'service_crash':
        const restartAction = await this.playwrightService.executeAction(
          'restart_service',
          'https://your-dashboard.example.com/dashboard',
          { serviceId: incident.service },
        );
        actions.push({
          action: 'restart_service',
          target: incident.service,
          result: restartAction.result,
          success: restartAction.success,
        });
        break;

      default:
        actions.push({
          action: 'escalate_to_team',
          target: incident.service,
          result: 'Incident escalated for manual review',
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

    // Get client and users
    const client = await this.clientModel.findById(projectId);
    const notifications: Array<{
      recipient: string;
      channel: string;
      status: string;
    }> = [];

    if (client && client.userIds.length > 0) {
      // Send role-based notifications
      await this.notificationsService.sendRoleBasedAlerts(incident);
      notifications.push({
        recipient: 'role_based_distribution',
        channel: 'email',
        status: 'sent',
      });
    }

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
