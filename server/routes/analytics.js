import { Router } from 'express';
import Vehicle from '../models/Vehicle.js';
import CrowdData from '../models/CrowdData.js';
import Alert from '../models/Alert.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get system overview analytics
router.get('/overview', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [vehicleStats, crowdStats, alertStats] = await Promise.all([
      // Vehicle analytics
      Vehicle.aggregate([
        {
          $group: {
            _id: null,
            totalVehicles: { $sum: 1 },
            activeVehicles: {
              $sum: { $cond: [{ $ne: ['$status', 'maintenance'] }, 1, 0] }
            },
            averageOccupancy: { $avg: '$occupancy.percentage' },
            onTimeVehicles: {
              $sum: { $cond: [{ $eq: ['$status', 'on-time'] }, 1, 0] }
            },
            delayedVehicles: {
              $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
            },
            crowdedVehicles: {
              $sum: { $cond: [{ $eq: ['$status', 'crowded'] }, 1, 0] }
            }
          }
        }
      ]),

      // Crowd analytics
      CrowdData.aggregate([
        {
          $match: {
            createdAt: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            totalReadings: { $sum: 1 },
            averageCrowdLevel: { $avg: '$crowdMetrics.percentage' },
            peakCrowdLevel: { $max: '$crowdMetrics.percentage' },
            highRiskLocations: {
              $sum: { $cond: [{ $eq: ['$riskAssessment.level', 'high'] }, 1, 0] }
            },
            criticalRiskLocations: {
              $sum: { $cond: [{ $eq: ['$riskAssessment.level', 'critical'] }, 1, 0] }
            }
          }
        }
      ]),

      // Alert analytics
      Alert.aggregate([
        {
          $match: {
            createdAt: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            averageResponseTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', 'resolved'] },
                  { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        }
      ])
    ]);

    const overview = {
      timeframe,
      generatedAt: new Date(),
      vehicles: vehicleStats[0] || {
        totalVehicles: 0,
        activeVehicles: 0,
        averageOccupancy: 0,
        onTimeVehicles: 0,
        delayedVehicles: 0,
        crowdedVehicles: 0
      },
      crowd: crowdStats[0] || {
        totalReadings: 0,
        averageCrowdLevel: 0,
        peakCrowdLevel: 0,
        highRiskLocations: 0,
        criticalRiskLocations: 0
      },
      alerts: alertStats.reduce((acc, alert) => {
        acc[alert._id] = {
          count: alert.count,
          averageResponseTime: alert.averageResponseTime ? 
            Math.round(alert.averageResponseTime / (1000 * 60)) : 0 // Convert to minutes
        };
        return acc;
      }, {}),
      performance: {
        onTimePerformance: vehicleStats[0] ? 
          Math.round((vehicleStats[0].onTimeVehicles / vehicleStats[0].totalVehicles) * 100) : 0,
        systemReliability: 95, // This would be calculated based on various factors
        customerSatisfaction: 4.2 // This would come from user feedback
      }
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview'
    });
  }
});

// Get route performance analytics
router.get('/routes', async (req, res) => {
  try {
    const routeAnalytics = await Vehicle.aggregate([
      {
        $group: {
          _id: '$route',
          totalVehicles: { $sum: 1 },
          averageOccupancy: { $avg: '$occupancy.percentage' },
          onTimeCount: { $sum: { $cond: [{ $eq: ['$status', 'on-time'] }, 1, 0] } },
          delayedCount: { $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] } },
          crowdedCount: { $sum: { $cond: [{ $eq: ['$status', 'crowded'] }, 1, 0] } }
        }
      },
      {
        $project: {
          route: '$_id',
          totalVehicles: 1,
          averageOccupancy: { $round: ['$averageOccupancy', 1] },
          onTimePerformance: {
            $round: [
              { $multiply: [{ $divide: ['$onTimeCount', '$totalVehicles'] }, 100] },
              1
            ]
          },
          delayedCount: 1,
          crowdedCount: 1
        }
      },
      { $sort: { onTimePerformance: -1 } }
    ]);

    res.json({
      success: true,
      data: routeAnalytics
    });
  } catch (error) {
    logger.error('Error fetching route analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route analytics'
    });
  }
});

