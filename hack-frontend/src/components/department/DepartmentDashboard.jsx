import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CurrencyDollarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { departmentAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import useCurrencyStore from '../../store/currencyStore';

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
  const navigate = useNavigate();
  const { formatCurrency, convertFinancialData } = useCurrencyStore();
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
    
    // Listen for currency changes
    const handleCurrencyChange = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if department is approved
      if (!user?.isApproved) {
        console.log('Department not approved yet');
        setBudgets([]);
        setRecentTransactions([]);
        setStats({
          totalBudget: 0,
          spentAmount: 0,
          pendingRequests: 0,
          approvedRequests: 0
        });
        return;
      }
      
      // Fetch department's allocated budgets
      const budgetsResponse = await departmentAPI.getMyBudgets();
      console.log('Budgets API Response:', budgetsResponse.data);
      const departmentBudgets = budgetsResponse.data.budgets || [];
      console.log('Department Budgets:', departmentBudgets);
      
      // Convert budget data to current currency
      const convertedBudgets = departmentBudgets.map(budget => 
        convertFinancialData(budget, 'INR')
      );
      setBudgets(convertedBudgets);

      // Fetch transaction history
      const transactionsResponse = await departmentAPI.getTransactionHistory({ limit: 5 });
      const transactions = transactionsResponse.data.transactions || [];
      
      // Convert transaction data to current currency
      const convertedTransactions = transactions.map(transaction => 
        convertFinancialData(transaction, 'INR')
      );
      setRecentTransactions(convertedTransactions);

      // Calculate stats from converted budgets and transactions
      const totalBudget = convertedBudgets.reduce((sum, budget) => 
        sum + (budget.myAllocation?.allocated || 0), 0);
      
      const totalSpent = convertedBudgets.reduce((sum, budget) => 
        sum + (budget.myAllocation?.spent || 0), 0);

      const pendingCount = convertedTransactions.filter(t => t.status === 'pending').length;
      const approvedCount = convertedTransactions.filter(t => t.status === 'approved' || t.status === 'completed').length;

      setStats({
        totalBudget,
        spentAmount: totalSpent,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

      {/* Budget Allocations */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-surface rounded-lg shadow-sm border border-border p-6"
      >
        <h3 className="text-lg font-semibold text-textPrimary mb-4">My Budget Allocations</h3>
        {!user?.isApproved ? (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-textMuted">Your department is pending admin approval.</p>
            <p className="text-sm text-textMuted mt-1">Once approved, you'll be able to see budget allocations here.</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8">
            <CurrencyDollarIcon className="w-12 h-12 text-textMuted mx-auto mb-3" />
            <p className="text-textMuted">No budget allocations found for your department.</p>
            <p className="text-sm text-textMuted mt-1">Contact admin to get budget allocated.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const allocation = budget.myAllocation;
              const allocatedAmount = allocation?.allocated || 0;
              const spentAmount = allocation?.spent || 0;
              const remainingAmount = allocation?.remaining || 0;
              const utilizationRate = parseFloat(allocation?.utilizationRate) || 0;

              return (
                <motion.div 
                  key={budget._id} 
                  whileHover={{ scale: 1.02 }}
                  className="border border-border rounded-lg p-4 bg-background hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-textPrimary">{budget.title}</h4>
                      <p className="text-sm text-textMuted capitalize">
                        {budget.category} • {budget.financialYear}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-textMuted">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        budget.status === 'active' ? 'bg-success/20 text-success' : 'bg-textMuted/20 text-textMuted'
                      }`}>
                        {budget.status}
                      </span>
                    </div>
                  </div>

                  {/* Budget Breakdown */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-textMuted">Allocated</p>
                      <p className="font-semibold text-primary">{formatCurrency(allocatedAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-textMuted">Spent</p>
                      <p className="font-semibold text-success">{formatCurrency(spentAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-textMuted">Remaining</p>
                      <p className="font-semibold text-accent">{formatCurrency(remainingAmount)}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-textMuted mb-1">
                      <span>Utilization Progress</span>
                      <span>{utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          utilizationRate > 90 ? 'bg-error' : 
                          utilizationRate > 75 ? 'bg-accent' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Allocation History */}
                  {allocation?.allocationHistory && allocation.allocationHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-textMuted mb-2">Allocation History:</p>
                      <div className="space-y-1">
                        {allocation.allocationHistory.slice(0, 2).map((history, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-textMuted">
                              {formatDate(history.allocatedAt)}
                            </span>
                            <span className="text-primary font-medium">
                              +{formatCurrency(history.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
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
      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/department/submit-expense')}
            className="flex items-center p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
          >
            <DocumentTextIcon className="w-8 h-8 text-textMuted" />
            <div className="ml-3">
              <p className="font-medium text-textPrimary">Submit Expense Request</p>
              <p className="text-sm text-textMuted">Create a new expense request for approval</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/department/budgets')}
            className="flex items-center p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
          >
            <CurrencyDollarIcon className="w-8 h-8 text-textMuted" />
            <div className="ml-3">
              <p className="font-medium text-textPrimary">View Budget Details</p>
              <p className="text-sm text-textMuted">Check allocated budgets and spending</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DepartmentDashboard;
