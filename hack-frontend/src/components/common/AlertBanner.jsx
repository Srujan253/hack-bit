import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Bell } from 'lucide-react';
import { alertAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Icon from './Icon';
import ActionButton from './Button';

const AlertBanner = ({ userRole }) => {
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchCriticalAlerts();
    const interval = setInterval(fetchCriticalAlerts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCriticalAlerts = async () => {
    try {
      const response = await alertAPI.getAlerts({
        severity: 'critical',
        status: 'active',
        limit: 5
      });
      
      if (response.data.alerts.length > 0) {
        setAlerts(response.data.alerts);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledgeAlert(alertId);
      // Remove acknowledged alert from the list
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
      if (alerts.length <= 1) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const nextAlert = () => {
    setCurrentAlert((prev) => (prev + 1) % alerts.length);
  };

  const prevAlert = () => {
    setCurrentAlert((prev) => (prev - 1 + alerts.length) % alerts.length);
  };

  if (!isVisible || alerts.length === 0) return null;

  const alert = alerts[currentAlert];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon as={AlertTriangle} size={20} className="text-white animate-pulse" />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">CRITICAL ALERT</span>
                  {alerts.length > 1 && (
                    <span className="text-xs bg-red-700 px-2 py-1 rounded">
                      {currentAlert + 1} of {alerts.length}
                    </span>
                  )}
                </div>
                <p className="text-sm">{alert.title}</p>
                {alert.currentValues?.utilizationPercentage && (
                  <p className="text-xs opacity-90">
                    Budget utilization: {alert.currentValues.utilizationPercentage.toFixed(1)}% 
                    ({formatCurrency(alert.currentValues.spentAmount)} / {formatCurrency(alert.currentValues.allocatedAmount)})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {alerts.length > 1 && (
                <div className="flex space-x-1">
                  <button
                    onClick={prevAlert}
                    className="p-1 hover:bg-red-700 rounded text-xs"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextAlert}
                    className="p-1 hover:bg-red-700 rounded text-xs"
                  >
                    ›
                  </button>
                </div>
              )}
              
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => handleAcknowledge(alert._id)}
                className="bg-red-700 hover:bg-red-800 text-white border-red-600"
              >
                Acknowledge
              </ActionButton>
              
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-red-700 rounded"
              >
                <Icon as={X} size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner;
