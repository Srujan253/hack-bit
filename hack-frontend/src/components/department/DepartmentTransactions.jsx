import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { transactionAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import Icon from '../common/Icon';
import Card from '../common/Card';

const DepartmentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getTransactions(filters);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const CreateTransactionModal = () => {
    const [formData, setFormData] = useState({
      budgetId: '',
      amount: '',
      description: '',
      category: 'equipment',
      vendorName: '',
      vendorContact: '',
      invoiceNumber: '',
      priority: 'medium',
      expectedDate: ''
    });
    const [budgets, setBudgets] = useState([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
      // Fetch available budgets for this department
      const fetchBudgets = async () => {
        try {
          const response = await transactionAPI.getAvailableBudgets();
          setBudgets(response.data.budgets);
        } catch (error) {
          console.error('Error fetching budgets:', error);
        }
      };
      fetchBudgets();
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setCreating(true);
        await transactionAPI.createTransaction({
          ...formData,
          amount: parseFloat(formData.amount)
        });
        toast.success('Expense request submitted successfully');
        setShowCreateModal(false);
        fetchTransactions();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to submit expense request');
      } finally {
        setCreating(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl shadow-2xl border border-slate-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Submit Expense Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Budget</label>
                  <select
                    required
                    value={formData.budgetId}
                    onChange={(e) => setFormData({...formData, budgetId: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  >
                    <option value="" className="bg-slate-700 text-white">Select Budget</option>
                    {budgets.map(budget => (
                      <option key={budget._id} value={budget._id} className="bg-slate-700 text-white">
                        {budget.title} ({budget.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Amount</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  rows="3"
                  placeholder="Detailed description of the expense..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
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
                  <label className="block text-sm font-medium text-slate-300">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  >
                    <option value="low" className="bg-slate-700 text-white">Low</option>
                    <option value="medium" className="bg-slate-700 text-white">Medium</option>
                    <option value="high" className="bg-slate-700 text-white">High</option>
                    <option value="urgent" className="bg-slate-700 text-white">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Vendor Contact</label>
                  <input
                    type="text"
                    value={formData.vendorContact}
                    onChange={(e) => setFormData({...formData, vendorContact: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                    className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={creating}
                >
                  {creating ? 'Submitting...' : 'Submit Request'}
                </ActionButton>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );
  };

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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <GradientHeader
          title="Expense Requests"
          subtitle="Manage your department's expense requests"
        />
        <ActionButton
          onClick={() => setShowCreateModal(true)}
          icon={Plus}
          className="mt-4 sm:mt-0"
        >
          New Request
        </ActionButton>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Icon as={Search} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          >
            <option value="" className="bg-slate-700 text-white">All Status</option>
            <option value="pending" className="bg-slate-700 text-white">Pending</option>
            <option value="approved" className="bg-slate-700 text-white">Approved</option>
            <option value="rejected" className="bg-slate-700 text-white">Rejected</option>
            <option value="completed" className="bg-slate-700 text-white">Completed</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          >
            <option value="" className="bg-slate-700 text-white">All Categories</option>
            <option value="equipment" className="bg-slate-700 text-white">Equipment</option>
            <option value="supplies" className="bg-slate-700 text-white">Supplies</option>
            <option value="services" className="bg-slate-700 text-white">Services</option>
            <option value="maintenance" className="bg-slate-700 text-white">Maintenance</option>
            <option value="salary" className="bg-slate-700 text-white">Salary</option>
            <option value="travel" className="bg-slate-700 text-white">Travel</option>
            <option value="utilities" className="bg-slate-700 text-white">Utilities</option>
            <option value="other" className="bg-slate-700 text-white">Other</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          >
            <option value="" className="bg-slate-700 text-white">All Priorities</option>
            <option value="low" className="bg-slate-700 text-white">Low</option>
            <option value="medium" className="bg-slate-700 text-white">Medium</option>
            <option value="high" className="bg-slate-700 text-white">High</option>
            <option value="urgent" className="bg-slate-700 text-white">Urgent</option>
          </select>
        </div>
      </motion.div>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No transactions found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-r from-slate-800 to-slate-700 divide-y divide-slate-600">
                {transactions.map((transaction) => (
                  <motion.tr
                    key={transaction._id}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                    className="hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{transaction.transactionId}</div>
                        <div className="text-sm text-slate-300 truncate max-w-xs" title={transaction.description}>
                          {transaction.description}
                        </div>
                        <div className="text-xs text-slate-400">
                          Vendor: {transaction.vendorName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                        {transaction.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(transaction.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {showCreateModal && <CreateTransactionModal />}
      </AnimatePresence>
    </motion.div>
  );
};

export default DepartmentTransactions;
