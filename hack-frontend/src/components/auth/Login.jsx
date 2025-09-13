import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleLogin = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.departmentLogin(data);
      
      setAuth(response.data.user, response.data.token);
      toast.success('Login successful');
      navigate('/department');
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
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-textPrimary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
            Department Login
          </h2>
          <p className="mt-2 text-center text-sm text-textMuted">
            Login with your Aadhaar number and password
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit(handleLogin)}>
            <div>
              <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-textPrimary">
                Aadhaar Number
              </label>
              <input
                {...register('aadhaarNumber', {
                  required: 'Aadhaar number is required',
                  pattern: {
                    value: /^\d{12}$/,
                    message: 'Aadhaar number must be 12 digits'
                  }
                })}
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Enter 12-digit Aadhaar number"
                maxLength="12"
              />
              {errors.aadhaarNumber && (
                <p className="mt-1 text-sm text-error">{errors.aadhaarNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required'
                })}
                type="password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-textPrimary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          <div className="text-center space-y-2">
            <Link
              to="/admin/login"
              className="text-primary hover:text-primary text-sm font-medium"
            >
              Admin Login
            </Link>
            <div className="text-sm text-textMuted">
              New department?{' '}
              <Link
                to="/department/signup"
                className="text-primary hover:text-primary font-medium"
              >
                Register here
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
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
