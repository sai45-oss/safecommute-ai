import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { broadcastVehicleUpdate, broadcastCrowdUpdate } from '../sockets/index.js';

// Mock data stores for WebContainer environment
const mockVehicles = [
  {
    _id: 'vehicle-1',
    vehicleId: 'BUS-001',
    type: 'bus',
    route: 'Route 42',
    location: { coordinates: [-74.0060, 40.7128] },
    occupancy: { current: 25, capacity: 50 },
    status: 'on-time',
    lastUpdated: new Date()
  },
  {
    _id: 'vehicle-2',
    vehicleId: 'TRAIN-A1',
    type: 'train',
    route: 'Blue Line',
    location: { coordinates: [-73.9851, 40.7589] },
    occupancy: { current: 120, capacity: 200 },
    status: 'on-time',
    lastUpdated: new Date()
  }
];

const mockCrowdData = [];
const mockAlerts = [];

export const startBackgroundServices = (io) => {
  logger.info('Starting background services...');

  // Simulate real-time vehicle updates every 10 seconds
  const vehicleUpdateInterval = setInterval(async () => {
    try {
      // Use mock vehicles instead of database query
      const vehicles = mockVehicles.filter(v => v.status !== 'maintenance').slice(0, 10);
      
      for (const vehicle of vehicles) {
        // Simulate movement and occupancy changes
        const updates = simulateVehicleUpdates(vehicle);
        
        // Update mock vehicle data
        Object.assign(vehicle, updates);
        
        // Broadcast update to connected clients
        broadcastVehicleUpdate(io, { ...vehicle, ...updates });
      }
    } catch (error) {
      logger.error('Error updating vehicles:', error);
    }
  }, 10000);

  // Simulate crowd data updates every 15 seconds
  const crowdUpdateInterval = setInterval(async () => {
    try {
      const locations = [
        'central-station-platform-a',
        'downtown-hub-east-exit',
        'university-stop-main',
        'airport-terminal-gate-b'
      ];

      for (const locationId of locations) {
        const crowdUpdate = simulateCrowdData(locationId);
        
        if (crowdUpdate) {
          // Add to mock data store
          mockCrowdData.push({
            ...crowdUpdate,
            _id: `crowd-${Date.now()}-${Math.random()}`,
            createdAt: new Date()
          });
          
          // Keep only recent data (last 100 entries)
          if (mockCrowdData.length > 100) {
            mockCrowdData.splice(0, mockCrowdData.length - 100);
          }
          
          // Broadcast update to connected clients
          broadcastCrowdUpdate(io, crowdUpdate);
        }
      }
    } catch (error) {
      logger.error('Error updating crowd data:', error);
    }
  }, 15000);

  // Clean up old data every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Clean old crowd data from mock store
      const initialCrowdCount = mockCrowdData.length;
      for (let i = mockCrowdData.length - 1; i >= 0; i--) {
        if (mockCrowdData[i].createdAt < oneWeekAgo) {
          mockCrowdData.splice(i, 1);
        }
      }
      const deletedCrowdCount = initialCrowdCount - mockCrowdData.length;
      
      // Clean resolved alerts older than 24 hours from mock store
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const initialAlertCount = mockAlerts.length;
      for (let i = mockAlerts.length - 1; i >= 0; i--) {
        const alert = mockAlerts[i];
        if (alert.status === 'resolved' && alert.resolution?.resolvedAt < oneDayAgo) {
          mockAlerts.splice(i, 1);
        }
      }
      const deletedAlertCount = initialAlertCount - mockAlerts.length;
      
      logger.info(`Cleanup completed: ${deletedCrowdCount} crowd records, ${deletedAlertCount} alerts`);
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  });

  // Generate daily analytics report
  cron.schedule('0 6 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyStats = await generateDailyStats(yesterday, today);
      logger.info('Daily analytics report generated:', dailyStats);
      
      // In production, this would be sent to administrators
    } catch (error) {
      logger.error('Error generating daily report:', error);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    clearInterval(vehicleUpdateInterval);
    clearInterval(crowdUpdateInterval);
    logger.info('Background services stopped');
  });
};

