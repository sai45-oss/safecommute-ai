import { logger } from '../utils/logger.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle client joining specific rooms for targeted updates
    socket.on('join-route', (routeId) => {
      socket.join(`route-${routeId}`);
      logger.info(`Client ${socket.id} joined route ${routeId}`);
    });

    socket.on('join-location', (locationId) => {
      socket.join(`location-${locationId}`);
      logger.info(`Client ${socket.id} joined location ${locationId}`);
    });

    socket.on('join-alerts', () => {
      socket.join('alerts');
      logger.info(`Client ${socket.id} joined alerts room`);
    });

    // Handle real-time data requests
    socket.on('request-vehicle-updates', (routeId) => {
      socket.join(`vehicle-updates-${routeId}`);
    });

    socket.on('request-crowd-updates', (locationId) => {
      socket.join(`crowd-updates-${locationId}`);
    });

    // Handle voice command processing
    socket.on('voice-command', async (data) => {
      try {
        const { command, userId } = data;
        logger.info(`Voice command received from ${socket.id}: ${command}`);

        // Process voice command (simplified)
        const response = await processVoiceCommand(command);
        
        socket.emit('voice-response', {
          command,
          response,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error processing voice command:', error);
        socket.emit('voice-error', {
          message: 'Failed to process voice command'
        });
      }
    });

    // Handle emergency alerts
    socket.on('emergency-alert', (data) => {
      const { location, type, description } = data;
      
      // Broadcast emergency alert to all connected clients
      io.emit('emergency-broadcast', {
        type: 'emergency',
        location,
        alertType: type,
        description,
        timestamp: new Date(),
        source: socket.id
      });

      logger.warn(`Emergency alert broadcast: ${type} at ${location}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Send initial connection data
    socket.emit('connected', {
      message: 'Connected to SafeCommute AI',
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  // Broadcast system status updates
  setInterval(() => {
    io.emit('system-heartbeat', {
      status: 'operational',
      timestamp: new Date(),
      connectedClients: io.engine.clientsCount
    });
  }, 30000); // Every 30 seconds
};

// Voice command processing function
const processVoiceCommand = async (command) => {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes('status') || lowerCommand.includes('how are')) {
    return {
      type: 'status',
      message: 'All systems are operational. 247 vehicles active, 92% on-time performance.',
      data: {
        vehicles: 247,
        onTimePerformance: 92,
        activeAlerts: 3
      }
    };
  }

  if (lowerCommand.includes('crowd') || lowerCommand.includes('busy')) {
    return {
      type: 'crowd',
      message: 'Current average occupancy is 68%. Downtown Hub is experiencing high crowds.',
      data: {
        averageOccupancy: 68,
        highCrowdLocations: ['Downtown Hub', 'Central Station']
      }
    };
  }

  if (lowerCommand.includes('alert') || lowerCommand.includes('emergency')) {
    return {
      type: 'alerts',
      message: 'There are currently 3 active alerts: 1 medical emergency, 2 crowd warnings.',
      data: {
        totalAlerts: 3,
        emergency: 1,
        warnings: 2
      }
    };
  }

  if (lowerCommand.includes('route') || lowerCommand.includes('directions')) {
    return {
      type: 'route',
      message: 'Please specify your origin and destination for route optimization.',
      data: {
        availableRoutes: ['Blue Line', 'Green Line', 'Red Line', 'Bus Routes']
      }
    };
  }

  return {
    type: 'unknown',
    message: 'I didn\'t understand that command. Try asking about status, crowds, alerts, or routes.',
    suggestions: ['Show system status', 'Check crowd levels', 'Any alerts?', 'Route information']
  };
};

// Utility functions for broadcasting updates
export const broadcastVehicleUpdate = (io, vehicleData) => {
  io.to(`route-${vehicleData.route}`).emit('vehicle-update', vehicleData);
  io.to(`vehicle-updates-${vehicleData.route}`).emit('vehicle-location', {
    vehicleId: vehicleData.vehicleId,
    location: vehicleData.location,
    status: vehicleData.status,
    occupancy: vehicleData.occupancy
  });
};

export const broadcastCrowdUpdate = (io, crowdData) => {
  io.to(`location-${crowdData.locationId}`).emit('crowd-update', crowdData);
  io.to(`crowd-updates-${crowdData.locationId}`).emit('crowd-level', {
    locationId: crowdData.locationId,
    current: crowdData.crowdMetrics.current,
    percentage: crowdData.crowdMetrics.percentage,
    riskLevel: crowdData.riskAssessment.level
  });
};

export const broadcastAlert = (io, alertData) => {
  io.to('alerts').emit('new-alert', alertData);
  
  // Send to specific locations if applicable
  if (alertData.location.routeId) {
    io.to(`route-${alertData.location.routeId}`).emit('route-alert', alertData);
  }
};