import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { transactionAPI, departmentAPI } from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SubmitExpense = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      budgetId: '',
      amount: '',
      description: '',
      category: 'equipment',
      vendorName: '',
      vendorContact: '',
      invoiceNumber: '',
      priority: 'medium',
      invoiceDate: ''
    }
  });

  useEffect(() => {
    fetchAvailableBudgets();
  }, []);

  const fetchAvailableBudgets = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getMyBudgets();
      console.log('Budgets response:', response.data);
      const departmentBudgets = response.data.budgets || [];
      
      // Filter only active budgets with remaining allocation
      const availableBudgets = departmentBudgets.filter(budget => 
        budget.status === 'active' && 
        budget.myAllocation && 
        budget.myAllocation.remaining > 0
      );
      
      setBudgets(availableBudgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load available budgets');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await transactionAPI.submitTransaction({
        ...data,
        amount: parseFloat(data.amount)
      });
      toast.success('Expense request submitted successfully');
      reset();
      navigate('/department/transactions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit expense request');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBudget = budgets.find(b => b._id === watch('budgetId'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/department/transactions')}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Expense Request</h1>
          <p className="text-gray-600">Create a new expense request for approval</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Budget Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget <span className="text-red-500">*</span>
              </label>
              <select
                {...register('budgetId', { required: 'Please select a budget' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={loading}
              >
                <option value="">Select Budget</option>
                {budgets.map(budget => (
                  <option key={budget._id} value={budget._id}>
                    {budget.title} ({budget.category})
                  </option>
                ))}
              </select>
              {errors.budgetId && (
                <p className="mt-1 text-sm text-red-600">{errors.budgetId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Budget Info */}
          {selectedBudget && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Selected Budget Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Total Budget:</span>
                  <span className="ml-2 text-blue-900">₹{selectedBudget.totalAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Allocated:</span>
                  <span className="ml-2 text-blue-900">₹{selectedBudget.myAllocation?.allocated?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Remaining:</span>
                  <span className="ml-2 text-blue-900">₹{selectedBudget.myAllocation?.remaining?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Provide a detailed description of the expense..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="equipment">Equipment</option>
                <option value="supplies">Supplies</option>
                <option value="services">Services</option>
                <option value="maintenance">Maintenance</option>
                <option value="salary">Salary</option>
                <option value="travel">Travel</option>
                <option value="utilities">Utilities</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Vendor Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('vendorName', { required: 'Vendor name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter vendor name"
                />
                {errors.vendorName && (
                  <p className="mt-1 text-sm text-red-600">{errors.vendorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Contact</label>
                <input
                  type="text"
                  {...register('vendorContact')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Phone number or email"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('invoiceNumber', { required: 'Invoice number is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter invoice/bill number"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('invoiceDate', { required: 'Invoice date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {errors.invoiceDate && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceDate.message}</p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate('/department/transactions')}
              className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Expense Request'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SubmitExpense;
