import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Scatter } from 'react-chartjs-2';
import {
  DollarSign,
  FileText,
  Users,
  Clock,
  Search,
  Bell,
  User,
  BarChart3,
  Calendar,
  Mail,
  TrendingUp,
  RefreshCw,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { budgetAPI, transactionAPI } from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import StatCard from '../common/StatCard';
import GradientHeader from '../common/GradientHeader';
import Card from '../common/Card';
import Icon from '../common/Icon';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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

export default function FarmerDashboard() {
  const { formatCurrency, convertFinancialData } = useCurrencyStore();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for currency changes
    const handleCurrencyChange = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch budgets and transactions from existing APIs
      const [budgetResponse, transactionResponse] = await Promise.all([
        budgetAPI.getBudgets(),
        transactionAPI.getTransactions()
      ]);

      const budgetData = budgetResponse.data.budgets || budgetResponse.data || [];
      const transactionData = transactionResponse.data.transactions || transactionResponse.data || [];

      // Convert to current currency
      const convertedBudgets = budgetData.map(budget => convertFinancialData(budget, 'INR'));
      const convertedTransactions = transactionData.map(transaction => convertFinancialData(transaction, 'INR'));

      setBudgets(convertedBudgets);
      setTransactions(convertedTransactions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search
  const filteredBudgets = budgets.filter(budget =>
    budget.title?.toLowerCase().includes(search.toLowerCase()) ||
    budget.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    transaction.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
    transaction.amount?.toString().includes(search)
  );

  // Create chart data from existing budget/transaction data
  const budgetChartData = {
    labels: filteredBudgets.map(budget => budget.title || 'Unnamed Budget'),
    datasets: [{
      label: 'Budget Amount',
      data: filteredBudgets.map(budget => budget.totalAmount || 0),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f7c948', '#e63946', '#60a5fa', '#34d399'
      ],
      borderColor: [
        '#2563eb', '#059669', '#d97706', '#dc2626', '#3b82f6', '#10b981'
      ],
      borderWidth: 1
    }]
  };

  const transactionChartData = {
    labels: ['Pending', 'Approved', 'Completed', 'Rejected'],
    datasets: [{
      label: 'Transaction Count',
      data: [
        filteredTransactions.filter(t => t.status === 'pending').length,
        filteredTransactions.filter(t => t.status === 'approved').length,
        filteredTransactions.filter(t => t.status === 'completed').length,
        filteredTransactions.filter(t => t.status === 'rejected').length,
      ],
      backgroundColor: ['#f7c948', '#10b981', '#3b82f6', '#e63946'],
    }]
  };

  // Department spending comparison
  const departmentData = {};
  filteredTransactions.forEach(transaction => {
    const dept = transaction.departmentId?.name || 'Unknown Department';
    if (!departmentData[dept]) {
      departmentData[dept] = { planned: 0, actual: 0 };
    }
    departmentData[dept].actual += transaction.amount || 0;
  });

  filteredBudgets.forEach(budget => {
    budget.allocations?.forEach(allocation => {
      const dept = allocation.departmentId?.name || 'Unknown Department';
      if (!departmentData[dept]) {
        departmentData[dept] = { planned: 0, actual: 0 };
      }
      departmentData[dept].planned += allocation.allocatedAmount || 0;
    });
  });

  const comparisonData = {
    labels: Object.keys(departmentData),
    datasets: [
      {
        label: 'Planned',
        data: Object.values(departmentData).map(d => d.planned),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Actual',
        data: Object.values(departmentData).map(d => d.actual),
        backgroundColor: '#10b981',
      }
    ]
  };

  // Calculate statistics
  const totalBudgetAmount = filteredBudgets.reduce((sum, budget) => sum + (budget.totalAmount || 0), 0);
  const totalTransactionAmount = filteredTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const topVendor = filteredTransactions.reduce((acc, transaction) => {
    const vendor = transaction.vendorName || 'Unknown';
    acc[vendor] = (acc[vendor] || 0) + (transaction.amount || 0);
    return acc;
  }, {});
  const topVendorEntry = Object.entries(topVendor).sort((a, b) => b[1] - a[1])[0];

  const handleNodeClick = (item) => {
    setSelectedFlow(item);
  };

  const closeModal = () => {
    setSelectedFlow(null);
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
      className="min-h-screen p-6 bg-gray-900 text-white"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <GradientHeader
            title="Flow Dashboard"
            subtitle="Real-time budget flows and transaction monitoring"
          />
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search budgets, transactions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <Bell className="h-6 w-6 text-gray-400 cursor-pointer hover:text-white transition-colors" />
            <User className="h-8 w-8 text-gray-400 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Budget Amount"
            value={formatCurrency(totalBudgetAmount)}
            subtitle="Across all budgets"
            color="emerald"
          />
          <StatCard
            icon={FileText}
            title="Active Transactions"
            value={filteredTransactions.length}
            subtitle="Ongoing activities"
            color="blue"
          />
          <StatCard
            icon={UserCheck}
            title="Top Vendor"
            value={topVendorEntry ? `${topVendorEntry[0]} - ${formatCurrency(topVendorEntry[1])}` : 'No data'}
            subtitle="Highest allocation"
            color="gold"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Spent"
            value={formatCurrency(totalTransactionAmount)}
            subtitle="All transactions"
            color="violet"
          />
        </div>

        {/* Budget Flow Visualization and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Flow Animation */}
          <Card className="bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center">
              <BarChart3 className="mr-2" />
              Budget Flow Visualization
            </h3>
            <div className="relative h-64 overflow-hidden">
              {filteredBudgets.slice(0, 5).map((budget, idx) => (
                <motion.div
                  key={`budget-${idx}`}
                  onClick={() => handleNodeClick(budget)}
                  className="absolute cursor-pointer"
                  style={{
                    top: `${50 + idx * 40}px`,
                    width: `${Math.min((budget.totalAmount || 0) / 10000, 200)}px`,
                    height: "12px",
                    borderRadius: "6px",
                    background: "linear-gradient(90deg, #10b981, #34d399)",
                    boxShadow: "0 0 8px #10b981",
                  }}
                  animate={{
                    x: ['-100%', '0%', '100%']
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    delay: idx * 0.5,
                    ease: "linear"
                  }}
                  title={`${budget.title} - ${formatCurrency(budget.totalAmount || 0)}`}
                >
                  <span className="absolute left-full ml-2 text-xs font-medium text-blue-800 bg-white bg-opacity-90 px-2 py-1 rounded whitespace-nowrap">
                    {budget.title} - {formatCurrency(budget.totalAmount || 0)}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Budget Summary Chart */}
          <Card className="bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Budget Summary</h3>
            <div className="h-64">
              <Bar 
                data={budgetChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* Transaction Distribution and Department Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Status Pie Chart */}
          <Card className="bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Transaction Distribution</h3>
            <div className="h-64">
              <Pie 
                data={transactionChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </Card>

          {/* Department Comparison */}
          <Card className="bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Department Comparison</h3>
            <div className="h-64">
              <Bar 
                data={comparisonData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true }
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/admin/budgets"
              className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <DollarSign className="mr-2" />
              Manage Budgets
            </Link>
            <Link 
              to="/admin/transactions"
              className="flex items-center justify-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FileText className="mr-2" />
              View Transactions
            </Link>
            <Link 
              to="/admin/approvals"
              className="flex items-center justify-center p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Users className="mr-2" />
              Department Approvals
            </Link>
          </div>
        </Card>
      </div>

      {/* Modal for Budget/Transaction Details */}
      {selectedFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="w-4/5 max-w-4xl bg-gray-800 text-white rounded-lg p-6 relative max-h-96 overflow-y-auto">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-2xl cursor-pointer hover:text-red-500"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold text-center text-blue-400 mb-4">
              {selectedFlow.title || selectedFlow.transactionId || 'Details'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <p><strong>Title:</strong> {selectedFlow.title || selectedFlow.transactionId || 'N/A'}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedFlow.totalAmount || selectedFlow.amount || 0)}</p>
                <p><strong>Category:</strong> {selectedFlow.category || selectedFlow.vendorName || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedFlow.status || 'Active'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Additional Details</h4>
                <p><strong>Created:</strong> {selectedFlow.createdAt ? new Date(selectedFlow.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Financial Year:</strong> {selectedFlow.financialYear || 'Current'}</p>
                {selectedFlow.description && (
                  <p><strong>Description:</strong> {selectedFlow.description}</p>
                )}
              </div>
            </div>

            {/* Process Steps */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Process Flow</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  "Initiation: Request created",
                  "Approval: Reviewed by manager", 
                  "Allocation: Funds assigned",
                  "Processing: Transaction started",
                  "Verification: Amount verified",
                  "Adjustment: Budget modified",
                  "Transfer: Payment released",
                  "Confirmation: Receipt acknowledged",
                  "Completion: Process closed"
                ].map((step, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 border border-gray-600 rounded-lg text-center ${
                      idx % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600'
                    }`}
                  >
                    <h5 className="font-medium mb-1">Step {idx + 1}</h5>
                    <p className="text-sm text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
