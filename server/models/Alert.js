import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['emergency', 'warning', 'info', 'maintenance'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  location: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
    stopId: String,
    routeId: String
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'cancelled'],
    default: 'active',
    index: true
  },
  affectedServices: [{
    vehicleId: String,
    route: String,
    impact: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'severe']
    }
  }],
  affectedPassengers: {
    estimated: {
      type: Number,
      default: 0,
      min: 0
    },
    confirmed: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  responseTeam: {
    assigned: {
      type: Boolean,
      default: false
    },
    teamId: String,
    estimatedResponse: Date
  },
  resolution: {
    resolvedAt: Date,
    resolvedBy: String,
    resolution: String,
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['automated', 'manual', 'passenger-report', 'sensor'],
      default: 'automated'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes for performance
alertSchema.index({ status: 1, type: 1 });
alertSchema.index({ 'location.coordinates': '2dsphere' });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });

// Virtual for alert age
alertSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to check if alert is stale
alertSchema.methods.isStale = function() {
  const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
  return this.age > staleThreshold && this.status === 'active';
};

export default mongoose.model('Alert', alertSchema);