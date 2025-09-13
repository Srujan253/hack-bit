import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Play,
  Filter,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { alertAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import GradientHeader from '../common/GradientHeader';
import ActionButton from '../common/Button';
import Card from '../common/Card';
import Icon from '../common/Icon';

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

const AlertManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: 'active'
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [runningDetection, setRunningDetection] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
  }, [filters]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertAPI.getAlerts(filters);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await alertAPI.getAlertStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching alert statistics:', error);
    }
  };

  const runAnomalyDetection = async () => {
    try {
      setRunningDetection(true);
      const response = await alertAPI.runAnomalyDetection({});
      toast.success(`Detection completed! Generated ${response.data.results.totalAlertsGenerated} new alerts`);
      fetchAlerts();
      fetchStatistics();
    } catch (error) {
      toast.error('Failed to run anomaly detection');
    } finally {
      setRunningDetection(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId, comments = '') => {
    try {
      await alertAPI.resolveAlert(alertId, comments);
      toast.success('Alert resolved');
      fetchAlerts();
      setShowDetailsModal(false);
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleDismiss = async (alertId, reason = '') => {
    try {
      await alertAPI.dismissAlert(alertId, reason);
      toast.success('Alert dismissed');
      fetchAlerts();
      setShowDetailsModal(false);
    } catch (error) {
      toast.error('Failed to dismiss alert');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || colors.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      budget_overrun: AlertTriangle,
      approaching_limit: TrendingUp,
      unusual_spending: DollarSign,
      high_frequency_transactions: Clock
    };
    return icons[type] || AlertTriangle;
  };

  const AlertDetailsModal = () => {
    const [comments, setComments] = useState('');
    const [reason, setReason] = useState('');

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-surface rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-textPrimary mb-2">Alert Details</h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getSeverityColor(selectedAlert.severity)}`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
                <span className="text-sm text-textMuted">{selectedAlert.type.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => setShowDetailsModal(false)}
            >
              ×
            </ActionButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Information */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-textPrimary mb-2">Alert Information</h4>
                <div className="bg-surface/50 rounded-lg p-4 border border-border space-y-3">
                  <div>
                    <span className="text-sm font-medium text-textPrimary">Title:</span>
                    <p className="text-sm text-textMuted mt-1">{selectedAlert.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-textPrimary">Description:</span>
                    <p className="text-sm text-textMuted mt-1">{selectedAlert.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-textPrimary">Created:</span>
                    <p className="text-sm text-textMuted mt-1">{formatDate(selectedAlert.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Budget & Department Info */}
              <div>
                <h4 className="font-medium text-textPrimary mb-2">Related Information</h4>
                <div className="bg-surface/50 rounded-lg p-4 border border-border space-y-3">
                  <div>
                    <span className="text-sm font-medium text-textPrimary">Budget:</span>
                    <p className="text-sm text-textMuted mt-1">{selectedAlert.budgetId?.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-textPrimary">Department:</span>
                    <p className="text-sm text-textMuted mt-1">
                      {selectedAlert.departmentId?.departmentName} ({selectedAlert.departmentId?.departmentCode})
                    </p>
                  </div>
                  {selectedAlert.transactionId && (
                    <div>
                      <span className="text-sm font-medium text-textPrimary">Transaction:</span>
                      <p className="text-sm text-textMuted mt-1">{selectedAlert.transactionId.transactionId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Values & Thresholds */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-textPrimary mb-2">Current Values</h4>
                <div className="bg-surface/50 rounded-lg p-4 border border-border space-y-3">
                  {selectedAlert.currentValues?.spentAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-textMuted">Spent Amount:</span>
                      <span className="text-sm font-medium text-textPrimary">
                        {formatCurrency(selectedAlert.currentValues.spentAmount)}
                      </span>
                    </div>
                  )}
                  {selectedAlert.currentValues?.allocatedAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-textMuted">Allocated Amount:</span>
                      <span className="text-sm font-medium text-textPrimary">
                        {formatCurrency(selectedAlert.currentValues.allocatedAmount)}
                      </span>
                    </div>
                  )}
                  {selectedAlert.currentValues?.utilizationPercentage && (
                    <div className="flex justify-between">
                      <span className="text-sm text-textMuted">Utilization:</span>
                      <span className="text-sm font-medium text-textPrimary">
                        {selectedAlert.currentValues.utilizationPercentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-medium text-textPrimary mb-2">Actions</h4>
                <div className="space-y-3">
                  {selectedAlert.status === 'active' && (
                    <>
                      <ActionButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledge(selectedAlert._id)}
                        className="w-full"
                      >
                        <Icon as={CheckCircle} size={16} className="mr-2" />
                        Acknowledge Alert
                      </ActionButton>
                      
                      <div className="space-y-2">
                        <textarea
                          placeholder="Resolution comments..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:ring-2 focus:ring-primary focus:outline-none"
                          rows={3}
                        />
                        <ActionButton
                          variant="success"
                          size="sm"
                          onClick={() => handleResolve(selectedAlert._id, comments)}
                          className="w-full"
                        >
                          <Icon as={CheckCircle} size={16} className="mr-2" />
                          Resolve Alert
                        </ActionButton>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          placeholder="Dismissal reason..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:ring-2 focus:ring-primary focus:outline-none"
                          rows={2}
                        />
                        <ActionButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDismiss(selectedAlert._id, reason)}
                          className="w-full"
                        >
                          <Icon as={XCircle} size={16} className="mr-2" />
                          Dismiss Alert
                        </ActionButton>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="space-y-6 p-6"
    >
      <div className="flex justify-between items-center">
        <GradientHeader 
          title="Alert Management" 
          subtitle="Monitor and manage budget anomaly alerts" 
        />
        <ActionButton
          variant="primary"
          onClick={runAnomalyDetection}
          disabled={runningDetection}
          icon={Play}
        >
          {runningDetection ? 'Running...' : 'Run Detection'}
        </ActionButton>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textMuted">Active Alerts</p>
                <p className="text-2xl font-bold text-textPrimary">{statistics.summary?.active || 0}</p>
              </div>
              <Icon as={AlertTriangle} size={24} className="text-orange-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textMuted">Critical</p>
                <p className="text-2xl font-bold text-red-600">{statistics.severityBreakdown?.critical || 0}</p>
              </div>
              <Icon as={XCircle} size={24} className="text-red-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textMuted">Acknowledged</p>
                <p className="text-2xl font-bold text-textPrimary">{statistics.summary?.acknowledged || 0}</p>
              </div>
              <Icon as={CheckCircle} size={24} className="text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textMuted">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{statistics.summary?.resolved || 0}</p>
              </div>
              <Icon as={CheckCircle} size={24} className="text-green-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Icon as={Filter} size={20} className="text-textMuted" />
          <span className="font-medium text-textPrimary">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Types</option>
            <option value="budget_overrun">Budget Overrun</option>
            <option value="approaching_limit">Approaching Limit</option>
            <option value="unusual_spending">Unusual Spending</option>
            <option value="high_frequency_transactions">High Frequency</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({...filters, severity: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textPrimary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </Card>

      {/* Alerts List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-textMuted">
            No alerts found matching your criteria
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border hover:bg-surface/70 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Icon as={TypeIcon} size={24} className="text-orange-500" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-textPrimary">{alert.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-textMuted mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-textMuted">
                        <span>{alert.budgetId?.title}</span>
                        <span>{alert.departmentId?.departmentName}</span>
                        <span>{formatDate(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Icon as={Eye} size={16} className="mr-1" />
                      Details
                    </ActionButton>
                    {alert.status === 'active' && (
                      <ActionButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledge(alert._id)}
                      >
                        <Icon as={CheckCircle} size={16} className="mr-1" />
                        Acknowledge
                      </ActionButton>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {showDetailsModal && selectedAlert && <AlertDetailsModal />}
    </motion.div>
  );
};

export default AlertManagement;
