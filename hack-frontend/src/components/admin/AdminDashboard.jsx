import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DollarSign,
  FileText,
  Users,
  Clock,
} from 'lucide-react';
import { budgetAPI, transactionAPI, authAPI } from '../../services/api';
import { formatCurrency, formatDate, getPriorityColor } from '../../utils/helpers';
import StatCard from '../common/StatCard';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import InteractiveTable from '../common/InteractiveTable';
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
        pendingTransactionsData = await transactionAPI.getTransactions({ status: 'pending', limit: 5 });
        setRecentTransactions(pendingTransactionsData.data.transactions || []);
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      }

      // Log the actual data structure to debug
      console.log('Budget stats response:', budgetStats);
      console.log('Transaction stats response:', transactionStats);
      console.log('Pending approvals response:', pendingApprovalsData);
      console.log('Pending transactions response:', pendingTransactionsData);

      setStats({
        budgets: budgetStats.data?.overall || budgetStats.data,
        transactions: transactionStats.data?.overall || transactionStats.data,
        pendingApprovals: Array.isArray(pendingApprovalsData.data?.data) ? pendingApprovalsData.data.data.length : 
                         Array.isArray(pendingApprovalsData.data) ? pendingApprovalsData.data.length : 0,
        pendingTransactions: pendingTransactionsData.data?.transactions?.length || 0
      });

      setPendingApprovals(Array.isArray(pendingApprovalsData.data.data) ? pendingApprovalsData.data.data : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-background p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-32 bg-surface rounded-xl mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-surface rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <GradientHeader
          title="Admin Dashboard"
          subtitle="Manage budgets, transactions, and department approvals"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Budgets"
            value={stats.budgets?.totalBudgets || stats.budgets?.count || 0}
            subtitle="Active budgets"
            color="emerald"
          />
          <StatCard
            icon={FileText}
            title="Pending Transactions"
            value={stats.pendingTransactions}
            subtitle="Awaiting review"
            color="blue"
          />
          <StatCard
            icon={Users}
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Department requests"
            color="violet"
          />
          <StatCard
            icon={Clock}
            title="Total Spent"
            value={formatCurrency(stats.transactions?.totalAmount || stats.transactions?.totalSpent || 0)}
            subtitle="This month"
            color="gold"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center">
              <Icon as={Clock} size={20} className="mr-2" />
              Recent Pending Transactions
            </h3>
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border hover:bg-surface/70 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-textPrimary">{transaction.transactionId}</p>
                    <p className="text-xs text-textMuted">{transaction.vendorName}</p>
                    <p className="text-xs text-textMuted">{formatDate(transaction.requestedAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <ActionButton size="sm" variant="success">Approve</ActionButton>
                    <ActionButton size="sm" variant="danger">Reject</ActionButton>
                  </div>
                </motion.div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-textMuted text-center py-4">No pending transactions</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center">
              <Icon as={Users} size={20} className="mr-2" />
              Pending Department Approvals
            </h3>
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((approval, index) => (
                <motion.div
                  key={approval._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border hover:bg-surface/70 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-textPrimary">{approval.name}</p>
                    <p className="text-xs text-textMuted">{approval.email}</p>
                    <p className="text-xs text-textMuted">{approval.department}</p>
                  </div>
                  <div className="flex space-x-2">
                    <ActionButton size="sm" variant="success">Approve</ActionButton>
                    <ActionButton size="sm" variant="danger">Reject</ActionButton>
                  </div>
                </motion.div>
              ))}
              {pendingApprovals.length === 0 && (
                <p className="text-textMuted text-center py-4">No pending approvals</p>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Transaction Status Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-surface/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-gold">{stats.transactions?.pendingCount || stats.transactions?.statusCounts?.pending || 0}</p>
              <p className="text-sm text-textMuted">Pending</p>
            </div>
            <div className="p-4 bg-surface/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-success">{stats.transactions?.approvedCount || stats.transactions?.statusCounts?.approved || 0}</p>
              <p className="text-sm text-textMuted">Approved</p>
            </div>
            <div className="p-4 bg-surface/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-blue-500">{stats.transactions?.completedCount || stats.transactions?.statusCounts?.completed || 0}</p>
              <p className="text-sm text-textMuted">Completed</p>
            </div>
            <div className="p-4 bg-surface/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-danger">{stats.transactions?.rejectedCount || stats.transactions?.statusCounts?.rejected || 0}</p>
              <p className="text-sm text-textMuted">Rejected</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/budgets">
              <ActionButton variant="emerald" size="md" icon={DollarSign}>
                Create Budget
              </ActionButton>
            </Link>
            <Link to="/admin/transactions">
              <ActionButton variant="blue" size="md" icon={FileText}>
                Review Transactions
              </ActionButton>
            </Link>
            <Link to="/admin/approvals">
              <ActionButton variant="violet" size="md" icon={Users}>
                Department Approvals
              </ActionButton>
            </Link>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
