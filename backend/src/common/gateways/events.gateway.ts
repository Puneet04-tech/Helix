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

    const token = data.token || client.handshake.auth?.token;
    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const allowedProjects: string[] = payload.projectIds || [];
      if (allowedProjects.length > 0 && !allowedProjects.includes(data.projectId)) {
        client.emit('error', { message: 'Access denied for this project' });
        client.disconnect();
        return;
      }
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
      return;
    }

    client.join(`project_${data.projectId}`);
    this.logger.log(`Client ${client.id} subscribed to project ${data.projectId}`);

    client.emit('subscribed', {
      projectId: data.projectId,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastNewIncident(projectId: string, incident: any) {
    this.server.to(`project_${projectId}`).emit('new_incident', {
      incident,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastAuditLog(projectId: string, auditLog: any) {
    this.server.to(`project_${projectId}`).emit('audit_log', {
      log: auditLog,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastIncidentUpdate(projectId: string, incidentId: string, update: any) {
    this.server.to(`project_${projectId}`).emit('incident_update', {
      incidentId,
      update,
      timestamp: new Date().toISOString(),
    });
  }
}
