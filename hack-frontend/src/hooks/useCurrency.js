import { useState, useEffect, useCallback } from 'react';
import { currencyAPI } from '../services/api';

export const useCurrency = () => {
  const [currentCurrency, setCurrentCurrency] = useState('INR');
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load initial currency preference and exchange rates
  useEffect(() => {
    loadCurrencyData();
  }, []);

  const loadCurrencyData = async () => {
    try {
      setLoading(true);
      
      // Load currency info and exchange rates
      const [currencyInfo, userPreference] = await Promise.allSettled([
        currencyAPI.getCurrencyInfo(),
        currencyAPI.getUserPreference().catch(() => ({ data: { preferredCurrency: 'INR' } }))
      ]);

      if (currencyInfo.status === 'fulfilled') {
        setExchangeRates(currencyInfo.value.data.exchangeRates);
      }

      if (userPreference.status === 'fulfilled') {
        setCurrentCurrency(userPreference.value.data.preferredCurrency || 'INR');
      }
    } catch (error) {
      console.error('Failed to load currency data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format amount with currency symbol
  const formatCurrency = useCallback((amount, currency = currentCurrency) => {
    if (typeof amount !== 'number') return amount;

    const formatOptions = {
      INR: {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      },
      USD: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    };

    const options = formatOptions[currency] || formatOptions.INR;
    
    try {
      return new Intl.NumberFormat('en-US', options).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbols = { INR: '₹', USD: '$' };
      return `${symbols[currency] || '₹'}${amount.toLocaleString()}`;
    }
  }, [currentCurrency]);

  // Convert amount between currencies
  const convertAmount = useCallback(async (amount, fromCurrency, toCurrency = currentCurrency) => {
    if (!amount || fromCurrency === toCurrency) return amount;
    
    try {
      const response = await currencyAPI.convertCurrency({
        amount,
        fromCurrency,
        toCurrency
      });
      return response.data.converted.amount;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return amount; // Return original amount on error
    }
  }, [currentCurrency]);

  // Convert and format amount
  const convertAndFormat = useCallback(async (amount, fromCurrency = 'INR') => {
    try {
      const convertedAmount = await convertAmount(amount, fromCurrency, currentCurrency);
      return formatCurrency(convertedAmount, currentCurrency);
    } catch (error) {
      console.error('Convert and format failed:', error);
      return formatCurrency(amount, fromCurrency);
    }
  }, [currentCurrency, convertAmount, formatCurrency]);

  // Convert financial data object
  const convertFinancialData = useCallback(async (data, baseCurrency = 'INR') => {
    if (!data || baseCurrency === currentCurrency) return data;

    const convertValue = async (value) => {
      if (typeof value === 'number') {
        return await convertAmount(value, baseCurrency, currentCurrency);
      }
      return value;
    };

    try {
      if (Array.isArray(data)) {
        return await Promise.all(data.map(item => convertFinancialData(item, baseCurrency)));
      }

      if (typeof data === 'object' && data !== null) {
        const converted = { ...data };
        
        // Convert common financial fields
        const financialFields = [
          'amount', 'totalAmount', 'allocatedAmount', 'spentAmount',
          'remainingAmount', 'budgetAmount', 'availableAmount'
        ];

        for (const field of financialFields) {
          if (converted[field] !== undefined) {
            converted[field] = await convertValue(converted[field]);
          }
        }

        // Handle nested arrays (like departments)
        if (converted.departments && Array.isArray(converted.departments)) {
          converted.departments = await Promise.all(
            converted.departments.map(dept => convertFinancialData(dept, baseCurrency))
          );
        }

        return converted;
      }

      return data;
    } catch (error) {
      console.error('Financial data conversion failed:', error);
      return data;
    }
  }, [currentCurrency, convertAmount]);

  // Change currency
  const changeCurrency = useCallback(async (newCurrency) => {
    if (newCurrency === currentCurrency) return;
    
    try {
      setLoading(true);
      await currencyAPI.updateUserPreference(newCurrency);
      setCurrentCurrency(newCurrency);
    } catch (error) {
      console.error('Failed to change currency:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentCurrency]);

  return {
    currentCurrency,
    exchangeRates,
    loading,
    formatCurrency,
    convertAmount,
    convertAndFormat,
    convertFinancialData,
    changeCurrency,
    refreshRates: loadCurrencyData
  };
};

export default useCurrency;