const simulateVehicleUpdates = (vehicle) => {
  const updates = {};
  
  // Simulate location changes (small random movement)
  const [lng, lat] = vehicle.location.coordinates;
  updates['location'] = {
    coordinates: [
      lng + (Math.random() - 0.5) * 0.001,
      lat + (Math.random() - 0.5) * 0.001
    ]
  };
  
  // Simulate occupancy changes
  const currentOccupancy = vehicle.occupancy.current;
  const capacity = vehicle.occupancy.capacity;
  const change = Math.floor((Math.random() - 0.5) * 10);
  const newOccupancy = Math.max(0, Math.min(capacity, currentOccupancy + change));
  
  updates['occupancy'] = {
    current: newOccupancy,
    capacity: capacity
  };
  updates.lastUpdated = new Date();
  
  // Update status based on occupancy
  const percentage = (newOccupancy / capacity) * 100;
  if (percentage > 90) {
    updates.status = 'crowded';
  } else if (Math.random() < 0.05) {
    updates.status = 'delayed';
  } else {
    updates.status = 'on-time';
  }
  
  return updates;
};

const simulateCrowdData = (locationId) => {
  const locations = {
    'central-station-platform-a': {
      name: 'Central Station - Platform A',
      coordinates: [-74.0060, 40.7128],
      capacity: 300
    },
    'downtown-hub-east-exit': {
      name: 'Downtown Hub - East Exit',
      coordinates: [-73.9851, 40.7589],
      capacity: 150
    },
    'university-stop-main': {
      name: 'University Stop - Main Platform',
      coordinates: [-73.9934, 40.7505],
      capacity: 200
    },
    'airport-terminal-gate-b': {
      name: 'Airport Terminal - Gate B',
      coordinates: [-73.7781, 40.6413],
      capacity: 350
    }
  };

  const location = locations[locationId];
  if (!location) return null;

  // Simulate crowd levels based on time of day
  const hour = new Date().getHours();
  let baseCrowd = 0.3; // 30% base occupancy

  // Rush hour patterns
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    baseCrowd = 0.8; // 80% during rush hour
  } else if (hour >= 10 && hour <= 16) {
    baseCrowd = 0.5; // 50% during day
  } else if (hour >= 20 || hour <= 6) {
    baseCrowd = 0.2; // 20% during night
  }

  // Add random variation
  const variation = (Math.random() - 0.5) * 0.3;
  const finalCrowd = Math.max(0.1, Math.min(1.0, baseCrowd + variation));
  
  const current = Math.floor(location.capacity * finalCrowd);
  const percentage = (current / location.capacity) * 100;

  // Calculate risk assessment level based on crowd percentage
  let riskLevel = 'low';
  if (percentage >= 90) {
    riskLevel = 'critical';
  } else if (percentage >= 75) {
    riskLevel = 'high';
  } else if (percentage >= 50) {
    riskLevel = 'medium';
  }

  return {
    locationId,
    locationName: location.name,
    locationType: 'platform',
    coordinates: {
      type: 'Point',
      coordinates: location.coordinates
    },
    crowdMetrics: {
      current,
      capacity: location.capacity
    },
    predictions: {
      next15min: Math.floor(current * (1 + (Math.random() - 0.5) * 0.2)),
      next30min: Math.floor(current * (1 + (Math.random() - 0.5) * 0.3)),
      next60min: Math.floor(current * (1 + (Math.random() - 0.5) * 0.4))
    },
    trends: {
      direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      rate: Math.floor((Math.random() - 0.5) * 10),
      confidence: 0.7 + Math.random() * 0.3
    },
    riskAssessment: {
      level: riskLevel,
      factors: ['crowd_density'],
      score: Math.min(100, Math.floor(percentage * 1.2)),
      recommendations: percentage > 75 ? ['avoid_location', 'use_alternative_route'] : ['monitor_situation']
    },
    dataSource: 'camera',
    quality: {
      accuracy: 0.85 + Math.random() * 0.15
    }
  };
};

const generateDailyStats = async (startDate, endDate) => {
  try {
    // Generate mock statistics since we don't have a real database
    const vehicleStats = {
      totalVehicles: mockVehicles.length,
      averageOccupancy: mockVehicles.reduce((sum, v) => sum + (v.occupancy.current / v.occupancy.capacity), 0) / mockVehicles.length * 100,
      onTimeCount: mockVehicles.filter(v => v.status === 'on-time').length
    };

    const crowdStats = {
      totalReadings: mockCrowdData.filter(c => c.createdAt >= startDate && c.createdAt < endDate).length,
      averageCrowd: 45, // Mock average
      peakCrowd: 280 // Mock peak
    };

    const alertStats = mockAlerts.reduce((acc, alert) => {
      if (alert.createdAt >= startDate && alert.createdAt < endDate) {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      date: startDate.toISOString().split('T')[0],
      vehicles: vehicleStats,
      crowd: crowdStats,
      alerts: alertStats
    };
  } catch (error) {
    logger.error('Error generating daily stats:', error);
    return null;
  }
};

// Export mock data for use in other modules
export { mockVehicles, mockCrowdData, mockAlerts };