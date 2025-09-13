import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { budgetAPI, transactionAPI, authAPI } from '../../services/api';
import { formatCurrency, formatDate, getPriorityColor } from '../../utils/helpers';
import StatCard from '../common/StatCard';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import InteractiveTable from '../common/InteractiveTable';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  return (
    <motion.div
      className="space-y-8 px-4"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <GradientHeader
        title="Admin Dashboard"
        subtitle="Manage budgets, approve transactions, and oversee the platform"
        actions={
          <>
            <Link to="/admin/budgets">
              <ActionButton variant="primary" size="md">Manage Budgets</ActionButton>
            </Link>
            <Link to="/admin/approvals">
              <ActionButton variant="danger" size="md">Pending Approvals</ActionButton>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={CurrencyDollarIcon}
          title="Total Budgets"
          value={stats.budgets?.totalBudgets || 0}
          subtitle={`${formatCurrency(stats.budgets?.totalAmount || 0)} allocated`}
          color="blue"
        />
        <StatCard
          icon={DocumentTextIcon}
          title="Total Transactions"
          value={stats.transactions?.totalTransactions || 0}
          subtitle={`${formatCurrency(stats.transactions?.totalAmount || 0)} processed`}
          color="emerald"
        />
        <StatCard
          icon={ClockIcon}
          title="Pending Transactions"
          value={stats.pendingTransactions}
          subtitle="Awaiting review"
          color="gold"
        />
        <StatCard
          icon={UserGroupIcon}
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Department signups"
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-xl shadow-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Pending Department Approvals</h3>
          {pendingApprovals.length === 0 ? (
            <p className="text-textMuted text-center py-4">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.slice(0, 3).map((approval) => (
                <motion.div
                  key={approval._id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer"
                >
                  <div>
                    <h4 className="font-medium text-textPrimary">{approval.departmentName}</h4>
                    <p className="text-sm text-textMuted">{approval.departmentCode} • {approval.email}</p>
                    <p className="text-xs text-textMuted">Aadhaar: {approval.aadhaarNumber}</p>
                  </div>
                  <div className="flex space-x-2">
                    <ActionButton
                      size="sm"
                      variant="success"
                      onClick={() => handleDepartmentApproval(approval._id, 'approve')}
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleDepartmentApproval(approval._id, 'reject')}
                    >
                      Reject
                    </ActionButton>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl shadow-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Pending Transactions</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-textMuted text-center py-4">No pending transactions</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <motion.div
                  key={transaction._id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-textPrimary">{transaction.transactionId}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transaction.priority)}`}>
                        {transaction.priority}
                      </span>
                    </div>
                    <p className="text-sm text-textMuted truncate">{transaction.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-textMuted mt-1">
                      <span>{transaction.departmentId?.departmentName}</span>
                      <span>{formatCurrency(transaction.amount)}</span>
                      <span>{formatDate(transaction.requestedAt)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <ActionButton size="sm" variant="success">Approve</ActionButton>
                    <ActionButton size="sm" variant="danger">Reject</ActionButton>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Transaction Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gold">{stats.transactions?.pendingCount || 0}</p>
            <p className="text-sm text-textMuted">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{stats.transactions?.approvedCount || 0}</p>
            <p className="text-sm text-textMuted">Approved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">{stats.transactions?.completedCount || 0}</p>
            <p className="text-sm text-textMuted">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-danger">{stats.transactions?.rejectedCount || 0}</p>
            <p className="text-sm text-textMuted">Rejected</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/budgets">
            <ActionButton variant="blue" size="md" icon={CurrencyDollarIcon}>
              Create Budget
            </ActionButton>
          </Link>
          <Link to="/admin/transactions">
            <ActionButton variant="emerald" size="md" icon={DocumentTextIcon}>
              Review Transactions
            </ActionButton>
          </Link>
          <Link to="/admin/approvals">
            <ActionButton variant="violet" size="md" icon={UserGroupIcon}>
              Department Approvals
            </ActionButton>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
