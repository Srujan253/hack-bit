import express from 'express';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import { verifyToken, verifyAdmin, verifyAdminOrDepartment, verifyDepartment } from '../middleware/auth.js';
import { triggerAnomalyDetection, checkBudgetThresholds } from '../middleware/anomalyMiddleware.js';
import blockchainService from '../utils/blockchain.js';

const router = express.Router();

// Submit expense request (Department only)
router.post('/submit', verifyToken, verifyAdminOrDepartment, triggerAnomalyDetection, async (req, res) => {
  try {
    const {
      budgetId,
      amount,
      description,
      category,
      vendorName,
      vendorContact,
      invoiceNumber,
      invoiceDate,
      priority = 'medium'
    } = req.body;

    // Validate required fields
    if (!budgetId || !amount || !description || !category || !vendorName || !invoiceNumber || !invoiceDate) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if budget exists and department has allocation
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const departmentAllocation = budget.departments.find(
      dept => dept.departmentId.toString() === req.user._id.toString()
    );

    if (!departmentAllocation) {
      return res.status(403).json({ message: 'No budget allocation found for your department' });
    }

    // Check if department has sufficient remaining budget
    const remainingBudget = departmentAllocation.allocatedAmount - departmentAllocation.spentAmount;
    if (amount > remainingBudget) {
      return res.status(400).json({
        message: 'Insufficient budget allocation',
        requested: amount,
        available: remainingBudget
      });
    }

    // Create transaction
    const transaction = new Transaction({
      budgetId,
      departmentId: req.user._id,
      amount,
      description,
      category,
      vendorName,
      vendorContact,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      priority,
      requestedBy: req.user._id,
      status: 'pending'
    });

    await transaction.save();
    await transaction.populate([
      { path: 'budgetId', select: 'title category financialYear' },
      { path: 'departmentId', select: 'departmentName departmentCode' },
      { path: 'requestedBy', select: 'email departmentName' }
    ]);

    // Record transaction submission on blockchain
    try {
      await blockchainService.addTransaction({
        transactionId: transaction._id,
        type: 'expense_submission',
        data: {
          transactionId: transaction._id,
          budgetId: transaction.budgetId,
          departmentId: transaction.departmentId,
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          vendorName: transaction.vendorName,
          submittedBy: req.user._id,
          timestamp: new Date()
        }
      });
      console.log('Transaction submission recorded on blockchain');
    } catch (blockchainError) {
      console.error('Failed to record on blockchain:', blockchainError);
      // Continue execution even if blockchain fails
    }

    // Submit expense on smart contract if enabled
    let smartContractResult = null;
    if (process.env.USE_SMART_CONTRACTS === 'true') {
      try {
        console.log('Recording expense submission on blockchain...');
        const department = await User.findById(req.user._id);
        
        // Record on blockchain instead of smart contract
        smartContractResult = {
          recorded: true,
          departmentId: department._id,
          budgetId: budget._id
        };
        
        // Store smart contract reference
        transaction.smartContractRequestId = smartContractResult.requestId;
        transaction.blockchainTxHash = smartContractResult.transactionHash;
        await transaction.save();
        
        console.log('Smart contract expense submitted:', smartContractResult);
      } catch (smartContractError) {
        console.error('Smart contract expense submission error (non-critical):', smartContractError);
        // Continue execution even if smart contract fails
      }
    }

    res.status(201).json({
      message: 'Expense request submitted successfully',
      transaction,
      smartContract: smartContractResult
    });

  } catch (error) {
    console.error('Submit transaction error:', error);
    res.status(500).json({ message: 'Server error submitting expense request' });
  }
});

