import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{12}$/.test(v); // 12 digit Aadhaar number
      },
      message: 'Aadhaar number must be 12 digits'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Invalid email address']
  },
  role: {
    type: String,
    enum: ['admin', 'department'],
    required: true
  },
  departmentName: {
    type: String,
    required: function() {
      return this.role === 'department';
    }
  },
  departmentCode: {
    type: String,
    required: function() {
      return this.role === 'department';
    },
    uppercase: true
  },
  password: {
    type: String,
    required: function() {
      return this.role === 'admin' || this.role === 'department';
    },
    minlength: 6
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  preferredCurrency: {
    type: String,
    enum: ['INR', 'USD'],
    default: 'INR'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  otpCode: {
    type: String
  },
  otpExpiry: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving (for admin users)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP for Aadhaar verification
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  this.otpCode = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(otp) {
  return this.otpCode === otp && this.otpExpiry > new Date();
};

export default mongoose.model('User', userSchema);
