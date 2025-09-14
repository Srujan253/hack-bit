import React, { useState, useEffect, useRef } from 'react';
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
} from '@heroicons/react/24/outline'; // Using outline for consistency, could be solid
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import CurrencyToggle from '../common/CurrencyToggle';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth, isAdmin, isDepartment } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/');
    setShowUserDropdown(false);
    setIsSidebarOpen(false); // Close mobile sidebar on logout
  };

  // Common styles for navigation items
  const navItemClass = "flex items-center space-x-4 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200";
  const activeNavItemClass = "bg-[#282828] text-white";
  const inactiveNavItemClass = "text-[#b3b3b3] hover:text-white";

  // Navigation items structured for a single, unified list
  const publicNavItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Fund Flow', href: '/flow-dashboard', icon: ChartBarIcon },
    { name: 'Budgets', href: '/budgets', icon: CurrencyDollarIcon },
    { name: 'Transactions', href: '/transactions', icon: DocumentTextIcon },
  ];

  const adminNavItems = [
    { group: 'Overview', items: [
      { name: 'Dashboard', href: '/admin', icon: HomeIcon },
      { name: 'Fund Flow', href: '/admin/farmer-dashboard', icon: ChartBarIcon },
    ]},
    { group: 'Budget Management', items: [
      { name: 'Budgets', href: '/admin/budgets', icon: CurrencyDollarIcon },
      { name: 'Allocate Funds', href: '/admin/allocate-budget', icon: BanknotesIcon },
    ]},
    { group: 'Operations', items: [
      { name: 'Transactions', href: '/admin/transactions', icon: DocumentTextIcon },
      { name: 'Approvals', href: '/admin/approvals', icon: UserGroupIcon },
      { name: 'Alerts', href: '/admin/alerts', icon: Cog6ToothIcon },
    ]},
  ];

  const departmentNavItems = [
    { name: 'Dashboard', href: '/department', icon: HomeIcon },
    { name: 'My Budgets', href: '/department/budgets', icon: CurrencyDollarIcon },
    { name: 'Expense Tracker', href: '/department/expense-tracker', icon: ChartBarIcon },
    { name: 'Transactions', href: '/department/transactions', icon: DocumentTextIcon },
    { name: 'Submit Expense', href: '/department/submit-expense', icon: BanknotesIcon },
  ];

  const getNavItems = () => {
    if (isAdmin()) return adminNavItems;
    if (isDepartment()) return departmentNavItems;
    return publicNavItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex bg-[#121212] min-h-screen text-white font-sans antialiased">
      {/* Sidebar - Fixed Left Navigation */}
      <aside className={`fixed top-0 left-0 w-64 h-full bg-black flex-shrink-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BanknotesIcon className="w-8 h-8 text-[#1db954]" />
            <span className="text-xl font-bold tracking-tight">Fund Tracker</span>
          </Link>
          <div className="mt-8 space-y-4">
            {/* Main Navigation */}
            {Array.isArray(navItems) && navItems.length > 0 && navItems[0].group ? (
              // Render grouped items for Admin
              navItems.map((group, groupIndex) => (
                <div key={group.group} className="space-y-2">
                  <h3 className="text-xs uppercase text-[#b3b3b3] font-bold tracking-wider">{group.group}</h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`${navItemClass} ${location.pathname === item.href ? activeNavItemClass : inactiveNavItemClass}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Render simple list for Public and Department
              navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`${navItemClass} ${location.pathname === item.href ? activeNavItemClass : inactiveNavItemClass}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header/Top Bar */}
        <header className="sticky top-0 z-40 bg-[#121212] bg-opacity-80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-[#282828] lg:border-none">
          <div className="flex-1">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isSidebarOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {/* Currency Toggle */}
            <CurrencyToggle
              onCurrencyChange={(currency) => {
                window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }));
              }}
              className="bg-[#232326] text-white px-3 py-2 rounded-md border border-[#27272a] focus:ring-1 focus:ring-green-500"
            />
            {/* Auth/User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-1.5 rounded-full bg-[#282828] hover:bg-[#343434] transition-colors"
                >
                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                </button>
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-[#282828] rounded-md shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">{user?.departmentName || user?.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role} {user?.departmentCode && `(${user.departmentCode})`}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-400 hover:bg-[#343434] hover:text-white transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-black bg-white rounded-full hover:scale-105 transition-transform"
              >
                Log in
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 overflow-y-auto flex-1">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;