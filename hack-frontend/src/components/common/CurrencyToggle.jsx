import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CurrencyDollarIcon, 
  ChevronDownIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { currencyAPI } from '../../services/api';
import toast from 'react-hot-toast';
import useCurrencyStore from '../../store/currencyStore';

const CurrencyToggle = ({ onCurrencyChange, className = "" }) => {
  const { 
    currentCurrency, 
    exchangeRates, 
    loading, 
    setCurrency, 
    loadExchangeRates: loadRates, 
    loadUserPreference: loadPreference 
  } = useCurrencyStore();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currencies = [
    {
      code: 'INR',
      name: 'Indian Rupee',
      symbol: '₹',
      flag: '🇮🇳',
      color: 'from-orange-500 to-green-500'
    },
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      color: 'from-blue-500 to-red-500'
    }
  ];

  // Load user's preferred currency on mount
  useEffect(() => {
    loadPreference();
    loadRates();
  }, []);

  const handleCurrencyChange = async (currency) => {
    if (currency === currentCurrency) return;
    
    try {
      await setCurrency(currency);
      setIsDropdownOpen(false);
      onCurrencyChange?.(currency);
      
      toast.success(`Currency switched to ${currency}`, {
        icon: currencies.find(c => c.code === currency)?.flag
      });
    } catch (error) {
      console.error('Failed to update currency preference:', error);
      toast.error('Failed to update currency preference');
    }
  };

  const selectedCurrencyData = currencies.find(c => c.code === currentCurrency);
  const getExchangeRate = () => {
    if (!exchangeRates) return null;
    if (currentCurrency === 'USD') {
      return `1 USD = ₹${exchangeRates.USD_TO_INR?.toFixed(2)}`;
    } else {
      return `1 INR = $${exchangeRates.INR_TO_USD?.toFixed(4)}`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Currency Toggle Button */}
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        disabled={loading}
      >
        {/* Currency Icon with Gradient */}
        <motion.div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedCurrencyData?.color} flex items-center justify-center shadow-sm`}
          animate={{ rotate: loading ? 360 : 0 }}
          transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
        >
          <span className="text-white text-sm font-bold">
            {selectedCurrencyData?.symbol}
          </span>
        </motion.div>

        {/* Currency Info */}
        <div className="flex flex-col items-start">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-800">
              {currentCurrency}
            </span>
            <span className="text-lg">{selectedCurrencyData?.flag}</span>
          </div>
          {exchangeRates && (
            <span className="text-xs text-gray-500">
              {getExchangeRate()}
            </span>
          )}
        </div>

        {/* Dropdown Arrow */}
        <motion.div
          animate={{ rotate: isDropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDownIcon className="w-4 h-4 text-gray-600" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                Select Currency
              </h3>
              
              <div className="space-y-2">
                {currencies.map((currency, index) => (
                  <motion.button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      currentCurrency === currency.code
                        ? 'bg-gradient-to-r ' + currency.color + ' text-white shadow-lg'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{currency.flag}</span>
                      <div className="text-left">
                        <div className="font-medium">{currency.code}</div>
                        <div className={`text-sm ${
                          currentCurrency === currency.code ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {currency.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${
                        currentCurrency === currency.code ? 'text-white' : 'text-gray-600'
                      }`}>
                        {currency.symbol}
                      </span>
                      {currentCurrency === currency.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
                        >
                          <CheckIcon className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Exchange Rate Info */}
              {exchangeRates && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="text-xs text-gray-600 mb-1">Current Exchange Rate</div>
                  <div className="text-sm font-medium text-gray-800">
                    {getExchangeRate()}
                  </div>
                  {exchangeRates.lastUpdated && (
                    <div className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(exchangeRates.lastUpdated).toLocaleTimeString()}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default CurrencyToggle;
