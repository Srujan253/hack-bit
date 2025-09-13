import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';

dotenv.config();

const sampleTransactions = [
  {
    transactionId: 'TXN-2024-001',
    amount: 25000,
    description: 'Purchase of office computers and laptops for IT department',
    vendorName: 'Tech Solutions Ltd',
    category: 'equipment',
    priority: 'high',
    status: 'pending',
    invoiceNumber: 'INV-2024-001',
    requestedAt: new Date('2024-01-15'),
    documents: ['invoice.pdf', 'quotation.pdf']
  },
  {
    transactionId: 'TXN-2024-002',
    amount: 15000,
    description: 'Medical supplies for healthcare department',
    vendorName: 'MedCare Supplies',
    category: 'supplies',
    priority: 'urgent',
    status: 'pending',
    invoiceNumber: 'INV-2024-002',
    requestedAt: new Date('2024-01-16'),
    documents: ['medical_invoice.pdf']
  },
  {
    transactionId: 'TXN-2024-003',
    amount: 8000,
    description: 'Maintenance of air conditioning systems',
    vendorName: 'Cool Air Services',
    category: 'maintenance',
    priority: 'medium',
    status: 'approved',
    invoiceNumber: 'INV-2024-003',
    requestedAt: new Date('2024-01-14'),
    reviewedAt: new Date('2024-01-15'),
    documents: ['maintenance_contract.pdf']
  },
  {
    transactionId: 'TXN-2024-004',
    amount: 12000,
    description: 'Office furniture for new employees',
    vendorName: 'Furniture World',
    category: 'equipment',
    priority: 'low',
    status: 'pending',
    invoiceNumber: 'INV-2024-004',
    requestedAt: new Date('2024-01-17'),
    documents: ['furniture_quote.pdf']
  },
  {
    transactionId: 'TXN-2024-005',
    amount: 5000,
    description: 'Travel expenses for conference attendance',
    vendorName: 'Travel Agency Pro',
    category: 'travel',
    priority: 'medium',
    status: 'completed',
    invoiceNumber: 'INV-2024-005',
    requestedAt: new Date('2024-01-10'),
    reviewedAt: new Date('2024-01-11'),
    approvedAt: new Date('2024-01-12'),
    completedAt: new Date('2024-01-13'),
    documents: ['travel_receipt.pdf']
  }
];

async function seedTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find existing users and budgets
    const adminUser = await User.findOne({ role: 'admin' });
    const departmentUsers = await User.find({ role: 'department' }).limit(3);
    const budgets = await Budget.find().limit(3);

    if (!adminUser) {
      console.log('No admin user found. Creating one...');
      const newAdmin = new User({
        email: 'admin@government.in',
        password: 'admin123',
        role: 'admin',
        isApproved: true,
        aadhaarNumber: '123456789012'
      });
      await newAdmin.save();
      console.log('Admin user created');
    }

    if (departmentUsers.length === 0) {
      console.log('No department users found. Creating sample departments...');
      const departments = [
        {
          email: 'it@dept.gov.in',
          password: 'dept123',
          role: 'department',
          departmentName: 'Information Technology',
          departmentCode: 'IT',
          isApproved: true,
          aadhaarNumber: '123456789013'
        },
        {
          email: 'health@dept.gov.in',
          password: 'dept123',
          role: 'department',
          departmentName: 'Healthcare',
          departmentCode: 'HC',
          isApproved: true,
          aadhaarNumber: '123456789014'
        },
        {
          email: 'admin@dept.gov.in',
          password: 'dept123',
          role: 'department',
          departmentName: 'Administration',
          departmentCode: 'ADM',
          isApproved: true,
          aadhaarNumber: '123456789015'
        }
      ];

      for (const dept of departments) {
        const newDept = new User(dept);
        await newDept.save();
        departmentUsers.push(newDept);
      }
      console.log('Department users created');
    }

    if (budgets.length === 0) {
      console.log('No budgets found. Creating sample budgets...');
      const sampleBudgets = [
        {
          title: 'IT Infrastructure Budget 2024',
          description: 'Budget for IT equipment and infrastructure',
          totalAmount: 500000,
          financialYear: '2024-2025',
          category: 'infrastructure',
          status: 'active',
          createdBy: adminUser._id
        },
        {
          title: 'Healthcare Equipment Budget 2024',
          description: 'Budget for medical equipment and supplies',
          totalAmount: 300000,
          financialYear: '2024-2025',
          category: 'healthcare',
          status: 'active',
          createdBy: adminUser._id
        },
        {
          title: 'Administrative Operations Budget 2024',
          description: 'Budget for administrative operations',
          totalAmount: 200000,
          financialYear: '2024-2025',
          category: 'administration',
          status: 'active',
          createdBy: adminUser._id
        }
      ];

      for (const budget of sampleBudgets) {
        const newBudget = new Budget(budget);
        await newBudget.save();
        budgets.push(newBudget);
      }
      console.log('Sample budgets created');
    }

    // Clear existing transactions
    await Transaction.deleteMany({});
    console.log('Cleared existing transactions');

    // Create transactions with proper references
    const transactionsToCreate = sampleTransactions.map((transaction, index) => ({
      ...transaction,
      budgetId: budgets[index % budgets.length]._id,
      departmentId: departmentUsers[index % departmentUsers.length]._id,
      requestedBy: departmentUsers[index % departmentUsers.length]._id,
      reviewedBy: transaction.status !== 'pending' ? adminUser._id : undefined,
      approvedBy: ['approved', 'completed'].includes(transaction.status) ? adminUser._id : undefined
    }));

    const createdTransactions = await Transaction.insertMany(transactionsToCreate);
    console.log(`Created ${createdTransactions.length} sample transactions`);

    // Update budget spent amounts
    for (const transaction of createdTransactions) {
      if (['approved', 'completed'].includes(transaction.status)) {
        await Budget.findByIdAndUpdate(
          transaction.budgetId,
          { $inc: { spentAmount: transaction.amount } }
        );
      }
    }

    console.log('Sample transactions seeded successfully!');
    console.log('Transactions created:');
    createdTransactions.forEach(t => {
      console.log(`- ${t.transactionId}: ${t.description} (${t.status})`);
    });

  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedTransactions();
