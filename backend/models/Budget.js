import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  allocatedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: function() {
      return this.totalAmount - this.spentAmount;
    }
  },
  financialYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/ // Format: 2024-2025
  },
  category: {
    type: String,
    required: true,
    enum: ['infrastructure', 'education', 'healthcare', 'welfare', 'development', 'administration', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'suspended'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  departments: [{
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    departmentName: String,
    allocatedAmount: {
      type: Number,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  blockchainHash: {
    type: String // For blockchain integration
  }
}, {
  timestamps: true
});

// Update remaining amount before saving
budgetSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.spentAmount;
  next();
});

// Calculate total allocated to departments
budgetSchema.methods.getTotalAllocated = function() {
  return this.departments.reduce((total, dept) => total + dept.allocatedAmount, 0);
};

// Check if budget can accommodate new allocation
budgetSchema.methods.canAllocate = function(amount) {
  const currentAllocated = this.getTotalAllocated();
  return (currentAllocated + amount) <= this.totalAmount;
};

export default mongoose.model('Budget', budgetSchema);
