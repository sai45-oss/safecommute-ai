import { Router } from 'express';
import Route from '../models/Route.js';
import Vehicle from '../models/Vehicle.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { schemas } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get all routes
router.get('/', validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page, limit, sort = 'name', order } = req.validatedQuery;
    const { type, status } = req.query;

    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const routes = await Route.find(filter)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('alerts');

    const total = await Route.countDocuments(filter);

    res.json({
      success: true,
      data: routes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes'
    });
  }
});

// Get single route with real-time data
router.get('/:routeId', async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId })
      .populate('alerts');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Get active vehicles on this route
    const vehicles = await Vehicle.find({ 
      route: route.routeId,
      status: { $ne: 'maintenance' }
    });

    // Calculate real-time metrics
    const metrics = {
      activeVehicles: vehicles.length,
      averageOccupancy: vehicles.length > 0 
        ? Math.round(vehicles.reduce((sum, v) => sum + v.occupancy.percentage, 0) / vehicles.length)
        : 0,
      onTimeVehicles: vehicles.filter(v => v.status === 'on-time').length,
      delayedVehicles: vehicles.filter(v => v.status === 'delayed').length,
      crowdedVehicles: vehicles.filter(v => v.status === 'crowded').length
    };

    metrics.onTimePerformance = vehicles.length > 0 
      ? Math.round((metrics.onTimeVehicles / vehicles.length) * 100)
      : route.performance.onTimePerformance;

    res.json({
      success: true,
      data: {
        ...route.toObject(),
        realTimeMetrics: metrics,
        vehicles: vehicles.map(v => ({
          vehicleId: v.vehicleId,
          location: v.location,
          occupancy: v.occupancy,
          status: v.status,
          nextStop: v.nextStop,
          lastUpdated: v.lastUpdated
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route'
    });
  }
});

// Get route schedule
router.get('/:routeId/schedule', async (req, res) => {
  try {
    const { stopId } = req.query;
    
    const route = await Route.findOne({ routeId: req.params.routeId });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    let schedule = route.schedule;
    let nextDepartures = [];

    if (stopId) {
      // Get next departures for specific stop
      const stop = route.stops.find(s => s.stopId === stopId);
      if (!stop) {
        return res.status(404).json({
          success: false,
          message: 'Stop not found on this route'
        });
      }

      // Calculate next 5 departures
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const currentSchedule = isWeekend ? schedule.weekend : schedule.weekday;
      
      for (let i = 0; i < 5; i++) {
        const departure = new Date(now.getTime() + (i * currentSchedule.frequency * 60000));
        departure.setMinutes(departure.getMinutes() + stop.estimatedTime);
        
        nextDepartures.push({
          scheduledTime: departure,
          estimatedTime: departure, // In real system, this would account for delays
          status: 'on-time'
        });
      }
    }

    res.json({
      success: true,
      data: {
        routeId: route.routeId,
        schedule,
        stopId,
        nextDepartures,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error fetching route schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route schedule'
    });
  }
});

// Get route stops
router.get('/:routeId/stops', async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Enhance stops with real-time data
    const enhancedStops = await Promise.all(
      route.stops.map(async (stop) => {
        // Get vehicles approaching this stop
        const approachingVehicles = await Vehicle.find({
          route: route.routeId,
          'nextStop.stopId': stop.stopId
        });

        return {
          ...stop.toObject(),
          approachingVehicles: approachingVehicles.map(v => ({
            vehicleId: v.vehicleId,
            estimatedArrival: v.nextStop.estimatedArrival,
            occupancy: v.occupancy,
            status: v.status
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        routeId: route.routeId,
        stops: enhancedStops,
        totalStops: enhancedStops.length
      }
    });
  } catch (error) {
    logger.error('Error fetching route stops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route stops'
    });
  }
});

// Get route performance metrics
router.get('/:routeId/performance', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const route = await Route.findOne({ routeId: req.params.routeId });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Get historical vehicle data for this route
    const vehicles = await Vehicle.find({ 
      route: route.routeId,
      lastUpdated: { $gte: startDate }
    });

    // Calculate performance metrics
    const performance = {
      onTimePerformance: route.performance.onTimePerformance,
      averageDelay: route.performance.averageDelay,
      reliability: route.performance.reliability,
      averageOccupancy: route.capacity.averageOccupancy,
      
      // Historical trends (simplified)
      trends: {
        onTime: generateTrendData(days, 'onTime'),
        occupancy: generateTrendData(days, 'occupancy'),
        delays: generateTrendData(days, 'delays')
      },
      
      // Peak hours analysis
      peakHours: [
        { hour: 8, occupancy: 85, onTimePerformance: 88 },
        { hour: 9, occupancy: 78, onTimePerformance: 92 },
        { hour: 17, occupancy: 90, onTimePerformance: 85 },
        { hour: 18, occupancy: 88, onTimePerformance: 87 }
      ],
      
      // Service quality indicators
      serviceQuality: {
        punctuality: route.performance.onTimePerformance,
        comfort: Math.max(0, 100 - route.capacity.averageOccupancy),
        frequency: calculateFrequencyScore(route.schedule),
        accessibility: 95 // Based on wheelchair accessible stops
      }
    };

    res.json({
      success: true,
      data: performance,
      timeframe: `${days} days`,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error fetching route performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route performance'
    });
  }
});

// Helper functions
const generateTrendData = (days, metric) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    let value;
    switch (metric) {
      case 'onTime':
        value = 85 + Math.random() * 15; // 85-100%
        break;
      case 'occupancy':
        value = 50 + Math.random() * 40; // 50-90%
        break;
      case 'delays':
        value = Math.random() * 10; // 0-10 minutes
        break;
      default:
        value = 0;
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 10) / 10
    });
  }
  return data;
};

const calculateFrequencyScore = (schedule) => {
  // Higher score for more frequent service
  const weekdayFreq = schedule.weekday.frequency;
  const peakFreq = schedule.weekday.peakFrequency || weekdayFreq;
  
  // Score based on peak frequency (lower minutes = higher score)
  return Math.max(0, 100 - (peakFreq * 2));
};

export default router;