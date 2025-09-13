import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { transactionAPI, budgetAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

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

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
      red: 'bg-red-500 text-red-600 bg-red-50'
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color].split(' ')[2]}`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[1]}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.departmentName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            title="Total Budget Allocated"
            value={formatCurrency(stats.totalBudget)}
            icon={CurrencyDollarIcon}
            color="blue"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatCard
            title="Amount Spent"
            value={formatCurrency(stats.spentAmount)}
            icon={CheckCircleIcon}
            color="green"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={ClockIcon}
            color="yellow"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <StatCard
            title="Approved Requests"
            value={stats.approvedRequests}
            icon={DocumentTextIcon}
            color="green"
          />
        </motion.div>
      </div>

      {/* Budget Overview */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Allocations</h3>
        {budgets.length === 0 ? (
          <p className="text-gray-500">No budget allocations found for your department.</p>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const allocation = budget.departmentAllocations?.find(alloc =>
                alloc.departmentId === user.departmentId
              );
              const allocatedAmount = allocation?.allocatedAmount || 0;
              const spentPercentage = allocatedAmount > 0 ? (stats.spentAmount / allocatedAmount) * 100 : 0;

              return (
                <div key={budget._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{budget.title}</h4>
                      <p className="text-sm text-gray-500">{budget.category} • {budget.financialYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Allocated</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(allocatedAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Spent: {formatCurrency(stats.spentAmount)}</span>
                      <span>{spentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          spentPercentage > 90 ? 'bg-red-500' :
                          spentPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <a href="/department/transactions" className="text-red-600 hover:text-red-700 text-sm font-medium">
            View All
          </a>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-gray-500">No recent transactions found.</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{transaction.transactionId}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{transaction.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">{formatDate(transaction.requestedAt)}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/department/transactions/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            <div className="ml-3">
              <p className="font-medium text-gray-900">Submit Expense Request</p>
              <p className="text-sm text-gray-500">Create a new expense request for approval</p>
            </div>
          </a>

          <a
            href="/department/budgets"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <CurrencyDollarIcon className="w-8 h-8 text-gray-400" />
            <div className="ml-3">
              <p className="font-medium text-gray-900">View Budget Details</p>
              <p className="text-sm text-gray-500">Check allocated budgets and spending</p>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default DepartmentDashboard;
