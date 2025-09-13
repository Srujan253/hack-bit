import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { departmentAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import useCurrencyStore from '../../store/currencyStore';
import toast from 'react-hot-toast';

const ProgressiveExpenseTracker = () => {
  const { formatCurrency, convertFinancialData } = useCurrencyStore();
  const [budgets, setBudgets] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBudgets();
    fetchTransactionHistory();
    fetchAllocation();

    // Listen for currency changes
    const handleCurrencyChange = () => {
      fetchMyBudgets();
      fetchTransactionHistory();
      fetchAllocation();
    };
    
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  const fetchMyBudgets = async () => {
    try {
      const response = await departmentAPI.getMyBudgets();
      const budgetData = response.data.budgets || [];
      
      // Convert budget data to current currency
      const convertedBudgets = budgetData.map(budget => 
        convertFinancialData(budget, 'INR')
      );
      setBudgets(convertedBudgets);
      
      if (convertedBudgets.length > 0) {
        setSelectedBudget(convertedBudgets[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const response = await departmentAPI.getTransactionHistory();
      const transactionData = response.data.transactions || [];
      
      // Convert transaction data to current currency
      const convertedTransactions = transactionData.map(transaction => 
        convertFinancialData(transaction, 'INR')
      );
      setTransactions(convertedTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const fetchAllocation = async () => {
    try {
      const response = await departmentAPI.getAllocation();
      const allocationData = response.data.allocation || {};
      
      // Convert allocation data to current currency
      const convertedAllocation = convertFinancialData(allocationData, 'INR');
      setAllocation(convertedAllocation);
    } catch (error) {
      console.error('Failed to fetch allocation');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-accent bg-accent/20';
      case 'approved': return 'text-success bg-success/20';
      case 'rejected': return 'text-error bg-error/20';
      case 'completed': return 'text-primary bg-primary/20';
      default: return 'text-textMuted bg-surface';
    }
  };

  const getProgressSteps = (allocation) => {
    return [
      {
        id: 1,
        title: 'Budget Allocated',
        description: `${formatCurrency(allocation.allocated)} allocated`,
        completed: allocation.allocated > 0,
        icon: CurrencyDollarIcon
      },
      {
        id: 2,
        title: 'Expenses Submitted',
        description: `${allocation.transactions.length} transactions`,
        completed: allocation.transactions.length > 0,
        icon: DocumentTextIcon
      },
      {
        id: 3,
        title: 'Funds Utilized',
        description: `${allocation.utilizationRate}% utilized`,
        completed: allocation.spent > 0,
        icon: ArrowTrendingUpIcon
      },
      {
        id: 4,
        title: 'Budget Active',
        description: allocation.remaining > 0 ? 'Funds available' : 'Fully utilized',
        completed: allocation.remaining >= 0,
        icon: CheckCircleIcon
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-textPrimary mb-2">Progressive Expense Tracker</h1>
        <p className="text-textMuted">Track your budget utilization step by step</p>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <motion.div
            key={budget._id}
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-lg border cursor-pointer transition-all ${
              selectedBudget?._id === budget._id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary/50'
            }`}
            onClick={() => setSelectedBudget(budget)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-textPrimary">{budget.title}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                budget.status === 'active' ? 'bg-success/20 text-success' : 'bg-textMuted/20 text-textMuted'
              }`}>
                {budget.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-textMuted">Allocated</span>
                <span className="font-medium text-textPrimary">
                  {formatCurrency(budget.myAllocation.allocated)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-textMuted">Spent</span>
                <span className="font-medium text-success">
                  {formatCurrency(budget.myAllocation.spent)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-textMuted">Remaining</span>
                <span className="font-medium text-primary">
                  {formatCurrency(budget.myAllocation.remaining)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-textMuted mb-1">
                <span>Utilization</span>
                <span>{budget.myAllocation.utilizationRate}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(budget.myAllocation.utilizationRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Budget Details */}
      {selectedBudget && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Steps */}
          <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">Budget Progress Steps</h2>
            <div className="space-y-4">
              {getProgressSteps(selectedBudget.myAllocation).map((step, index) => (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-success text-textPrimary' : 'bg-border text-textMuted'
                  }`}>
                    {step.completed ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${step.completed ? 'text-textPrimary' : 'text-textMuted'}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-textMuted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation History */}
          <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">Allocation History</h2>
            <div className="space-y-3">
              {selectedBudget.myAllocation.allocationHistory.map((allocation, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-md">
                  <div>
                    <div className="font-medium text-textPrimary">
                      {formatCurrency(allocation.amount)} allocated
                    </div>
                    <div className="text-sm text-textMuted">
                      {formatDate(allocation.allocatedAt)}
                    </div>
                  </div>
                  <CheckCircleIcon className="w-5 h-5 text-success" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-textPrimary">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                  Budget Impact
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {transactions.slice(0, 10).map((transaction) => (
                <tr key={transaction._id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-textPrimary">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-textMuted">
                      {transaction.vendorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.status === 'approved' || transaction.status === 'completed' ? (
                      <div className="flex items-center space-x-1 text-success">
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                        <span className="text-sm">Deducted</span>
                      </div>
                    ) : transaction.status === 'rejected' ? (
                      <div className="flex items-center space-x-1 text-error">
                        <XCircleIcon className="w-4 h-4" />
                        <span className="text-sm">No Impact</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-accent">
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressiveExpenseTracker;
