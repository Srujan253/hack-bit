import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { budgetAPI, transactionAPI, authAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    budgets: null,
    transactions: null,
    pendingApprovals: 0,
    pendingTransactions: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending approvals separately to handle errors better
      let pendingApprovalsData = { data: [] };
      let budgetStats = { data: null };
      let transactionStats = { data: null };
      let pendingTransactionsData = { data: [] };

      try {
        pendingApprovalsData = await authAPI.getPendingApprovals();
        console.log('Full response:', pendingApprovalsData);
        console.log('Response data:', pendingApprovalsData.data);
        console.log('Data type:', typeof pendingApprovalsData.data);
        console.log('Data keys:', Object.keys(pendingApprovalsData.data));
        if (pendingApprovalsData.data.data) {
          console.log('Nested data:', pendingApprovalsData.data.data);
          console.log('Is nested data array?', Array.isArray(pendingApprovalsData.data.data));
        }
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
      }

      try {
        budgetStats = await budgetAPI.getBudgetStatistics();
      } catch (error) {
        console.error('Error fetching budget stats:', error);
      }

      try {
        transactionStats = await transactionAPI.getTransactionStatistics();
      } catch (error) {
        console.error('Error fetching transaction stats:', error);
      }

      try {
        pendingTransactionsData = await transactionAPI.getPendingTransactions({ limit: 5 });
      } catch (error) {
        console.error('Error fetching pending transactions:', error);
      }

      setStats({
        budgets: budgetStats.data,
        transactions: transactionStats.data,
        pendingApprovals: pendingApprovalsData.data?.data ? pendingApprovalsData.data.data.length : 0,
        pendingTransactions: pendingTransactionsData.data ? pendingTransactionsData.data.length : 0
      });

      setPendingApprovals(Array.isArray(pendingApprovalsData.data?.data) ? pendingApprovalsData.data.data : []);
      setRecentTransactions(Array.isArray(pendingTransactionsData.data) ? pendingTransactionsData.data : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setPendingApprovals([]);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentApproval = async (userId, action) => {
    try {
      await authAPI.approveDepartment(userId, action, action === 'approve' ? 'Approved by admin' : 'Rejected by admin');
      toast.success(`Department ${action}d successfully`);
      fetchDashboardData(); // Refresh the data
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} department`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-red-100 text-lg">
              Manage budgets, approve transactions, and oversee the platform
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              to="/admin/budgets"
              className="px-4 py-2 bg-white text-red-600 rounded-md hover:bg-red-50 font-medium"
            >
              Manage Budgets
            </Link>
            <Link
              to="/admin/approvals"
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-400 font-medium"
            >
              Pending Approvals
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budgets</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.budgets?.totalBudgets || 0}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(stats.budgets?.totalAmount || 0)} allocated
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.transactions?.totalTransactions || 0}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(stats.transactions?.totalAmount || 0)} processed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingTransactions}
              </p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pendingApprovals}
              </p>
              <p className="text-sm text-gray-500">Department signups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Department Approvals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Pending Department Approvals</h3>
              <Link
                to="/admin/approvals"
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {!Array.isArray(pendingApprovals) || pendingApprovals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending approvals</p>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.slice(0, 3).map((approval) => (
                  <div key={approval._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{approval.departmentName}</h4>
                      <p className="text-sm text-gray-500">{approval.departmentCode} • {approval.email}</p>
                      <p className="text-xs text-gray-400">Aadhaar: {approval.aadhaarNumber}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDepartmentApproval(approval._id, 'approve')}
                        className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleDepartmentApproval(approval._id, 'reject')}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Pending Transactions</h3>
              <Link
                to="/admin/transactions?status=pending"
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending transactions</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{transaction.transactionId}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                          {transaction.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{transaction.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{transaction.departmentId?.departmentName}</span>
                        <span>{formatCurrency(transaction.amount)}</span>
                        <span>{formatDate(transaction.requestedAt)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                        Approve
                      </button>
                      <button className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Status Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.transactions?.pendingCount || 0}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.transactions?.approvedCount || 0}
            </p>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.transactions?.completedCount || 0}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {stats.transactions?.rejectedCount || 0}
            </p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/budgets"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <CurrencyDollarIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Create Budget</p>
              <p className="text-sm text-gray-500">Add new budget allocation</p>
            </div>
          </Link>
          
          <Link
            to="/admin/transactions"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <DocumentTextIcon className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Review Transactions</p>
              <p className="text-sm text-gray-500">Approve pending requests</p>
            </div>
          </Link>
          
          <Link
            to="/admin/approvals"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <UserGroupIcon className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Department Approvals</p>
              <p className="text-sm text-gray-500">Manage department signups</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
