import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { budgetAPI } from '../../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import Card from '../common/Card';
import Icon from '../common/Icon';

const AdminBudgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    financialYear: ''
  });

  useEffect(() => {
    fetchBudgets();
  }, [filters]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getBudgets(filters);
      setBudgets(response.data.budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const CreateBudgetModal = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      totalAmount: '',
      financialYear: '',
      category: 'infrastructure'
    });
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setCreating(true);
        await budgetAPI.createBudget({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount)
        });
        toast.success('Budget created successfully');
        setShowCreateModal(false);
        fetchBudgets();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create budget');
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Budget</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
              <input
                type="number"
                required
                min="0"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Financial Year</label>
              <input
                type="text"
                required
                placeholder="2024-2025"
                pattern="\d{4}-\d{4}"
                value={formData.financialYear}
                onChange={(e) => setFormData({...formData, financialYear: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="infrastructure">Infrastructure</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="welfare">Welfare</option>
                <option value="development">Development</option>
                <option value="administration">Administration</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex space-x-3 pt-4">
              <ActionButton
                type="button"
                onClick={() => setShowCreateModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                disabled={creating}
                variant="primary"
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Budget'}
              </ActionButton>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
        title="Budget Management"
        subtitle="Create and manage budget allocations"
        actions={
          <ActionButton
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={Plus}
          >
            Create Budget
          </ActionButton>
        }
      />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Icon as={Search} size={20} color="text-textMuted" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="welfare">Welfare</option>
            <option value="development">Development</option>
            <option value="administration">Administration</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select>
          <input
            type="text"
            placeholder="Financial Year"
            value={filters.financialYear}
            onChange={(e) => setFilters({...filters, financialYear: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          />
        </div>
      </Card>

      {/* Budgets Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-backgroundSecondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                <AnimatePresence>
                  {budgets.map((budget, index) => (
                  <motion.tr
                    key={budget._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-backgroundSecondary"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-textPrimary">{budget.title}</div>
                        <div className="text-sm text-textMuted">{budget.category} • {budget.financialYear}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-textPrimary">
                      {formatCurrency(budget.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                      {formatCurrency(budget.allocatedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {formatCurrency(budget.spentAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {/* Handle edit */}}
                        >
                          Edit
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          size="sm"
                          onClick={() => {/* Handle allocate */}}
                        >
                          Allocate
                        </ActionButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {showCreateModal && <CreateBudgetModal />}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminBudgets;
