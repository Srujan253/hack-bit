import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { transactionAPI } from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import Icon from '../common/Icon';

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
      expectedDate: ''
    }
  });

  useEffect(() => {
    fetchAvailableBudgets();
  }, []);

  const fetchAvailableBudgets = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAvailableBudgets();
      setBudgets(response.data.budgets);
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
      await transactionAPI.createTransaction({
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-xl p-6 mb-6 flex items-center justify-between w-full"
      >
        <div className="flex items-center space-x-4">
          <Icon
            as={ArrowLeft}
            onClick={() => navigate('/department/transactions')}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          />
          <div className="text-white flex flex-col">
            <h1 className="text-2xl font-bold">Submit Expense Request</h1>
            <p className="text-indigo-200 mt-1">Create a new expense request for approval</p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Budget Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget <span className="text-red-400">*</span>
              </label>
              <select
                {...register('budgetId', { required: 'Please select a budget' })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                disabled={loading}
              >
                <option value="" className="bg-slate-700 text-white">Select Budget</option>
                {budgets.map(budget => (
                  <option key={budget._id} value={budget._id} className="bg-slate-700 text-white">
                    {budget.title} ({budget.category})
                  </option>
                ))}
              </select>
              {errors.budgetId && (
                <p className="mt-1 text-sm text-red-400">{errors.budgetId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Budget Info */}
          {selectedBudget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-xl border border-blue-500/40 shadow-lg backdrop-blur-md hover:shadow-2xl transition-shadow duration-300 col-span-full"
            >
              <h4 className="font-semibold text-blue-300 mb-4 text-lg">Selected Budget Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-blue-200 font-semibold">Total Budget:</span>
                  <span className="ml-2 text-white font-medium">₹{selectedBudget.totalAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-200 font-semibold">Allocated:</span>
                  <span className="ml-2 text-white font-medium">₹{selectedBudget.allocatedAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-200 font-semibold">Remaining:</span>
                  <span className="ml-2 text-white font-medium">₹{(selectedBudget.allocatedAmount - selectedBudget.spentAmount)?.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows="4"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
              placeholder="Provide a detailed description of the expense..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="equipment" className="bg-slate-700 text-white">Equipment</option>
                <option value="supplies" className="bg-slate-700 text-white">Supplies</option>
                <option value="services" className="bg-slate-700 text-white">Services</option>
                <option value="maintenance" className="bg-slate-700 text-white">Maintenance</option>
                <option value="salary" className="bg-slate-700 text-white">Salary</option>
                <option value="travel" className="bg-slate-700 text-white">Travel</option>
                <option value="utilities" className="bg-slate-700 text-white">Utilities</option>
                <option value="other" className="bg-slate-700 text-white">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="low" className="bg-slate-700 text-white">Low</option>
                <option value="medium" className="bg-slate-700 text-white">Medium</option>
                <option value="high" className="bg-slate-700 text-white">High</option>
                <option value="urgent" className="bg-slate-700 text-white">Urgent</option>
              </select>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Vendor Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vendor Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register('vendorName', { required: 'Vendor name is required' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  placeholder="Enter vendor name"
                />
                {errors.vendorName && (
                  <p className="mt-1 text-sm text-red-400">{errors.vendorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vendor Contact</label>
                <input
                  type="text"
                  {...register('vendorContact')}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  placeholder="Phone number or email"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Invoice Number</label>
              <input
                type="text"
                {...register('invoiceNumber')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                placeholder="Invoice/Bill number (if available)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Expected Date</label>
              <input
                type="date"
                {...register('expectedDate')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-slate-600">
            <ActionButton
              type="button"
              variant="secondary"
              onClick={() => navigate('/department/transactions')}
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={submitting || loading}
            >
              {submitting ? 'Submitting...' : 'Submit Expense Request'}
            </ActionButton>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SubmitExpense;
