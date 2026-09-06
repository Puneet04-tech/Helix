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
  const [events, setEvents] = useState<any[]>([]);
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [playwrightActions, setPlaywrightActions] = useState<any[]>([]);
  const [canaryUpdate, setCanaryUpdate] = useState<any>(null);
  const [chaosUpdate, setChaosUpdate] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statusUpdate, setStatusUpdate] = useState<any>(null);
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
    if (!token) return;

    const socket = io(`${backendUrl}/incidents`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (projectId) {
        socket.emit('subscribe_project', { projectId, token });
      }
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

    socket.on('new_event', (data) => {
      if (data?.event) {
        setEvents(prev => [data.event, ...prev].slice(0, 100));
      }
    });

    socket.on('agent_step', (data) => {
      if (data) {
        setAgentSteps(prev => [data, ...prev].slice(0, 50));
        if (data.incidentId && data.data) {
          mergeIncident({ incidentId: data.incidentId, lastAgentStep: data.step, ...data.data });
        }
      }
    });

    socket.on('playwright_action', (data) => {
      if (data) {
        setPlaywrightActions(prev => [data, ...prev].slice(0, 50));
      }
    });

    socket.on('canary_update', (data) => {
      if (data?.result) {
        setCanaryUpdate(data.result);
      }
    });

    socket.on('chaos_update', (data) => {
      if (data?.simulation) {
        setChaosUpdate(data.simulation);
      }
    });

    socket.on('audit_log', (data) => {
      const log = data.log || data;
      if (log) {
        setAuditLogs(prev => [log, ...prev].slice(0, 100));
      }
    });

    socket.on('status_update', (data) => {
      if (data?.statusData) {
        setStatusUpdate(data.statusData);
      }
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
    events,
    agentSteps,
    playwrightActions,
    canaryUpdate,
    chaosUpdate,
    auditLogs,
    statusUpdate,
    socket: socketRef.current,
  };
}
