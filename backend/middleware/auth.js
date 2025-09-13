import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // Only check approval for departments accessing protected resources
    // Admins are always approved, departments can access basic endpoints even if not approved

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Verify admin role
export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin verification.' });
  }
};

// Verify department role
export const verifyDepartment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'department') {
      return res.status(403).json({ message: 'Department access required.' });
    }

    // Check if department is approved
    if (!req.user.isApproved) {
      return res.status(403).json({ message: 'Department not approved yet. Please wait for admin approval.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in department verification.' });
  }
};

// Verify either admin or department role
export const verifyAdminOrDepartment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'department') {
      return res.status(403).json({ message: 'Admin or Department access required.' });
    }

    // For departments, check if they are approved
    if (req.user.role === 'department' && !req.user.isApproved) {
      return res.status(403).json({ message: 'Department not approved yet. Please wait for admin approval.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in role verification.' });
  }
};

// Generate JWT token
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Simulate Aadhaar OTP verification
export const simulateAadhaarOTP = (aadhaarNumber) => {
  // In real implementation, this would call UIDAI API
  // For simulation, we'll generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  console.log(`[AADHAAR SIMULATION] OTP for ${aadhaarNumber}: ${otp}`);
  
  return {
    success: true,
    otp: otp,
    message: 'OTP sent successfully'
  };
};

// Validate Aadhaar number format
export const validateAadhaar = (aadhaarNumber) => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaarNumber);
};
