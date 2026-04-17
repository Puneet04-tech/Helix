import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users,
  Home,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Wifi,
  RefreshCw,
  MessageSquare,
  Plus,
  CheckCircle,
  X
} from 'lucide-react';

interface Stats {
  totalGuests: number;
  checkedInGuests: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalComplaints: number;
  pendingComplaints: number;
  estimatedRevenue: number;
  systemUptime: number;
  timestamp: string;
}

interface Guest {
  id: string;
  name: string;
  roomNumber: number;
  status: string;
  checkInDate: string;
  checkOutDate: string;
}

interface Complaint {
  id: string;
  guestId: string;
  description: string;
  severity: string;
  timestamp: string;
  resolved: boolean;
}

const API_BASE_URL = 'http://localhost:4000/api';

export default function HotelDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newComplaint, setNewComplaint] = useState({ description: '', severity: 'medium' });

  const fetchData = async () => {
    try {
      const [statsRes, guestsRes, complaintsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats`),
        axios.get(`${API_BASE_URL}/guests`),
        axios.get(`${API_BASE_URL}/complaints`)
      ]);

      setStats(statsRes.data);
      setGuests(guestsRes.data);
      setComplaints(complaintsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3600000); // Refresh every 1 hour
    return () => clearInterval(interval);
  }, []);

  const handleNewComplaint = async () => {
    if (!newComplaint.description) return;

    try {
      const guest = guests[0]; // Assign to first guest for demo
      await axios.post(`${API_BASE_URL}/complaints`, {
        guestId: guest?.id || 'guest-demo',
        description: newComplaint.description,
        severity: newComplaint.severity
      });

      setNewComplaint({ description: '', severity: 'medium' });
      fetchData();
    } catch (error) {
      console.error('Error creating complaint:', error);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/complaints/${complaintId}/resolve`);
      fetchData();
    } catch (error) {
      console.error('Error resolving complaint:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading hotel data...</div>
      </div>
    );
  }

  const occupancyColor = stats && stats.occupancyRate > 80 ? 'text-green-400' : stats && stats.occupancyRate > 50 ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">🏨 Hotel Management System</h1>
          <p className="text-gray-400 mt-2">Integrated with Helix Threat Detection</p>
        </div>
        <button
          onClick={fetchData}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Guests */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Guests</p>
              <p className="text-3xl font-bold text-blue-400">{stats?.checkedInGuests}</p>
              <p className="text-xs text-gray-500 mt-2">{stats?.totalGuests} total registered</p>
            </div>
            <Users className="text-blue-500" size={40} />
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Occupancy Rate</p>
              <p className={`text-3xl font-bold ${occupancyColor}`}>{stats?.occupancyRate}%</p>
              <p className="text-xs text-gray-500 mt-2">{stats?.occupiedRooms}/{stats?.totalRooms} rooms</p>
            </div>
            <Home className="text-green-500" size={40} />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Estimated Revenue</p>
              <p className="text-3xl font-bold text-emerald-400">${stats?.estimatedRevenue}</p>
              <p className="text-xs text-gray-500 mt-2">From occupied rooms</p>
            </div>
            <DollarSign className="text-emerald-500" size={40} />
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">System Status</p>
              <p className="text-3xl font-bold text-green-400">Healthy</p>
              <p className="text-xs text-gray-500 mt-2">Uptime: {Math.round(stats?.systemUptime || 0)}s</p>
            </div>
            <Wifi className="text-green-500" size={40} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guests Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users size={24} /> Checked-In Guests
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1">
                <Plus size={16} /> New Booking
              </button>
            </div>

            <div className="space-y-2">
              {guests.slice(0, 5).map(guest => (
                <div key={guest.id} className="bg-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-600 transition">
                  <div>
                    <p className="font-semibold">{guest.name}</p>
                    <p className="text-xs text-gray-400">Room {guest.roomNumber} • {guest.checkInDate} to {guest.checkOutDate}</p>
                  </div>
                  <span className="bg-green-600 px-2 py-1 rounded text-xs">{guest.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complaints Summary */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
            <AlertTriangle size={24} className="text-orange-500" /> Complaints
          </h2>

          <div className="bg-gray-700 p-3 rounded mb-4">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-orange-400">{stats?.pendingComplaints}</p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {complaints.slice(0, 4).map(complaint => (
              <div key={complaint.id} className={`p-3 rounded text-sm ${complaint.resolved ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                <div className="flex justify-between items-start">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    complaint.severity === 'critical' ? 'bg-red-600' :
                    complaint.severity === 'high' ? 'bg-orange-600' :
                    'bg-yellow-600'
                  }`}>
                    {complaint.severity}
                  </span>
                  {complaint.resolved && <CheckCircle size={16} className="text-green-400" />}
                </div>
                <p className="mt-1 text-gray-200">{complaint.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Complaint Form */}
      <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <MessageSquare size={24} /> Report Guest Complaint
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComplaint.description}
            onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
            placeholder="Describe the issue..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
          />
          <select
            value={newComplaint.severity}
            onChange={(e) => setNewComplaint({ ...newComplaint, severity: e.target.value })}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={handleNewComplaint}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Report
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          ✨ <strong>Integration Status:</strong> Hotel Management System is actively sending guest incidents, complaints, and system metrics to Helix for real-time threat detection and analysis.
        </p>
      </div>
    </div>
  );
}