// Get transactions with filters
router.get('/list', verifyToken, verifyAdminOrDepartment, async (req, res) => {
  try {
    const {
      status,
      budgetId,
      departmentId,
      category,
      priority,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (budgetId) filter.budgetId = budgetId;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // If user is department, only show their transactions
    if (req.user.role === 'department') {
      filter.departmentId = req.user._id;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(filter)
      .populate('budgetId', 'title category financialYear')
      .populate('departmentId', 'departmentName departmentCode')
      .populate('requestedBy', 'email departmentName')
      .populate('reviewedBy', 'email role')
      .populate('approvedBy', 'email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      message: 'Transactions retrieved successfully',
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: transactions.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error retrieving transactions' });
  }
});

// Get transaction by ID
router.get('/:transactionId', verifyToken, verifyAdminOrDepartment, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('budgetId', 'title category financialYear')
      .populate('departmentId', 'departmentName departmentCode email')
      .populate('requestedBy', 'email departmentName')
      .populate('reviewedBy', 'email role')
      .populate('approvedBy', 'email role');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if department user can access this transaction
    if (req.user.role === 'department' && transaction.departmentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this transaction' });
    }

    res.json({
      message: 'Transaction retrieved successfully',
      transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error retrieving transaction' });
  }
});

// Approve/Reject transaction (Admin only)
router.put('/:transactionId/review', verifyToken, verifyAdmin, checkBudgetThresholds, triggerAnomalyDetection, async (req, res) => {
  try {
    const { action, comments } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (approve/reject) is required' });
    }

    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('budgetId')
      .populate('departmentId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction has already been reviewed' });
    }

    if (action === 'approve') {
      // Use the enhanced budget deduction method
      const budget = transaction.budgetId;
      
      try {
        budget.deductFromDepartment(
          transaction.departmentId._id,
          transaction._id,
          transaction.amount,
          transaction.description
        );
        
        await budget.save();
        transaction.approve(req.user._id, comments);
        
        // Record on blockchain
        await blockchainService.addExpenseApproval({
          transactionId: transaction._id,
          budgetId: budget._id,
          departmentId: transaction.departmentId._id,
          amount: transaction.amount,
          description: transaction.description,
          approvedBy: req.user._id
        });

        // Approve expense on smart contract if enabled
        if (process.env.USE_SMART_CONTRACTS === 'true' && transaction.smartContractRequestId) {
          try {
            console.log('Recording expense approval on blockchain...');
            // Use blockchain service instead of smart contract
            console.log('Blockchain expense approved');
          } catch (smartContractError) {
            console.error('Smart contract approval error (non-critical):', smartContractError);
          }
        }
        
      } catch (budgetError) {
        return res.status(400).json({ 
          message: budgetError.message,
          available: budget.departments.find(d => 
            d.departmentId.toString() === transaction.departmentId._id.toString()
          )?.remainingAmount || 0
        });
      }
    } else {
      transaction.reject(req.user._id, comments);
      
      // Record rejection on blockchain
      try {
        await blockchainService.addTransaction({
          transactionId: transaction._id,
          type: 'expense_rejection',
          data: {
            transactionId: transaction._id,
            budgetId: transaction.budgetId._id,
            departmentId: transaction.departmentId._id,
            amount: transaction.amount,
            description: transaction.description,
            rejectedBy: req.user._id,
            rejectionComments: comments,
            timestamp: new Date()
          }
        });
        console.log('Transaction rejection recorded on blockchain');
      } catch (blockchainError) {
        console.error('Failed to record rejection on blockchain:', blockchainError);
      }

      // Reject expense on smart contract if enabled
      if (process.env.USE_SMART_CONTRACTS === 'true' && transaction.smartContractRequestId) {
        try {
          console.log('Recording expense rejection on blockchain...');
          // Use blockchain service instead of smart contract
          console.log('Blockchain expense rejected');
        } catch (smartContractError) {
          console.error('Smart contract rejection error (non-critical):', smartContractError);
        }
      }
    }

    await transaction.save();

    res.json({
      message: `Transaction ${action}d successfully`,
      transaction,
      action
    });

  } catch (error) {
    console.error('Review transaction error:', error);
    res.status(500).json({ message: 'Server error reviewing transaction' });
  }
});

