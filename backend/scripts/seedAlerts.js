import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Alert from '../models/Alert.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import anomalyDetectionService from '../services/anomalyDetection.js';

dotenv.config();

async function seedAlerts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing alerts
    await Alert.deleteMany({});
    console.log('Cleared existing alerts');

    // Run anomaly detection to generate real alerts
    console.log('Running anomaly detection...');
    const results = await anomalyDetectionService.detectAnomalies();
    
    console.log('Anomaly detection results:');
    console.log(`- Budget overruns: ${results.budgetOverruns.length}`);
    console.log(`- Approaching limits: ${results.approachingLimits.length}`);
    console.log(`- Unusual spending: ${results.unusualSpending.length}`);
    console.log(`- High frequency transactions: ${results.highFrequencyTransactions.length}`);
    console.log(`- Total alerts generated: ${results.totalAlertsGenerated}`);

    // If no real alerts were generated, create some sample ones for testing
    if (results.totalAlertsGenerated === 0) {
      console.log('No real anomalies detected. Creating sample alerts for testing...');
      
      const budgets = await Budget.find().limit(3);
      const departments = await User.find({ role: 'department' }).limit(3);
      
      if (budgets.length > 0 && departments.length > 0) {
        const sampleAlerts = [
          {
            type: 'budget_overrun',
            severity: 'critical',
            title: 'Budget Overrun Detected - IT Department',
            description: 'IT Department has exceeded their allocated budget by 15%. Immediate attention required.',
            budgetId: budgets[0]._id,
            departmentId: departments[0]._id,
            threshold: { percentage: 100, amount: 100000 },
            currentValues: { 
              spentAmount: 115000, 
              allocatedAmount: 100000, 
              utilizationPercentage: 115 
            },
            status: 'active'
          },
          {
            type: 'approaching_limit',
            severity: 'high',
            title: 'Budget Limit Approaching - Healthcare',
            description: 'Healthcare Department has used 92% of their allocated budget. Consider reviewing upcoming expenses.',
            budgetId: budgets[1]._id,
            departmentId: departments[1]._id,
            threshold: { percentage: 85, amount: 150000 },
            currentValues: { 
              spentAmount: 138000, 
              allocatedAmount: 150000, 
              utilizationPercentage: 92 
            },
            status: 'active'
          },
          {
            type: 'unusual_spending',
            severity: 'medium',
            title: 'Unusual Spending Pattern Detected',
            description: 'Administration Department shows 75% increase in spending compared to historical average.',
            budgetId: budgets[2]._id,
            departmentId: departments[2]._id,
            threshold: { percentage: 50 },
            currentValues: { 
              recentAverage: 8750, 
              historicalAverage: 5000, 
              increasePercentage: 75 
            },
            status: 'active'
          }
        ];

        const createdAlerts = await Alert.insertMany(sampleAlerts);
        console.log(`Created ${createdAlerts.length} sample alerts for testing`);
      }
    }

    console.log('Alert seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding alerts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedAlerts();
