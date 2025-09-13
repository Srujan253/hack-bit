// Test script to verify currency functionality
const testCurrencyConversion = () => {
  console.log('Testing Currency Conversion...');
  
  // Test data
  const testAmount = 100000; // 1 lakh INR
  const exchangeRate = 0.012; // Approximate USD rate
  
  const convertedAmount = testAmount * exchangeRate;
  
  console.log(`INR Amount: ₹${testAmount.toLocaleString('en-IN')}`);
  console.log(`USD Amount: $${convertedAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
  
  // Test formatting
  const formatCurrency = (amount, currency) => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };
  
  console.log('Formatted INR:', formatCurrency(testAmount, 'INR'));
  console.log('Formatted USD:', formatCurrency(convertedAmount, 'USD'));
  
  return {
    original: testAmount,
    converted: convertedAmount,
    rate: exchangeRate
  };
};

// Test financial data conversion
const testFinancialDataConversion = () => {
  const sampleBudget = {
    title: "Infrastructure Development",
    totalAmount: 5000000,
    spentAmount: 2500000,
    remainingAmount: 2500000,
    departments: [
      { name: "Public Works", allocated: 2000000, spent: 1000000 },
      { name: "Transportation", allocated: 3000000, spent: 1500000 }
    ]
  };
  
  const exchangeRate = 0.012;
  
  const convertedBudget = {
    ...sampleBudget,
    totalAmount: sampleBudget.totalAmount * exchangeRate,
    spentAmount: sampleBudget.spentAmount * exchangeRate,
    remainingAmount: sampleBudget.remainingAmount * exchangeRate,
    departments: sampleBudget.departments.map(dept => ({
      ...dept,
      allocated: dept.allocated * exchangeRate,
      spent: dept.spent * exchangeRate
    }))
  };
  
  console.log('\nOriginal Budget (INR):');
  console.log(`Total: ₹${sampleBudget.totalAmount.toLocaleString('en-IN')}`);
  console.log(`Spent: ₹${sampleBudget.spentAmount.toLocaleString('en-IN')}`);
  
  console.log('\nConverted Budget (USD):');
  console.log(`Total: $${convertedBudget.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`Spent: $${convertedBudget.spentAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  
  return convertedBudget;
};

// Run tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCurrencyConversion, testFinancialDataConversion };
} else {
  testCurrencyConversion();
  testFinancialDataConversion();
}
