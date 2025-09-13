import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import Alert from '../models/Alert.js';
import User from '../models/User.js';

class AnomalyDetectionService {
  constructor() {
    this.thresholds = {
      budget_overrun: 100, // 100% of allocated amount
      approaching_limit: 85, // 85% of allocated amount
      unusual_spending: 50, // 50% increase from average
      high_frequency_transactions: 10 // 10 transactions in 24 hours
    };
  }

  // Main method to check for all types of anomalies
  async detectAnomalies(budgetId = null, departmentId = null) {
    try {
      const results = {
        budgetOverruns: [],
        approachingLimits: [],
        unusualSpending: [],
        highFrequencyTransactions: [],
        totalAlertsGenerated: 0
      };

      // Get budgets to analyze
      const filter = {};
      if (budgetId) filter._id = budgetId;
      if (departmentId) filter['departments.departmentId'] = departmentId;

      const budgets = await Budget.find(filter)
        .populate('departments.departmentId', 'departmentName departmentCode email');

      for (const budget of budgets) {
        // Check each department allocation in the budget
        for (const deptAllocation of budget.departments) {
          const anomalies = await this.checkDepartmentAnomalies(budget, deptAllocation);
          
          results.budgetOverruns.push(...anomalies.budgetOverruns);
          results.approachingLimits.push(...anomalies.approachingLimits);
          results.unusualSpending.push(...anomalies.unusualSpending);
          results.highFrequencyTransactions.push(...anomalies.highFrequencyTransactions);
        }
      }

      results.totalAlertsGenerated = 
        results.budgetOverruns.length + 
        results.approachingLimits.length + 
        results.unusualSpending.length + 
        results.highFrequencyTransactions.length;

      return results;
    } catch (error) {
      console.error('Error in anomaly detection:', error);
      throw error;
    }
  }

  // Check anomalies for a specific department allocation
  async checkDepartmentAnomalies(budget, deptAllocation) {
    const results = {
      budgetOverruns: [],
      approachingLimits: [],
      unusualSpending: [],
      highFrequencyTransactions: []
    };

    const departmentId = deptAllocation.departmentId._id;
    const allocatedAmount = deptAllocation.allocatedAmount;
    const spentAmount = deptAllocation.spentAmount;
    const utilizationPercentage = (spentAmount / allocatedAmount) * 100;

    // 1. Check for budget overruns
    if (utilizationPercentage >= this.thresholds.budget_overrun) {
      const alert = await this.createAlert({
        type: 'budget_overrun',
        severity: 'critical',
        title: `Budget Overrun Detected`,
        description: `Department ${deptAllocation.departmentId.departmentName} has exceeded their allocated budget of ${this.formatCurrency(allocatedAmount)}. Current spending: ${this.formatCurrency(spentAmount)} (${utilizationPercentage.toFixed(1)}%)`,
        budgetId: budget._id,
        departmentId: departmentId,
        threshold: { percentage: this.thresholds.budget_overrun, amount: allocatedAmount },
        currentValues: { spentAmount, allocatedAmount, utilizationPercentage }
      });
      results.budgetOverruns.push(alert);
    }

    // 2. Check for approaching limits
    else if (utilizationPercentage >= this.thresholds.approaching_limit) {
      const alert = await this.createAlert({
        type: 'approaching_limit',
        severity: utilizationPercentage >= 95 ? 'high' : 'medium',
        title: `Budget Limit Approaching`,
        description: `Department ${deptAllocation.departmentId.departmentName} is approaching their budget limit. Current usage: ${utilizationPercentage.toFixed(1)}% of allocated ${this.formatCurrency(allocatedAmount)}`,
        budgetId: budget._id,
        departmentId: departmentId,
        threshold: { percentage: this.thresholds.approaching_limit, amount: allocatedAmount },
        currentValues: { spentAmount, allocatedAmount, utilizationPercentage }
      });
      results.approachingLimits.push(alert);
    }

    // 3. Check for unusual spending patterns
    const unusualSpending = await this.detectUnusualSpending(budget._id, departmentId);
    if (unusualSpending) {
      results.unusualSpending.push(unusualSpending);
    }

    // 4. Check for high frequency transactions
    const highFrequency = await this.detectHighFrequencyTransactions(budget._id, departmentId);
    if (highFrequency) {
      results.highFrequencyTransactions.push(highFrequency);
    }

    return results;
  }

