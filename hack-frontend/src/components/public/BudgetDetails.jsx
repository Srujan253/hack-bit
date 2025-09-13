import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Budget not found</h3>
        <Link to="/budgets" className="text-blue-600 hover:text-blue-700">
          ← Back to Budgets
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <Link
          to="/budgets"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{budget.title}</h1>
          <p className="text-gray-600">{budget.description}</p>
        </div>
      </motion.div>

      {/* Budget Overview */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            label: "Total Budget",
            value: formatCurrency(budget.totalAmount),
            color: "text-gray-900",
            bgColor: "bg-blue-100",
            icon: <ChartBarIcon className="w-6 h-6 text-blue-600" />
          },
          {
            label: "Total Spent",
            value: formatCurrency(budget.spentAmount),
            color: "text-green-600",
            bgColor: "bg-green-100",
            icon: <DocumentTextIcon className="w-6 h-6 text-green-600" />
          },
          {
            label: "Remaining",
            value: formatCurrency(budget.remainingAmount),
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            icon: <ChartBarIcon className="w-6 h-6 text-yellow-600" />
          },
          {
            label: "Utilization",
            value: `${budget.utilizationRate?.toFixed(1)}%`,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            icon: <ChartBarIcon className="w-6 h-6 text-purple-600" />
          }
        ].map((item, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                {item.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Budget Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Category</p>
            <p className="text-sm text-gray-900 capitalize">{budget.category}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Financial Year</p>
            <p className="text-sm text-gray-900">{budget.financialYear}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
              {budget.status}
            </span>
          </div>
        </div>
      </div>

      {/* Department Spending */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Spending</h3>
        <div className="space-y-4">
          {departmentSpending.map((dept) => (
            <div key={dept.departmentId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{dept.departmentName}</h4>
                  <p className="text-sm text-gray-500">{dept.departmentCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(dept.spentAmount)} / {formatCurrency(dept.allocatedAmount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dept.transactionCount} transactions
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(dept.utilizationRate, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>{dept.utilizationRate.toFixed(1)}% utilized</span>
                <span>Remaining: {formatCurrency(dept.remainingAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Link
              to={`/transactions?budgetId=${budget._id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transactions found for this budget
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {transaction.transactionId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{transaction.departmentId?.departmentName}</div>
                        <div className="text-gray-500">{transaction.departmentId?.departmentCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.approvedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BudgetDetails;
