import { logger } from '../utils/logger.js';

// Mock Vehicle model for WebContainer environment
class MockVehicle {
  constructor(data) {
    this._id = data._id || `vehicle-${Date.now()}-${Math.random()}`;
    this.vehicleId = data.vehicleId;
    this.type = data.type;
    this.route = data.route;
    this.location = data.location;
    this.occupancy = data.occupancy;
    this.status = data.status || 'on-time';
    this.speed = data.speed || 0;
    this.heading = data.heading;
    this.nextStop = data.nextStop;
    this.alerts = data.alerts || [];
    this.lastUpdated = data.lastUpdated || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toObject() {
    return { ...this };
  }

  save() {
    this.updatedAt = new Date();
    // In a real implementation, this would save to database
    return Promise.resolve(this);
  }

  static mockData = [
    {
      _id: 'vehicle-1',
      vehicleId: 'BUS-001',
      type: 'bus',
      route: 'Route 42',
      location: { type: 'Point', coordinates: [-74.0060, 40.7128] },
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
    },
    {
      _id: 'vehicle-3',
      vehicleId: 'BUS-002',
      type: 'bus',
      route: 'Route 15',
      location: { type: 'Point', coordinates: [-73.9934, 40.7505] },
      occupancy: { current: 18, capacity: 50, percentage: 36 },
      status: 'delayed',
      speed: 15,
      heading: 270,
      lastUpdated: new Date()
    }
  ];

  static find(filter = {}) {
    let results = this.mockData.map(data => new MockVehicle(data));
    
    // Apply filters
    if (filter.route) {
      results = results.filter(v => v.route === filter.route);
    }
    if (filter.status) {
      results = results.filter(v => v.status === filter.status);
    }
    if (filter.type) {
      results = results.filter(v => v.type === filter.type);
    }

    return {
      sort: (sortObj) => ({
        limit: (limit) => ({
          skip: (skip) => ({
            populate: () => Promise.resolve(results.slice(skip, skip + limit))
          })
        })
      }),
      populate: () => Promise.resolve(results)
    };
  }

  static findOne(filter) {
    const result = this.mockData.find(data => {
      if (filter.vehicleId) return data.vehicleId === filter.vehicleId;
      if (filter._id) return data._id === filter._id;
      return false;
    });
    return {
      populate: () => Promise.resolve(result ? new MockVehicle(result) : null)
    };
  }

  static findOneAndUpdate(filter, update, options = {}) {
    const index = this.mockData.findIndex(data => {
      if (filter.vehicleId) return data.vehicleId === filter.vehicleId;
      if (filter._id) return data._id === filter._id;
      return false;
    });

    if (index !== -1) {
      Object.assign(this.mockData[index], update);
      this.mockData[index].updatedAt = new Date();
      return Promise.resolve(new MockVehicle(this.mockData[index]));
    } else if (options.upsert) {
      const newData = { ...update, _id: `vehicle-${Date.now()}` };
      this.mockData.push(newData);
      return Promise.resolve(new MockVehicle(newData));
    }
    return Promise.resolve(null);
  }

  static findByIdAndUpdate(id, update) {
    return this.findOneAndUpdate({ _id: id }, update);
  }

  static countDocuments(filter = {}) {
    let count = this.mockData.length;
    if (filter.route) {
      count = this.mockData.filter(v => v.route === filter.route).length;
    }
    if (filter.status) {
      count = this.mockData.filter(v => v.status === filter.status).length;
    }
    return Promise.resolve(count);
  }

  static aggregate(pipeline) {
    // Mock aggregation for statistics
    const mockStats = [{
      _id: null,
      totalVehicles: this.mockData.length,
      averageOccupancy: 55,
      onTimeVehicles: this.mockData.filter(v => v.status === 'on-time').length,
      delayedVehicles: this.mockData.filter(v => v.status === 'delayed').length,
      crowdedVehicles: this.mockData.filter(v => v.status === 'crowded').length
    }];
    return Promise.resolve(mockStats);
  }
}

export default MockVehicle;