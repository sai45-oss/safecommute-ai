import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bus', 'train', 'metro', 'tram'],
    required: true,
    index: true
  },
  color: {
    type: String,
    default: '#0066CC'
  },
  stops: [{
    stopId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    estimatedTime: Number, // minutes from start
    facilities: [String] // wheelchair, elevator, etc.
  }],
  schedule: {
    weekday: {
      firstDeparture: String, // HH:MM format
      lastDeparture: String,
      frequency: Number, // minutes between services
      peakFrequency: Number
    },
    weekend: {
      firstDeparture: String,
      lastDeparture: String,
      frequency: Number
    }
  },
  performance: {
    onTimePerformance: {
      type: Number,
      min: 0,
      max: 100,
      default: 90
    },
    averageDelay: {
      type: Number,
      default: 0
    },
    reliability: {
      type: Number,
      min: 0,
      max: 100,
      default: 95
    }
  },
  capacity: {
    vehicleCapacity: {
      type: Number,
      required: true
    },
    peakHourCapacity: Number,
    averageOccupancy: {
      type: Number,
      min: 0,
      max: 100,
      default: 60
    }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'maintenance', 'limited'],
    default: 'active',
    index: true
  },
  alerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }]
}, {
  timestamps: true
});

// Indexes for performance
routeSchema.index({ type: 1, status: 1 });
routeSchema.index({ 'stops.coordinates': '2dsphere' });

// Method to get next scheduled departure
routeSchema.methods.getNextDeparture = function(fromStopId) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  const schedule = isWeekend ? this.schedule.weekend : this.schedule.weekday;
  const frequency = schedule.frequency;
  
  // Find the stop
  const stop = this.stops.find(s => s.stopId === fromStopId);
  if (!stop) return null;
  
  // Calculate next departure time
  const stopTime = currentTime + stop.estimatedTime;
  const nextDeparture = Math.ceil(stopTime / frequency) * frequency;
  
  return new Date(now.getTime() + (nextDeparture - currentTime) * 60000);
};

export default mongoose.model('Route', routeSchema);