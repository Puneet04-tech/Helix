import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

export function useWebSocket(projectId: string) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const mergeIncident = useCallback((incoming: any) => {
    const id = incoming.incidentId || incoming._id || incoming.id;
    setIncidents(prev => {
      const idx = prev.findIndex(
        i => (i.incidentId || i._id || i.id) === id,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      }
      return [incoming, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!projectId || !token) return;

    const socket = io(`${backendUrl}/incidents`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe_project', { projectId, token });
    });

    socket.on('subscribed', () => {
      setConnected(true);
    });

    socket.on('new_incident', (data) => {
      if (data?.incident) mergeIncident(data.incident);
    });

    socket.on('incident_update', (data) => {
      if (data?.update) mergeIncident({ incidentId: data.incidentId, ...data.update });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId, token, mergeIncident]);

  return {
    connected,
    incidents,
    socket: socketRef.current,
  };
}
