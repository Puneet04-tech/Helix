import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL,
          'https://helix-threat.netlify.app',
          'https://helix-ujly.onrender.com',
        ].filter(Boolean)
      : process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/incidents',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized on /incidents namespace');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection', {
      data: 'Connected to live incident stream',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_project')
  async handleSubscribe(
    client: Socket,
    data: { projectId: string; token: string },
  ) {
    if (!data.projectId) {
      client.emit('error', { message: 'Project ID required' });
      return;
    }

    // Temporarily disable token validation for debugging
    const token = data.token || client.handshake.auth?.token;
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        const allowedProjects: string[] = payload.projectIds || [];
        if (allowedProjects.length > 0 && !allowedProjects.includes(data.projectId)) {
          client.emit('error', { message: 'Access denied for this project' });
          client.disconnect();
          return;
        }
      } catch (error: any) {
        this.logger.warn(`Token validation failed, allowing connection anyway: ${error?.message || error}`);
      }
    }

    client.join(`project_${data.projectId}`);
    this.logger.log(`Client ${client.id} subscribed to project ${data.projectId}`);

    client.emit('subscribed', {
      projectId: data.projectId,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastNewIncident(projectId: string, incident: any) {
    const payload = {
      incident,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('new_incident', payload);
    }
    this.server.emit('new_incident', payload);
  }

  broadcastAuditLog(projectId: string, auditLog: any) {
    const payload = {
      log: auditLog,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('audit_log', payload);
    }
    this.server.emit('audit_log', payload);
  }

  broadcastIncidentUpdate(projectId: string, incidentId: string, update: any) {
    const payload = {
      incidentId,
      update,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('incident_update', payload);
    }
    this.server.emit('incident_update', payload);
  }

  broadcastNewEvent(projectId: string, event: any) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('new_event', payload);
    }
    this.server.emit('new_event', payload);
  }

  broadcastAgentStep(projectId: string, incidentId: string, step: string, data: any) {
    const payload = {
      incidentId,
      step,
      data,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('agent_step', payload);
    }
    this.server.emit('agent_step', payload);
  }

  broadcastPlaywrightAction(projectId: string, action: string, data: any) {
    const payload = {
      action,
      data,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('playwright_action', payload);
    }
    this.server.emit('playwright_action', payload);
  }

  broadcastCanaryUpdate(projectId: string, result: any) {
    const payload = {
      result,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('canary_update', payload);
    }
    this.server.emit('canary_update', payload);
  }

  broadcastChaosUpdate(projectId: string, simulation: any) {
    const payload = {
      simulation,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('chaos_update', payload);
    }
    this.server.emit('chaos_update', payload);
  }

  broadcastStatusUpdate(projectId: string, statusData: any) {
    const payload = {
      statusData,
      timestamp: new Date().toISOString(),
    };
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('status_update', payload);
    }
    this.server.emit('status_update', payload);
  }
}
