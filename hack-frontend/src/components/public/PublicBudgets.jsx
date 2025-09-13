import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';
import { formatDate, getStatusColor } from '../../utils/helpers';
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

const PublicBudgets = () => {
  const { formatCurrency, currentCurrency, convertFinancialData } = useCurrencyStore();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    financialYear: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 12
  });
  const [categories, setCategories] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchFinancialYears();
  }, [filters, pagination.current]);

  // Listen for currency changes and refresh data
  useEffect(() => {
    const handleCurrencyChange = () => {
      fetchBudgets();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      };
      
      const response = await publicAPI.getPublicBudgets(params);
      
      // Convert financial data to current currency
      const convertedBudgets = await convertFinancialData(response.data.budgets, 'INR');
      setBudgets(convertedBudgets);
      
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        count: response.data.pagination.count,
        totalRecords: response.data.pagination.totalRecords
      }));
    } catch (error) {
      console.error('Error fetching budgets:', error);
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

  const fetchFinancialYears = async () => {
    try {
      const response = await publicAPI.getFinancialYears();
      setFinancialYears(response.data.financialYears);
    } catch (error) {
      console.error('Error fetching financial years:', error);
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
        <h1 className="text-3xl font-bold mb-2">Public Budgets</h1>
        <p className="text-textMuted text-lg">Browse all government budget allocations</p>
      </motion.div>

      {/* Filters */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
            <input
              type="text"
              placeholder="Search budgets..."
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
            value={filters.financialYear}
            onChange={(e) => handleFilterChange('financialYear', e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Years</option>
            {financialYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilters({ search: '', category: '', financialYear: '' });
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            className="px-4 py-2 bg-secondary text-textPrimary rounded-md hover:bg-secondary/80 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </motion.div>

      {/* Budget Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="bg-surface p-6 rounded-lg shadow-sm border border-border animate-pulse" variants={fadeUp}>
              <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-border rounded"></div>
                <div className="h-3 bg-border rounded w-2/3"></div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={staggerContainer} initial="initial" animate="animate">
          {budgets.map((budget, index) => (
            <motion.div key={budget._id} variants={fadeUp}>
              <Link to={`/budgets/${budget._id}`}>
                <div className="bg-surface p-6 rounded-lg shadow-sm border border-border hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-textPrimary line-clamp-2">
                      {budget.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                      {budget.status}
                    </span>
                  </div>

                  <p className="text-textMuted text-sm mb-4 line-clamp-2">
                    {budget.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-textMuted">Total Budget</span>
                      <span className="font-semibold text-textPrimary">
                        {formatCurrency(budget.totalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-textMuted">Spent</span>
                      <span className="font-semibold text-success">
                        {formatCurrency(budget.spentAmount)}
                      </span>
                    </div>

                    <div className="w-full bg-border rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${Math.min(budget.utilizationRate || 0, 100)}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(budget.utilizationRate || 0, 100)}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      ></motion.div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-textMuted">
                        {(budget.utilizationRate || 0).toFixed(1)}% utilized
                      </span>
                      <span className="text-textMuted">
                        {budget.departmentCount} departments
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                      <span className="text-textMuted capitalize">
                        {budget.category}
                      </span>
                      <span className="text-textMuted">
                        {budget.financialYear}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && budgets.length === 0 && (
        <motion.div className="bg-surface p-8 rounded-lg shadow-sm border border-border text-center" variants={fadeUp}>
          <FunnelIcon className="w-12 h-12 text-textMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textPrimary mb-2">No budgets found</h3>
          <p className="text-textMuted">Try adjusting your search criteria</p>
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.total > 1 && (
        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex justify-center items-center space-x-2">
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
        </motion.div>
      )}
    </motion.div>
  );
};

export default PublicBudgets;
