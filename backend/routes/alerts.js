import express from 'express';
import Alert from '../models/Alert.js';
import anomalyDetectionService from '../services/anomalyDetection.js';
import { verifyToken, verifyAdmin, verifyAdminOrDepartment } from '../middleware/auth.js';

const router = express.Router();

// Get all alerts with filters (Admin and Department)
router.get('/', verifyToken, verifyAdminOrDepartment, async (req, res) => {
  try {
    const {
      type,
      severity,
      status = 'active',
      budgetId,
      departmentId,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (budgetId) filter.budgetId = budgetId;
    
    // Department users can only see their own alerts
    if (req.user.role === 'department') {
      filter.departmentId = req.user._id;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    const skip = (page - 1) * limit;

    const alerts = await Alert.find(filter)
      .populate('budgetId', 'title category financialYear')
      .populate('departmentId', 'departmentName departmentCode email')
      .populate('transactionId', 'transactionId amount description')
      .populate('acknowledgedBy', 'email role')
      .sort({ severity: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(filter);

    res.json({
      message: 'Alerts retrieved successfully',
      alerts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: alerts.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error retrieving alerts' });
  }
});

// Get alert statistics (Admin only)
router.get('/statistics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const stats = await anomalyDetectionService.getAlertStatistics(timeframe);
    
    // Get summary counts
    const summary = await Alert.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityCounts = await Alert.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      message: 'Alert statistics retrieved successfully',
      detailed: stats,
      summary: summary.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      severityBreakdown: severityCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get alert statistics error:', error);
    res.status(500).json({ message: 'Server error retrieving alert statistics' });
  }
});

// Run anomaly detection manually (Admin only)
router.post('/detect', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { budgetId, departmentId } = req.body;
    
    console.log('Manual anomaly detection triggered by:', req.user.email);
    const results = await anomalyDetectionService.detectAnomalies(budgetId, departmentId);
    
    res.json({
      message: 'Anomaly detection completed successfully',
      results
    });

  } catch (error) {
    console.error('Manual anomaly detection error:', error);
    res.status(500).json({ message: 'Server error running anomaly detection' });
  }
});

// Acknowledge an alert
router.put('/:alertId/acknowledge', verifyToken, verifyAdminOrDepartment, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Department users can only acknowledge their own alerts
    if (req.user.role === 'department' && alert.departmentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this alert' });
    }

    const updatedAlert = await anomalyDetectionService.acknowledgeAlert(alertId, req.user._id);
    
    res.json({
      message: 'Alert acknowledged successfully',
      alert: updatedAlert
    });

  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ message: 'Server error acknowledging alert' });
  }
});

// Resolve an alert (Admin only)
router.put('/:alertId/resolve', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { comments } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        'metadata.resolutionComments': comments
      },
      { new: true }
    ).populate([
      { path: 'budgetId', select: 'title category' },
      { path: 'departmentId', select: 'departmentName departmentCode' }
    ]);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json({
      message: 'Alert resolved successfully',
      alert
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ message: 'Server error resolving alert' });
  }
});

// Dismiss an alert (Admin only)
router.put('/:alertId/dismiss', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { reason } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        status: 'dismissed',
        'metadata.dismissalReason': reason
      },
      { new: true }
    ).populate([
      { path: 'budgetId', select: 'title category' },
      { path: 'departmentId', select: 'departmentName departmentCode' }
    ]);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json({
      message: 'Alert dismissed successfully',
      alert
    });

  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({ message: 'Server error dismissing alert' });
  }
});

// Get alert details by ID
router.get('/:alertId', verifyToken, verifyAdminOrDepartment, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await Alert.findById(alertId)
      .populate('budgetId', 'title category financialYear totalAmount')
      .populate('departmentId', 'departmentName departmentCode email')
      .populate('transactionId', 'transactionId amount description vendorName')
      .populate('acknowledgedBy', 'email role')
      .populate('metadata.relatedTransactions', 'transactionId amount description createdAt');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Department users can only view their own alerts
    if (req.user.role === 'department' && alert.departmentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this alert' });
    }
    
    res.json({
      message: 'Alert details retrieved successfully',
      alert
    });

  } catch (error) {
    console.error('Get alert details error:', error);
    res.status(500).json({ message: 'Server error retrieving alert details' });
  }
});

export default router;
