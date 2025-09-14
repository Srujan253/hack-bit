import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import useCurrencyStore from '../../store/currencyStore';
import toast from 'react-hot-toast';

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

const BudgetDetails = () => {
  const { formatCurrency, convertFinancialData } = useCurrencyStore();
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [departmentSpending, setDepartmentSpending] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentStats, setCommentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    comment: '',
    type: 'comment'
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchBudgetDetails();
      fetchComments();
      fetchCommentStats();
    }
    
    // Listen for currency changes
    const handleCurrencyChange = () => {
      if (id) {
        fetchBudgetDetails();
      }
    };
    
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [id]);

  const fetchBudgetDetails = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getPublicBudgetById(id);
      
      // Convert budget data to current currency
      const budgetData = response.data.budget;
      
      // Ensure remainingAmount is calculated if not present
      if (budgetData.remainingAmount === undefined || budgetData.remainingAmount === null) {
        budgetData.remainingAmount = budgetData.totalAmount - (budgetData.spentAmount || 0);
      }
      
      // Ensure utilizationRate is calculated if not present
      if (budgetData.utilizationRate === undefined || budgetData.utilizationRate === null) {
        budgetData.utilizationRate = budgetData.totalAmount > 0 ? 
          ((budgetData.spentAmount || 0) / budgetData.totalAmount) * 100 : 0;
      }
      
      const convertedBudget = convertFinancialData(budgetData, 'INR');
      setBudget(convertedBudget);
      setTransactions(response.data.transactions);
      setDepartmentSpending(response.data.departmentSpending);
    } catch (error) {
      console.error('Error fetching budget details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await fetch(`https://fund-tracker-hppt.onrender.com/api/comments/budget/${id}`);
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments);
      } else {
        console.error('Failed to fetch comments:', data.message);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchCommentStats = async () => {
    try {
      const response = await fetch(`https://fund-tracker-hppt.onrender.com/api/comments/budget/${id}/stats`);
      const data = await response.json();
      if (response.ok) {
        setCommentStats(data);
      } else {
        console.error('Failed to fetch comment stats:', data.message);
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentForm.name.trim() || !commentForm.email.trim() || !commentForm.comment.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`https://fund-tracker-hppt.onrender.com/api/comments/budget/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Comment submitted successfully! It will be visible after moderation.');
        setCommentForm({ name: '', email: '', comment: '', type: 'comment' });
        setShowCommentForm(false);
        // Refresh stats
        fetchCommentStats();
      } else {
        toast.error(data.message || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`https://fund-tracker-hppt.onrender.com/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update the comment likes in state
        setComments(comments.map(comment => 
          comment._id === commentId 
            ? { ...comment, likes: comment.likes + 1 }
            : comment
        ));
        toast.success('Thank you for your feedback!');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const getCommentIcon = (type) => {
    switch (type) {
      case 'suggestion':
        return <LightBulbIcon className="w-5 h-5 text-yellow-500" />;
      case 'question':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-textPrimary mb-2">Budget not found</h3>
        <Link to="/budgets" className="text-primary hover:text-primary">
          ← Back to Budgets
        </Link>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" exit="exit" variants={fadeUp}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-4">
          <Link
            to="/budgets"
            className="p-2 text-textMuted hover:text-textPrimary rounded-md hover:bg-surface"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">{budget.title}</h1>
            <p className="text-textMuted">{budget.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-textMuted">
              <span className="flex items-center space-x-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Created: {formatDate(budget.createdAt)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <UserIcon className="w-4 h-4" />
                <span>By: {budget.createdBy?.email || 'Government'}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-surface rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-primary text-white' 
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'comments' 
                ? 'bg-primary text-white' 
                : 'text-textMuted hover:text-textPrimary hover:bg-surface'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Public Feedback</span>
            {commentStats.totalComments > 0 ? (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {commentStats.totalComments}
              </span>
            ) : (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                New!
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Budget Overview */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Total Budget</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(budget.totalAmount)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Total Spent</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(budget.spentAmount)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Remaining</p>
              <p className="text-2xl font-bold text-textPrimary">
                {formatCurrency(budget.remainingAmount)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-textPrimary">Utilization</p>
              <p className="text-2xl font-bold text-textPrimary">
                {budget.utilizationRate?.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Budget Info */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Budget Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-textMuted">Category</p>
            <p className="text-sm text-textPrimary capitalize">{budget.category}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-textMuted">Financial Year</p>
            <p className="text-sm text-textPrimary">{budget.financialYear}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-textMuted">Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
              {budget.status}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Department Spending */}
      <motion.div className="bg-surface p-6 rounded-lg shadow-sm border border-border" variants={fadeUp}>
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Department-wise Spending</h3>
        <motion.div className="space-y-4" variants={staggerContainer} initial="initial" animate="animate">
          {departmentSpending.map((dept, index) => (
            <motion.div key={dept.departmentId} className="border border-border rounded-lg p-4" variants={fadeUp}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-textPrimary">{dept.departmentName}</h4>
                  <p className="text-sm text-textMuted">{dept.departmentCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-textPrimary">
                    {formatCurrency(dept.spentAmount)} / {formatCurrency(dept.allocatedAmount)}
                  </p>
                  <p className="text-sm text-textMuted">
                    {dept.transactionCount} transactions
                  </p>
                </div>
              </div>

              <div className="w-full bg-border rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(dept.utilizationRate, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-textMuted">
                <span>{dept.utilizationRate.toFixed(1)}% utilized</span>
                <span>Remaining: {formatCurrency(dept.remainingAmount)}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Recent Transactions */}
            <motion.div className="bg-surface rounded-lg shadow-sm border border-border" variants={fadeUp}>
              <div className="px-6 py-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-textPrimary">Recent Transactions</h3>
                  <Link
                    to={`/transactions?budgetId=${budget._id}`}
                    className="text-primary hover:text-primary text-sm font-medium"
                  >
                    View All →
                  </Link>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-6 text-center text-textMuted">
                  No transactions found for this budget
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <motion.tbody className="bg-surface divide-y divide-border" variants={staggerContainer} initial="initial" animate="animate">
                      {transactions.slice(0, 10).map((transaction, index) => (
                        <motion.tr key={transaction._id} className="hover:bg-surface" variants={fadeUp}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                            {transaction.transactionId}
                          </td>
                          <td className="px-6 py-4 text-sm text-textPrimary">
                            <div className="max-w-xs truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                            <div>
                              <div className="font-medium">{transaction.departmentId?.departmentName}</div>
                              <div className="text-textMuted">{transaction.departmentId?.departmentCode}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-textPrimary">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                            {formatDate(transaction.approvedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Public Feedback Call-to-Action */}
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
              variants={fadeUp}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Share Your Feedback</h3>
                    <p className="text-gray-600 mt-1">
                      Help improve government transparency by sharing your thoughts, suggestions, and questions about this budget.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>View Public Feedback</span>
                </button>
              </div>
              
              {commentStats.totalComments > 0 && (
                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>{commentStats.totalComments} comments</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HandThumbUpIcon className="w-4 h-4" />
                    <span>{commentStats.engagement?.totalLikes || 0} likes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <LightBulbIcon className="w-4 h-4" />
                    <span>{commentStats.byType?.find(t => t._id === 'suggestion')?.count || 0} suggestions</span>
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'comments' && (
          <motion.div
            key="comments"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Comment Stats */}
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={fadeUp}>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-textPrimary">{commentStats.totalComments || 0}</p>
                    <p className="text-sm text-textMuted">Total Comments</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <HandThumbUpIcon className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-textPrimary">{commentStats.engagement?.totalLikes || 0}</p>
                    <p className="text-sm text-textMuted">Total Likes</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <LightBulbIcon className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-textPrimary">
                      {commentStats.byType?.find(t => t._id === 'suggestion')?.count || 0}
                    </p>
                    <p className="text-sm text-textMuted">Suggestions</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Add Comment Button */}
            <motion.div className="flex justify-between items-center" variants={fadeUp}>
              <h3 className="text-lg font-semibold text-textPrimary">Public Comments & Suggestions</h3>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Add Comment</span>
              </button>
            </motion.div>

            {/* Comment Form */}
            <AnimatePresence>
              {showCommentForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-surface p-6 rounded-lg border border-border"
                >
                  <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-textPrimary mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={commentForm.name}
                          onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-textPrimary mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={commentForm.email}
                          onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">
                        Type
                      </label>
                      <select
                        value={commentForm.type}
                        onChange={(e) => setCommentForm({...commentForm, type: e.target.value})}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="comment">General Comment</option>
                        <option value="suggestion">Suggestion</option>
                        <option value="question">Question</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">
                        Comment *
                      </label>
                      <textarea
                        value={commentForm.comment}
                        onChange={(e) => setCommentForm({...commentForm, comment: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Share your thoughts, suggestions, or questions about this budget..."
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCommentForm(false)}
                        className="px-4 py-2 text-textMuted hover:text-textPrimary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Submit Comment
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comments List */}
            <motion.div className="space-y-4" variants={fadeUp}>
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-textMuted">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment._id}
                    className="bg-surface p-6 rounded-lg border border-border"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getCommentIcon(comment.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-textPrimary">{comment.name}</h4>
                            <p className="text-sm text-textMuted capitalize">{comment.type}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-textMuted">
                            <span>{formatDate(comment.createdAt)}</span>
                            <button
                              onClick={() => handleLikeComment(comment._id)}
                              className="flex items-center space-x-1 hover:text-primary transition-colors"
                            >
                              <HandThumbUpIcon className="w-4 h-4" />
                              <span>{comment.likes}</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-textPrimary mb-4">{comment.comment}</p>
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="space-y-3 pl-4 border-l-2 border-border">
                            {comment.replies.map((reply, index) => (
                              <div key={index} className="bg-background p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-textPrimary">{reply.name}</span>
                                  {reply.isOfficial && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                      Official Response
                                    </span>
                                  )}
                                  <span className="text-xs text-textMuted">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-textPrimary">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BudgetDetails;
