import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export function useWebSocket(projectId: string) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!projectId || !token) return;

    // Connect to WebSocket
    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
      {
        path: '/socket.io',
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Subscribe to project
      socket.emit('subscribe_project', {
        projectId,
        token,
      });
    });

    socket.on('subscribed', (data) => {
      console.log('Subscribed to project:', data.projectId);
    });

    socket.on('new_incident', (data) => {
      console.log('New incident received:', data.incident);
      setIncidents((prev) => [data.incident, ...prev]);
    });

    socket.on('incident_update', (data) => {
      console.log('Incident update:', data);
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === data.incidentId ? { ...inc, ...data.update } : inc
        )
      );
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId, token]);

  const startLiveDemo = () => {
    if (socketRef.current) {
      socketRef.current.emit('start_live_demo', { projectId });
    }
  };

  const stopLiveDemo = () => {
    if (socketRef.current) {
      socketRef.current.emit('stop_live_demo');
    }
  };

  return {
    connected,
    incidents,
    startLiveDemo,
    stopLiveDemo,
    socket: socketRef.current,
  };
}