// Get crowd trends analytics
router.get('/crowd-trends', async (req, res) => {
  try {
    const { locationId, hours = 24 } = req.query;
    
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const matchStage = {
      createdAt: { $gte: startTime }
    };
    
    if (locationId) {
      matchStage.locationId = locationId;
    }

    const trends = await CrowdData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            locationId: '$locationId',
            locationName: '$locationName',
            hour: { $hour: '$createdAt' }
          },
          averageCrowd: { $avg: '$crowdMetrics.percentage' },
          peakCrowd: { $max: '$crowdMetrics.percentage' },
          minCrowd: { $min: '$crowdMetrics.percentage' },
          readings: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            locationId: '$_id.locationId',
            locationName: '$_id.locationName'
          },
          hourlyData: {
            $push: {
              hour: '$_id.hour',
              average: { $round: ['$averageCrowd', 1] },
              peak: '$peakCrowd',
              min: '$minCrowd',
              readings: '$readings'
            }
          },
          overallAverage: { $avg: '$averageCrowd' },
          overallPeak: { $max: '$peakCrowd' }
        }
      },
      { $sort: { '_id.locationName': 1 } }
    ]);

    res.json({
      success: true,
      data: trends,
      timeframe: `${hours} hours`,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error fetching crowd trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crowd trends'
    });
  }
});

// Get alert patterns analytics
router.get('/alert-patterns', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const patterns = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            severity: '$severity',
            hour: { $hour: '$createdAt' },
            dayOfWeek: { $dayOfWeek: '$createdAt' }
          },
          count: { $sum: 1 },
          averageResponseTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            type: '$_id.type',
            severity: '$_id.severity'
          },
          totalCount: { $sum: '$count' },
          hourlyDistribution: {
            $push: {
              hour: '$_id.hour',
              count: '$count'
            }
          },
          weeklyDistribution: {
            $push: {
              dayOfWeek: '$_id.dayOfWeek',
              count: '$count'
            }
          },
          averageResponseTime: { $avg: '$averageResponseTime' }
        }
      },
      {
        $project: {
          type: '$_id.type',
          severity: '$_id.severity',
          totalCount: 1,
          hourlyDistribution: 1,
          weeklyDistribution: 1,
          averageResponseTime: {
            $cond: [
              { $ne: ['$averageResponseTime', null] },
              { $round: [{ $divide: ['$averageResponseTime', 60000] }, 1] }, // Convert to minutes
              0
            ]
          }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    res.json({
      success: true,
      data: patterns,
      timeframe: `${days} days`,
      generatedAt: new Date()
    });
  } catch (error) {
    logger.error('Error fetching alert patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert patterns'
    });
  }
});

// Get predictive insights
router.get('/predictions', async (req, res) => {
  try {
    // This would use ML models in production
    // For now, we'll provide rule-based predictions
    
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    const predictions = {
      crowdLevels: {
        next1Hour: generateCrowdPrediction(currentHour + 1),
        next3Hours: generateCrowdPrediction(currentHour + 3),
        peakTime: getPeakTimePrediction(currentDay),
        confidence: 0.75
      },
      delays: {
        probability: getDelayProbability(currentHour, currentDay),
        expectedRoutes: ['Blue Line', 'Route 42'],
        averageDelay: '8 minutes'
      },
      alerts: {
        expectedCount: getExpectedAlertCount(currentHour),
        likelyTypes: ['crowding', 'minor delays'],
        riskLevel: 'medium'
      },
      recommendations: [
        {
          type: 'operational',
          priority: 'high',
          message: 'Deploy additional vehicles on Blue Line during evening rush'
        },
        {
          type: 'maintenance',
          priority: 'medium',
          message: 'Schedule platform cleaning at Downtown Hub during low-traffic hours'
        }
      ],
      generatedAt: new Date(),
      modelVersion: '1.0.0'
    };

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    logger.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictions'
    });
  }
});

// Helper functions for predictions
const generateCrowdPrediction = (hour) => {
  // Rush hour patterns
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return { level: 'high', percentage: 85 };
  } else if (hour >= 10 && hour <= 16) {
    return { level: 'medium', percentage: 60 };
  } else {
    return { level: 'low', percentage: 30 };
  }
};

const getPeakTimePrediction = (dayOfWeek) => {
  // Weekend vs weekday patterns
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
    return { time: '14:00', description: 'Weekend afternoon peak' };
  } else {
    return { time: '18:00', description: 'Weekday evening rush hour' };
  }
};

const getDelayProbability = (hour, dayOfWeek) => {
  let baseProbability = 0.15; // 15% base probability
  
  // Higher probability during rush hours
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    baseProbability = 0.35;
  }
  
  // Higher probability on weekdays
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    baseProbability += 0.1;
  }
  
  return Math.min(0.8, baseProbability);
};

const getExpectedAlertCount = (hour) => {
  // More alerts during busy periods
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return Math.floor(Math.random() * 5) + 3; // 3-7 alerts
  } else {
    return Math.floor(Math.random() * 3) + 1; // 1-3 alerts
  }
};

export default router;