  // Detect unusual spending patterns
  async detectUnusualSpending(budgetId, departmentId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get average spending for last 30 days (excluding last 7 days)
      const historicalTransactions = await Transaction.find({
        budgetId,
        departmentId,
        status: { $in: ['approved', 'completed'] },
        createdAt: { $gte: thirtyDaysAgo, $lt: sevenDaysAgo }
      });

      // Get recent spending (last 7 days)
      const recentTransactions = await Transaction.find({
        budgetId,
        departmentId,
        status: { $in: ['approved', 'completed'] },
        createdAt: { $gte: sevenDaysAgo }
      });

      if (historicalTransactions.length === 0) return null;

      const historicalAverage = historicalTransactions.reduce((sum, t) => sum + t.amount, 0) / historicalTransactions.length;
      const recentTotal = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
      const recentAverage = recentTransactions.length > 0 ? recentTotal / recentTransactions.length : 0;

      const increasePercentage = ((recentAverage - historicalAverage) / historicalAverage) * 100;

      if (increasePercentage >= this.thresholds.unusual_spending) {
        const department = await User.findById(departmentId);
        return await this.createAlert({
          type: 'unusual_spending',
          severity: increasePercentage >= 100 ? 'high' : 'medium',
          title: `Unusual Spending Pattern Detected`,
          description: `Department ${department.departmentName} shows unusual spending increase of ${increasePercentage.toFixed(1)}% compared to historical average. Recent average: ${this.formatCurrency(recentAverage)}, Historical average: ${this.formatCurrency(historicalAverage)}`,
          budgetId,
          departmentId,
          threshold: { percentage: this.thresholds.unusual_spending },
          currentValues: { 
            recentAverage, 
            historicalAverage, 
            increasePercentage,
            recentTransactionCount: recentTransactions.length
          },
          metadata: {
            triggerCondition: `${increasePercentage.toFixed(1)}% increase in spending`,
            relatedTransactions: recentTransactions.map(t => t._id)
          }
        });
      }

      return null;
    } catch (error) {
      console.error('Error detecting unusual spending:', error);
      return null;
    }
  }

  // Detect high frequency transactions
  async detectHighFrequencyTransactions(budgetId, departmentId) {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentTransactions = await Transaction.find({
        budgetId,
        departmentId,
        createdAt: { $gte: twentyFourHoursAgo }
      });

      if (recentTransactions.length >= this.thresholds.high_frequency_transactions) {
        const department = await User.findById(departmentId);
        const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

        return await this.createAlert({
          type: 'high_frequency_transactions',
          severity: recentTransactions.length >= 20 ? 'high' : 'medium',
          title: `High Frequency Transactions Detected`,
          description: `Department ${department.departmentName} has submitted ${recentTransactions.length} transactions in the last 24 hours, totaling ${this.formatCurrency(totalAmount)}. This may indicate unusual activity.`,
          budgetId,
          departmentId,
          threshold: { count: this.thresholds.high_frequency_transactions },
          currentValues: { 
            transactionCount: recentTransactions.length,
            totalAmount,
            timeWindow: '24 hours'
          },
          metadata: {
            triggerCondition: `${recentTransactions.length} transactions in 24 hours`,
            relatedTransactions: recentTransactions.map(t => t._id)
          }
        });
      }

      return null;
    } catch (error) {
      console.error('Error detecting high frequency transactions:', error);
      return null;
    }
  }

  // Create an alert (avoid duplicates)
  async createAlert(alertData) {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await Alert.findOne({
        type: alertData.type,
        budgetId: alertData.budgetId,
        departmentId: alertData.departmentId,
        status: 'active',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
      });

      if (existingAlert) {
        // Update existing alert with new values
        existingAlert.currentValues = alertData.currentValues;
        existingAlert.description = alertData.description;
        existingAlert.metadata = { ...existingAlert.metadata, ...alertData.metadata };
        await existingAlert.save();
        return existingAlert;
      }

      // Create new alert
      const alert = new Alert(alertData);
      await alert.save();
      
      // Populate references for return
      await alert.populate([
        { path: 'budgetId', select: 'title category financialYear' },
        { path: 'departmentId', select: 'departmentName departmentCode email' }
      ]);

      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  // Get active alerts with filters
  async getActiveAlerts(filters = {}) {
    try {
      const query = { status: 'active' };
      
      if (filters.type) query.type = filters.type;
      if (filters.severity) query.severity = filters.severity;
      if (filters.budgetId) query.budgetId = filters.budgetId;
      if (filters.departmentId) query.departmentId = filters.departmentId;

      const alerts = await Alert.find(query)
        .populate('budgetId', 'title category financialYear')
        .populate('departmentId', 'departmentName departmentCode email')
        .populate('transactionId', 'transactionId amount description')
        .sort({ severity: -1, createdAt: -1 });

      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw error;
    }
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId, userId) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        {
          status: 'acknowledged',
          acknowledgedBy: userId,
          acknowledgedAt: new Date()
        },
        { new: true }
      ).populate([
        { path: 'budgetId', select: 'title category' },
        { path: 'departmentId', select: 'departmentName departmentCode' },
        { path: 'acknowledgedBy', select: 'email role' }
      ]);

      return alert;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Get alert statistics
  async getAlertStatistics(timeframe = '30d') {
    try {
      const days = parseInt(timeframe.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Alert.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              type: '$type',
              severity: '$severity'
            },
            count: { $sum: 1 },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $ne: ['$resolvedAt', null] },
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            severityBreakdown: {
              $push: {
                severity: '$_id.severity',
                count: '$count',
                avgResolutionTime: '$avgResolutionTime'
              }
            },
            totalCount: { $sum: '$count' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      throw error;
    }
  }

  // Utility method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Schedule periodic anomaly detection
  async schedulePeriodicCheck() {
    console.log('Running scheduled anomaly detection...');
    try {
      const results = await this.detectAnomalies();
      console.log(`Anomaly detection completed. Generated ${results.totalAlertsGenerated} alerts.`);
      return results;
    } catch (error) {
      console.error('Error in scheduled anomaly detection:', error);
    }
  }
}

export default new AnomalyDetectionService();
