import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { transactionAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getTransactions({ status: 'pending' });
      setPendingApprovals(response.data.transactions);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (transactionId, action, comments = '') => {
    try {
      await transactionAPI.reviewTransaction(transactionId, action, comments);
      toast.success(`Transaction ${action}d successfully`);
      fetchPendingApprovals();
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
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Transaction: {selectedTransaction?.transactionId}
          </h3>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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
                <span className="font-medium">Priority:</span> 
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTransaction?.priority)}`}>
                  {selectedTransaction?.priority}
                </span>
              </div>
              <div>
                <span className="font-medium">Vendor:</span> {selectedTransaction?.vendorName}
              </div>
              <div>
                <span className="font-medium">Invoice:</span> {selectedTransaction?.invoiceNumber || 'N/A'}
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium">Description:</span>
              <p className="mt-1 text-gray-700">{selectedTransaction?.description}</p>
            </div>
            <div className="mt-3">
              <span className="font-medium">Requested Date:</span> {formatDate(selectedTransaction?.requestedAt)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Decision</label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="approve"
                    checked={action === 'approve'}
                    onChange={(e) => setAction(e.target.value)}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2 text-green-600 font-medium">Approve</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="reject"
                    checked={action === 'reject'}
                    onChange={(e) => setAction(e.target.value)}
                    className="form-radio text-red-600"
                  />
                  <span className="ml-2 text-red-600 font-medium">Reject</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Comments {action === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required={action === 'reject'}
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600">Review and approve department expense requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingApprovals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <CheckIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(pendingApprovals.reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingApprovals.filter(t => t.priority === 'high' || t.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Requests Awaiting Approval</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
            <p>All expense requests have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingApprovals.map((transaction) => (
              <div key={transaction._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{transaction.transactionId}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                          {transaction.priority}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">{formatCurrency(transaction.amount)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{transaction.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Department:</span>
                        <br />
                        {transaction.departmentId?.departmentName}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <br />
                        {transaction.category}
                      </div>
                      <div>
                        <span className="font-medium">Vendor:</span>
                        <br />
                        {transaction.vendorName}
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span>
                        <br />
                        {formatDate(transaction.requestedAt)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => handleReview(transaction._id, 'approve')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>Quick Approve</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowReviewModal(true);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Review Details
                  </button>
                  
                  <button
                    onClick={() => handleReview(transaction._id, 'reject', 'Rejected by admin')}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Quick Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReviewModal && <ReviewModal />}
    </div>
  );
};

export default AdminApprovals;
