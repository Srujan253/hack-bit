import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import useAuthStore from './store/authStore';

// Import components
import PublicDashboard from './components/public/PublicDashboard';
import PublicBudgets from './components/public/PublicBudgets';
import PublicTransactions from './components/public/PublicTransactions';
import BudgetDetails from './components/public/BudgetDetails';

import Login from './components/auth/Login';
import DepartmentSignup from './components/auth/DepartmentSignup';
import AdminLogin from './components/auth/AdminLogin';
import RoleBasedLogin from './components/auth/RoleBasedLogin';

import AdminDashboard from './components/admin/AdminDashboard';
import AdminBudgets from './components/admin/AdminBudgets';
import AdminTransactions from './components/admin/AdminTransactions';
import AdminApprovals from './components/admin/AdminApprovals';
import BudgetAllocation from './components/admin/BudgetAllocation';
import AlertManagement from './components/admin/AlertManagement';

import DepartmentDashboard from './components/department/DepartmentDashboard';
import DepartmentBudgets from './components/department/DepartmentBudgets';
import DepartmentTransactions from './components/department/DepartmentTransactions';
import SubmitExpense from './components/department/SubmitExpense';
import ProgressiveExpenseTracker from './components/department/ProgressiveExpenseTracker';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AlertBanner from './components/common/AlertBanner';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background">
          {isAuthenticated && <AlertBanner userRole={user?.role} />}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><PublicDashboard /></Layout>} />
          <Route path="/budgets" element={<Layout><PublicBudgets /></Layout>} />
          <Route path="/budgets/:id" element={<Layout><BudgetDetails /></Layout>} />
          <Route path="/transactions" element={<Layout><PublicTransactions /></Layout>} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<RoleBasedLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/department/signup" element={<DepartmentSignup />} />
          
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/budgets" element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AdminBudgets /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AdminTransactions /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/approvals" element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AdminApprovals /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/allocate-budget" element={
            <ProtectedRoute requiredRole="admin">
              <Layout><BudgetAllocation /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/alerts" element={
            <ProtectedRoute requiredRole="admin">
              <Layout><AlertManagement /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Department Routes */}
          <Route path="/department" element={
            <ProtectedRoute requiredRole="department">
              <Layout><DepartmentDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/department/budgets" element={
            <ProtectedRoute requiredRole="department">
              <Layout><DepartmentBudgets /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/department/transactions" element={
            <ProtectedRoute requiredRole="department">
              <Layout><DepartmentTransactions /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/department/submit-expense" element={
            <ProtectedRoute requiredRole="department">
              <Layout><SubmitExpense /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/department/expense-tracker" element={
            <ProtectedRoute requiredRole="department">
              <Layout><ProgressiveExpenseTracker /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirect authenticated users to their dashboard */}
          <Route path="/dashboard" element={
            isAuthenticated ? (
              user?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/department" />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
    </ErrorBoundary>
  );
}
