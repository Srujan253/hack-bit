import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { budgetAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const DepartmentBudgets = () => {
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    financialYear: ''
  });

  useEffect(() => {
    fetchBudgets();
  }, [filters]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getBudgets(filters);
      
      // Filter budgets that have allocations for this department
      const departmentBudgets = response.data.budgets.filter(budget => 
        budget.departmentAllocations?.some(alloc => 
          alloc.departmentId === user.departmentId
        )
      );
      
      setBudgets(departmentBudgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const BudgetCard = ({ budget }) => {
    const allocation = budget.departmentAllocations?.find(alloc => 
      alloc.departmentId === user.departmentId
    );
    const allocatedAmount = allocation?.allocatedAmount || 0;
    const spentAmount = allocation?.spentAmount || 0;
    const remainingAmount = allocatedAmount - spentAmount;
    const spentPercentage = allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{budget.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{budget.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {budget.category}
              </motion.span>
              <span className="text-xs text-gray-500">{budget.financialYear}</span>
            </div>
          </div>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}
          >
            {budget.status}
          </motion.span>
        </div>

        <div className="space-y-4">
          {/* Budget Amounts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Allocated</p>
              <p className="text-lg font-semibold text-blue-600">{formatCurrency(allocatedAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(spentAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(remainingAmount)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Budget Utilization</span>
              <span>{spentPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  spentPercentage > 90 ? 'bg-red-500' : 
                  spentPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Budget Details */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Budget:</span>
                <span className="ml-2 font-medium">{formatCurrency(budget.totalAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{formatDate(budget.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Budget Overview</h1>
        <p className="text-gray-600">View your department's budget allocations and spending</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="welfare">Welfare</option>
            <option value="development">Development</option>
            <option value="administration">Administration</option>
            <option value="other">Other</option>
          </select>
          
          <input
            type="text"
            placeholder="Financial Year (e.g., 2024-2025)"
            value={filters.financialYear}
            onChange={(e) => setFilters({...filters, financialYear: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </motion.div>

      {/* Budget Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : budgets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
        >
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Allocations</h3>
          <p className="text-gray-500">
            {filters.search || filters.category || filters.financialYear
              ? 'No budgets found matching your search criteria.'
              : 'Your department has no budget allocations yet.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {budgets.map((budget) => (
              <motion.div
                key={budget._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <BudgetCard budget={budget} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Summary Stats */}
      {budgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Allocated</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  budgets.reduce((sum, budget) => {
                    const allocation = budget.departmentAllocations?.find(alloc => 
                      alloc.departmentId === user.departmentId
                    );
                    return sum + (allocation?.allocatedAmount || 0);
                  }, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  budgets.reduce((sum, budget) => {
                    const allocation = budget.departmentAllocations?.find(alloc => 
                      alloc.departmentId === user.departmentId
                    );
                    return sum + (allocation?.spentAmount || 0);
                  }, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  budgets.reduce((sum, budget) => {
                    const allocation = budget.departmentAllocations?.find(alloc => 
                      alloc.departmentId === user.departmentId
                    );
                    const allocated = allocation?.allocatedAmount || 0;
                    const spent = allocation?.spentAmount || 0;
                    return sum + (allocated - spent);
                  }, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Active Budgets</p>
              <p className="text-2xl font-bold text-red-600">
                {budgets.filter(b => b.status === 'active').length}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DepartmentBudgets;
