import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import CurrencyToggle from '../common/CurrencyToggle';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth, isAdmin, isDepartment } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/');
    setShowUserDropdown(false);
  };

  // Public navigation items
  const publicNavItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Budgets', href: '/budgets', icon: CurrencyDollarIcon, color: 'from-green-500 to-green-600' },
    { name: 'Transactions', href: '/transactions', icon: DocumentTextIcon, color: 'from-purple-500 to-purple-600' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'Budgets', href: '/admin/budgets', icon: CurrencyDollarIcon, color: 'from-green-500 to-green-600' },
    { name: 'Allocate Budget', href: '/admin/allocate-budget', icon: BanknotesIcon, color: 'from-yellow-500 to-yellow-600' },
    { name: 'Transactions', href: '/admin/transactions', icon: DocumentTextIcon, color: 'from-purple-500 to-purple-600' },
    { name: 'Approvals', href: '/admin/approvals', icon: UserGroupIcon, color: 'from-red-500 to-red-600' },
    { name: 'Alerts', href: '/admin/alerts', icon: Cog6ToothIcon, color: 'from-orange-500 to-orange-600' },
  ];

  // Department navigation items
  const departmentNavItems = [
    { name: 'Dashboard', href: '/department', icon: HomeIcon, color: 'from-blue-500 to-blue-600' },
    { name: 'My Budgets', href: '/department/budgets', icon: CurrencyDollarIcon, color: 'from-green-500 to-green-600' },
    { name: 'Expense Tracker', href: '/department/expense-tracker', icon: ChartBarIcon, color: 'from-indigo-500 to-indigo-600' },
    { name: 'Transactions', href: '/department/transactions', icon: DocumentTextIcon, color: 'from-purple-500 to-purple-600' },
    { name: 'Submit Expense', href: '/department/submit-expense', icon: BanknotesIcon, color: 'from-yellow-500 to-yellow-600' },
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
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-surface/80 backdrop-blur-xl shadow-lg border-b border-border/50' 
            : 'bg-surface shadow-sm border-b border-border'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Enhanced Logo */}
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Link to="/" className="flex items-center space-x-2 group">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ 
                    rotate: [0, -10, 10, 0],
                    scale: 1.1 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <BanknotesIcon className="w-5 h-5 text-white" />
                </motion.div>
                <motion.span 
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  Fund Tracker
                </motion.span>
              </Link>
            </motion.div>

            {/* Enhanced Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    className="relative"
                    onHoverStart={() => setActiveHover(index)}
                    onHoverEnd={() => setActiveHover(null)}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Link
                      to={item.href}
                      className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden group ${
                        isActive
                          ? 'text-white shadow-lg'
                          : 'text-textMuted hover:text-textPrimary'
                      }`}
                    >
                      {/* Background gradient for active/hover */}
                      {(isActive || activeHover === index) && (
                        <motion.div
                          layoutId={isActive ? "activeTab" : "hoverTab"}
                          className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`}
                          initial={false}
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                      
                      {/* Shimmer effect on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
                        transition={{ duration: 0.6 }}
                      />
                      
                      <motion.div
                        className="relative z-10"
                        animate={isActive ? { rotate: [0, -5, 5, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className="w-4 h-4" />
                      </motion.div>
                      <span className="relative z-10">{item.name}</span>
                      
                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Enhanced User Menu */}
            <div className="flex items-center space-x-4">
              {/* Currency Toggle - Always visible */}
              <CurrencyToggle onCurrencyChange={(currency) => {
                // Trigger page refresh or state update to reflect new currency
                window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }));
              }} />

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {/* Notification Bell */}
                  <motion.button
                    className="p-2 text-textMuted hover:text-textPrimary rounded-full hover:bg-surface transition-all duration-300 relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BellIcon className="w-5 h-5" />
                    <motion.span
                      className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.button>

                  {/* Enhanced User Dropdown */}
                  <div className="relative">
                    <motion.button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md"
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-2">
                        <motion.div
                          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <UserCircleIcon className="w-5 h-5 text-white" />
                        </motion.div>
                        <div className="text-left hidden sm:block">
                          <p className="text-sm font-medium text-gray-800">
                            {user?.departmentName || user?.email}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            {user?.role} {user?.departmentCode && `(${user.departmentCode})`}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showUserDropdown ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-4 h-4 text-gray-600"
                      >
                        ▼
                      </motion.div>
                    </motion.button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-800">
                              {user?.departmentName || user?.email}
                            </p>
                            <p className="text-xs text-gray-600 capitalize">
                              {user?.role} Account {user?.departmentCode && `• ${user.departmentCode}`}
                            </p>
                          </div>
                          
                          <div className="py-2">
                            <motion.button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                              whileHover={{ x: 5 }}
                            >
                              <ArrowRightOnRectangleIcon className="w-4 h-4" />
                              <span>Sign Out</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-textMuted hover:text-textPrimary transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}

              {/* Enhanced Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Bars3Icon className="w-5 h-5 text-gray-700" />
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-border bg-surface/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 relative overflow-hidden group ${
                          isActive
                            ? 'text-white shadow-lg'
                            : 'text-textMuted hover:text-textPrimary hover:bg-gray-50'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mobileActiveTab"
                            className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl`}
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                          />
                        )}
                        
                        <motion.div
                          className="relative z-10"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <item.icon className="w-5 h-5" />
                        </motion.div>
                        <span className="relative z-10">{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main content with smooth transitions */}
      <motion.main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {children}
      </motion.main>

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

      {/* Click outside handler for dropdowns */}
      {(showUserDropdown || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserDropdown(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;