import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth, isAdmin, isDepartment } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Public navigation items
  const publicNavItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Budgets', href: '/budgets', icon: CurrencyDollarIcon },
    { name: 'Transactions', href: '/transactions', icon: DocumentTextIcon },
  ];

  // Admin navigation items
  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Budgets', href: '/admin/budgets', icon: CurrencyDollarIcon },
    { name: 'Allocate Budget', href: '/admin/allocate-budget', icon: BanknotesIcon },
    { name: 'Transactions', href: '/admin/transactions', icon: DocumentTextIcon },
    { name: 'Approvals', href: '/admin/approvals', icon: UserGroupIcon },
  ];

  // Department navigation items
  const departmentNavItems = [
    { name: 'Dashboard', href: '/department', icon: HomeIcon },
    { name: 'My Budgets', href: '/department/budgets', icon: CurrencyDollarIcon },
    { name: 'Expense Tracker', href: '/department/expense-tracker', icon: ChartBarIcon },
    { name: 'Transactions', href: '/department/transactions', icon: DocumentTextIcon },
    { name: 'Submit Expense', href: '/department/submit-expense', icon: BanknotesIcon },
  ];

  // Get navigation items based on user role
  const getNavItems = () => {
    if (isAdmin()) return adminNavItems;
    if (isDepartment()) return departmentNavItems;
    return publicNavItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-surface shadow-sm border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BanknotesIcon className="w-5 h-5 text-textPrimary" />
                </div>
                <span className="text-xl font-bold text-textPrimary">
                  Fund Tracker
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-textMuted hover:text-textPrimary hover:bg-surface'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="text-textPrimary font-medium">
                      {user?.departmentName || user?.email}
                    </p>
                    <p className="text-textMuted capitalize">
                      {user?.role} {user?.departmentCode && `(${user.departmentCode})`}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-textMuted hover:text-error transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-textMuted hover:text-textPrimary"
                  >
                    Login
                  </Link>
                  <Link
                    to="/department/signup"
                    className="px-4 py-2 text-sm font-medium text-textPrimary bg-primary rounded-md hover:bg-primary transition-colors"
                  >
                    Department Signup
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-border">
          <div className="px-2 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-textMuted hover:text-textPrimary hover:bg-surface'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-textMuted">
              © 2024 Transparent Fund-Tracking Platform. Built for Government Transparency.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/" className="text-sm text-textMuted hover:text-textPrimary">
                Public Dashboard
              </Link>
              <Link to="/budgets" className="text-sm text-textMuted hover:text-textPrimary">
                View Budgets
              </Link>
              <Link to="/transactions" className="text-sm text-textMuted hover:text-textPrimary">
                View Transactions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;