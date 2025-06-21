import React, { useState, useEffect } from 'react';
import { MapPin, Users, AlertTriangle, Mic, Settings, Globe, Navigation, Zap } from 'lucide-react';
import { LiveMap } from './LiveMap';
import { CrowdMonitor } from './CrowdMonitor';
import { SafetyAlerts } from './SafetyAlerts';
import { VoiceCommand } from './VoiceCommand';
import { RouteOptimizer } from './RouteOptimizer';

interface DashboardProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentLanguage, onLanguageChange }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [systemStatus, setSystemStatus] = useState('operational');

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'crowd', label: 'Crowd Monitor', icon: Users },
    { id: 'safety', label: 'Safety Alerts', icon: AlertTriangle },
    { id: 'routes', label: 'Route Optimizer', icon: Navigation },
    { id: 'voice', label: 'Voice Commands', icon: Mic },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <LiveMap />;
      case 'crowd':
        return <CrowdMonitor />;
      case 'safety':
        return <SafetyAlerts />;
      case 'routes':
        return <RouteOptimizer />;
      case 'voice':
        return <VoiceCommand isActive={isVoiceActive} onToggle={setIsVoiceActive} />;
      default:
        return <LiveMap />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SafeCommute AI</h1>
              <p className="text-sm text-slate-600">Real-time Transportation Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                systemStatus === 'operational' ? 'bg-green-500' : 
                systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium text-slate-700 capitalize">{systemStatus}</span>
            </div>
            
            {/* Language Selector */}
            <select 
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
            
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-slate-200 min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeView === item.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};