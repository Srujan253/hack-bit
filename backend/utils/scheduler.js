import cron from 'node-cron';
import anomalyDetectionService from '../services/anomalyDetection.js';

class SchedulerService {
  constructor() {
    this.tasks = new Map();
  }

  // Start all scheduled tasks
  startScheduledTasks() {
    console.log('Starting scheduled tasks...');
    
    // Run anomaly detection every 30 minutes
    this.scheduleAnomalyDetection();
    
    // Run comprehensive anomaly detection every 6 hours
    this.scheduleComprehensiveDetection();
    
    console.log('All scheduled tasks started successfully');
  }

  // Schedule regular anomaly detection (every 30 minutes)
  scheduleAnomalyDetection() {
    const task = cron.schedule('*/30 * * * *', async () => {
      console.log('Running scheduled anomaly detection...');
      try {
        const results = await anomalyDetectionService.detectAnomalies();
        console.log(`Anomaly detection completed. Generated ${results.totalAlertsGenerated} alerts.`);
        
        if (results.totalAlertsGenerated > 0) {
          console.log('Alert breakdown:');
          console.log(`- Budget overruns: ${results.budgetOverruns.length}`);
          console.log(`- Approaching limits: ${results.approachingLimits.length}`);
          console.log(`- Unusual spending: ${results.unusualSpending.length}`);
          console.log(`- High frequency transactions: ${results.highFrequencyTransactions.length}`);
        }
      } catch (error) {
        console.error('Error in scheduled anomaly detection:', error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    this.tasks.set('anomalyDetection', task);
    task.start();
    console.log('Scheduled anomaly detection every 30 minutes');
  }

  // Schedule comprehensive detection (every 6 hours)
  scheduleComprehensiveDetection() {
    const task = cron.schedule('0 */6 * * *', async () => {
      console.log('Running comprehensive anomaly detection...');
      try {
        // Get statistics for reporting
        const stats = await anomalyDetectionService.getAlertStatistics('24h');
        console.log('24-hour alert statistics:', stats);
        
        // Run full detection
        const results = await anomalyDetectionService.detectAnomalies();
        console.log(`Comprehensive detection completed. Generated ${results.totalAlertsGenerated} alerts.`);
        
        // Log summary for monitoring
        this.logDetectionSummary(results, stats);
      } catch (error) {
        console.error('Error in comprehensive anomaly detection:', error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    this.tasks.set('comprehensiveDetection', task);
    task.start();
    console.log('Scheduled comprehensive anomaly detection every 6 hours');
  }

  // Log detection summary for monitoring
  logDetectionSummary(results, stats) {
    const summary = {
      timestamp: new Date().toISOString(),
      newAlerts: results.totalAlertsGenerated,
      breakdown: {
        budgetOverruns: results.budgetOverruns.length,
        approachingLimits: results.approachingLimits.length,
        unusualSpending: results.unusualSpending.length,
        highFrequencyTransactions: results.highFrequencyTransactions.length
      },
      last24Hours: stats
    };
    
    console.log('=== ANOMALY DETECTION SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log('================================');
  }

  // Stop a specific scheduled task
  stopTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      this.tasks.delete(taskName);
      console.log(`Stopped scheduled task: ${taskName}`);
    }
  }

  // Stop all scheduled tasks
  stopAllTasks() {
    console.log('Stopping all scheduled tasks...');
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`Stopped task: ${name}`);
    }
    this.tasks.clear();
    console.log('All scheduled tasks stopped');
  }

  // Get status of all tasks
  getTasksStatus() {
    const status = {};
    for (const [name, task] of this.tasks) {
      status[name] = {
        running: task.running,
        scheduled: task.scheduled
      };
    }
    return status;
  }

  // Manual trigger for testing
  async triggerAnomalyDetection() {
    console.log('Manually triggering anomaly detection...');
    try {
      const results = await anomalyDetectionService.detectAnomalies();
      console.log(`Manual detection completed. Generated ${results.totalAlertsGenerated} alerts.`);
      return results;
    } catch (error) {
      console.error('Error in manual anomaly detection:', error);
      throw error;
    }
  }
}

export default new SchedulerService();
