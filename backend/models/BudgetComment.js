import mongoose from 'mongoose';

const budgetCommentSchema = new mongoose.Schema({
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['comment', 'suggestion', 'question'],
    default: 'comment'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false // Comments need approval before being public
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  moderationReason: {
    type: String,
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  replies: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    isOfficial: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
budgetCommentSchema.index({ budgetId: 1, isApproved: 1, createdAt: -1 });
budgetCommentSchema.index({ email: 1 });

// Method to approve comment
budgetCommentSchema.methods.approve = function(moderatorId, reason) {
  this.isApproved = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  if (reason) this.moderationReason = reason;
};

// Method to reject comment
budgetCommentSchema.methods.reject = function(moderatorId, reason) {
  this.isApproved = false;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason || 'Comment rejected by moderator';
};

// Method to add reply
budgetCommentSchema.methods.addReply = function(name, email, message, isOfficial = false) {
  this.replies.push({
    name,
    email,
    message,
    isOfficial,
    createdAt: new Date()
  });
};

export default mongoose.model('BudgetComment', budgetCommentSchema);
