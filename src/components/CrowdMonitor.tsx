import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, AlertTriangle, Clock, BarChart3 } from 'lucide-react';

interface CrowdData {
  location: string;
  current: number;
  capacity: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  prediction: number;
}

export const CrowdMonitor: React.FC = () => {
  const [crowdData, setCrowdData] = useState<CrowdData[]>([
    {
      location: 'Central Station - Platform A',
      current: 245,
      capacity: 300,
      trend: 'up',
      riskLevel: 'medium',
      prediction: 285
    },
    {
      location: 'Downtown Hub - East Exit',
      current: 89,
      capacity: 150,
      trend: 'down',
      riskLevel: 'low',
      prediction: 75
    },
    {
      location: 'University Stop - Main Platform',
      current: 167,
      capacity: 200,
      trend: 'up',
      riskLevel: 'medium',
      prediction: 195
    },
    {
      location: 'Airport Terminal - Gate B',
      current: 312,
      capacity: 350,
      trend: 'stable',
      riskLevel: 'high',
      prediction: 310
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOccupancyPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Crowd Monitoring</h2>
          <p className="text-slate-600">Real-time passenger density analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="3h">Last 3 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Passengers</p>
              <p className="text-3xl font-bold text-slate-900">813</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+5.2% from last hour</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Occupancy</p>
              <p className="text-3xl font-bold text-slate-900">74%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '74%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">High Risk Areas</p>
              <p className="text-3xl font-bold text-slate-900">1</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-red-600">
            Airport Terminal - Gate B
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Peak Prediction</p>
              <p className="text-3xl font-bold text-slate-900">18:30</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">
            Expected 90% capacity
          </div>
        </div>
      </div>

      {/* Crowd Monitoring Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {crowdData.map((location, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{location.location}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(location.riskLevel)}`}>
                  {location.riskLevel} risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-600">Current Occupancy</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold text-slate-900">{location.current}</p>
                    <span className="text-sm text-slate-600">/ {location.capacity}</span>
                    {getTrendIcon(location.trend)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Predicted (15 min)</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{location.prediction}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Capacity Utilization</span>
                  <span className="font-medium">{getOccupancyPercentage(location.current, location.capacity)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      getOccupancyPercentage(location.current, location.capacity) > 80 
                        ? 'bg-red-500' 
                        : getOccupancyPercentage(location.current, location.capacity) > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${getOccupancyPercentage(location.current, location.capacity)}%` }}
                  ></div>
                </div>
              </div>

              {location.riskLevel === 'high' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">High Density Alert</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Consider crowd control measures or alternate routing suggestions.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Historical Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Crowd Density Trends</h3>
          <p className="text-sm text-slate-600">Historical patterns and predictions</p>
        </div>
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Interactive Crowd Analytics</p>
              <p className="text-sm">Real-time and historical crowd density visualization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};