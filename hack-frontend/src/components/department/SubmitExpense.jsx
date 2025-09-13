import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { transactionAPI } from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import Icon from '../common/Icon';
import Card from '../common/Card';

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
      <GradientHeader
        title="Submit Expense Request"
        subtitle="Create a new expense request for approval"
        actions={
          <ActionButton
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/department/transactions')}
          >
            Back to Transactions
          </ActionButton>
        }
      />

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto mt-6"
      >
        <Card className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Budget Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Budget</label>
              <select
                {...register('budgetId', { required: 'Please select a budget' })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="" className="bg-slate-700 text-white">Choose a budget...</option>
                {budgets.map(budget => (
                  <option key={budget._id} value={budget._id} className="bg-slate-700 text-white">
                    {budget.title} - {budget.category} ({budget.financialYear})
                  </option>
                ))}
              </select>
              {errors.budgetId && <p className="text-red-400 text-sm mt-1">{errors.budgetId.message}</p>}
            </motion.div>

            {/* Amount and Category */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="equipment" className="bg-slate-700 text-white">Equipment</option>
                  <option value="supplies" className="bg-slate-700 text-white">Supplies</option>
                  <option value="services" className="bg-slate-700 text-white">Services</option>
                  <option value="travel" className="bg-slate-700 text-white">Travel</option>
                  <option value="training" className="bg-slate-700 text-white">Training</option>
                  <option value="maintenance" className="bg-slate-700 text-white">Maintenance</option>
                  <option value="utilities" className="bg-slate-700 text-white">Utilities</option>
                  <option value="other" className="bg-slate-700 text-white">Other</option>
                </select>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                placeholder="Describe the expense..."
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
            </motion.div>

            {/* Priority */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
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
            </motion.div>

            {/* Vendor Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vendor Name</label>
                <input
                  type="text"
                  {...register('vendorName', { required: 'Vendor name is required' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  placeholder="Vendor or supplier name"
                />
                {errors.vendorName && <p className="text-red-400 text-sm mt-1">{errors.vendorName.message}</p>}
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
            </motion.div>

            {/* Additional Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
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
            </motion.div>

            {/* Submit Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex space-x-4 pt-6 border-t border-slate-600"
            >
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/department/transactions')}
                className="flex-1"
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={submitting || loading}
                className="flex-1"
                icon={Plus}
              >
                {submitting ? 'Submitting...' : 'Submit Expense Request'}
              </ActionButton>
            </motion.div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SubmitExpense;
