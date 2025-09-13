import express from 'express';
import currencyService from '../services/currencyService.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get supported currencies and current exchange rates
router.get('/info', async (req, res) => {
  try {
    const currencyInfo = currencyService.getCurrencyInfo();
    const exchangeRates = await currencyService.getExchangeRates();
    
    res.json({
      message: 'Currency information retrieved successfully',
      currencies: currencyInfo,
      exchangeRates: exchangeRates
    });
  } catch (error) {
    console.error('Get currency info error:', error);
    res.status(500).json({ message: 'Server error retrieving currency information' });
  }
});

// Convert amount between currencies
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ 
        message: 'Amount, fromCurrency, and toCurrency are required' 
      });
    }

    const result = await currencyService.convertAndFormat(amount, fromCurrency, toCurrency);
    
    res.json({
      message: 'Currency conversion successful',
      original: {
        amount: amount,
        currency: fromCurrency,
        formatted: currencyService.formatCurrency(amount, fromCurrency)
      },
      converted: {
        amount: result.amount,
        currency: toCurrency,
        formatted: result.formatted
      },
      exchangeRate: result.exchangeRate
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ message: 'Server error during currency conversion' });
  }
});

// Update user currency preference
router.put('/preference', verifyToken, async (req, res) => {
  try {
    const { currency } = req.body;
    const supportedCurrencies = ['INR', 'USD'];
    
    if (!currency || !supportedCurrencies.includes(currency)) {
      return res.status(400).json({ 
        message: 'Valid currency (INR or USD) is required' 
      });
    }

    // Update user's currency preference
    req.user.preferredCurrency = currency;
    await req.user.save();
    
    res.json({
      message: 'Currency preference updated successfully',
      preferredCurrency: currency
    });
  } catch (error) {
    console.error('Update currency preference error:', error);
    res.status(500).json({ message: 'Server error updating currency preference' });
  }
});

// Get user's currency preference
router.get('/preference', verifyToken, async (req, res) => {
  try {
    const preferredCurrency = req.user.preferredCurrency || 'INR';
    
    res.json({
      message: 'Currency preference retrieved successfully',
      preferredCurrency: preferredCurrency
    });
  } catch (error) {
    console.error('Get currency preference error:', error);
    res.status(500).json({ message: 'Server error retrieving currency preference' });
  }
});

export default router;
