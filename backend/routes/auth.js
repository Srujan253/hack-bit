import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, simulateAadhaarOTP, validateAadhaar, verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Department Signup with Password
router.post('/department/signup', async (req, res) => {
  try {
    const { aadhaarNumber, email, departmentName, departmentCode, password } = req.body;

    // Validate input
    if (!aadhaarNumber || !email || !departmentName || !departmentCode || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateAadhaar(aadhaarNumber)) {
      return res.status(400).json({ message: 'Invalid Aadhaar number format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ aadhaarNumber }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this Aadhaar number or email already exists' });
    }

    // Create new department user (pending approval)
    const newUser = new User({
      aadhaarNumber,
      email,
      password,
      role: 'department',
      departmentName,
      departmentCode: departmentCode.toUpperCase(),
      isApproved: false
    });

    await newUser.save();

    res.status(201).json({
      message: 'Department signup successful. Please wait for admin approval.',
      userId: newUser._id
    });

  } catch (error) {
    console.error('Department signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Verify OTP for department signup
router.post('/department/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verification
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      message: 'OTP verified successfully. Your account is pending admin approval.',
      verified: true
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Department Login with Password
router.post('/department/login', async (req, res) => {
  try {
    const { aadhaarNumber, password } = req.body;

    if (!aadhaarNumber || !password) {
      return res.status(400).json({ message: 'Aadhaar number and password are required' });
    }

    if (!validateAadhaar(aadhaarNumber)) {
      return res.status(400).json({ message: 'Invalid Aadhaar number format' });
    }

    // Find user by Aadhaar number
    const user = await User.findOne({ aadhaarNumber, role: 'department' });
    if (!user) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved yet. Please contact admin.' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        aadhaarNumber: user.aadhaarNumber,
        email: user.email,
        role: user.role,
        departmentName: user.departmentName,
        departmentCode: user.departmentCode,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Department login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify OTP for department login
router.post('/department/verify-login-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'department') {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update last login and clear OTP
    user.lastLogin = new Date();
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        aadhaarNumber: user.aadhaarNumber,
        email: user.email,
        role: user.role,
        departmentName: user.departmentName,
        departmentCode: user.departmentCode,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({ message: 'Server error during login verification' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin user
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = generateToken(admin._id, admin.role);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Get pending department approvals (Admin only)
router.get('/admin/pending-approvals', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: 'department',
      isApproved: false
    }).select('-password -otpCode -otpExpiry');

    res.json({
      message: 'Pending approvals retrieved successfully',
      data: pendingUsers
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error retrieving pending approvals' });
  }
});

// Approve/Reject department signup (Admin only)
router.put('/admin/approve-department/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (approve/reject) is required' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'department') {
      return res.status(404).json({ message: 'Department user not found' });
    }

    if (action === 'approve') {
      user.isApproved = true;
      user.approvedBy = req.user._id;
      user.approvedAt = new Date();
    } else {
      // For rejection, we might want to delete the user or mark as rejected
      await User.findByIdAndDelete(userId);
      return res.json({
        message: 'Department signup rejected and removed',
        action: 'rejected'
      });
    }

    await user.save();

    res.json({
      message: `Department ${action}d successfully`,
      action,
      user: {
        id: user._id,
        departmentName: user.departmentName,
        departmentCode: user.departmentCode,
        email: user.email,
        isApproved: user.isApproved,
        approvedAt: user.approvedAt
      }
    });

  } catch (error) {
    console.error('Approve department error:', error);
    res.status(500).json({ message: 'Server error during approval process' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otpCode -otpExpiry');
    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Logout (client-side token removal, but we can track last activity)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

export default router;
