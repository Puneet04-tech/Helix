import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from '../../common/schemas/user.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: any;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL || 'your-email@gmail.com',
        pass: process.env.NODEMAILER_PASS || 'your-app-password',
      },
    });
  }

  async sendRoleBasedAlerts(incident: any) {
    try {
      const client = await this.clientModel.findById(incident.projectId);
      if (!client || !client.userIds.length) {
        this.logger.warn(`No users found for client ${incident.projectId}`);
        return;
      }

      const users = await this.userModel.find({ _id: { $in: client.userIds } });
      const usersByRole = this.groupUsersByRole(users);

      // Send role-specific emails in parallel
      const emailPromises: Promise<any>[] = [];

      // Developer Emails - Technical Details
      if (usersByRole['developer'].length > 0) {
        emailPromises.push(
          this.sendTypeSpecificAlert(
            usersByRole['developer'],
            incident,
            client.name,
            'developer'
          ),
        );
      }

      // Manager Emails - Business Impact
      if (usersByRole['manager'].length > 0) {
        emailPromises.push(
          this.sendTypeSpecificAlert(
            usersByRole['manager'],
            incident,
            client.name,
            'manager'
          ),
        );
      }

      // Owner Emails - Executive Summary
      if (usersByRole['owner'].length > 0) {
        emailPromises.push(
          this.sendTypeSpecificAlert(
            usersByRole['owner'],
            incident,
            client.name,
            'owner'
          ),
        );
      }

      await Promise.all(emailPromises);
      this.logger.debug(
        `Role-based alerts sent for incident ${incident.incidentId}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send role-based alerts: ${err.message}`);
    }
  }

  private groupUsersByRole(users: any[]): { [role: string]: any[] } {
    return users.reduce(
      (acc, user) => {
        const role = user.role || 'developer';
        if (!acc[role]) acc[role] = [];
        acc[role].push(user);
        return acc;
      },
      {},
    );
  }

  private async sendTypeSpecificAlert(
    users: any[],
    incident: any,
    clientName: string,
    role: string
  ) {
    const recipients = users
      .filter(u => u.preferences?.email)
      .map(u => u.email)
      .join(', ');

    if (!recipients) return;

    let htmlContent = '';
    let subject = '';

    // Get incident type-specific template
    const template = this.getIncidentTypeTemplate(incident.type, role);
    htmlContent = template(incident, clientName);
    subject = this.getIncidentSubject(incident, role);

    return this.transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: recipients,
      subject,
      html: htmlContent,
    });
  }

  private getIncidentSubject(incident: any, role: string): string {
    const prefixes: Record<string, string> = {
      developer: '[CRITICAL]',
      manager: '[ACTION]',
      owner: '[INFO]'
    };

    const incidentTypeNames: Record<string, string> = {
      medical_incident: 'Medical Incident',
      equipment_failure: 'Equipment Failure',
      patient_incident: 'Patient Incident',
      system_incident: 'System Incident',
      guest_complaint: 'Guest Complaint',
      security_threat: 'Security Threat',
      performance_degradation: 'Performance Degradation',
      unauthorized_access: 'Unauthorized Access',
      rate_limit_exceeded: 'Rate Limit Exceeded',
      cpu_spike: 'CPU Spike',
      memory_leak: 'Memory Leak',
      database_timeout: 'Database Timeout',
      api_failure: 'API Failure'
    };

    const typeName = incidentTypeNames[incident.type] || incident.type.replace(/_/g, ' ').toUpperCase();
    return `${prefixes[role]} ${typeName} on ${incident.service}`;
  }

  private getIncidentTypeTemplate(incidentType: string, role: string) {
    const templates: Record<string, Record<string, (incident: any, clientName: string) => string>> = {
      // Medical Incidents
      medical_incident: {
        developer: (incident: any, clientName: string) => `
          <h2>🚨 Medical Emergency Alert</h2>
          <p><strong>Facility</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Incident ID</strong>: ${incident.incidentId}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>🏥 Medical Details:</h3>
          <ul>
            <li><strong>Patient Status</strong>: ${incident.metadata?.patientStatus || 'Unknown'}</li>
            <li><strong>Department</strong>: ${incident.metadata?.department || 'Emergency'}</li>
            <li><strong>Urgency Level</strong>: ${incident.severity?.toUpperCase()}</li>
            <li><strong>Medical Equipment Involved</strong>: ${incident.metadata?.equipment || 'None specified'}</li>
          </ul>
          
          <h3>Technical Response:</h3>
          <ul>
            <li><strong>System Response</strong>: ${incident.agentReasoning?.responseAgent?.actions?.map((a: any) => a.action).join(', ') || 'Monitoring active'}</li>
            <li><strong>Emergency Protocols</strong>: Activated</li>
            <li><strong>Staff Notified</strong>: Medical team alerted</li>
          </ul>
          
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Medical Incident Details</a></p>
        `,
        manager: (incident: any, clientName: string) => `
          <h2>🏥 Medical Incident Report</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>Impact Assessment:</h3>
          <p>${incident.impactSummary || 'Medical emergency detected and protocols activated'}</p>
          
          <h3>Response Actions:</h3>
          <ul>
            <li>✓ Medical team automatically notified</li>
            <li>✓ Emergency protocols activated</li>
            <li>✓ Patient monitoring systems engaged</li>
            <li>✓ Documentation automatically generated</li>
          </ul>
          
          <h3>Current Status:</h3>
          <p><strong>Status</strong>: ${incident.status}</p>
          <p><strong>Automatic Response</strong>: Medical emergency protocols executed</p>
          
          <p><strong>Immediate Action Required</strong>: Follow established medical protocols</p>
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Full Report</a></p>
        `,
        owner: (incident: any, clientName: string) => `
          <h2>🏥 Medical Alert</h2>
          <p>A medical incident was detected and protocols were automatically activated.</p>
          
          <p><strong>Facility</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Status</strong>: ${incident.status === 'resolved' ? '✓ Resolved' : 'Medical protocols active'}</p>
          <p><strong>Automatic Response</strong>: Emergency protocols and staff notification executed</p>
          
          <p>Medical team has been notified and is responding according to established protocols.</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>
        `
      },

      // Equipment Failures
      equipment_failure: {
        developer: (incident: any, clientName: string) => `
          <h2>🔧 Equipment Failure Alert</h2>
          <p><strong>Facility</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Incident ID</strong>: ${incident.incidentId}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>🔧 Equipment Details:</h3>
          <ul>
            <li><strong>Equipment Type</strong>: ${incident.metadata?.equipmentType || 'Unknown'}</li>
            <li><strong>Equipment ID</strong>: ${incident.metadata?.equipmentId || 'N/A'}</li>
            <li><strong>Location</strong>: ${incident.metadata?.location || 'Unknown'}</li>
            <li><strong>Failure Mode</strong>: ${incident.metadata?.failureMode || 'System detected anomaly'}</li>
            <li><strong>Last Maintenance</strong>: ${incident.metadata?.lastMaintenance || 'Not available'}</li>
          </ul>
          
          <h3>Technical Response:</h3>
          <ul>
            <li><strong>Diagnostic Results</strong>: ${incident.agentReasoning?.analysisAgent?.rootCause || 'Analysis in progress'}</li>
            <li><strong>Automatic Actions</strong>: ${incident.automaticActions?.map((a: any) => `${a.action}: ${a.success ? '✓' : '✗'}`).join(', ') || 'None'}</li>
            <li><strong>Maintenance Team</strong>: Automatically notified</li>
          </ul>
          
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Equipment Details</a></p>
        `,
        manager: (incident: any, clientName: string) => `
          <h2>🔧 Equipment Failure Report</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>Impact Assessment:</h3>
          <p>${incident.impactSummary || 'Equipment failure detected and maintenance team notified'}</p>
          
          <h3>Response Actions:</h3>
          <ul>
            <li>✓ Maintenance team automatically notified</li>
            <li>✓ Backup systems activated where available</li>
            <li>✓ Service impact assessment completed</li>
            <li>✓ Replacement parts ordered if needed</li>
          </ul>
          
          <h3>Current Status:</h3>
          <p><strong>Status</strong>: ${incident.status}</p>
          <p><strong>Estimated Downtime</strong>: ${incident.metadata?.estimatedDowntime || 'Under assessment'}</p>
          
          <p><strong>Action Required</strong>: Coordinate with maintenance team for repair/replacement</p>
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Full Report</a></p>
        `,
        owner: (incident: any, clientName: string) => `
          <h2>🔧 Equipment Alert</h2>
          <p>Equipment failure was detected and maintenance protocols were automatically activated.</p>
          
          <p><strong>Facility</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Status</strong>: ${incident.status === 'resolved' ? '✓ Resolved' : 'Maintenance in progress'}</p>
          <p><strong>Automatic Response</strong>: Maintenance team notified and backup systems activated</p>
          
          <p>Maintenance team has been notified and is responding according to established protocols.</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>
        `
      },

      // Security Threats
      security_threat: {
        developer: (incident: any, clientName: string) => `
          <h2>🚨 Security Threat Alert</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Incident ID</strong>: ${incident.incidentId}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>🔒 Security Details:</h3>
          <ul>
            <li><strong>Threat Type</strong>: ${incident.metadata?.threatType || 'Unknown'}</li>
            <li><strong>Source IP</strong>: ${incident.metadata?.sourceIP || 'Blocked'}</li>
            <li><strong>Target System</strong>: ${incident.metadata?.target || incident.service}</li>
            <li><strong>Severity</strong>: ${incident.severity?.toUpperCase()}</li>
            <li><strong>Blocked</strong>: ${incident.metadata?.blocked ? 'Yes' : 'No'}</li>
          </ul>
          
          <h3>Security Response:</h3>
          <ul>
            <li><strong>Analysis</strong>: ${incident.agentReasoning?.analysisAgent?.rootCause || 'Security analysis in progress'}</li>
            <li><strong>Automatic Actions</strong>: ${incident.automaticActions?.map((a: any) => `${a.action}: ${a.success ? '✓' : '✗'}`).join(', ') || 'None'}</li>
            <li><strong>IP Blocking</strong>: ${incident.metadata?.blocked ? 'Source IP blocked' : 'Under evaluation'}</li>
            <li><strong>Security Team</strong>: Notified</li>
          </ul>
          
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Security Incident</a></p>
        `,
        manager: (incident: any, clientName: string) => `
          <h2>🔒 Security Threat Report</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>Security Impact:</h3>
          <p>${incident.impactSummary || 'Security threat detected and countermeasures activated'}</p>
          
          <h3>Response Actions:</h3>
          <ul>
            <li>✓ Security team automatically notified</li>
            <li>✓ Threat containment protocols activated</li>
            <li>✓ Access restrictions applied</li>
            <li>✓ Forensic analysis initiated</li>
          </ul>
          
          <h3>Current Status:</h3>
          <p><strong>Status</strong>: ${incident.status}</p>
          <p><strong>Threat Level</strong>: ${incident.severity?.toUpperCase()}</p>
          <p><strong>Systems Affected</strong>: ${incident.metadata?.affectedSystems || incident.service}</p>
          
          <p><strong>Immediate Action Required</strong>: Follow security incident response protocol</p>
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Security Report</a></p>
        `,
        owner: (incident: any, clientName: string) => `
          <h2>🔒 Security Alert</h2>
          <p>A security threat was detected and countermeasures were automatically activated.</p>
          
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Status</strong>: ${incident.status === 'resolved' ? '✓ Resolved' : 'Security protocols active'}</p>
          <p><strong>Automatic Response</strong>: Security team notified and containment activated</p>
          
          <p>Security team has been notified and is responding according to established protocols.</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>
        `
      },

      // Performance Issues
      performance_degradation: {
        developer: (incident: any, clientName: string) => `
          <h2>⚡ Performance Degradation Alert</h2>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Incident ID</strong>: ${incident.incidentId}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>⚡ Performance Metrics:</h3>
          <ul>
            <li><strong>Response Time</strong>: ${incident.metadata?.responseTime || 'N/A'}ms</li>
            <li><strong>CPU Usage</strong>: ${incident.metadata?.cpuUsage || 'N/A'}%</li>
            <li><strong>Memory Usage</strong>: ${incident.metadata?.memoryUsage || 'N/A'}%</li>
            <li><strong>Error Rate</strong>: ${incident.metadata?.errorRate || 'N/A'}%</li>
            <li><strong>Throughput</strong>: ${incident.metadata?.throughput || 'N/A'} req/s</li>
          </ul>
          
          <h3>Performance Analysis:</h3>
          <ul>
            <li><strong>Root Cause</strong>: ${incident.agentReasoning?.analysisAgent?.rootCause || 'Performance analysis in progress'}</li>
            <li><strong>Bottleneck Identified</strong>: ${incident.metadata?.bottleneck || 'Under investigation'}</li>
            <li><strong>Automatic Actions</strong>: ${incident.automaticActions?.map((a: any) => `${a.action}: ${a.success ? '✓' : '✗'}`).join(', ') || 'None'}</li>
          </ul>
          
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Performance Details</a></p>
        `,
        manager: (incident: any, clientName: string) => `
          <h2>⚡ Performance Degradation Report</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>Performance Impact:</h3>
          <p>${incident.impactSummary || 'Performance degradation detected and optimization initiated'}</p>
          
          <h3>Response Actions:</h3>
          <ul>
            <li>✓ Performance monitoring enhanced</li>
            <li>✓ Resource allocation optimized</li>
            <li>✓ Cache warming initiated</li>
            <li>✓ Load balancing adjusted</li>
          </ul>
          
          <h3>Current Status:</h3>
          <p><strong>Status</strong>: ${incident.status}</p>
          <p><strong>Performance Impact</strong>: ${incident.severity?.toUpperCase()}</p>
          <p><strong>User Experience</strong>: ${incident.metadata?.userImpact || 'Under assessment'}</p>
          
          <p><strong>Action Required</strong>: Monitor performance improvements and user feedback</p>
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Performance Report</a></p>
        `,
        owner: (incident: any, clientName: string) => `
          <h2>⚡ Performance Alert</h2>
          <p>Performance degradation was detected and optimization protocols were automatically activated.</p>
          
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Status</strong>: ${incident.status === 'resolved' ? '✓ Resolved' : 'Optimization in progress'}</p>
          <p><strong>Automatic Response</strong>: Performance optimization and resource adjustment executed</p>
          
          <p>System performance is being optimized and monitored continuously.</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>
        `
      },

      // Default template for other incident types
      default: {
        developer: (incident: any, clientName: string) => `
          <h2>🚨 System Alert: ${incident.type.replace(/_/g, ' ').toUpperCase()}</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Incident ID</strong>: ${incident.incidentId}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>Technical Details:</h3>
          <ul>
            <li><strong>Root Cause</strong>: ${incident.agentReasoning?.analysisAgent?.rootCause || 'Analysis in progress'}</li>
            <li><strong>Severity</strong>: ${incident.severity?.toUpperCase()}</li>
            <li><strong>Status</strong>: ${incident.status}</li>
          </ul>
          
          <h3>Automatic Actions:</h3>
          <ul>
            ${incident.automaticActions?.map((a: any) => `<li>${a.action}: ${a.success ? '✓ Success' : '✗ Failed'}</li>`).join('') || '<li>No automatic actions required</li>'}
          </ul>
          
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Full Details</a></p>
        `,
        manager: (incident: any, clientName: string) => `
          <h2>📊 System Alert: ${incident.type.replace(/_/g, ' ').toUpperCase()}</h2>
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
          
          <h3>Impact Summary:</h3>
          <p>${incident.impactSummary || 'System alert detected and response initiated'}</p>
          
          <h3>Current Status:</h3>
          <p><strong>Status</strong>: ${incident.status}</p>
          <p><strong>Automatic Response</strong>: ${incident.automaticActions?.length ? `${incident.automaticActions.length} actions taken` : 'Monitoring in progress'}</p>
          
          <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Details</a></p>
        `,
        owner: (incident: any, clientName: string) => `
          <h2>🛡️ System Alert</h2>
          <p>A system incident was detected and automatically handled by Helix.</p>
          
          <p><strong>Organization</strong>: ${clientName}</p>
          <p><strong>Service</strong>: ${incident.service}</p>
          <p><strong>Status</strong>: ${incident.status === 'resolved' ? '✓ Resolved' : 'In Progress'}</p>
          <p><strong>Automatic Response</strong>: ${incident.automaticActions?.length ? 'Automatic remediation executed' : 'Monitoring and analysis underway'}</p>
          
          <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>
        `
      }
    };

    // Return specific template or default
    const incidentTemplates = templates[incidentType] || templates.default;
    return incidentTemplates[role] || templates.default[role];
  }

  async sendPredictiveAlert(clientId: string, prediction: any) {
    try {
      const users = await this.userModel.find({
        projectIds: clientId,
        'alertPreferences.warning': true,
      });

      const recipients = users
        .filter(u => u.preferences?.email)
        .map(u => u.email)
        .join(', ');

      if (!recipients) return;

      const htmlContent = `
        <h2>⚠️ Predictive Alert</h2>
        <p>${prediction.message}</p>
        <p><strong>Expected Time</strong>: ${prediction.predictedTime}</p>
        <p>Helix has detected a pattern that suggests a potential issue at the predicted time.</p>
        <p><a href="${process.env.FRONTEND_URL}/dashboard">Review Dashboard</a></p>
      `;

      return this.transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: recipients,
        subject: 'Predictive Alert from Helix',
        html: htmlContent,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send predictive alert: ${err.message}`);
    }
  }

  /**
   * Generic method to send email (used by predictive crisis service)
   */
  async sendEmail(to: string, subject: string, message: string): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <pre style="white-space: pre-wrap; word-wrap: break-word;">${message}</pre>
          <hr>
          <p><small>This is an automated message from Helix</small></p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to,
        subject,
        html: htmlContent,
      });

      this.logger.debug(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send email: ${err.message}`);
    }
  }
}
