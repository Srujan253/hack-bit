import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Search } from 'lucide-react';
import { transactionAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import Card from '../common/Card';
import Icon from '../common/Icon';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    category: '',
    priority: '',
    search: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

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

  const handleReview = async (transactionId, action, comments = '') => {
    try {
      await transactionAPI.reviewTransaction(transactionId, action, comments);
      toast.success(`Transaction ${action}d successfully`);
      fetchTransactions();
      setShowReviewModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} transaction`);
    }
  };

  const ReviewModal = () => {
    const [action, setAction] = useState('approve');
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      await handleReview(selectedTransaction._id, action, comments);
      setSubmitting(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-surface rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border"
        >
          <h3 className="text-lg font-semibold text-textPrimary mb-4">
            Review Transaction: {selectedTransaction?.transactionId}
          </h3>

          <div className="mb-4 p-4 bg-surface/50 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-textPrimary">Amount:</span>
                <br />
                {formatCurrency(selectedTransaction.amount)}
              </div>
              <div>
                <span className="font-medium text-textPrimary">Vendor:</span>
                <br />
                {selectedTransaction.vendorName}
              </div>
              <div>
                <span className="font-medium text-textPrimary">Category:</span>
                <br />
                {selectedTransaction.category}
              </div>
              <div>
                <span className="font-medium text-textPrimary">Priority:</span>
                <br />
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTransaction.priority)}`}>
                  {selectedTransaction.priority}
                </span>
              </div>
              <div>
                <span className="font-medium text-textPrimary">Requested:</span>
                <br />
                {formatDate(selectedTransaction.requestedAt)}
              </div>
              <div>
                <span className="font-medium text-textPrimary">Department:</span>
                <br />
                {selectedTransaction.departmentId?.departmentName || selectedTransaction.departmentName}
              </div>
            </div>
            {selectedTransaction.description && (
              <div className="mt-4">
                <span className="font-medium text-textPrimary">Description:</span>
                <br />
                <p className="text-textMuted mt-1">{selectedTransaction.description}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Comments (Optional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Add any comments..."
              />
            </div>

            <div className="flex space-x-3">
              <ActionButton type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Processing...' : `${action.charAt(0).toUpperCase() + action.slice(1)} Transaction`}
              </ActionButton>
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
              >
              </ActionButton>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="space-y-6 p-6"
    >
      <GradientHeader title="Transaction Management" subtitle="Review and manage department transactions" />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Icon as={Search} size={20} color="text-textMuted" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Categories</option>
            <option value="equipment">Equipment</option>
            <option value="supplies">Supplies</option>
            <option value="services">Services</option>
            <option value="maintenance">Maintenance</option>
            <option value="salary">Salary</option>
            <option value="travel">Travel</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-textMuted">
            No transactions found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-backgroundSecondary">
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
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id}
                    className="hover:bg-backgroundSecondary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-textPrimary">{transaction.transactionId}</div>
                        <div className="text-sm text-textMuted truncate max-w-xs" title={transaction.description}>
                          {transaction.description}
                        </div>
                        <div className="text-xs text-textMuted">
                          Vendor: {transaction.vendorName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-textPrimary">{transaction.departmentId?.departmentName}</div>
                      <div className="text-sm text-textMuted">{transaction.departmentId?.departmentCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-textPrimary">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted capitalize">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                        {transaction.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {formatDate(transaction.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {transaction.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <ActionButton
                            onClick={() => handleReview(transaction._id, 'approve')}
                            variant="success"
                            size="sm"
                            title="Quick Approve"
                          >
                            <Icon as={Check} size={16} />
                          </ActionButton>
                          <ActionButton
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowReviewModal(true);
                            }}
                            variant="primary"
                            size="sm"
                          >
                            Review
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleReview(transaction._id, 'reject', 'Rejected by admin')}
                            variant="danger"
                            size="sm"
                            title="Quick Reject"
                          >
                            <Icon as={X} size={16} />
                          </ActionButton>
                        </div>
                      ) : (
                        <span className="text-textMuted">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showReviewModal && <ReviewModal />}
    </motion.div>
  );
};

export default AdminTransactions;
