import { Router } from 'express';
import CrowdData from '../models/CrowdData.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { schemas } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get crowd data with filtering
router.get('/', validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page, limit, sort = 'createdAt', order } = req.validatedQuery;
    const { locationType, riskLevel } = req.query;

    // Build filter
    const filter = {};
    if (locationType) filter.locationType = locationType;
    if (riskLevel) filter['riskAssessment.level'] = riskLevel;

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const crowdData = await CrowdData.find(filter)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CrowdData.countDocuments(filter);

    res.json({
      success: true,
      data: crowdData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching crowd data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crowd data'
    });
  }
});

// Get crowd data near location
router.get('/nearby', validateQuery(schemas.coordinates), async (req, res) => {
  try {
    const { lat, lng, radius } = req.validatedQuery;

    const crowdData = await CrowdData.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: crowdData,
      count: crowdData.length
    });
  } catch (error) {
    logger.error('Error fetching nearby crowd data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby crowd data'
    });
  }
});

// Get crowd data for specific location
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { hours = 24 } = req.query;

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const crowdData = await CrowdData.find({
      locationId,
      createdAt: { $gte: startTime }
    }).sort({ createdAt: -1 });

    if (crowdData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No crowd data found for this location'
      });
    }

    // Get latest data point
    const latest = crowdData[0];

    // Calculate trends
    const trends = {
      hourly: [],
      average: 0,
      peak: { time: null, count: 0 },
      low: { time: null, count: Infinity }
    };

    crowdData.forEach(data => {
      const count = data.crowdMetrics.current;
      trends.average += count;

      if (count > trends.peak.count) {
        trends.peak = { time: data.createdAt, count };
      }

      if (count < trends.low.count) {
        trends.low = { time: data.createdAt, count };
      }
    });

    trends.average = Math.round(trends.average / crowdData.length);

    res.json({
      success: true,
      data: {
        latest,
        historical: crowdData,
        trends,
        count: crowdData.length
      }
    });
  } catch (error) {
    logger.error('Error fetching location crowd data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location crowd data'
    });
  }
});

// Create or update crowd data
router.post('/', validateRequest(schemas.crowdData), async (req, res) => {
  try {
    const crowdData = new CrowdData(req.validatedData);
    await crowdData.save();

    // Emit real-time update to connected clients
    req.app.get('io')?.emit('crowdUpdate', crowdData);

    // Check for high-risk conditions and create alerts if necessary
    if (crowdData.riskAssessment.level === 'critical') {
      // This would trigger alert creation in a real system
      logger.warn('Critical crowd level detected:', {
        locationId: crowdData.locationId,
        percentage: crowdData.crowdMetrics.percentage
      });
    }

    res.status(201).json({
      success: true,
      data: crowdData,
      message: 'Crowd data recorded successfully'
    });
  } catch (error) {
    logger.error('Error creating crowd data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record crowd data'
    });
  }
});

// Get crowd statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await CrowdData.aggregate([
      {
        $group: {
          _id: null,
          totalLocations: { $addToSet: '$locationId' },
          averageOccupancy: { $avg: '$crowdMetrics.percentage' },
          highRiskLocations: {
            $sum: { $cond: [{ $eq: ['$riskAssessment.level', 'high'] }, 1, 0] }
          },
          criticalRiskLocations: {
            $sum: { $cond: [{ $eq: ['$riskAssessment.level', 'critical'] }, 1, 0] }
          },
          totalPassengers: { $sum: '$crowdMetrics.current' }
        }
      },
      {
        $project: {
          totalLocations: { $size: '$totalLocations' },
          averageOccupancy: { $round: ['$averageOccupancy', 1] },
          highRiskLocations: 1,
          criticalRiskLocations: 1,
          totalPassengers: 1
        }
      }
    ]);

    const result = stats[0] || {
      totalLocations: 0,
      averageOccupancy: 0,
      highRiskLocations: 0,
      criticalRiskLocations: 0,
      totalPassengers: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching crowd statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crowd statistics'
    });
  }
});

// Get crowd predictions for location
router.get('/predictions/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;

    // Get recent historical data for prediction
    const recentData = await CrowdData.find({
      locationId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(100);

    if (recentData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insufficient data for predictions'
      });
    }

    // Simple prediction algorithm (in production, use ML models)
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Find similar time patterns
    const similarTimeData = recentData.filter(data => {
      const dataHour = data.createdAt.getHours();
      const dataDay = data.createdAt.getDay();
      return Math.abs(dataHour - currentHour) <= 1 && dataDay === currentDay;
    });

    const predictions = {
      next15min: 0,
      next30min: 0,
      next60min: 0,
      confidence: 0.7,
      trend: 'stable'
    };

    if (similarTimeData.length > 0) {
      const avgCurrent = similarTimeData.reduce((sum, data) => sum + data.crowdMetrics.current, 0) / similarTimeData.length;
      
      predictions.next15min = Math.round(avgCurrent * 1.05);
      predictions.next30min = Math.round(avgCurrent * 1.1);
      predictions.next60min = Math.round(avgCurrent * 1.15);
      predictions.confidence = Math.min(0.9, similarTimeData.length / 10);
    }

    res.json({
      success: true,
      data: {
        locationId,
        predictions,
        basedOnSamples: similarTimeData.length,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error generating crowd predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictions'
    });
  }
});

export default router;