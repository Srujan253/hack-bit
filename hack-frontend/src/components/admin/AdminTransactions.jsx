import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { transactionAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Transaction: {selectedTransaction?.transactionId}
          </h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Amount:</span> {formatCurrency(selectedTransaction?.amount)}
              </div>
              <div>
                <span className="font-medium">Department:</span> {selectedTransaction?.departmentId?.departmentName}
              </div>
              <div>
                <span className="font-medium">Category:</span> {selectedTransaction?.category}
              </div>
              <div>
                <span className="font-medium">Priority:</span> {selectedTransaction?.priority}
              </div>
            </div>
            <div className="mt-2">
              <span className="font-medium">Description:</span> {selectedTransaction?.description}
            </div>
            <div className="mt-2">
              <span className="font-medium">Vendor:</span> {selectedTransaction?.vendorName}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={action === 'approve' ? 'Optional approval comments' : 'Please provide reason for rejection'}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedTransaction(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                  action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Transaction`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600">Review and approve department expense requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.transactionId}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={transaction.description}>
                          {transaction.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          Vendor: {transaction.vendorName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.departmentId?.departmentName}</div>
                      <div className="text-sm text-gray-500">{transaction.departmentId?.departmentCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                        {transaction.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          <button
                            onClick={() => handleReview(transaction._id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            title="Quick Approve"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowReviewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleReview(transaction._id, 'reject', 'Rejected by admin')}
                            className="text-red-600 hover:text-red-900"
                            title="Quick Reject"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReviewModal && <ReviewModal />}
    </div>
  );
};

export default AdminTransactions;
