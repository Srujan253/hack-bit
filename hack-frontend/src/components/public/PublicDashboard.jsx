import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

const PublicDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchFinancialYears();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = selectedYear ? { financialYear: selectedYear } : {};
      const response = await publicAPI.getDashboard(params);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialYears = async () => {
    try {
      const response = await publicAPI.getFinancialYears();
      setFinancialYears(response.data.financialYears);
    } catch (error) {
      console.error('Error fetching financial years:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { overview, categoryBreakdown, recentTransactions, departmentSpending } = dashboardData || {};

  return (
    <motion.div className="space-y-8" initial="initial" animate="animate" exit="exit" variants={fadeUp}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-8 text-textPrimary">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Transparent Fund Tracking Platform
            </h1>
            <p className="text-textMuted text-lg">
              Real-time visibility into government budget allocation and spending
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-surface text-textPrimary px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-primary"
            >
              <option value="">All Years</option>
              {financialYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-success/20 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textMuted">Total Budget</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(overview?.totalAllocated || 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-primary/20 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textMuted">Total Spent</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(overview?.totalSpent || 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-accent/20 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-accent" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textMuted">Remaining</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(overview?.totalRemaining || 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-secondary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textMuted">Active Budgets</p>
              <p className="text-2xl font-bold text-textPrimary">
                {overview?.totalBudgets || 0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={fadeUp}>
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Budget by Category</h3>
          <div className="space-y-4">
            {categoryBreakdown?.map((category, index) => {
              const utilizationRate = category.utilizationRate || 0;
              return (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-textPrimary capitalize">
                      {category.category}
                    </span>
                    <span className="text-sm text-textMuted">
                      {formatCurrency(category.totalBudget)}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-textMuted">
                    <span>Spent: {formatCurrency(category.totalSpent)}</span>
                    <span>{utilizationRate.toFixed(1)}% utilized</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Top Spending Departments</h3>
          <div className="space-y-4">
            {departmentSpending?.slice(0, 5).map((dept, index) => (
              <div key={dept._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-textMuted">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textPrimary">
                      {dept.departmentName}
                    </p>
                    <p className="text-xs text-textMuted">
                      {dept.departmentCode} • {dept.transactionCount} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-textPrimary">
                    {formatCurrency(dept.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div className="bg-surface rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <div className="px-6 py-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-textPrimary">Recent Transactions</h3>
            <Link
              to="/transactions"
              className="text-primary hover:text-primary text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {recentTransactions?.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-surface">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-textPrimary">
                        {transaction.transactionId}
                      </div>
                      <div className="text-sm text-textMuted truncate max-w-xs">
                        {transaction.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-textPrimary">
                      {transaction.departmentId?.departmentName}
                    </div>
                    <div className="text-sm text-textMuted">
                      {transaction.departmentId?.departmentCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                    {formatDate(transaction.approvedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-success/20 text-success'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Explore More</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/budgets"
            className="flex items-center p-4 border border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
          >
            <CurrencyDollarIcon className="w-8 h-8 text-primary" />
            <div className="ml-3">
              <p className="text-sm font-medium text-textPrimary">View All Budgets</p>
              <p className="text-sm text-textMuted">Browse budget allocations</p>
            </div>
          </Link>

          <Link
            to="/transactions"
            className="flex items-center p-4 border border-border rounded-lg hover:border-success hover:bg-surface transition-colors"
          >
            <DocumentTextIcon className="w-8 h-8 text-success" />
            <div className="ml-3">
              <p className="text-sm font-medium text-textPrimary">View Transactions</p>
              <p className="text-sm text-textMuted">Track all expenses</p>
            </div>
          </Link>

          <Link
            to="/login"
            className="flex items-center p-4 border border-border rounded-lg hover:border-secondary hover:bg-surface transition-colors"
          >
            <BuildingOfficeIcon className="w-8 h-8 text-secondary" />
            <div className="ml-3">
              <p className="text-sm font-medium text-textPrimary">Department Login</p>
              <p className="text-sm text-textMuted">Access your dashboard</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PublicDashboard;
