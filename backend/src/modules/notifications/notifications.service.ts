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
          this.sendDeveloperAlert(
            usersByRole['developer'],
            incident,
            client.name,
          ),
        );
      }

      // Manager Emails - Business Impact
      if (usersByRole['manager'].length > 0) {
        emailPromises.push(
          this.sendManagerAlert(usersByRole['manager'], incident, client.name),
        );
      }

      // Owner Emails - Executive Summary
      if (usersByRole['owner'].length > 0) {
        emailPromises.push(
          this.sendOwnerAlert(usersByRole['owner'], incident, client.name),
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

  private async sendDeveloperAlert(
    developers: any[],
    incident: any,
    clientName: string,
  ) {
    const recipients = developers
      .filter(d => d.preferences?.email)
      .map(d => d.email)
      .join(', ');

    if (!recipients) return;

    const htmlContent = `
      <h2>🚨 Critical Alert: ${incident.type.replace(/_/g, ' ').toUpperCase()}</h2>
      <p><strong>Service</strong>: ${incident.service}</p>
      <p><strong>Incident ID</strong>: ${incident.incidentId}</p>
      <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
      
      <h3>Technical Details:</h3>
      <ul>
        <li><strong>Root Cause</strong>: ${incident.agentReasoning?.analysisAgent?.rootCause || 'Analysis in progress'}</li>
        <li><strong>Affected Endpoint</strong>: ${incident.affectedEndpoints?.[0] || 'Multiple endpoints'}</li>
        <li><strong>Stack Trace</strong>: [Available in dashboard]</li>
        <li><strong>Memory Usage at Crash</strong>: [Check logs for details]</li>
      </ul>
      
      <h3>Automatic Actions Taken:</h3>
      <ul>
        ${incident.automaticActions?.map((a: Record<string, any>) => `<li>${a.action} on ${a.target}: ${a.success ? '✓ Success' : '✗ Failed'}</li>`).join('') || '<li>No automatic actions required</li>'}
      </ul>
      
      <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Full Details</a></p>
    `;

    return this.transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: recipients,
      subject: `[CRITICAL] ${incident.type} on ${incident.service}`,
      html: htmlContent,
    });
  }

  private async sendManagerAlert(
    managers: any[],
    incident: any,
    clientName: string,
  ) {
    const recipients = managers
      .filter(m => m.preferences?.email)
      .map(m => m.email)
      .join(', ');

    if (!recipients) return;

    const htmlContent = `
      <h2>📊 Incident Report: ${incident.type.replace(/_/g, ' ').toUpperCase()}</h2>
      <p><strong>Organization</strong>: ${clientName}</p>
      <p><strong>Affected Service</strong>: ${incident.service}</p>
      <p><strong>Time</strong>: ${new Date(incident.detectedAt).toISOString()}</p>
      
      <h3>Impact Summary:</h3>
      <p>${incident.impactSummary || 'Automatic analysis and response in progress'}</p>
      
      <h3>Status:</h3>
      <p><strong>Current Status</strong>: ${incident.status}</p>
      <p><strong>Automatic Response</strong>: ${incident.automaticActions?.length ? `Yes - ${incident.automaticActions.length} actions taken` : 'Monitoring in progress'}</p>
      
      <h3>What Was Done:</h3>
      <ul>
        ${
          incident.agentReasoning?.responseAgent?.actions
            ?.map((a: Record<string, any>) => `<li>${a.action} on ${a.target}</li>`)
            .join('') || '<li>System monitoring and analysis in progress</li>'
        }
      </ul>
      
      <p><strong>No immediate action needed</strong> - AI Guardian has taken appropriate measures.</p>
      <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.incidentId}">View Details</a></p>
    `;

    return this.transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: recipients,
      subject: `[ACTION] ${incident.type} on ${incident.service}`,
      html: htmlContent,
    });
  }

  private async sendOwnerAlert(owners: any[], incident: any, clientName: string) {
    const recipients = owners
      .filter(o => o.preferences?.email)
      .map(o => o.email)
      .join(', ');

    if (!recipients) return;

    const htmlContent = `
      <h2>🛡️ AI Guardian Alert</h2>
      <p>An incident was detected and automatically handled by AI Guardian.</p>
      
      <p><strong>Service</strong>: ${incident.service}</p>
      <p><strong>Status</strong>: ${incident.status === 'resolved' ? '✓ Resolved' : 'In Progress'}</p>
      <p><strong>Action Taken</strong>: ${incident.automaticActions?.length ? 'Automatic remediation executed' : 'Monitoring and analysis underway'}</p>
      
      <p>Visit the dashboard if you need more details.</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard">Go to Dashboard</a></p>
    `;

    return this.transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: recipients,
      subject: `[INFO] ${incident.service} incident detected`,
      html: htmlContent,
    });
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
        <p>AI Guardian has detected a pattern that suggests a potential issue at the predicted time.</p>
        <p><a href="${process.env.FRONTEND_URL}/dashboard">Review Dashboard</a></p>
      `;

      return this.transporter.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: recipients,
        subject: 'Predictive Alert from AI Guardian',
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
          <p><small>This is an automated message from AI Guardian</small></p>
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
