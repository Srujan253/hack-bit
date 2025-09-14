import React, { useState, useEffect } from "react";
import { Search, BarChart3 } from "lucide-react";
import { budgetAPI, commentAPI } from "../../services/api";
// BudgetComments component for public comments (no login required)
const BudgetComments = ({ budgetId }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [budgetId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await commentAPI.getBudgetComments(budgetId);
      setComments(res.data.comments || []);
    } catch (err) {
      setErrorMsg("Failed to load comments");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    if (!name.trim() || !email.trim() || !commentText.trim()) {
      setErrorMsg("Name, email, and comment are required.");
      setSubmitting(false);
      return;
    }
    try {
      const res = await commentAPI.postBudgetComment(budgetId, {
        name: name.trim(),
        email: email.trim(),
        comment: commentText.trim(),
      });
      setSuccessMsg("Comment submitted!");
      setCommentText("");
      setName("");
      setEmail("");
      // Force page reload after successful comment submission
      window.location.reload();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Failed to submit comment.");
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-indigo-500 shadow-2xl">
        <h4 className="text-white text-xl font-bold mb-6 text-center tracking-wide drop-shadow">
          💬 Public Comments
        </h4>
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 flex flex-col items-center"
        >
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-700 border-2 border-indigo-400 text-white flex-1 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-700 border-2 border-indigo-400 text-white flex-1 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-700 border-2 border-indigo-400 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            required
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-all duration-200 disabled:opacity-60 mt-2 text-base"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Post Comment"}
          </button>
          {successMsg && (
            <div className="text-green-400 text-base mt-1 text-center font-medium">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="text-red-400 text-base mt-1 text-center font-medium">
              {errorMsg}
            </div>
          )}
        </form>
        <div className="border-t border-slate-600 mb-6"></div>
        <div className="w-full">
          {loading ? (
            <div className="text-slate-400 text-center">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-slate-400 text-center">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className="bg-slate-700 rounded-xl p-4 border border-indigo-400 shadow"
                >
                  <div className="text-slate-100 text-base font-medium">
                    {c.comment}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex justify-between items-center">
                    <span>{c.name || "Anonymous"}</span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import { formatDate, getStatusColor } from "../../utils/helpers";
import useCurrencyStore from "../../store/currencyStore";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import GradientHeader from "../common/GradientHeader";
import StatCard from "../common/StatCard";
import ActionButton from "../common/Button";
import Icon from "../common/Icon";
import Card from "../common/Card";

const DepartmentBudgets = () => {
  const { user } = useAuthStore();
  const { formatCurrency, convertFinancialData } = useCurrencyStore();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    financialYear: "",
  });

  useEffect(() => {
    fetchBudgets();

    // Listen for currency changes
    const handleCurrencyChange = () => {
      fetchBudgets();
    };

    window.addEventListener("currencyChanged", handleCurrencyChange);
    return () =>
      window.removeEventListener("currencyChanged", handleCurrencyChange);
  }, [filters]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getDepartmentBudgets();
      const budgetData = response.data.budgets || [];

      // Convert budget data to current currency
      const convertedBudgets = budgetData.map((budget) =>
        convertFinancialData(budget, "INR")
      );
      setBudgets(convertedBudgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const BudgetCard = ({ budget }) => {
    const allocation = budget.myAllocation;
    const allocatedAmount = allocation?.allocated || 0;
    const spentAmount = allocation?.spent || 0;
    const remainingAmount = allocation?.remaining || 0;
    const spentPercentage =
      allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0;

    // Toggle for showing/hiding comments
    const [showComments, setShowComments] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
        className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-xl border border-slate-700 p-6 text-white"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{budget.title}</h3>
            <p className="text-sm text-slate-300 mt-1">{budget.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded-full"
              >
                {budget.category}
              </motion.span>
              <span className="text-xs text-slate-400">
                {budget.financialYear}
              </span>
            </div>
          </div>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              budget.status
            )}`}
          >
            {budget.status}
          </motion.span>
        </div>

        <div className="space-y-4">
          {/* Budget Amounts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-300">Allocated</p>
              <p className="text-lg font-semibold text-blue-400">
                {formatCurrency(allocatedAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-300">Spent</p>
              <p className="text-lg font-semibold text-green-400">
                {formatCurrency(spentAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-300">Remaining</p>
              <p className="text-lg font-semibold text-slate-200">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-slate-300 mb-1">
              <span>Budget Utilization</span>
              <span>{spentPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  spentPercentage > 90
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : spentPercentage > 75
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Budget Details */}
          <div className="pt-4 border-t border-slate-600">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-300">Total Budget:</span>
                <span className="ml-2 font-medium text-white">
                  {formatCurrency(budget.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-300">Created:</span>
                <span className="ml-2 text-white">
                  {formatDate(budget.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row md:space-x-3 space-y-2 md:space-y-0 pt-4">
            <ActionButton variant="primary" icon={BarChart3}>
              View Details
            </ActionButton>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                showComments
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-indigo-700 border-indigo-500 hover:bg-indigo-50"
              }`}
              onClick={() => setShowComments((prev) => !prev)}
            >
              {showComments ? "Hide Public Feedback" : "View Public Feedback"}
            </button>
          </div>

          {/* Comments Section (public, toggled) */}
          {showComments && <BudgetComments budgetId={budget._id} />}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"
    >
      {/* Header */}
      <GradientHeader
        title="Budget Overview"
        subtitle="View your department's budget allocations and spending"
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 p-6 mt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Icon
              as={Search}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search budgets..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          >
            <option value="" className="bg-slate-700 text-white">
              All Categories
            </option>
            <option value="infrastructure" className="bg-slate-700 text-white">
              Infrastructure
            </option>
            <option value="education" className="bg-slate-700 text-white">
              Education
            </option>
            <option value="healthcare" className="bg-slate-700 text-white">
              Healthcare
            </option>
            <option value="welfare" className="bg-slate-700 text-white">
              Welfare
            </option>
            <option value="development" className="bg-slate-700 text-white">
              Development
            </option>
            <option value="administration" className="bg-slate-700 text-white">
              Administration
            </option>
            <option value="other" className="bg-slate-700 text-white">
              Other
            </option>
          </select>

          <input
            type="text"
            placeholder="Financial Year (e.g., 2024-2025)"
            value={filters.financialYear}
            onChange={(e) =>
              setFilters({ ...filters, financialYear: e.target.value })
            }
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-400"
          />
        </div>
      </motion.div>

      {/* Budget Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : budgets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 p-12 text-center mt-6"
        >
          <Icon
            as={BarChart3}
            size={48}
            className="text-slate-400 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-white mb-2">
            No Budget Allocations
          </h3>
          <p className="text-slate-300">
            {filters.search || filters.category || filters.financialYear
              ? "No budgets found matching your search criteria."
              : "Your department has no budget allocations yet."}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"
        >
          <AnimatePresence>
            {budgets.map((budget) => (
              <motion.div
                key={budget._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <BudgetCard budget={budget} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Summary Stats */}
      {budgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl border border-slate-600 p-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Budget Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={BarChart3}
              title="Total Allocated"
              value={formatCurrency(
                budgets.reduce((sum, budget) => {
                  const allocation = budget.myAllocation;
                  return sum + (allocation?.allocated || 0);
                }, 0)
              )}
              color="blue"
            />
            <StatCard
              icon={BarChart3}
              title="Total Spent"
              value={formatCurrency(
                budgets.reduce((sum, budget) => {
                  const allocation = budget.myAllocation;
                  return sum + (allocation?.spent || 0);
                }, 0)
              )}
              color="emerald"
            />
            <StatCard
              icon={BarChart3}
              title="Remaining"
              value={formatCurrency(
                budgets.reduce((sum, budget) => {
                  const allocation = budget.myAllocation;
                  return sum + (allocation?.remaining || 0);
                }, 0)
              )}
              color="indigo"
            />
            <StatCard
              icon={BarChart3}
              title="Active Budgets"
              value={budgets.filter((b) => b.status === "active").length}
              color="violet"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DepartmentBudgets;
