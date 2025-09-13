import express from 'express';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/chat - Answer chatbot questions using live database
router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ answer: 'Please provide a valid question.' });
  }

  try {
    // Normalize question
    const q = question.trim().toLowerCase();

    // 1. Total budget allocated
    if (q.includes('total budget allocated') || q.includes('total allocated')) {
      const stats = await Budget.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalAllocated: { $sum: '$totalAmount' } } }
      ]);
      const total = stats[0]?.totalAllocated || 0;
      return res.json({ answer: `The total budget allocated is ₹${total.toLocaleString()}.` });
    }

    // 2. Total spent so far
    if (q.includes('spent so far') || q.includes('total spent')) {
      const stats = await Budget.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalSpent: { $sum: '$spentAmount' } } }
      ]);
      const total = stats[0]?.totalSpent || 0;
      return res.json({ answer: `The total amount spent so far is ₹${total.toLocaleString()}.` });
    }

    // 3. Remaining budget
    if (q.includes('remaining budget')) {
      const stats = await Budget.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalRemaining: { $sum: '$remainingAmount' } } }
      ]);
      const total = stats[0]?.totalRemaining || 0;
      return res.json({ answer: `The remaining budget is ₹${total.toLocaleString()}.` });
    }

    // 4. List all departments and their budgets
    if (q.includes('departments') && q.includes('budget')) {
      const departments = await User.find({ role: 'department', isApproved: true })
        .select('departmentName departmentCode');
      const budgets = await Budget.find({ status: 'active' })
        .select('title totalAmount departments');
      let answer = 'Departments and their budgets:\n';
      departments.forEach(dept => {
        const deptBudgets = budgets.filter(b => b.departments.some(d => d.departmentId.toString() === dept._id.toString()));
        const total = deptBudgets.reduce((sum, b) => {
          const d = b.departments.find(d => d.departmentId.toString() === dept._id.toString());
          return sum + (d?.allocatedAmount || 0);
        }, 0);
        answer += `- ${dept.departmentName} (${dept.departmentCode}): ₹${total.toLocaleString()}\n`;
      });
      return res.json({ answer });
    }

    // 5. Show recent transactions
    if (q.includes('recent transactions')) {
      const txns = await Transaction.find({ isPublic: true, status: { $in: ['approved', 'completed'] } })
        .sort({ approvedAt: -1 })
        .limit(5)
        .select('transactionId amount description vendorName approvedAt');
      if (!txns.length) return res.json({ answer: 'No recent transactions found.' });
      let answer = 'Recent transactions:\n';
      txns.forEach(t => {
        answer += `- ${t.transactionId}: ₹${t.amount.toLocaleString()} (${t.vendorName}) on ${t.approvedAt?.toLocaleDateString?.() || 'N/A'}\n`;
      });
      return res.json({ answer });
    }

    // 6. Who approved the last transaction?
    if (q.includes('who approved') && q.includes('transaction')) {
      const txn = await Transaction.findOne({ isPublic: true, status: { $in: ['approved', 'completed'] } })
        .sort({ approvedAt: -1 })
        .populate('approvedBy', 'email');
      if (!txn) return res.json({ answer: 'No approved transactions found.' });
      return res.json({ answer: `The last transaction was approved by ${txn.approvedBy?.email || 'N/A'}.` });
    }

    // 7. Largest expense this month
    if (q.includes('largest expense') && q.includes('month')) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const txn = await Transaction.findOne({
        isPublic: true,
        status: { $in: ['approved', 'completed'] },
        approvedAt: { $gte: firstDay, $lte: lastDay }
      }).sort({ amount: -1 });
      if (!txn) return res.json({ answer: 'No expenses found for this month.' });
      return res.json({ answer: `The largest expense this month is ₹${txn.amount.toLocaleString()} for ${txn.description}.` });
    }

    // 8. Budget for IT department
    if (q.includes('budget for it department')) {
      const dept = await User.findOne({ role: 'department', departmentName: /it/i, isApproved: true });
      if (!dept) return res.json({ answer: 'IT department not found.' });
      const budgets = await Budget.find({ 'departments.departmentId': dept._id, status: 'active' });
      const total = budgets.reduce((sum, b) => {
        const d = b.departments.find(d => d.departmentId.toString() === dept._id.toString());
        return sum + (d?.allocatedAmount || 0);
      }, 0);
      return res.json({ answer: `The IT department's total allocated budget is ₹${total.toLocaleString()}.` });
    }

    // 9. Budget utilization rate
    if (q.includes('budget utilization rate')) {
      const stats = await Budget.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, totalSpent: { $sum: '$spentAmount' } } }
      ]);
      const total = stats[0]?.totalAmount || 0;
      const spent = stats[0]?.totalSpent || 0;
      const rate = total > 0 ? (spent / total) * 100 : 0;
      return res.json({ answer: `The overall budget utilization rate is ${rate.toFixed(2)}%.` });
    }

    // 10. How do I submit an expense?
    if (q.includes('how do i submit') && q.includes('expense')) {
      return res.json({ answer: 'To submit an expense, go to the Department Dashboard and click on "Submit Expense". Fill in the required details and submit for approval.' });
    }

    // 11. Approval process for expenses
    if (q.includes('approval process') && q.includes('expense')) {
      return res.json({ answer: 'Expenses are submitted by departments, reviewed and approved by admins. Approved transactions are then completed and recorded.' });
    }

    // 12. Transactions pending approval
    if (q.includes('transactions pending approval')) {
      const count = await Transaction.countDocuments({ status: 'pending' });
      return res.json({ answer: `There are currently ${count} transactions pending approval.` });
    }

    // 13. How do I reset my password?
    if (q.includes('reset my password')) {
      return res.json({ answer: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions to reset.' });
    }

    // 14. What currencies are supported?
    if (q.includes('currencies are supported')) {
      return res.json({ answer: 'Supported currencies: INR, USD, EUR, GBP.' });
    }

    // 15. How do I contact support?
    if (q.includes('contact support')) {
      return res.json({ answer: 'You can contact support at support@fundtracker.gov.in.' });
    }

    // Fallback
    return res.json({ answer: 'Sorry, I could not find an answer for your question. Please try rephrasing or ask something else.' });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ answer: 'Server error answering your question.' });
  }
});

export default router;
