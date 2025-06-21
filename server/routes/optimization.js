import { Router } from 'express';
import { validateRequest } from '../middleware/validation.js';
import { schemas } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import { calculateOptimalRoutes } from '../services/routeOptimization.js';

const router = Router();

// Get optimized routes
router.post('/routes', validateRequest(schemas.routeOptimization), async (req, res) => {
  try {
    const { origin, destination, preferences = {}, departureTime } = req.validatedData;

    const routes = await calculateOptimalRoutes({
      origin,
      destination,
      preferences,
      departureTime: departureTime || new Date()
    });

    res.json({
      success: true,
      data: {
        routes,
        origin,
        destination,
        generatedAt: new Date(),
        preferences
      }
    });
  } catch (error) {
    logger.error('Error calculating optimal routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate optimal routes'
    });
  }
});

// Get real-time travel insights
router.get('/insights', async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination coordinates required'
      });
    }

    // Parse coordinates
    const originCoords = origin.split(',').map(Number);
    const destCoords = destination.split(',').map(Number);

    if (originCoords.length !== 2 || destCoords.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate format. Use: lat,lng'
      });
    }

    // Get current conditions affecting the route
    const insights = {
      conditions: [
        {
          type: 'traffic',
          status: 'moderate',
          impact: 'medium',
          description: 'Moderate traffic conditions on main routes'
        },
        {
          type: 'weather',
          status: 'clear',
          impact: 'low',
          description: 'Clear weather, optimal for travel'
        },
        {
          type: 'crowding',
          status: 'high',
          impact: 'high',
          description: 'High passenger density at major stations'
        }
      ],
      recommendations: [
        {
          type: 'timing',
          priority: 'high',
          message: 'Consider departing 15 minutes later to avoid peak crowds'
        },
        {
          type: 'route',
          priority: 'medium',
          message: 'Alternative route via Green Line may be less crowded'
        },
        {
          type: 'mode',
          priority: 'low',
          message: 'Walking portion of journey is weather-friendly'
        }
      ],
      alerts: [
        {
          severity: 'medium',
          message: 'Blue Line experiencing minor delays',
          affectedRoutes: ['blue-line']
        }
      ],
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Error fetching travel insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel insights'
    });
  }
});

// Get crowd-aware route suggestions
router.post('/crowd-aware', async (req, res) => {
  try {
    const { origin, destination, maxCrowdLevel = 'medium' } = req.body;

    if (!origin?.coordinates || !destination?.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination coordinates required'
      });
    }

    // This would integrate with crowd monitoring data
    const suggestions = {
      primaryRoute: {
        id: 'route-1',
        name: 'Comfort Route',
        duration: '32 min',
        crowdLevel: 'low',
        steps: [
          'Walk to Green Line Station (3 min)',
          'Green Line to Central Hub (18 min)',
          'Transfer to Express Bus (2 min)',
          'Express Bus to destination (9 min)'
        ],
        crowdForecast: [
          { segment: 'Green Line', level: 'low', confidence: 0.85 },
          { segment: 'Central Hub', level: 'medium', confidence: 0.75 },
          { segment: 'Express Bus', level: 'low', confidence: 0.90 }
        ]
      },
      alternativeRoutes: [
        {
          id: 'route-2',
          name: 'Fast Route',
          duration: '25 min',
          crowdLevel: 'high',
          reason: 'Faster but more crowded during peak hours'
        }
      ],
      crowdAlerts: [
        {
          location: 'Central Station',
          level: 'high',
          recommendation: 'Use North entrance for easier access'
        }
      ]
    };

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Error generating crowd-aware routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate crowd-aware routes'
    });
  }
});

export default router;