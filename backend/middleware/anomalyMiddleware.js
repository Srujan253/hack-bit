import anomalyDetectionService from '../services/anomalyDetection.js';
import Budget from '../models/Budget.js';

// Middleware to trigger anomaly detection after budget-affecting operations
export const triggerAnomalyDetection = async (req, res, next) => {
  // Store original res.json to intercept successful responses
  const originalJson = res.json;
  
  res.json = function(data) {
    // Call original response first
    originalJson.call(this, data);
    
    // Trigger anomaly detection asynchronously after successful operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setImmediate(async () => {
        try {
          let budgetId = null;
          let departmentId = null;
          
          // Extract relevant IDs based on the operation
          if (req.route.path.includes('allocate') && req.params.budgetId) {
            budgetId = req.params.budgetId;
            departmentId = req.body.departmentId;
          } else if (req.route.path.includes('submit') && data.transaction) {
            budgetId = data.transaction.budgetId;
            departmentId = data.transaction.departmentId;
          } else if (req.route.path.includes('review') && data.transaction) {
            budgetId = data.transaction.budgetId;
            departmentId = data.transaction.departmentId;
          }
          
          if (budgetId || departmentId) {
            console.log(`Triggering anomaly detection for budget: ${budgetId}, department: ${departmentId}`);
            await anomalyDetectionService.detectAnomalies(budgetId, departmentId);
          }
        } catch (error) {
          console.error('Error in automatic anomaly detection:', error);
        }
      });
    }
  };
  
  next();
};

// Middleware to check budget thresholds before transaction approval
export const checkBudgetThresholds = async (req, res, next) => {
  try {
    if (req.body.action === 'approve' && req.params.transactionId) {
      const Transaction = (await import('../models/Transaction.js')).default;
      const transaction = await Transaction.findById(req.params.transactionId)
        .populate('budgetId')
        .populate('departmentId');
      
      if (transaction && transaction.budgetId) {
        const budget = transaction.budgetId;
        const deptAllocation = budget.departments.find(
          d => d.departmentId.toString() === transaction.departmentId._id.toString()
        );
        
        if (deptAllocation) {
          const newSpentAmount = deptAllocation.spentAmount + transaction.amount;
          const utilizationPercentage = (newSpentAmount / deptAllocation.allocatedAmount) * 100;
          
          // Add warning headers for high utilization
          if (utilizationPercentage >= 90) {
            res.set('X-Budget-Warning', 'high-utilization');
            res.set('X-Utilization-Percentage', utilizationPercentage.toFixed(1));
          }
          
          // Block if would cause overrun (optional - can be configured)
          if (utilizationPercentage > 100 && process.env.STRICT_BUDGET_ENFORCEMENT === 'true') {
            return res.status(400).json({
              message: 'Transaction approval would cause budget overrun',
              currentSpent: deptAllocation.spentAmount,
              transactionAmount: transaction.amount,
              allocatedAmount: deptAllocation.allocatedAmount,
              wouldExceedBy: newSpentAmount - deptAllocation.allocatedAmount
            });
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in budget threshold check:', error);
    next(); // Continue even if check fails
  }
};
