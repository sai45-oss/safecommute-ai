import React, { useState, useEffect } from 'react';
import { Navigation, Clock, Users, TrendingDown, MapPin, Route, Zap, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface RouteOption {
  id: string;
  name: string;
  duration: string;
  crowdLevel: 'low' | 'medium' | 'high';
  reliability: number;
  steps: string[];
  savings: string;
  type: 'fastest' | 'least-crowded' | 'most-reliable';
  cost?: number;
  carbonFootprint?: number;
  alerts?: Array<{type: string, message: string}>;
}

interface TravelInsight {
  type: string;
  status: string;
  impact: string;
  description: string;
}

export const RouteOptimizer: React.FC = () => {
  const [origin, setOrigin] = useState('Central Station');
  const [destination, setDestination] = useState('Airport Terminal');
  const [travelTime, setTravelTime] = useState('now');
  const [preferences, setPreferences] = useState('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [insights, setInsights] = useState<TravelInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const locations = [
    'Central Station',
    'Downtown Hub',
    'University Campus',
    'Business District',
    'Airport Terminal',
    'Shopping Center',
    'Hospital',
    'Sports Complex',
    'North Station',
    'South Terminal'
  ];

  const calculateRoutes = async () => {
    if (origin === destination) {
      setError('Origin and destination cannot be the same');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate dynamic route options based on current selections
      const routes = await generateRouteOptions(origin, destination, preferences, travelTime);
      setRouteOptions(routes);

      // Generate travel insights
      const currentInsights = await generateTravelInsights(origin, destination);
      setInsights(currentInsights);

    } catch (err) {
      setError('Failed to calculate routes. Please try again.');
      console.error('Route calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRouteOptions = async (from: string, to: string, pref: string, time: string): Promise<RouteOption[]> => {
    const baseRoutes: RouteOption[] = [
      {
        id: 'route-1',
        name: 'Express Route',
        duration: calculateDuration(from, to, 'fastest'),
        crowdLevel: 'high',
        reliability: 92,
        steps: generateSteps(from, to, 'express'),
        savings: '12 minutes faster',
        type: 'fastest',
        cost: 3.50,
        carbonFootprint: 2.1
      },
      {
        id: 'route-2',
        name: 'Comfort Route',
        duration: calculateDuration(from, to, 'comfort'),
        crowdLevel: 'low',
        reliability: 97,
        steps: generateSteps(from, to, 'comfort'),
        savings: '60% less crowded',
        type: 'least-crowded',
        cost: 4.25,
        carbonFootprint: 2.8
      },
      {
        id: 'route-3',
        name: 'Reliable Route',
        duration: calculateDuration(from, to, 'reliable'),
        crowdLevel: 'medium',
        reliability: 98,
        steps: generateSteps(from, to, 'reliable'),
        savings: '98% on-time rate',
        type: 'most-reliable',
        cost: 4.00,
        carbonFootprint: 1.9
      }
    ];

    // Add time-based adjustments
    if (time !== 'now') {
      baseRoutes.forEach(route => {
        if (time === '15min' || time === '30min') {
          route.crowdLevel = route.crowdLevel === 'high' ? 'medium' : route.crowdLevel;
          route.savings += ' (off-peak)';
        }
      });
    }

    // Add alerts for certain routes
    if (Math.random() > 0.7) {
      baseRoutes[0].alerts = [{
        type: 'warning',
        message: 'Minor delays expected due to high demand'
      }];
    }

    // Sort based on preferences
    return baseRoutes.sort((a, b) => {
      switch (pref) {
        case 'fastest':
          return parseInt(a.duration) - parseInt(b.duration);
        case 'comfortable':
          const crowdOrder = { 'low': 1, 'medium': 2, 'high': 3 };
          return crowdOrder[a.crowdLevel] - crowdOrder[b.crowdLevel];
        case 'reliable':
          return b.reliability - a.reliability;
        default:
          return b.reliability - a.reliability;
      }
    });
  };

  const calculateDuration = (from: string, to: string, type: string): string => {
    const baseTime = 25 + Math.floor(Math.random() * 20); // 25-45 minutes base
    
    switch (type) {
      case 'fastest':
        return `${Math.max(15, baseTime - 10)} min`;
      case 'comfort':
        return `${baseTime + 8} min`;
      case 'reliable':
        return `${baseTime + 3} min`;
      default:
        return `${baseTime} min`;
    }
  };

  const generateSteps = (from: string, to: string, type: string): string[] => {
    const transitModes = ['Blue Line', 'Green Line', 'Red Line', 'Express Bus', 'Local Bus', 'Metro'];
    const randomMode1 = transitModes[Math.floor(Math.random() * transitModes.length)];
    const randomMode2 = transitModes[Math.floor(Math.random() * transitModes.length)];

    switch (type) {
      case 'express':
        return [
          `Walk to ${randomMode1} Station (3 min)`,
          `${randomMode1} Express to Downtown Hub (15 min)`,
          `Transfer to ${randomMode2} (2 min)`,
          `${randomMode2} to ${to} (8 min)`
        ];
      case 'comfort':
        return [
          `Walk to ${randomMode1} Station (4 min)`,
          `${randomMode1} to University (12 min)`,
          `Transfer to Local Bus (3 min)`,
          `Local Bus to Transit Center (8 min)`,
          `Transfer to Shuttle (2 min)`,
          `Shuttle to ${to} (6 min)`
        ];
      case 'reliable':
        return [
          `Walk to ${randomMode1} Station (6 min)`,
          `${randomMode1} Direct to ${to} (26 min)`
        ];
      default:
        return [
          `Walk to ${randomMode1} Station (5 min)`,
          `${randomMode1} to ${to} (20 min)`
        ];
    }
  };

  const generateTravelInsights = async (from: string, to: string): Promise<TravelInsight[]> => {
    const currentHour = new Date().getHours();
    const insights: TravelInsight[] = [];

    // Time-based insights
    if (currentHour >= 7 && currentHour <= 9) {
      insights.push({
        type: 'traffic',
        status: 'high',
        impact: 'high',
        description: 'Morning rush hour - expect higher crowds and potential delays'
      });
    } else if (currentHour >= 17 && currentHour <= 19) {
      insights.push({
        type: 'traffic',
        status: 'high',
        impact: 'high',
        description: 'Evening rush hour - consider alternative routes'
      });
    } else {
      insights.push({
        type: 'traffic',
        status: 'moderate',
        impact: 'low',
        description: 'Off-peak hours - optimal travel conditions'
      });
    }

    // Weather insight
    insights.push({
      type: 'weather',
      status: 'clear',
      impact: 'low',
      description: 'Clear weather conditions, no weather-related delays expected'
    });

    // Random service insights
    if (Math.random() > 0.6) {
      insights.push({
        type: 'service',
        status: 'maintenance',
        impact: 'medium',
        description: 'Scheduled maintenance on Blue Line may cause minor delays'
      });
    }

    return insights;
  };

  const selectRoute = (routeId: string) => {
    setSelectedRoute(routeId);
    const route = routeOptions.find(r => r.id === routeId);
    if (route) {
      // Simulate route selection confirmation
      setTimeout(() => {
        alert(`Route selected: ${route.name}\nEstimated time: ${route.duration}\nCost: $${route.cost?.toFixed(2)}`);
      }, 500);
    }
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRouteIcon = (type: string) => {
    switch (type) {
      case 'fastest': return <Zap className="w-5 h-5 text-blue-600" />;
      case 'least-crowded': return <Users className="w-5 h-5 text-green-600" />;
      case 'most-reliable': return <Clock className="w-5 h-5 text-purple-600" />;
      default: return <Route className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <Navigation className="w-4 h-4" />;
      case 'weather': return <Clock className="w-4 h-4" />;
      case 'service': return <AlertCircle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Auto-calculate routes when inputs change
  useEffect(() => {
    if (origin && destination && origin !== destination) {
      const timer = setTimeout(() => {
        calculateRoutes();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [origin, destination, preferences, travelTime]);

  return (
    <div className="space-y-6">
      {/* Route Planning Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Route Optimizer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Travel Time</label>
            <select
              value={travelTime}
              onChange={(e) => setTravelTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="now">Leave Now</option>
              <option value="15min">In 15 minutes</option>
              <option value="30min">In 30 minutes</option>
              <option value="1hour">In 1 hour</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferences</label>
            <select
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest Route</option>
              <option value="comfortable">Most Comfortable</option>
              <option value="reliable">Most Reliable</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button 
            onClick={calculateRoutes}
            disabled={isLoading || origin === destination}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 mr-2" />
                Find Best Routes
              </>
            )}
          </button>
          
          {error && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Calculating Optimal Routes</h3>
          <p className="text-slate-600">Analyzing real-time data and traffic conditions...</p>
        </div>
      )}

      {/* Route Options */}
      {!isLoading && routeOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Recommended Routes</h3>
            <span className="text-sm text-slate-600">From {origin} to {destination}</span>
          </div>

          {routeOptions.map((route, index) => (
            <div 
              key={route.id} 
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                selectedRoute === route.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getRouteIcon(route.type)}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{route.name}</h4>
                      <p className="text-sm text-slate-600">{route.savings}</p>
                    </div>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{route.duration}</p>
                      <p className="text-sm text-slate-600">total time</p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCrowdColor(route.crowdLevel)}`}>
                        {route.crowdLevel} crowd
                      </span>
                      <p className="text-sm text-slate-600 mt-1">{route.reliability}% reliable</p>
                    </div>
                  </div>
                </div>

                {route.alerts && route.alerts.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-900">Route Alert</span>
                    </div>
                    {route.alerts.map((alert, alertIndex) => (
                      <p key={alertIndex} className="text-sm text-yellow-700 mt-1">{alert.message}</p>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-slate-700 mb-2">Route Steps</p>
                      <div className="space-y-2">
                        {route.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-slate-600">{step}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-slate-600">
                        <span>Cost: ${route.cost?.toFixed(2)}</span>
                        <span>CO₂: {route.carbonFootprint}kg</span>
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-end">
                      <button 
                        onClick={() => selectRoute(route.id)}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                          selectedRoute === route.id
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {selectedRoute === route.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Selected
                          </>
                        ) : (
                          'Select Route'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Travel Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Travel Insights</h3>
              <p className="text-sm text-slate-600">Current conditions affecting your journey</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getInsightColor(insight.impact)}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {getInsightIcon(insight.type)}
                      <span className="text-sm font-medium capitalize">{insight.type} Conditions</span>
                    </div>
                    <p className="text-sm">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Smart Suggestions</h3>
              <p className="text-sm text-slate-600">AI-powered travel recommendations</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Optimal Departure</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {travelTime === 'now' 
                      ? 'Current time is optimal for travel'
                      : 'Scheduled departure time avoids peak crowds'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Alternative Stop</span>
                  </div>
                  <p className="text-sm text-green-700">Consider boarding at North Station for guaranteed seating</p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Time Savings</span>
                  </div>
                  <p className="text-sm text-purple-700">Express service available - save up to 15 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Routes State */}
      {!isLoading && routeOptions.length === 0 && origin !== destination && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Plan Your Route</h3>
          <p className="text-slate-600">Select your origin and destination to get started with route optimization.</p>
        </div>
      )}
    </div>
  );
};