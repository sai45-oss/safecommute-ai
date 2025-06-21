import React, { useState, useEffect } from 'react';
import { MapPin, Bus, Train, AlertCircle, Users, Clock, TrendingUp } from 'lucide-react';

interface TransitVehicle {
  id: string;
  type: 'bus' | 'train';
  route: string;
  occupancy: number;
  status: 'on-time' | 'delayed' | 'crowded' | 'incident';
  location: { lat: number; lng: number };
  estimatedArrival: string;
}

export const LiveMap: React.FC = () => {
  const [vehicles, setVehicles] = useState<TransitVehicle[]>([
    {
      id: 'bus-001',
      type: 'bus',
      route: 'Route 42',
      occupancy: 85,
      status: 'crowded',
      location: { lat: 40.7128, lng: -74.0060 },
      estimatedArrival: '3 min'
    },
    {
      id: 'train-001',
      type: 'train',
      route: 'Blue Line',
      occupancy: 65,
      status: 'on-time',
      location: { lat: 40.7589, lng: -73.9851 },
      estimatedArrival: '7 min'
    },
    {
      id: 'bus-002',
      type: 'bus',
      route: 'Route 15',
      occupancy: 35,
      status: 'on-time',
      location: { lat: 40.7505, lng: -73.9934 },
      estimatedArrival: '12 min'
    }
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<TransitVehicle | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'text-green-600 bg-green-100';
      case 'delayed': return 'text-yellow-600 bg-yellow-100';
      case 'crowded': return 'text-orange-600 bg-orange-100';
      case 'incident': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy < 50) return 'bg-green-500';
    if (occupancy < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Vehicles</p>
              <p className="text-3xl font-bold text-slate-900">247</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average Occupancy</p>
              <p className="text-3xl font-bold text-slate-900">68%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">On-Time Performance</p>
              <p className="text-3xl font-bold text-slate-900">92%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            Above target of 90%
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Alerts</p>
              <p className="text-3xl font-bold text-slate-900">3</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-red-600">
            2 crowding, 1 delay
          </div>
        </div>
      </div>

      {/* Map and Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulated Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Live Transit Map</h3>
            <p className="text-sm text-slate-600">Real-time vehicle locations and status</p>
          </div>
          <div className="p-6">
            <div className="relative bg-slate-100 rounded-lg h-96 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
                {/* Simulated map with vehicle positions */}
                <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-green-500 rounded-full"></div>
                
                {/* Map legend */}
                <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">On Time</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-slate-600">Delayed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-600">Crowded</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-slate-500 z-10">
                <MapPin className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Interactive Transit Map</p>
                <p className="text-sm">Real-time vehicle tracking and route visualization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Live Vehicles</h3>
            <p className="text-sm text-slate-600">Current status and occupancy</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedVehicle?.id === vehicle.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {vehicle.type === 'bus' ? (
                        <Bus className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Train className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium text-slate-900">{vehicle.route}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Occupancy: {vehicle.occupancy}%</span>
                    <span className="text-slate-600">ETA: {vehicle.estimatedArrival}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getOccupancyColor(vehicle.occupancy)}`}
                        style={{ width: `${vehicle.occupancy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};