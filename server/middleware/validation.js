import Joi from 'joi';

// Common validation schemas
export const schemas = {
  // Vehicle validation
  vehicle: Joi.object({
    vehicleId: Joi.string().required(),
    type: Joi.string().valid('bus', 'train', 'metro', 'tram').required(),
    route: Joi.string().required(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    occupancy: Joi.object({
      current: Joi.number().min(0).required(),
      capacity: Joi.number().min(1).required()
    }).required(),
    status: Joi.string().valid('on-time', 'delayed', 'crowded', 'incident', 'maintenance'),
    speed: Joi.number().min(0),
    heading: Joi.number().min(0).max(360)
  }),

  // Alert validation
  alert: Joi.object({
    type: Joi.string().valid('emergency', 'warning', 'info', 'maintenance').required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().max(1000).required(),
    location: Joi.object({
      name: Joi.string().required(),
      coordinates: Joi.object({
        coordinates: Joi.array().items(Joi.number()).length(2)
      }),
      stopId: Joi.string(),
      routeId: Joi.string()
    }).required(),
    affectedPassengers: Joi.object({
      estimated: Joi.number().min(0)
    })
  }),

  // Crowd data validation
  crowdData: Joi.object({
    locationId: Joi.string().required(),
    locationName: Joi.string().required(),
    locationType: Joi.string().valid('station', 'platform', 'vehicle', 'stop').required(),
    coordinates: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    crowdMetrics: Joi.object({
      current: Joi.number().min(0).required(),
      capacity: Joi.number().min(1).required()
    }).required(),
    dataSource: Joi.string().valid('camera', 'sensor', 'manual', 'estimated')
  }),

  // Route optimization request
  routeOptimization: Joi.object({
    origin: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
      name: Joi.string()
    }).required(),
    destination: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
      name: Joi.string()
    }).required(),
    preferences: Joi.object({
      priority: Joi.string().valid('fastest', 'least-crowded', 'most-reliable', 'balanced'),
      maxWalkingDistance: Joi.number().min(0).max(2000),
      avoidCrowded: Joi.boolean(),
      accessibilityRequired: Joi.boolean()
    }),
    departureTime: Joi.date().min('now')
  }),

  // Query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(0).max(50000).default(1000) // meters
  })
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.validatedData = value;
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.validatedQuery = value;
    next();
  };
};