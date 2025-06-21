# SafeCommute AI - Mock Data System

## Overview

The SafeCommute AI application uses a sophisticated mock data system to simulate a real transit system when running in WebContainer environments where external databases aren't available.

## How Mock Data Works

### 1. Mock Database Detection

The system automatically detects if it's running in a WebContainer environment:

```javascript
// In server/config/database.js
const isWebContainer = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost');

if (isWebContainer) {
  // Use mock database
  const conn = await mockDb.connect();
  logger.info('Using mock database for WebContainer environment');
} else {
  // Use real MongoDB in production
  const mongoose = await import('mongoose');
  // ... real database connection
}
```

### 2. Mock Vehicle Model

Instead of MongoDB documents, we use JavaScript classes that mimic Mongoose models:

```javascript
// In server/models/Vehicle.js
class MockVehicle {
  constructor(data) {
    this._id = data._id || `vehicle-${Date.now()}-${Math.random()}`;
    this.vehicleId = data.vehicleId;
    this.type = data.type; // 'bus' or 'train'
    this.route = data.route; // 'Route 42', 'Blue Line', etc.
    this.location = data.location; // { coordinates: [lng, lat] }
    this.occupancy = data.occupancy; // { current: 25, capacity: 50 }
    this.status = data.status || 'on-time'; // 'on-time', 'delayed', 'crowded'
    // ... other properties
  }

  // Mock database operations
  static find(filter = {}) {
    let results = this.mockData.map(data => new MockVehicle(data));
    
    // Apply filters just like real MongoDB
    if (filter.route) {
      results = results.filter(v => v.route === filter.route);
    }
    if (filter.status) {
      results = results.filter(v => v.status === filter.status);
    }
    
    return {
      sort: (sortObj) => ({
        limit: (limit) => ({
          skip: (skip) => Promise.resolve(results.slice(skip, skip + limit))
        })
      })
    };
  }
}
```

### 3. Pre-populated Mock Data

The system comes with realistic sample data:

```javascript
static mockData = [
  {
    _id: 'vehicle-1',
    vehicleId: 'BUS-001',
    type: 'bus',
    route: 'Route 42',
    location: { type: 'Point', coordinates: [-74.0060, 40.7128] }, // NYC coordinates
    occupancy: { current: 25, capacity: 50, percentage: 50 },
    status: 'on-time',
    speed: 25,
    heading: 90,
    lastUpdated: new Date()
  },
  {
    _id: 'vehicle-2',
    vehicleId: 'TRAIN-A1',
    type: 'train',
    route: 'Blue Line',
    location: { type: 'Point', coordinates: [-73.9851, 40.7589] },
    occupancy: { current: 120, capacity: 200, percentage: 60 },
    status: 'on-time',
    speed: 45,
    heading: 180,
    lastUpdated: new Date()
  }
  // ... more vehicles
];
```

### 4. Real-time Data Simulation

The background service continuously updates mock data to simulate real transit conditions:

```javascript
// In server/services/background.js
const simulateVehicleUpdates = (vehicle) => {
  const updates = {};
  
  // Simulate location changes (vehicles moving)
  const [lng, lat] = vehicle.location.coordinates;
  updates['location'] = {
    coordinates: [
      lng + (Math.random() - 0.5) * 0.001, // Small random movement
      lat + (Math.random() - 0.5) * 0.001
    ]
  };
  
  // Simulate occupancy changes (passengers boarding/alighting)
  const currentOccupancy = vehicle.occupancy.current;
  const capacity = vehicle.occupancy.capacity;
  const change = Math.floor((Math.random() - 0.5) * 10); // ±5 passengers
  const newOccupancy = Math.max(0, Math.min(capacity, currentOccupancy + change));
  
  updates['occupancy'] = {
    current: newOccupancy,
    capacity: capacity
  };
  
  // Update status based on occupancy
  const percentage = (newOccupancy / capacity) * 100;
  if (percentage > 90) {
    updates.status = 'crowded';
  } else if (Math.random() < 0.05) { // 5% chance of delay
    updates.status = 'delayed';
  } else {
    updates.status = 'on-time';
  }
  
  return updates;
};
```

### 5. Crowd Data Simulation

Crowd levels are simulated based on realistic patterns:

```javascript
const simulateCrowdData = (locationId) => {
  const locations = {
    'central-station-platform-a': {
      name: 'Central Station - Platform A',
      coordinates: [-74.0060, 40.7128],
      capacity: 300
    }
    // ... more locations
  };

  // Simulate crowd levels based on time of day
  const hour = new Date().getHours();
  let baseCrowd = 0.3; // 30% base occupancy

  // Rush hour patterns (7-9 AM, 5-7 PM)
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    baseCrowd = 0.8; // 80% during rush hour
  } else if (hour >= 10 && hour <= 16) {
    baseCrowd = 0.5; // 50% during day
  } else if (hour >= 20 || hour <= 6) {
    baseCrowd = 0.2; // 20% during night
  }

  // Add random variation (±30%)
  const variation = (Math.random() - 0.5) * 0.3;
  const finalCrowd = Math.max(0.1, Math.min(1.0, baseCrowd + variation));
  
  const current = Math.floor(location.capacity * finalCrowd);

  return {
    locationId,
    locationName: location.name,
    locationType: 'platform',
    coordinates: { type: 'Point', coordinates: location.coordinates },
    crowdMetrics: {
      current,
      capacity: location.capacity
    },
    predictions: {
      next15min: Math.floor(current * (1 + (Math.random() - 0.5) * 0.2)),
      next30min: Math.floor(current * (1 + (Math.random() - 0.5) * 0.3)),
      next60min: Math.floor(current * (1 + (Math.random() - 0.5) * 0.4))
    }
    // ... more realistic data
  };
};
```

## Data Flow

1. **Frontend Request**: Dashboard requests vehicle data via API
2. **API Route**: `/api/v1/vehicles` endpoint receives request
3. **Mock Model**: `MockVehicle.find()` returns filtered mock data
4. **Real-time Updates**: Background service updates mock data every 10 seconds
5. **WebSocket Broadcast**: Updated data is sent to frontend via Socket.IO
6. **UI Update**: Dashboard displays updated information

## Mock vs Real Database

| Feature | Mock Data | Real Database |
|---------|-----------|---------------|
| **Storage** | In-memory JavaScript arrays | MongoDB collections |
| **Persistence** | Session-only | Permanent |
| **Queries** | JavaScript array methods | MongoDB queries |
| **Real-time** | Simulated updates | Actual sensor data |
| **Performance** | Instant (no network) | Network dependent |

## Benefits of Mock Data

1. **No External Dependencies**: Works without MongoDB, Redis, or other services
2. **Realistic Simulation**: Mimics real transit patterns and behaviors
3. **Immediate Demo**: Full functionality available instantly
4. **Development Speed**: No database setup required
5. **Predictable Data**: Consistent for testing and demos

## Converting to Production

To use real databases in production, simply:

1. Set `MONGODB_URI` environment variable to real MongoDB connection string
2. The system automatically detects and uses real database
3. Replace mock data with actual sensor feeds and APIs
4. All API endpoints and frontend code remain unchanged

## Example API Responses

### Mock Vehicle Data Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "vehicle-1",
      "vehicleId": "BUS-001",
      "type": "bus",
      "route": "Route 42",
      "location": {
        "coordinates": [-74.0060, 40.7128]
      },
      "occupancy": {
        "current": 25,
        "capacity": 50,
        "percentage": 50
      },
      "status": "on-time",
      "lastUpdated": "2025-06-20T03:45:12.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

This mock data system provides a complete, realistic transit management experience without requiring any external infrastructure!