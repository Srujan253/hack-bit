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
  // Smart contract integration fields
  smartContractId: {
    type: Number,
    default: null
  },
  blockchainTxHash: {
    type: String,
    default: null
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
    departmentCode: String,
    allocatedAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingAmount: {
      type: Number,
      default: function() {
        return this.allocatedAmount - this.spentAmount;
      }
    },
    transactions: [{
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      },
      amount: Number,
      description: String,
      approvedAt: Date,
      blockchainHash: String
    }],
    allocationHistory: [{
      amount: Number,
      allocatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      allocatedAt: {
        type: Date,
        default: Date.now
      },
      blockchainHash: String
    }]
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
budgetSchema.methods.canAllocate = function(amount, departmentId = null) {
  const currentAllocated = this.getTotalAllocated();
  
  // If allocating to an existing department, don't count their current allocation
  if (departmentId) {
    const existingDept = this.departments.find(d => d.departmentId.toString() === departmentId.toString());
    const existingAllocation = existingDept ? existingDept.allocatedAmount : 0;
    return (currentAllocated - existingAllocation + amount) <= this.totalAmount;
  }
  
  return (currentAllocated + amount) <= this.totalAmount;
};

// Get available funds for a department (considering pending transactions)
budgetSchema.methods.getAvailableFunds = function(departmentId) {
  const department = this.departments.find(d => d.departmentId.toString() === departmentId.toString());
  
  if (!department) {
    return 0;
  }
  
  // For now, just return the current remaining amount
  // TODO: Add pending transaction consideration later if needed
  const currentRemaining = department.allocatedAmount - department.spentAmount;
  
  return Math.max(0, currentRemaining);
};

// Allocate funds to a department
budgetSchema.methods.allocateToDepartment = function(departmentId, departmentName, departmentCode, amount, allocatedBy) {
  const existingDept = this.departments.find(d => d.departmentId.toString() === departmentId.toString());
  
  if (existingDept) {
    existingDept.allocatedAmount += amount;
    existingDept.remainingAmount = existingDept.allocatedAmount - existingDept.spentAmount;
    existingDept.allocationHistory.push({
      amount,
      allocatedBy,
      allocatedAt: new Date()
    });
  } else {
    this.departments.push({
      departmentId,
      departmentName,
      departmentCode,
      allocatedAmount: amount,
      spentAmount: 0,
      remainingAmount: amount,
      transactions: [],
      allocationHistory: [{
        amount,
        allocatedBy,
        allocatedAt: new Date()
      }]
    });
  }
  
  this.allocatedAmount = this.getTotalAllocated();
  return this;
};

// Deduct funds from department when expense is approved
budgetSchema.methods.deductFromDepartment = function(departmentId, transactionId, amount, description) {
  const department = this.departments.find(d => d.departmentId.toString() === departmentId.toString());
  
  if (!department) {
    throw new Error('Department not found in budget');
  }
  
  // Calculate current remaining amount
  const currentRemaining = department.allocatedAmount - department.spentAmount;
  
  if (currentRemaining < amount) {
    throw new Error(`Insufficient funds in department allocation. Available: ₹${currentRemaining.toLocaleString()}, Requested: ₹${amount.toLocaleString()}`);
  }
  
  department.spentAmount += amount;
  department.remainingAmount = department.allocatedAmount - department.spentAmount;
  department.transactions.push({
    transactionId,
    amount,
    description,
    approvedAt: new Date()
  });
  
  this.spentAmount += amount;
  this.remainingAmount = this.totalAmount - this.spentAmount;
  
  return this;
};

export default mongoose.model('Budget', budgetSchema);