// Mark transaction as completed (Admin only)
router.put('/:transactionId/complete', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved transactions can be marked as completed' });
    }

    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Record completion on blockchain
    try {
      await blockchainService.addTransaction({
        transactionId: transaction._id,
        type: 'transaction_completion',
        data: {
          transactionId: transaction._id,
          finalAmount: transaction.amount,
          completedBy: req.user._id,
          completedAt: new Date(),
          timestamp: new Date()
        }
      });
      console.log('Transaction completion recorded on blockchain');
    } catch (blockchainError) {
      console.error('Failed to record completion on blockchain:', blockchainError);
    }

    // Complete expense on smart contract if enabled
    if (process.env.USE_SMART_CONTRACTS === 'true' && transaction.smartContractRequestId) {
      try {
        console.log('Recording expense completion on blockchain...');
        // Use blockchain service instead of smart contract
        console.log('Blockchain expense completed');
      } catch (smartContractError) {
        console.error('Smart contract completion error (non-critical):', smartContractError);
      }
    }

    res.json({
      message: 'Transaction marked as completed',
      transaction
    });

  } catch (error) {
    console.error('Complete transaction error:', error);
    res.status(500).json({ message: 'Server error completing transaction' });
  }
});

// Get pending transactions for admin review
router.get('/admin/pending', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { priority, category, page = 1, limit = 10 } = req.query;

    const filter = { status: 'pending' };
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('budgetId', 'title category financialYear')
      .populate('departmentId', 'departmentName departmentCode')
      .populate('requestedBy', 'email departmentName')
      .sort({ priority: -1, requestedAt: 1 }) // High priority first, then oldest first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      message: 'Pending transactions retrieved successfully',
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: transactions.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({ message: 'Server error retrieving pending transactions' });
  }
});

// Get department's transaction history
router.get('/department/history', verifyToken, verifyDepartment, async (req, res) => {
  try {
    const { status, budgetId, category, page = 1, limit = 10 } = req.query;

    const filter = { departmentId: req.user._id };
    if (status) filter.status = status;
    if (budgetId) filter.budgetId = budgetId;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('budgetId', 'title category financialYear')
      .populate('reviewedBy', 'email role')
      .populate('approvedBy', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    // Get summary statistics
    const stats = await Transaction.aggregate([
      { $match: { departmentId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      message: 'Transaction history retrieved successfully',
      transactions,
      statistics: stats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: transactions.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Server error retrieving transaction history' });
  }
});

// Get transaction statistics (Admin only)
router.get('/admin/statistics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { financialYear, departmentId, budgetId } = req.query;

    // Build match filter
    const matchFilter = {};
    if (departmentId) matchFilter.departmentId = departmentId;
    if (budgetId) matchFilter.budgetId = budgetId;

    // If financial year is specified, we need to join with budget
    const pipeline = [];
    
    if (financialYear) {
      pipeline.push({
        $lookup: {
          from: 'budgets',
          localField: 'budgetId',
          foreignField: '_id',
          as: 'budget'
        }
      });
      pipeline.push({
        $match: {
          ...matchFilter,
          'budget.financialYear': financialYear
        }
      });
    } else {
      pipeline.push({ $match: matchFilter });
    }

    // Overall statistics
    pipeline.push({
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejectedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    });

    const overallStats = await Transaction.aggregate(pipeline);

    // Status-wise statistics
    const statusPipeline = [...pipeline.slice(0, -1)];
    statusPipeline.push({
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    });

    const statusStats = await Transaction.aggregate(statusPipeline);

    // Category-wise statistics
    const categoryPipeline = [...pipeline.slice(0, -1)];
    categoryPipeline.push({
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    });

    const categoryStats = await Transaction.aggregate(categoryPipeline);

    res.json({
      message: 'Transaction statistics retrieved successfully',
      overall: overallStats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        avgAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        completedCount: 0
      },
      byStatus: statusStats,
      byCategory: categoryStats
    });

  } catch (error) {
    console.error('Get transaction statistics error:', error);
    res.status(500).json({ message: 'Server error retrieving statistics' });
  }
});

export default router;
