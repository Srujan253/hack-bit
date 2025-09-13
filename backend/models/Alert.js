import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['budget_overrun', 'approaching_limit', 'unusual_spending', 'high_frequency_transactions'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  threshold: {
    percentage: Number,
    amount: Number
  },
  currentValues: {
    spentAmount: Number,
    allocatedAmount: Number,
    utilizationPercentage: Number
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedAt: Date,
  metadata: {
    triggerCondition: String,
    previousAlerts: Number,
    relatedTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
  }
}, {
  timestamps: true
});

// Index for efficient querying
alertSchema.index({ budgetId: 1, status: 1 });
alertSchema.index({ departmentId: 1, status: 1 });
alertSchema.index({ type: 1, severity: 1 });
alertSchema.index({ createdAt: -1 });

// Virtual for time since creation
alertSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

export default mongoose.model('Alert', alertSchema);
