import mongoose from 'mongoose';

const crowdDataSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    index: true
  },
  locationName: {
    type: String,
    required: true
  },
  locationType: {
    type: String,
    enum: ['station', 'platform', 'vehicle', 'stop'],
    required: true,
    index: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  crowdMetrics: {
    current: {
      type: Number,
      required: true,
      min: 0
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    density: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true
    }
  },
  predictions: {
    next15min: Number,
    next30min: Number,
    next60min: Number,
    peakTime: Date,
    peakCapacity: Number
  },
  trends: {
    direction: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable']
    },
    rate: Number, // people per minute
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  riskAssessment: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      index: true
    },
    factors: [String],
    recommendations: [String]
  },
  dataSource: {
    type: String,
    enum: ['camera', 'sensor', 'manual', 'estimated'],
    default: 'camera'
  },
  quality: {
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.9
    },
    lastCalibration: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
crowdDataSchema.index({ locationId: 1, createdAt: -1 });
crowdDataSchema.index({ 'crowdMetrics.percentage': 1 });
crowdDataSchema.index({ 'riskAssessment.level': 1 });

// Pre-save middleware to calculate derived fields
crowdDataSchema.pre('save', function(next) {
  // Calculate percentage
  if (this.crowdMetrics.current !== undefined && this.crowdMetrics.capacity) {
    this.crowdMetrics.percentage = Math.round((this.crowdMetrics.current / this.crowdMetrics.capacity) * 100);
  }

  // Determine density level
  const percentage = this.crowdMetrics.percentage;
  if (percentage < 30) {
    this.crowdMetrics.density = 'low';
  } else if (percentage < 60) {
    this.crowdMetrics.density = 'medium';
  } else if (percentage < 85) {
    this.crowdMetrics.density = 'high';
  } else {
    this.crowdMetrics.density = 'critical';
  }

  // Set risk level based on density and other factors
  if (this.crowdMetrics.density === 'critical') {
    this.riskAssessment.level = 'critical';
  } else if (this.crowdMetrics.density === 'high') {
    this.riskAssessment.level = 'high';
  } else if (this.crowdMetrics.density === 'medium') {
    this.riskAssessment.level = 'medium';
  } else {
    this.riskAssessment.level = 'low';
  }

  next();
});

export default mongoose.model('CrowdData', crowdDataSchema);