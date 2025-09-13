import express from 'express';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const router = express.Router();

// Get public dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const { financialYear } = req.query;
    const filter = financialYear ? { financialYear } : {};

    // Get budget overview
    const budgetStats = await Budget.aggregate([
      { $match: { ...filter, status: 'active' } },
      {
        $group: {
          _id: null,
          totalBudgets: { $sum: 1 },
          totalAllocated: { $sum: '$totalAmount' },
          totalSpent: { $sum: '$spentAmount' },
          totalRemaining: { $sum: '$remainingAmount' }
        }
      }
    ]);

    // Get category-wise breakdown
    const categoryBreakdown = await Budget.aggregate([
      { $match: { ...filter, status: 'active' } },
      {
        $group: {
          _id: '$category',
          totalBudget: { $sum: '$totalAmount' },
          totalSpent: { $sum: '$spentAmount' },
          budgetCount: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          totalBudget: 1,
          totalSpent: 1,
          budgetCount: 1,
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalSpent', '$totalBudget'] },
              100
            ]
          }
        }
      }
    ]);

    // Get recent transactions (public ones only)
    const recentTransactions = await Transaction.find({
      isPublic: true,
      status: { $in: ['approved', 'completed'] }
    })
      .populate('budgetId', 'title category')
      .populate('departmentId', 'departmentName departmentCode')
      .sort({ approvedAt: -1 })
      .limit(10)
      .select('transactionId amount description category vendorName approvedAt status');

    // Get department-wise spending
    const departmentSpending = await Transaction.aggregate([
      {
        $match: {
          isPublic: true,
          status: { $in: ['approved', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $group: {
          _id: '$departmentId',
          departmentName: { $first: '$department.departmentName' },
          departmentCode: { $first: '$department.departmentCode' },
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      message: 'Public dashboard data retrieved successfully',
      overview: budgetStats[0] || {
        totalBudgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0
      },
      categoryBreakdown,
      recentTransactions,
      departmentSpending,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Get public dashboard error:', error);
    res.status(500).json({ message: 'Server error retrieving public dashboard data' });
  }
});

// Get all public budgets
router.get('/budgets', async (req, res) => {
  try {
    const {
      financialYear,
      category,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build filter
    const filter = { status: 'active' };
    if (financialYear) filter.financialYear = financialYear;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const budgets = await Budget.find(filter)
      .select('title description totalAmount spentAmount remainingAmount category financialYear departments createdAt')
      .populate('departments.departmentId', 'departmentName departmentCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(filter);

    // Calculate utilization rates
    const budgetsWithStats = budgets.map(budget => ({
      ...budget.toObject(),
      utilizationRate: budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0,
      departmentCount: budget.departments.length
    }));

    res.json({
      message: 'Public budgets retrieved successfully',
      budgets: budgetsWithStats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: budgets.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get public budgets error:', error);
    res.status(500).json({ message: 'Server error retrieving public budgets' });
  }
});

// Get budget details with transactions
router.get('/budgets/:budgetId', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.budgetId,
      status: 'active'
    })
      .populate('departments.departmentId', 'departmentName departmentCode')
      .select('-createdBy -approvedBy');

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found or not public' });
    }

    // Get public transactions for this budget
    const transactions = await Transaction.find({
      budgetId: budget._id,
      isPublic: true,
      status: { $in: ['approved', 'completed'] }
    })
      .populate('departmentId', 'departmentName departmentCode')
      .select('transactionId amount description category vendorName invoiceDate approvedAt status priority')
      .sort({ approvedAt: -1 });

    // Calculate department-wise spending for this budget
    const departmentSpending = budget.departments.map(dept => {
      const deptTransactions = transactions.filter(
        t => t.departmentId._id.toString() === dept.departmentId._id.toString()
      );
      
      return {
        departmentId: dept.departmentId._id,
        departmentName: dept.departmentId.departmentName,
        departmentCode: dept.departmentId.departmentCode,
        allocatedAmount: dept.allocatedAmount,
        spentAmount: dept.spentAmount,
        remainingAmount: dept.allocatedAmount - dept.spentAmount,
        utilizationRate: dept.allocatedAmount > 0 ? (dept.spentAmount / dept.allocatedAmount) * 100 : 0,
        transactionCount: deptTransactions.length
      };
    });

    res.json({
      message: 'Budget details retrieved successfully',
      budget: {
        ...budget.toObject(),
        utilizationRate: budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0
      },
      transactions,
      departmentSpending
    });

  } catch (error) {
    console.error('Get budget details error:', error);
    res.status(500).json({ message: 'Server error retrieving budget details' });
  }
});

// Get public transactions with filters
router.get('/transactions', async (req, res) => {
  try {
    const {
      budgetId,
      departmentId,
      category,
      page = 1,
      limit = 20,
      search,
      minAmount,
      maxAmount
    } = req.query;

    // Build filter
    const filter = {
      isPublic: true,
      status: { $in: ['approved', 'completed'] }
    };

    if (budgetId) filter.budgetId = budgetId;
    if (departmentId) filter.departmentId = departmentId;
    if (category) filter.category = category;
    if (minAmount) filter.amount = { $gte: parseFloat(minAmount) };
    if (maxAmount) filter.amount = { ...filter.amount, $lte: parseFloat(maxAmount) };
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('budgetId', 'title category financialYear')
      .populate('departmentId', 'departmentName departmentCode')
      .select('transactionId amount description category vendorName invoiceDate approvedAt completedAt status priority')
      .sort({ approvedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      message: 'Public transactions retrieved successfully',
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: transactions.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get public transactions error:', error);
    res.status(500).json({ message: 'Server error retrieving public transactions' });
  }
});

// Get available financial years
router.get('/financial-years', async (req, res) => {
  try {
    const financialYears = await Budget.distinct('financialYear', { status: 'active' });
    
    res.json({
      message: 'Financial years retrieved successfully',
      financialYears: financialYears.sort().reverse() // Latest first
    });

  } catch (error) {
    console.error('Get financial years error:', error);
    res.status(500).json({ message: 'Server error retrieving financial years' });
  }
});

// Get available categories
router.get('/categories', async (req, res) => {
  try {
    const budgetCategories = await Budget.distinct('category', { status: 'active' });
    const transactionCategories = await Transaction.distinct('category', { isPublic: true });
    
    const allCategories = [...new Set([...budgetCategories, ...transactionCategories])];
    
    res.json({
      message: 'Categories retrieved successfully',
      categories: allCategories.sort()
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error retrieving categories' });
  }
});

// Get departments list (public info only)
router.get('/departments', async (req, res) => {
  try {
    const departments = await User.find({
      role: 'department',
      isApproved: true
    })
      .select('departmentName departmentCode')
      .sort({ departmentName: 1 });

    res.json({
      message: 'Departments retrieved successfully',
      departments
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error retrieving departments' });
  }
});

// Search across budgets and transactions
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = { $regex: q.trim(), $options: 'i' };
    const results = {};

    if (type === 'all' || type === 'budgets') {
      results.budgets = await Budget.find({
        status: 'active',
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      })
        .select('title description category financialYear totalAmount spentAmount')
        .limit(10);
    }

    if (type === 'all' || type === 'transactions') {
      results.transactions = await Transaction.find({
        isPublic: true,
        status: { $in: ['approved', 'completed'] },
        $or: [
          { description: searchRegex },
          { vendorName: searchRegex },
          { transactionId: searchRegex }
        ]
      })
        .populate('budgetId', 'title')
        .populate('departmentId', 'departmentName')
        .select('transactionId amount description vendorName category approvedAt')
        .limit(10);
    }

    res.json({
      message: 'Search completed successfully',
      query: q,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

export default router;
