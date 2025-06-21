import { Router } from 'express';
import vehicleRoutes from './vehicles.js';
import alertRoutes from './alerts.js';
import crowdRoutes from './crowd.js';
import routeRoutes from './routes.js';
import analyticsRoutes from './analytics.js';
import optimizationRoutes from './optimization.js';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

export const setupRoutes = (app) => {
  // Mount route modules
  router.use('/vehicles', vehicleRoutes);
  router.use('/alerts', alertRoutes);
  router.use('/crowd', crowdRoutes);
  router.use('/routes', routeRoutes);
  router.use('/analytics', analyticsRoutes);
  router.use('/optimization', optimizationRoutes);

  // Mount main router
  app.use(API_VERSION, router);

  // API documentation endpoint
  app.get(API_VERSION, (req, res) => {
    res.json({
      success: true,
      message: 'SafeCommute AI API v1',
      version: '1.0.0',
      endpoints: {
        vehicles: `${API_VERSION}/vehicles`,
        alerts: `${API_VERSION}/alerts`,
        crowd: `${API_VERSION}/crowd`,
        routes: `${API_VERSION}/routes`,
        analytics: `${API_VERSION}/analytics`,
        optimization: `${API_VERSION}/optimization`
      },
      documentation: 'https://docs.safecommute.ai'
    });
  });
};