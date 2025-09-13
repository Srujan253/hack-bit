import axios from 'axios';

class CurrencyService {
  constructor() {
    this.exchangeRates = {
      USD_TO_INR: 83.25, // Default fallback rate
      INR_TO_USD: 0.012
    };
    this.lastUpdated = null;
    this.updateInterval = 1000 * 60 * 60; // 1 hour
  }

  // Fetch live exchange rates (using a free API)
  async updateExchangeRates() {
    try {
      // Using exchangerate-api.com (free tier)
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (response.data && response.data.rates && response.data.rates.INR) {
        this.exchangeRates.USD_TO_INR = response.data.rates.INR;
        this.exchangeRates.INR_TO_USD = 1 / response.data.rates.INR;
        this.lastUpdated = new Date();
        
        console.log(`Exchange rates updated: 1 USD = ${this.exchangeRates.USD_TO_INR} INR`);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates, using cached rates:', error.message);
      // Continue with cached/default rates
    }
  }

  // Get current exchange rates
  async getExchangeRates() {
    // Update rates if they're stale or never fetched
    if (!this.lastUpdated || (Date.now() - this.lastUpdated.getTime()) > this.updateInterval) {
      await this.updateExchangeRates();
    }
    
    return {
      USD_TO_INR: this.exchangeRates.USD_TO_INR,
      INR_TO_USD: this.exchangeRates.INR_TO_USD,
      lastUpdated: this.lastUpdated
    };
  }

  // Convert amount from one currency to another
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    
    if (fromCurrency === 'USD' && toCurrency === 'INR') {
      return amount * rates.USD_TO_INR;
    } else if (fromCurrency === 'INR' && toCurrency === 'USD') {
      return amount * rates.INR_TO_USD;
    }
    
    throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
  }

  // Format currency with proper symbols and decimals
  formatCurrency(amount, currency) {
    const formatOptions = {
      INR: {
        symbol: '₹',
        locale: 'en-IN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      },
      USD: {
        symbol: '$',
        locale: 'en-US',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    };

    const config = formatOptions[currency];
    if (!config) {
      return `${amount} ${currency}`;
    }

    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: config.minimumFractionDigits,
      maximumFractionDigits: config.maximumFractionDigits
    });

    return formatter.format(amount);
  }

  // Convert and format amount for display
  async convertAndFormat(amount, fromCurrency, toCurrency) {
    const convertedAmount = await this.convertCurrency(amount, fromCurrency, toCurrency);
    return {
      amount: convertedAmount,
      formatted: this.formatCurrency(convertedAmount, toCurrency),
      exchangeRate: fromCurrency !== toCurrency ? 
        (await this.getExchangeRates())[`${fromCurrency}_TO_${toCurrency}`] : 1
    };
  }

  // Get currency info for frontend
  getCurrencyInfo() {
    return {
      supported: ['INR', 'USD'],
      default: 'INR',
      symbols: {
        INR: '₹',
        USD: '$'
      },
      names: {
        INR: 'Indian Rupee',
        USD: 'US Dollar'
      }
    };
  }

  // Convert budget/transaction data with currency
  async convertFinancialData(data, targetCurrency, baseCurrency = 'INR') {
    if (!data || baseCurrency === targetCurrency) {
      return data;
    }

    const convertAmount = async (amount) => {
      if (typeof amount !== 'number') return amount;
      return await this.convertCurrency(amount, baseCurrency, targetCurrency);
    };

    // Handle different data structures
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.convertFinancialData(item, targetCurrency, baseCurrency)));
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
          converted[field] = await convertAmount(converted[field]);
        }
      }

      // Handle nested objects
      if (converted.departments && Array.isArray(converted.departments)) {
        converted.departments = await Promise.all(
          converted.departments.map(dept => this.convertFinancialData(dept, targetCurrency, baseCurrency))
        );
      }

      return converted;
    }

    return data;
  }
}

export default new CurrencyService();
