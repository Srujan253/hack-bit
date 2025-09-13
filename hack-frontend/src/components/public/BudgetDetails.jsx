import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';

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
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [departmentSpending, setDepartmentSpending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetDetails();
  }, [id]);

  const fetchBudgetDetails = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getPublicBudgetById(id);
      setBudget(response.data.budget);
      setTransactions(response.data.transactions);
      setDepartmentSpending(response.data.departmentSpending);
    } catch (error) {
      console.error('Error fetching budget details:', error);
    } finally {
      setLoading(false);
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
        className="flex items-center space-x-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          to="/budgets"
          className="p-2 text-textMuted hover:text-textPrimary rounded-md hover:bg-surface"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">{budget.title}</h1>
          <p className="text-textMuted">{budget.description}</p>
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
    </motion.div>
  );
};

export default BudgetDetails;
