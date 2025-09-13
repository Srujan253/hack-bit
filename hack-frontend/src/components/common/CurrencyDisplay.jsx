import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../hooks/useCurrency';

const CurrencyDisplay = ({ 
  amount, 
  baseCurrency = 'INR', 
  className = "",
  showConversion = false,
  size = 'md' 
}) => {
  const { currentCurrency, formatCurrency, convertAndFormat } = useCurrency();
  const [displayValue, setDisplayValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateDisplayValue();
  }, [amount, currentCurrency, baseCurrency]);

  // Listen for currency changes from the toggle
  useEffect(() => {
    const handleCurrencyChange = () => {
      updateDisplayValue();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [amount, baseCurrency]);

  const updateDisplayValue = async () => {
    if (!amount && amount !== 0) {
      setDisplayValue('--');
      return;
    }

    setLoading(true);
    try {
      if (baseCurrency === currentCurrency) {
        // No conversion needed
        setDisplayValue(formatCurrency(amount, currentCurrency));
        setOriginalValue('');
      } else {
        // Convert and format
        const converted = await convertAndFormat(amount, baseCurrency);
        setDisplayValue(converted);
        
        if (showConversion) {
          setOriginalValue(formatCurrency(amount, baseCurrency));
        }
      }
    } catch (error) {
      console.error('Currency display error:', error);
      setDisplayValue(formatCurrency(amount, baseCurrency));
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"
        />
      ) : (
        <div className="flex flex-col">
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`font-semibold ${sizeClasses[size]} text-gray-800`}
          >
            {displayValue}
          </motion.span>
          
          {showConversion && originalValue && baseCurrency !== currentCurrency && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-gray-500 mt-1"
            >
              Originally: {originalValue}
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrencyDisplay;
