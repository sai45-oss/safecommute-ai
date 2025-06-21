import { Router } from 'express';
import Vehicle from '../models/Vehicle.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { schemas } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get all vehicles with filtering and pagination
router.get('/', validateQuery(schemas.pagination), async (req, res) => {
  try {
    const { page, limit, sort = 'lastUpdated', order } = req.validatedQuery;
    const { route, status, type } = req.query;

    // Build filter
    const filter = {};
    if (route) filter.route = route;
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const vehicles = await Vehicle.find(filter)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('alerts');

    const total = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles'
    });
  }
});

// Get vehicles near location
router.get('/nearby', validateQuery(schemas.coordinates), async (req, res) => {
  try {
    const { lat, lng, radius } = req.validatedQuery;

    const vehicles = await Vehicle.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      }
    }).populate('alerts');

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    logger.error('Error fetching nearby vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby vehicles'
    });
  }
});

// Get single vehicle
router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId })
      .populate('alerts');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    logger.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle'
    });
  }
});

// Create or update vehicle
router.post('/', validateRequest(schemas.vehicle), async (req, res) => {
  try {
    const vehicleData = req.validatedData;

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId: vehicleData.vehicleId },
      vehicleData,
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle data updated successfully'
    });
  } catch (error) {
    logger.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle data'
    });
  }
});

// Update vehicle location
router.patch('/:vehicleId/location', async (req, res) => {
  try {
    const { coordinates, speed, heading } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [lng, lat] required'
      });
    }

    const updateData = {
      'location.coordinates': coordinates,
      lastUpdated: new Date()
    };

    if (speed !== undefined) updateData.speed = speed;
    if (heading !== undefined) updateData.heading = heading;

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.vehicleId },
      updateData,
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Vehicle location updated'
    });
  } catch (error) {
    logger.error('Error updating vehicle location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle location'
    });
  }
});

// Update vehicle occupancy
router.patch('/:vehicleId/occupancy', async (req, res) => {
  try {
    const { current, capacity } = req.body;

    if (current === undefined || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Current occupancy and capacity required'
      });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.vehicleId },
      {
        'occupancy.current': current,
        'occupancy.capacity': capacity,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Vehicle occupancy updated'
    });
  } catch (error) {
    logger.error('Error updating vehicle occupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle occupancy'
    });
  }
});

// Get vehicle statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
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
    ]);

    const result = stats[0] || {
      totalVehicles: 0,
      averageOccupancy: 0,
      onTimeVehicles: 0,
      delayedVehicles: 0,
      crowdedVehicles: 0
    };

    // Calculate on-time performance
    result.onTimePerformance = result.totalVehicles > 0 
      ? Math.round((result.onTimeVehicles / result.totalVehicles) * 100)
      : 0;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching vehicle statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle statistics'
    });
  }
});

export default router;