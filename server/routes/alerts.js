import { Router } from 'express';
import Alert from '../models/Alert.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { schemas } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import { generateAlertId } from '../utils/helpers.js';

const router = Router();

// Get all alerts with filtering
router.get('/', validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page, limit, sort = 'createdAt', order } = req.validatedQuery;
    const { type, severity, status } = req.query;

    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const alerts = await Alert.find(filter)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(filter);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// Get alerts near location
router.get('/nearby', validateQuery(schemas.coordinates), async (req, res) => {
  try {
    const { lat, lng, radius } = req.validatedQuery;

    const alerts = await Alert.find({
      'location.coordinates.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      },
      status: { $in: ['active', 'investigating'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    logger.error('Error fetching nearby alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby alerts'
    });
  }
});

// Get single alert
router.get('/:alertId', async (req, res) => {
  try {
    const alert = await Alert.findOne({ alertId: req.params.alertId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert'
    });
  }
});

// Create new alert
router.post('/', validateRequest(schemas.alert), async (req, res) => {
  try {
    const alertData = {
      ...req.validatedData,
      alertId: generateAlertId()
    };

    const alert = new Alert(alertData);
    await alert.save();

    // Emit real-time alert to connected clients
    req.app.get('io')?.emit('newAlert', alert);

    logger.info('New alert created:', { alertId: alert.alertId, type: alert.type });

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert'
    });
  }
});

// Update alert status
router.patch('/:alertId/status', async (req, res) => {
  try {
    const { status, resolution } = req.body;

    if (!['active', 'investigating', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = { status };

    if (status === 'resolved' && resolution) {
      updateData['resolution.resolvedAt'] = new Date();
      updateData['resolution.resolution'] = resolution;
    }

    const alert = await Alert.findOneAndUpdate(
      { alertId: req.params.alertId },
      updateData,
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Emit status update to connected clients
    req.app.get('io')?.emit('alertStatusUpdate', {
      alertId: alert.alertId,
      status: alert.status
    });

    res.json({
      success: true,
      data: alert,
      message: 'Alert status updated'
    });
  } catch (error) {
    logger.error('Error updating alert status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert status'
    });
  }
});

// Get alert statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          activeAlerts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          emergencyAlerts: {
            $sum: { $cond: [{ $eq: ['$type', 'emergency'] }, 1, 0] }
          },
          resolvedAlerts: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          averageResponseTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                {
                  $subtract: ['$resolution.resolvedAt', '$createdAt']
                },
                null
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAlerts: 0,
      activeAlerts: 0,
      emergencyAlerts: 0,
      resolvedAlerts: 0,
      averageResponseTime: 0
    };

    // Convert response time from milliseconds to minutes
    if (result.averageResponseTime) {
      result.averageResponseTime = Math.round(result.averageResponseTime / (1000 * 60));
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert statistics'
    });
  }
});

export default router;