import React, { useState, useEffect } from 'react';
import { Plus, Search, Check, X, Eye } from 'lucide-react';
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
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

  const handleReviewTransaction = async (transactionId, action) => {
    try {
      await transactionAPI.reviewTransaction(transactionId, { action });
      toast.success(`Transaction ${action}d successfully`);
      setShowReviewModal(false);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} transaction`);
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GradientHeader
                title="Create Expense Request"
                subtitle="Submit a new expense request for approval"
                className="w-full"
              />
            </motion.div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields similar to SubmitExpense.jsx */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Budget</label>
                  <select
                    value={formData.budgetId}
                    onChange={(e) => setFormData({...formData, budgetId: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    required
                  >
                    <option value="" className="bg-slate-700 text-white">Select budget...</option>
                    {budgets.map(budget => (
                      <option key={budget._id} value={budget._id} className="bg-slate-700 text-white">
                        {budget.title} - {budget.category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  placeholder="Describe the expense..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  >
                    <option value="low" className="bg-slate-700 text-white">Low</option>
                    <option value="medium" className="bg-slate-700 text-white">Medium</option>
                    <option value="high" className="bg-slate-700 text-white">High</option>
                    <option value="urgent" className="bg-slate-700 text-white">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="Vendor name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vendor Contact</label>
                  <input
                    type="text"
                    value={formData.vendorContact}
                    onChange={(e) => setFormData({...formData, vendorContact: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    placeholder="Invoice number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-slate-600">
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={creating}
                  className="flex-1"
                  icon={Plus}
                >
                  {creating ? 'Creating...' : 'Create Request'}
                </ActionButton>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const ReviewModal = () => {
    if (!selectedTransaction) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GradientHeader
                title="Review Transaction"
                subtitle={`Transaction ID: ${selectedTransaction.transactionId}`}
                className="w-full"
              />
            </motion.div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-300 text-sm">Amount:</span>
                  <p className="text-white font-semibold">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <span className="text-slate-300 text-sm">Status:</span>
                  <p className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </p>
                </div>
                <div>
                  <span className="text-slate-300 text-sm">Category:</span>
                  <p className="text-white capitalize">{selectedTransaction.category}</p>
                </div>
                <div>
                  <span className="text-slate-300 text-sm">Priority:</span>
                  <p className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTransaction.priority)}`}>
                    {selectedTransaction.priority}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-300 text-sm">Description:</span>
                <p className="text-white mt-1">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-300 text-sm">Vendor:</span>
                  <p className="text-white">{selectedTransaction.vendorName}</p>
                </div>
                <div>
                  <span className="text-slate-300 text-sm">Department:</span>
                  <p className="text-white">{selectedTransaction.departmentId?.departmentName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-300 text-sm">Requested:</span>
                  <p className="text-white">{formatDate(selectedTransaction.requestedAt)}</p>
                </div>
                <div>
                  <span className="text-slate-300 text-sm">Expected:</span>
                  <p className="text-white">{selectedTransaction.expectedDate ? formatDate(selectedTransaction.expectedDate) : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <ActionButton
                type="button"
                variant="success"
                onClick={() => handleReviewTransaction(selectedTransaction._id, 'approve')}
                icon={Check}
              >
                Approve
              </ActionButton>
              <ActionButton
                type="button"
                variant="danger"
                onClick={() => handleReviewTransaction(selectedTransaction._id, 'reject')}
                icon={X}
              >
                Reject
              </ActionButton>
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </ActionButton>
            </div>
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
      <GradientHeader
        title="Expense Transactions"
        subtitle="Manage your department's expense requests"
        actions={
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            New Request
          </ActionButton>
        }
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 p-6 mt-6"
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
            <option value="travel" className="bg-slate-700 text-white">Travel</option>
            <option value="training" className="bg-slate-700 text-white">Training</option>
            <option value="maintenance" className="bg-slate-700 text-white">Maintenance</option>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 mt-6 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Icon as={Search} size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Transactions Found</h3>
            <p className="text-slate-300">
              {filters.search || filters.status || filters.category || filters.priority
                ? 'No transactions match your search criteria.'
                : 'No expense transactions yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-800">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-700 divide-y divide-slate-600">
                {transactions.map((transaction) => (
                  <motion.tr
                    key={transaction._id}
                    whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                    className="hover:bg-slate-600 transition-colors duration-200"
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ActionButton
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowReviewModal(true);
                        }}
                      >
                        Review
                      </ActionButton>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && <CreateTransactionModal />}
        {showReviewModal && <ReviewModal />}
      </AnimatePresence>
    </motion.div>
  );
};

export default DepartmentTransactions;
