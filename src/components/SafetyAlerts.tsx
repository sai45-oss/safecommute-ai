import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, MapPin, Users, Zap } from 'lucide-react';

interface SafetyAlert {
  id: string;
  type: 'emergency' | 'warning' | 'info';
  title: string;
  description: string;
  location: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  affectedPassengers: number;
}

export const SafetyAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([
    {
      id: 'alert-001',
      type: 'emergency',
      title: 'Medical Emergency',
      description: 'Medical assistance required at Central Station Platform B',
      location: 'Central Station - Platform B',
      timestamp: '2 minutes ago',
      status: 'active',
      affectedPassengers: 150
    },
    {
      id: 'alert-002',
      type: 'warning',
      title: 'Overcrowding Detected',
      description: 'Platform capacity exceeded, crowd control measures activated',
      location: 'Downtown Hub - Main Platform',
      timestamp: '5 minutes ago',
      status: 'investigating',
      affectedPassengers: 320
    },
    {
      id: 'alert-003',
      type: 'info',
      title: 'Service Delay',
      description: 'Blue Line experiencing 10-minute delays due to signal maintenance',
      location: 'Blue Line - All Stations',
      timestamp: '12 minutes ago',
      status: 'active',
      affectedPassengers: 500
    },
    {
      id: 'alert-004',
      type: 'warning',
      title: 'Suspicious Activity',
      description: 'Unattended bag reported, security investigating',
      location: 'Airport Terminal - Gate C',
      timestamp: '8 minutes ago',
      status: 'resolved',
      affectedPassengers: 80
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [filterType, setFilterType] = useState<'all' | 'emergency' | 'warning' | 'info'>('all');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'investigating': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    const typeMatch = filterType === 'all' || alert.type === filterType;
    return statusMatch && typeMatch;
  });

  const activeAlerts = alerts.filter(alert => alert.status === 'active').length;
  const emergencyAlerts = alerts.filter(alert => alert.type === 'emergency' && alert.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Safety Alerts</h2>
          <p className="text-slate-600">Real-time safety monitoring and incident management</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">{activeAlerts} Active Alerts</span>
            </div>
          </div>
          {emergencyAlerts > 0 && (
            <div className="bg-red-100 rounded-lg p-3 border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">{emergencyAlerts} Emergency</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Alerts Today</p>
              <p className="text-3xl font-bold text-slate-900">18</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Response Time</p>
              <p className="text-3xl font-bold text-slate-900">2.4m</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Affected Passengers</p>
              <p className="text-3xl font-bold text-slate-900">1.2K</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Resolution Rate</p>
              <p className="text-3xl font-bold text-slate-900">94%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="warning">Warning</option>
              <option value="info">Information</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`rounded-xl border-2 p-6 ${getAlertStyle(alert.type)}`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{alert.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
                <p className="text-slate-700 mb-3">{alert.description}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{alert.affectedPassengers} affected</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Zap className="w-4 h-4 mr-2" />
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Alerts Found</h3>
          <p className="text-slate-600">No safety alerts match your current filters.</p>
        </div>
      )}
    </div>
  );
};