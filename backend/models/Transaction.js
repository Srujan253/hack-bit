import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    }
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['equipment', 'supplies', 'services', 'maintenance', 'salary', 'travel', 'utilities', 'other']
  },
  vendorName: {
    type: String,
    required: true,
    trim: true
  },
  vendorContact: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  blockchainHash: {
    type: String // Hash of the transaction stored on blockchain
  },
  blockchainTxId: {
    type: String // Blockchain transaction ID
  },
  isPublic: {
    type: Boolean,
    default: true // Whether this transaction is visible on public dashboard
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ budgetId: 1, departmentId: 1 });
transactionSchema.index({ status: 1, requestedAt: -1 });
transactionSchema.index({ transactionId: 1 });

// Virtual for calculating processing time
transactionSchema.virtual('processingTime').get(function() {
  if (this.approvedAt && this.requestedAt) {
    return Math.ceil((this.approvedAt - this.requestedAt) / (1000 * 60 * 60 * 24)); // Days
  }
  return null;
});

// Method to approve transaction
transactionSchema.methods.approve = function(adminId, comments) {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (comments) this.reviewComments = comments;
};

// Method to reject transaction
transactionSchema.methods.reject = function(adminId, comments) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.reviewComments = comments || 'Request rejected';
};

export default mongoose.model('Transaction', transactionSchema);
