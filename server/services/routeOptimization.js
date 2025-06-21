import Vehicle from '../models/Vehicle.js';
import CrowdData from '../models/CrowdData.js';
import Alert from '../models/Alert.js';
import Route from '../models/Route.js';
import { logger } from '../utils/logger.js';

export const calculateOptimalRoutes = async ({ origin, destination, preferences, departureTime }) => {
  try {
    // Get current system conditions
    const [vehicles, crowdData, activeAlerts, routes] = await Promise.all([
      Vehicle.find({ status: { $ne: 'maintenance' } }),
      CrowdData.find({ createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } }), // Last 30 minutes
      Alert.find({ status: 'active' }),
      Route.find({ status: 'active' })
    ]);

    // Calculate distance between two points (simplified)
    const calculateDistance = (coord1, coord2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
      const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Find nearby routes
    const nearbyRoutes = routes.filter(route => {
      return route.stops.some(stop => {
        const distanceToOrigin = calculateDistance(origin.coordinates, stop.coordinates);
        const distanceToDestination = calculateDistance(destination.coordinates, stop.coordinates);
        return distanceToOrigin < 1 || distanceToDestination < 1; // Within 1km
      });
    });

    // Generate route options based on preferences
    const routeOptions = [];

    // Fastest Route
    const fastestRoute = {
      id: 'fastest-route',
      name: 'Express Route',
      type: 'fastest',
      duration: '28 min',
      walkingTime: '5 min',
      transitTime: '23 min',
      transfers: 1,
      crowdLevel: 'high',
      reliability: 92,
      steps: [
        'Walk to Blue Line Station (3 min)',
        'Blue Line Express to Downtown Hub (15 min)',
        'Transfer to Airport Express (2 min)',
        'Airport Express to destination (8 min)'
      ],
      crowdForecast: [
        { segment: 'Blue Line', level: 'high', percentage: 85 },
        { segment: 'Downtown Hub', level: 'medium', percentage: 65 },
        { segment: 'Airport Express', level: 'medium', percentage: 70 }
      ],
      cost: 3.50,
      carbonFootprint: 2.1, // kg CO2
      accessibility: {
        wheelchairAccessible: true,
        elevatorRequired: false
      }
    };

    // Least Crowded Route
    const comfortRoute = {
      id: 'comfort-route',
      name: 'Comfort Route',
      type: 'least-crowded',
      duration: '35 min',
      walkingTime: '8 min',
      transitTime: '27 min',
      transfers: 2,
      crowdLevel: 'low',
      reliability: 97,
      steps: [
        'Walk to Green Line Station (4 min)',
        'Green Line to University (12 min)',
        'Transfer to Local Bus 45 (3 min)',
        'Bus 45 to Transit Center (8 min)',
        'Transfer to Airport Shuttle (2 min)',
        'Airport Shuttle to destination (6 min)'
      ],
      crowdForecast: [
        { segment: 'Green Line', level: 'low', percentage: 35 },
        { segment: 'Bus 45', level: 'low', percentage: 40 },
        { segment: 'Airport Shuttle', level: 'medium', percentage: 55 }
      ],
      cost: 4.25,
      carbonFootprint: 2.8,
      accessibility: {
        wheelchairAccessible: true,
        elevatorRequired: true
      }
    };

    // Most Reliable Route
    const reliableRoute = {
      id: 'reliable-route',
      name: 'Reliable Route',
      type: 'most-reliable',
      duration: '32 min',
      walkingTime: '6 min',
      transitTime: '26 min',
      transfers: 0,
      crowdLevel: 'medium',
      reliability: 98,
      steps: [
        'Walk to Red Line Station (6 min)',
        'Red Line Direct to Airport Terminal (26 min)'
      ],
      crowdForecast: [
        { segment: 'Red Line', level: 'medium', percentage: 68 }
      ],
      cost: 4.00,
      carbonFootprint: 1.9,
      accessibility: {
        wheelchairAccessible: true,
        elevatorRequired: false
      }
    };

    // Add routes based on preferences
    if (preferences.priority === 'fastest') {
      routeOptions.push(fastestRoute, reliableRoute, comfortRoute);
    } else if (preferences.priority === 'least-crowded') {
      routeOptions.push(comfortRoute, reliableRoute, fastestRoute);
    } else if (preferences.priority === 'most-reliable') {
      routeOptions.push(reliableRoute, fastestRoute, comfortRoute);
    } else {
      // Balanced approach
      routeOptions.push(reliableRoute, fastestRoute, comfortRoute);
    }

    // Apply real-time adjustments based on current conditions
    routeOptions.forEach(route => {
      // Check for alerts affecting this route
      const routeAlerts = activeAlerts.filter(alert => 
        route.steps.some(step => 
          step.toLowerCase().includes(alert.location.name.toLowerCase())
        )
      );

      if (routeAlerts.length > 0) {
        route.alerts = routeAlerts.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          message: alert.title,
          impact: alert.severity === 'high' ? 'major' : 'minor'
        }));

        // Adjust duration for delays
        if (routeAlerts.some(alert => alert.type === 'warning')) {
          const currentDuration = parseInt(route.duration);
          route.duration = `${currentDuration + 5} min`;
          route.adjustedForDelays = true;
        }
      }

      // Apply crowd level adjustments
      if (preferences.avoidCrowded && route.crowdLevel === 'high') {
        route.recommended = false;
        route.reason = 'High crowd levels detected';
      }

      // Calculate savings compared to baseline
      const baselineDuration = 40; // minutes
      const timeSaved = baselineDuration - parseInt(route.duration);
      if (timeSaved > 0) {
        route.savings = `${timeSaved} minutes faster`;
      }
    });

    // Sort routes by preference
    const sortedRoutes = routeOptions.sort((a, b) => {
      if (preferences.priority === 'fastest') {
        return parseInt(a.duration) - parseInt(b.duration);
      } else if (preferences.priority === 'least-crowded') {
        const crowdOrder = { 'low': 1, 'medium': 2, 'high': 3 };
        return crowdOrder[a.crowdLevel] - crowdOrder[b.crowdLevel];
      } else if (preferences.priority === 'most-reliable') {
        return b.reliability - a.reliability;
      }
      return b.reliability - a.reliability; // Default to reliability
    });

    return sortedRoutes;

  } catch (error) {
    logger.error('Error in route optimization:', error);
    throw error;
  }
};

export const getPredictedCrowdLevels = async (routeSegments, timeOfDay) => {
  try {
    const predictions = [];

    for (const segment of routeSegments) {
      // Get historical crowd data for this segment
      const historicalData = await CrowdData.find({
        locationName: { $regex: segment, $options: 'i' },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      if (historicalData.length > 0) {
        const avgCrowd = historicalData.reduce((sum, data) => 
          sum + data.crowdMetrics.percentage, 0) / historicalData.length;

        predictions.push({
          segment,
          predictedLevel: avgCrowd < 50 ? 'low' : avgCrowd < 75 ? 'medium' : 'high',
          confidence: Math.min(0.9, historicalData.length / 50),
          percentage: Math.round(avgCrowd)
        });
      } else {
        predictions.push({
          segment,
          predictedLevel: 'medium',
          confidence: 0.5,
          percentage: 60
        });
      }
    }

    return predictions;
  } catch (error) {
    logger.error('Error predicting crowd levels:', error);
    return [];
  }
};