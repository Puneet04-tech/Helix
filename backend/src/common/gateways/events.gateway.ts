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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  private liveSimulationInterval: NodeJS.Timeout | null = null;

  constructor() {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Send connected message
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

    // Join project-specific room
    client.join(`project_${data.projectId}`);
    this.logger.log(`Client ${client.id} subscribed to project ${data.projectId}`);

    client.emit('subscribed', {
      projectId: data.projectId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('start_live_demo')
  async handleStartLiveDemo(
    client: Socket,
    data: { projectId: string },
  ) {
    this.logger.log(`Starting live demo for project ${data.projectId}`);

    // Simulate new incidents every 5-10 seconds
    if (this.liveSimulationInterval) {
      clearInterval(this.liveSimulationInterval);
    }

    this.liveSimulationInterval = setInterval(() => {
      this.simulateNewIncident(data.projectId);
    }, 3600000);

    client.emit('demo_started', {
      message: 'Live incident simulation started',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('stop_live_demo')
  handleStopLiveDemo(client: Socket) {
    if (this.liveSimulationInterval) {
      clearInterval(this.liveSimulationInterval);
      this.liveSimulationInterval = null;
    }
    client.emit('demo_stopped', {
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast new incident to all connected clients in project room
  broadcastNewIncident(projectId: string, incident: any) {
    this.server
      .to(`project_${projectId}`)
      .emit('new_incident', {
        incident,
        timestamp: new Date().toISOString(),
      });
  }

  // Broadcast incident update
  broadcastIncidentUpdate(projectId: string, incidentId: string, update: any) {
    this.server
      .to(`project_${projectId}`)
      .emit('incident_update', {
        incidentId,
        update,
        timestamp: new Date().toISOString(),
      });
  }

  // Simulate a new incident for demo purposes
  private simulateNewIncident(projectId: string) {
    const incidents = [
      {
        type: 'sql_injection_attempt',
        service: 'Payment Service',
        severity: 'critical',
        description: 'Suspicious SQL query pattern detected in request payload',
      },
      {
        type: 'ddos_attack',
        service: 'API Gateway',
        severity: 'critical',
        description: 'Unusual spike in requests from multiple IP addresses',
      },
      {
        type: 'brute_force_attempt',
        service: 'Auth Service',
        severity: 'warning',
        description: 'Multiple failed login attempts from same IP',
      },
      {
        type: 'privilege_escalation',
        service: 'User Service',
        severity: 'critical',
        description: 'Unauthorized role elevation attempt detected',
      },
      {
        type: 'data_exfiltration',
        service: 'Storage Service',
        severity: 'critical',
        description: 'Large data download detected from unusual location',
      },
      {
        type: 'malware_detected',
        service: 'CDN',
        severity: 'warning',
        description: 'Suspicious file pattern detected in served content',
      },
    ];

    const randomIncident = incidents[Math.floor(Math.random() * incidents.length)];
    const newIncident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...randomIncident,
      status: 'active',
      timestamp: new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      affectedUsers: Math.floor(Math.random() * 10000),
      confidence: (Math.random() * 40 + 60).toFixed(1), // 60-100%
    };

    this.broadcastNewIncident(projectId, newIncident);
  }
}
