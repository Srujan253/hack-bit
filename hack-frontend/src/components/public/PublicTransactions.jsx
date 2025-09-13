import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
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

const PublicTransactions = () => {
  const { formatCurrency, convertFinancialData } = useCurrencyStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    departmentId: '',
    minAmount: '',
    maxAmount: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 20
  });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchTransactions();
    // Listen for currency changes
    const handleCurrencyChange = () => {
      fetchTransactions();
    };
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, [filters, pagination.current]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      };
      const response = await publicAPI.getTransactions({ ...filters, ...params });
      const transactionData = response.data.transactions || [];
      // Convert transaction data to current currency
      const convertedTransactions = transactionData.map(transaction => 
        convertFinancialData(transaction, 'INR')
      );
      setTransactions(convertedTransactions);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        count: response.data.pagination.count,
        totalRecords: response.data.pagination.totalRecords
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await publicAPI.getDepartments();
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" exit="exit" variants={fadeUp}>
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-primary to-secondary rounded-lg p-8 text-textPrimary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold mb-2">Public Transactions</h1>
        <p className="text-textMuted text-lg">View all approved government transactions</p>
      </motion.div>

      {/* Filters */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category} className="capitalize">
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.departmentId}
            onChange={(e) => handleFilterChange('departmentId', e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>
                {dept.departmentName} ({dept.departmentCode})
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Amount"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          />

          <input
            type="number"
            placeholder="Max Amount"
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilters({ search: '', category: '', departmentId: '', minAmount: '', maxAmount: '' });
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            className="px-4 py-2 bg-secondary text-textPrimary rounded-md hover:bg-secondary/80 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div className="bg-surface rounded-lg shadow-sm border border-border" variants={fadeUp}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-textMuted">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <FunnelIcon className="w-12 h-12 text-textMuted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-textPrimary mb-2">No transactions found</h3>
            <p className="text-textMuted">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <motion.tbody className="bg-surface divide-y divide-border" variants={staggerContainer} initial="initial" animate="animate">
                {transactions.map((transaction, index) => (
                  <motion.tr key={transaction._id} className="hover:bg-surface" variants={fadeUp}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {transaction.transactionId}
                    </td>
                    <td className="px-6 py-4 text-sm text-textPrimary">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                      <div>
                        <div className="font-medium">{transaction.departmentId?.departmentName}</div>
                        <div className="text-textMuted">{transaction.departmentId?.departmentCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-textPrimary">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted capitalize">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                      {transaction.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {formatDate(transaction.approvedAt || transaction.completedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                        {transaction.priority}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex justify-between items-center">
            <div className="text-sm text-textPrimary">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.current * pagination.limit, pagination.totalRecords)} of{' '}
              {pagination.totalRecords} transactions
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 bg-secondary text-textPrimary rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(Math.min(5, pagination.total))].map((_, i) => {
                const page = Math.max(1, pagination.current - 2) + i;
                if (page > pagination.total) return null;
                const isActive = page === pagination.current;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md ${
                      isActive
                        ? 'bg-primary text-textPrimary'
                        : 'bg-secondary text-textPrimary hover:bg-secondary/80'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-1 bg-secondary text-textPrimary rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PublicTransactions;
