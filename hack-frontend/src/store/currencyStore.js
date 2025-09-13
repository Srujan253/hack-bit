import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { currencyAPI } from '../services/api';

const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currentCurrency: 'INR',
      exchangeRates: null,
      loading: false,

      // Set current currency
      setCurrency: async (currency) => {
        set({ loading: true });
        try {
          // Update user preference if logged in
          const token = localStorage.getItem('auth-storage');
          if (token) {
            await currencyAPI.updateUserPreference(currency);
          }
          
          set({ currentCurrency: currency });
          
          // Trigger global currency change event
          window.dispatchEvent(new CustomEvent('currencyChanged', { 
            detail: { currency } 
          }));
          
        } catch (error) {
          console.error('Failed to update currency:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Initialize store
      init: async () => {
        console.log('🚀 Initializing currency store...');
        await get().loadExchangeRates();
        await get().loadUserPreference();
        console.log('✅ Currency store initialized');
      },

      // Load exchange rates
      loadExchangeRates: async () => {
        try {
          const response = await currencyAPI.getCurrencyInfo();
          set({ exchangeRates: response.data.exchangeRates });
        } catch (error) {
          console.error('Failed to load exchange rates:', error);
        }
      },

      // Load user preference
      loadUserPreference: async () => {
        try {
          const token = localStorage.getItem('auth-storage');
          if (token) {
            const response = await currencyAPI.getUserPreference();
            if (response.data.preferredCurrency) {
              set({ currentCurrency: response.data.preferredCurrency });
            }
          }
        } catch (error) {
          console.error('Failed to load user preference:', error);
        }
      },

      // Convert amount
      convertAmount: (amount, fromCurrency, toCurrency) => {
        const { exchangeRates } = get();
        
        console.log('Converting amount:', { amount, fromCurrency, toCurrency, exchangeRates });
        
        if (!amount || fromCurrency === toCurrency) {
          console.log('No conversion needed:', { amount, fromCurrency, toCurrency });
          return amount;
        }
        
        if (!exchangeRates) {
          console.error('❌ No exchange rates available for conversion - using fallback rates');
          // Use fallback exchange rates
          const fallbackRates = {
            USD_TO_INR: 83.0,
            INR_TO_USD: 0.012
          };
          
          if (fromCurrency === 'USD' && toCurrency === 'INR') {
            const converted = amount * fallbackRates.USD_TO_INR;
            console.log('🔄 USD to INR conversion (fallback):', amount, '->', converted);
            return converted;
          } else if (fromCurrency === 'INR' && toCurrency === 'USD') {
            const converted = amount * fallbackRates.INR_TO_USD;
            console.log('🔄 INR to USD conversion (fallback):', amount, '->', converted);
            return converted;
          }
          
          return amount;
        }

        if (fromCurrency === 'USD' && toCurrency === 'INR') {
          const converted = amount * exchangeRates.USD_TO_INR;
          console.log('✅ USD to INR conversion:', amount, '->', converted);
          return converted;
        } else if (fromCurrency === 'INR' && toCurrency === 'USD') {
          const converted = amount * exchangeRates.INR_TO_USD;
          console.log('✅ INR to USD conversion:', amount, '->', converted);
          return converted;
        }
        
        console.warn('⚠️ Unsupported currency conversion:', fromCurrency, 'to', toCurrency);
        return amount;
      },

      // Convert financial data object
      convertFinancialData: (data, baseCurrency = 'INR') => {
        const { currentCurrency, convertAmount } = get();
        
        console.log('Converting financial data:', { data, baseCurrency, currentCurrency });
        
        if (!data || baseCurrency === currentCurrency) return data;

        const convertValue = (value) => {
          if (typeof value === 'number') {
            return convertAmount(value, baseCurrency, currentCurrency);
          }
          return value;
        };

        try {
          if (Array.isArray(data)) {
            return data.map(item => get().convertFinancialData(item, baseCurrency));
          }

          if (typeof data === 'object' && data !== null) {
            const converted = { ...data };
            
            // Only convert fields that represent money/amount
            const moneyFields = [
              'amount', 'totalAmount', 'allocatedAmount', 'spentAmount',
              'remainingAmount', 'budgetAmount', 'availableAmount',
              'pendingAmount', 'approvedAmount', 'completedAmount', 'rejectedAmount',
              'minAmount', 'maxAmount', 'averageAmount', 'expense', 'cost', 'price'
            ];

            for (const field of moneyFields) {
              if (converted[field] !== undefined) {
                const originalValue = converted[field];
                converted[field] = convertValue(converted[field]);
                console.log(`Converted ${field}:`, originalValue, '->', converted[field]);
              }
            }

            // Handle nested objects and arrays
            const nestedObjects = ['myAllocation', 'allocation', 'budget', 'transaction', 'stats', 'overall'];
            for (const nestedField of nestedObjects) {
              if (converted[nestedField] && typeof converted[nestedField] === 'object' && !Array.isArray(converted[nestedField])) {
                converted[nestedField] = get().convertFinancialData(converted[nestedField], baseCurrency);
              }
            }

            // Handle nested arrays
            const nestedArrays = ['departments', 'transactions', 'budgets', 'allocations', 'expenses'];
            for (const arrayField of nestedArrays) {
              if (converted[arrayField] && Array.isArray(converted[arrayField])) {
                converted[arrayField] = converted[arrayField].map(item => 
                  get().convertFinancialData(item, baseCurrency)
                );
              }
            }

            // Handle statusCounts object (for admin dashboard)
            if (converted.statusCounts && typeof converted.statusCounts === 'object') {
              converted.statusCounts = get().convertFinancialData(converted.statusCounts, baseCurrency);
            }

            return converted;
          }

          return data;
        } catch (error) {
          console.error('Financial data conversion failed:', error);
          return data;
        }
      },

      // Format currency
      formatCurrency: (amount, currency) => {
        const { currentCurrency } = get();
        const targetCurrency = currency || currentCurrency;
        
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

        const options = formatOptions[targetCurrency] || formatOptions.INR;
        
        try {
          return new Intl.NumberFormat('en-US', options).format(amount || 0);
        } catch (error) {
          const symbols = { INR: '₹', USD: '$' };
          return `${symbols[targetCurrency] || '₹'}${(amount || 0).toLocaleString()}`;
        }
      }
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({ currentCurrency: state.currentCurrency })
    }
  )
);

export default useCurrencyStore;
