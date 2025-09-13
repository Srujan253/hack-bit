import express from 'express';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { verifyToken, verifyAdmin, verifyAdminOrDepartment } from '../middleware/auth.js';

const router = express.Router();

// Create new budget (Admin only)
router.post('/create', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      totalAmount,
      financialYear,
      category
    } = req.body;

    // Validate required fields
    if (!title || !description || !totalAmount || !financialYear || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate financial year format
    const fyRegex = /^\d{4}-\d{4}$/;
    if (!fyRegex.test(financialYear)) {
      return res.status(400).json({ message: 'Financial year must be in format YYYY-YYYY' });
    }

    const budget = new Budget({
      title,
      description,
      totalAmount,
      financialYear,
      category,
      createdBy: req.user._id,
      status: 'active'
    });

    await budget.save();
    await budget.populate('createdBy', 'email role');

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });

  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error creating budget' });
  }
});

// Get all budgets with filters
router.get('/list', async (req, res) => {
  try {
    const {
      financialYear,
      category,
      status,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    if (financialYear) filter.financialYear = financialYear;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const budgets = await Budget.find(filter)
      .populate('createdBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('departments.departmentId', 'departmentName departmentCode email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(filter);

    res.json({
      message: 'Budgets retrieved successfully',
      budgets,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: budgets.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error retrieving budgets' });
  }
});

// Get budget by ID
router.get('/:budgetId', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId)
      .populate('createdBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('departments.departmentId', 'departmentName departmentCode email');

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Get related transactions
    const transactions = await Transaction.find({ budgetId: budget._id })
      .populate('departmentId', 'departmentName departmentCode')
      .populate('requestedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Budget retrieved successfully',
      budget,
      transactions
    });

  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error retrieving budget' });
  }
});

// Allocate budget to department (Admin only)
router.post('/:budgetId/allocate', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { departmentId, allocatedAmount } = req.body;

    if (!departmentId || !allocatedAmount) {
      return res.status(400).json({ message: 'Department ID and allocated amount are required' });
    }

    const budget = await Budget.findById(req.params.budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const department = await User.findOne({ _id: departmentId, role: 'department' });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if budget can accommodate this allocation
    if (!budget.canAllocate(allocatedAmount)) {
      return res.status(400).json({ 
        message: 'Insufficient budget. Cannot allocate more than available amount.',
        available: budget.totalAmount - budget.getTotalAllocated()
      });
    }

    // Check if department already has allocation
    const existingAllocation = budget.departments.find(
      dept => dept.departmentId.toString() === departmentId
    );

    if (existingAllocation) {
      existingAllocation.allocatedAmount += allocatedAmount;
    } else {
      budget.departments.push({
        departmentId,
        departmentName: department.departmentName,
        allocatedAmount,
        spentAmount: 0
      });
    }

    budget.allocatedAmount = budget.getTotalAllocated();
    await budget.save();

    res.json({
      message: 'Budget allocated successfully',
      budget,
      allocation: {
        departmentId,
        departmentName: department.departmentName,
        allocatedAmount
      }
    });

  } catch (error) {
    console.error('Allocate budget error:', error);
    res.status(500).json({ message: 'Server error allocating budget' });
  }
});

// Get department's allocated budgets
router.get('/department/my-budgets', verifyToken, verifyAdminOrDepartment, async (req, res) => {
  try {
    let departmentId;
    
    if (req.user.role === 'department') {
      departmentId = req.user._id;
    } else {
      // Admin can specify department ID
      departmentId = req.query.departmentId || req.user._id;
    }

    const budgets = await Budget.find({
      'departments.departmentId': departmentId
    }).populate('createdBy', 'email role');

    // Filter to show only relevant department data
    const departmentBudgets = budgets.map(budget => {
      const deptAllocation = budget.departments.find(
        dept => dept.departmentId.toString() === departmentId.toString()
      );

      return {
        _id: budget._id,
        title: budget.title,
        description: budget.description,
        category: budget.category,
        financialYear: budget.financialYear,
        status: budget.status,
        totalAmount: budget.totalAmount,
        allocatedToMe: deptAllocation?.allocatedAmount || 0,
        spentByMe: deptAllocation?.spentAmount || 0,
        remainingForMe: (deptAllocation?.allocatedAmount || 0) - (deptAllocation?.spentAmount || 0),
        createdAt: budget.createdAt
      };
    });

    res.json({
      message: 'Department budgets retrieved successfully',
      budgets: departmentBudgets
    });

  } catch (error) {
    console.error('Get department budgets error:', error);
    res.status(500).json({ message: 'Server error retrieving department budgets' });
  }
});

// Update budget (Admin only)
router.put('/:budgetId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, description, totalAmount, category, status } = req.body;

    const budget = await Budget.findById(req.params.budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check if new total amount is sufficient for existing allocations
    if (totalAmount && totalAmount < budget.getTotalAllocated()) {
      return res.status(400).json({
        message: 'Total amount cannot be less than already allocated amount',
        currentAllocated: budget.getTotalAllocated()
      });
    }

    // Update fields
    if (title) budget.title = title;
    if (description) budget.description = description;
    if (totalAmount) budget.totalAmount = totalAmount;
    if (category) budget.category = category;
    if (status) budget.status = status;

    await budget.save();

    res.json({
      message: 'Budget updated successfully',
      budget
    });

  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error updating budget' });
  }
});

// Delete budget (Admin only)
router.delete('/:budgetId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check if there are any transactions associated with this budget
    const transactionCount = await Transaction.countDocuments({ budgetId: budget._id });
    if (transactionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete budget with existing transactions',
        transactionCount
      });
    }

    await Budget.findByIdAndDelete(req.params.budgetId);

    res.json({
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error deleting budget' });
  }
});

// Get budget statistics (Admin only)
router.get('/admin/statistics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { financialYear } = req.query;
    const filter = financialYear ? { financialYear } : {};

    const stats = await Budget.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBudgets: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' },
          avgBudgetSize: { $avg: '$totalAmount' }
        }
      }
    ]);

    const categoryStats = await Budget.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalSpent: { $sum: '$spentAmount' }
        }
      }
    ]);

    const statusStats = await Budget.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      message: 'Budget statistics retrieved successfully',
      overall: stats[0] || {
        totalBudgets: 0,
        totalAmount: 0,
        totalAllocated: 0,
        totalSpent: 0,
        avgBudgetSize: 0
      },
      byCategory: categoryStats,
      byStatus: statusStats
    });

  } catch (error) {
    console.error('Get budget statistics error:', error);
    res.status(500).json({ message: 'Server error retrieving statistics' });
  }
});

export default router;
