import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleAdminLogin = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.adminLogin(data);
      
      setAuth(response.data.user, response.data.token);
      toast.success('Admin login successful');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-error rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-textPrimary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-textMuted">
            Access the administrative dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleAdminLogin)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-error focus:border-error focus:z-10 sm:text-sm"
                placeholder="Enter admin email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-textPrimary bg-error hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error"
                >
                  Sign In as Admin
                </motion.button>

          <div className="text-center space-y-2">
            <div className="text-sm text-textMuted">
              Default credentials: admin@fundtracker.gov.in / admin123
            </div>
            <div className="text-sm text-textMuted">
              <Link
                to="/login"
                className="text-primary hover:text-primary font-medium"
              >
                Department Login
              </Link>
            </div>
            <div className="text-sm text-textMuted">
              <Link
                to="/"
                className="text-textMuted hover:text-textPrimary"
              >
                ← Back to Public Dashboard
              </Link>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AdminLogin;
