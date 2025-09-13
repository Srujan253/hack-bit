import React, { useState, useEffect } from 'react';
import { FileSearch, Search } from 'lucide-react';
import { transactionAPI } from '../services/api';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Card from './common/Card';
import Icon from './common/Icon';
import ActionButton from './common/Button';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: ''
  });

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
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#0F172A] p-6"
    >
      <Card className="rounded-xl shadow-md p-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Transactions</h1>
        <p className="text-white/80">Manage your transactions</p>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6">
        <div className="flex items-center bg-[#1E293B] border border-gray-700 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-400 hover:border-indigo-500 transition-all flex-grow mb-4 md:mb-0">
          <Icon as={Search} className="text-gray-400 w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="bg-transparent focus:outline-none text-white placeholder-gray-400 w-full"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="bg-[#1E293B] border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 hover:border-indigo-500 transition-all text-white mb-4 md:mb-0"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="bg-[#1E293B] border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 hover:border-indigo-500 transition-all text-white mb-4 md:mb-0"
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
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="bg-[#1E293B] border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 hover:border-indigo-500 transition-all text-white"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin mx-auto mb-3 text-gray-500 w-10 h-10 rounded-full border-b-2 border-gray-500"></div>
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <motion.div
          className="text-center text-gray-400 py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FileSearch className="mx-auto mb-3 text-gray-500 w-10 h-10" />
          <p>No transactions found</p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
          }}
          className="space-y-4"
        >
          {transactions.map((transaction) => (
            <motion.div
              key={transaction._id}
              whileHover={{ scale: 1.02 }}
              className="bg-[#1E293B] rounded-xl shadow-md p-4 cursor-pointer text-white"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{transaction.transactionId}</h3>
                  <p className="text-gray-300 truncate max-w-xs" title={transaction.description}>
                    {transaction.description}
                  </p>
                  <p className="text-gray-500 text-xs">Vendor: {transaction.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                  <p className="text-gray-400 text-xs">{formatDate(transaction.requestedAt)}</p>
                </div>
              </div>
              <div className="mt-2 flex space-x-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-semibold ${getPriorityColor(transaction.priority)}`}>
                  {transaction.priority}
                </span>
                <span className={`px-2 py-1 rounded-full font-semibold ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Transaction;
