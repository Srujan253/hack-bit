import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminAPI, publicAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const BudgetAllocation = () => {
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [allocationForm, setAllocationForm] = useState({
    departmentId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchDepartments();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await adminAPI.getBudgets({ status: 'active' });
      setBudgets(response.data.budgets);
    } catch (error) {
      toast.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await publicAPI.getDepartments();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments([]);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedBudget || !allocationForm.departmentId || !allocationForm.amount) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setAllocating(true);
      await adminAPI.allocateBudget(selectedBudget._id, {
        departmentId: allocationForm.departmentId,
        allocatedAmount: parseFloat(allocationForm.amount)
      });

      toast.success('Budget allocated successfully!');
      setAllocationForm({ departmentId: '', amount: '' });
      fetchBudgets(); // Refresh budgets
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to allocate budget');
    } finally {
      setAllocating(false);
    }
  };

  const getAvailableAmount = (budget) => {
    const totalAllocated = budget.departments?.reduce((sum, dept) => sum + dept.allocatedAmount, 0) || 0;
    return budget.totalAmount - totalAllocated;
  };

  const getUtilizationRate = (budget) => {
    if (budget.totalAmount === 0) return 0;
    const totalAllocated = budget.departments?.reduce((sum, dept) => sum + dept.allocatedAmount, 0) || 0;
    return (totalAllocated / budget.totalAmount) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-textPrimary mb-2">Budget Allocation</h1>
        <p className="text-textMuted">Allocate budget funds to departments step by step</p>
      </div>

      {/* Budget Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Available Budgets</h2>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <motion.div
                key={budget._id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedBudget?._id === budget._id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
                onClick={() => setSelectedBudget(budget)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-textPrimary">{budget.title}</h3>
                    <p className="text-sm text-textMuted mb-2">{budget.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-textMuted">
                        Category: <span className="capitalize font-medium">{budget.category}</span>
                      </span>
                      <span className="text-textMuted">
                        FY: <span className="font-medium">{budget.financialYear}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-textPrimary">
                      {formatCurrency(budget.totalAmount)}
                    </div>
                    <div className="text-sm text-textMuted">
                      Available: {formatCurrency(getAvailableAmount(budget))}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-textMuted mb-1">
                    <span>Allocation Progress</span>
                    <span>{getUtilizationRate(budget).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(getUtilizationRate(budget), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Department Allocations */}
                {budget.departments && budget.departments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-textMuted mb-2">Current Allocations:</div>
                    <div className="space-y-1">
                      {budget.departments.map((dept, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-textPrimary">{dept.departmentName}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-textMuted">
                              {formatCurrency(dept.allocatedAmount)}
                            </span>
                            <span className="text-success">
                              Spent: {formatCurrency(dept.spentAmount || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Allocation Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface p-6 rounded-lg shadow-sm border border-border sticky top-6">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">Allocate Funds</h2>
            
            {selectedBudget ? (
              <form onSubmit={handleAllocate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Selected Budget
                  </label>
                  <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                    <div className="font-medium text-textPrimary">{selectedBudget.title}</div>
                    <div className="text-sm text-textMuted">
                      Available: {formatCurrency(getAvailableAmount(selectedBudget))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Department
                  </label>
                  <select
                    value={allocationForm.departmentId}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.departmentName} ({dept.departmentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Allocation Amount
                  </label>
                  <input
                    type="number"
                    value={allocationForm.amount}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter amount"
                    min="1"
                    max={getAvailableAmount(selectedBudget)}
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={allocating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-textPrimary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {allocating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-textPrimary"></div>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      <span>Allocate Funds</span>
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="w-12 h-12 text-textMuted mx-auto mb-3" />
                <p className="text-textMuted">Select a budget to allocate funds</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetAllocation;
