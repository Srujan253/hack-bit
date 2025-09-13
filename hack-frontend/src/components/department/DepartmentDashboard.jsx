import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { transactionAPI, budgetAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const DepartmentDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalBudget: 0,
    spentAmount: 0,
    pendingRequests: 0,
    approvedRequests: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch transactions for stats and recent list
      const transactionsResponse = await transactionAPI.getTransactions({ limit: 5 });
      const transactions = transactionsResponse.data.transactions;
      setRecentTransactions(transactions);

      // Calculate stats from transactions
      const pendingCount = transactions.filter(t => t.status === 'pending').length;
      const approvedCount = transactions.filter(t => t.status === 'approved').length;
      const spentTotal = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      // Fetch budgets allocated to this department
      const budgetsResponse = await budgetAPI.getBudgets();
      const departmentBudgets = budgetsResponse.data.budgets.filter(budget =>
        budget.departmentAllocations?.some(alloc =>
          alloc.departmentId === user.departmentId
        )
      );
      setBudgets(departmentBudgets);

      const totalBudget = departmentBudgets.reduce((sum, budget) => {
        const allocation = budget.departmentAllocations?.find(alloc =>
          alloc.departmentId === user.departmentId
        );
        return sum + (allocation?.allocatedAmount || 0);
      }, 0);

      setStats({
        totalBudget,
        spentAmount: spentTotal,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" exit="exit" variants={fadeUp}>
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-primary to-secondary rounded-lg p-8 text-textPrimary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold mb-2">Department Dashboard</h1>
        <p className="text-textMuted text-lg">Welcome back, {user?.departmentName}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Total Budget Allocated</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Amount Spent</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(stats.spentAmount)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Pending Requests</p>
              <p className="text-2xl font-bold text-textPrimary">
                {stats.pendingRequests}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Approved Requests</p>
              <p className="text-2xl font-bold text-textPrimary">
                {stats.approvedRequests}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Budget Overview */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Budget Allocations</h3>
        {budgets.length === 0 ? (
          <p className="text-textMuted">No budget allocations found for your department.</p>
        ) : (
          <motion.div className="space-y-4" variants={staggerContainer} initial="initial" animate="animate">
            {budgets.map((budget, index) => {
              const allocation = budget.departmentAllocations?.find(alloc =>
                alloc.departmentId === user.departmentId
              );
              const allocatedAmount = allocation?.allocatedAmount || 0;
              const spentPercentage = allocatedAmount > 0 ? (stats.spentAmount / allocatedAmount) * 100 : 0;

              return (
                <motion.div key={budget._id} className="border border-border rounded-lg p-4" variants={fadeUp}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-textPrimary">{budget.title}</h4>
                      <p className="text-sm text-textMuted">{budget.category} • {budget.financialYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-textMuted">Allocated</p>
                      <p className="font-semibold text-textPrimary">{formatCurrency(allocatedAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-textMuted mb-1">
                      <span>Spent: {formatCurrency(stats.spentAmount)}</span>
                      <span>{spentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          spentPercentage > 90 ? 'bg-red-500' :
                          spentPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div className="bg-surface rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <div className="px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-textPrimary">Recent Transactions</h3>
            <a href="/department/transactions" className="text-primary hover:text-primary text-sm font-medium">
              View All →
            </a>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 text-center text-textMuted">
            No recent transactions found.
          </div>
        ) : (
          <motion.div className="p-6 space-y-3" variants={staggerContainer} initial="initial" animate="animate">
            {recentTransactions.map((transaction, index) => (
              <motion.div key={transaction._id} className="flex items-center justify-between p-3 border border-border rounded-lg" variants={fadeUp}>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-textPrimary">{transaction.transactionId}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-sm text-textMuted mt-1">{transaction.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-textMuted">{formatDate(transaction.requestedAt)}</span>
                    <span className="font-semibold text-textPrimary">{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Quick Actions</h3>
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={staggerContainer} initial="initial" animate="animate">
          <motion.div variants={fadeUp}>
            <a
              href="/department/transactions/new"
              className="flex items-center p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
            >
              <DocumentTextIcon className="w-8 h-8 text-textMuted" />
              <div className="ml-3">
                <p className="font-medium text-textPrimary">Submit Expense Request</p>
                <p className="text-sm text-textMuted">Create a new expense request for approval</p>
              </div>
            </a>
          </motion.div>

          <motion.div variants={fadeUp}>
            <a
              href="/department/budgets"
              className="flex items-center p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
            >
              <CurrencyDollarIcon className="w-8 h-8 text-textMuted" />
              <div className="ml-3">
                <p className="font-medium text-textPrimary">View Budget Details</p>
                <p className="text-sm text-textMuted">Check allocated budgets and spending</p>
              </div>
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default DepartmentDashboard;
