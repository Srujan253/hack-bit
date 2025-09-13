import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DepartmentSignup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const password = watch('password');

  const handleSignup = async (data) => {
    try {
      setLoading(true);
      await authAPI.departmentSignup(data);
      
      toast.success('Signup successful! Please wait for admin approval.');
      reset();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
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
          <div className="mx-auto h-12 w-12 bg-accent rounded-lg flex items-center justify-center">
            <svg className="h-6 w-6 text-textPrimary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
            Department Registration
          </h2>
          <p className="mt-2 text-center text-sm text-textMuted">
            Register your department with Aadhaar verification
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit(handleSignup)}>
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
                <label htmlFor="email" className="block text-sm font-medium text-textPrimary">
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
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="departmentName" className="block text-sm font-medium text-textPrimary">
                  Department Name
                </label>
                <input
                  {...register('departmentName', {
                    required: 'Department name is required',
                    minLength: {
                      value: 3,
                      message: 'Department name must be at least 3 characters'
                    }
                  })}
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="e.g., Public Works Department"
                />
                {errors.departmentName && (
                  <p className="mt-1 text-sm text-error">{errors.departmentName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="departmentCode" className="block text-sm font-medium text-textPrimary">
                  Department Code
                </label>
                <input
                  {...register('departmentCode', {
                    required: 'Department code is required',
                    pattern: {
                      value: /^[A-Z0-9]{2,6}$/,
                      message: 'Department code must be 2-6 uppercase letters/numbers'
                    }
                  })}
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="e.g., PWD, HEALTH, EDU"
                  maxLength="6"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.departmentCode && (
                  <p className="mt-1 text-sm text-error">{errors.departmentCode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-textPrimary">
                  Password
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type="password"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-textPrimary">
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type="password"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-textPrimary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Register Department'}
              </motion.button>
            </form>

          <div className="text-center space-y-2">
            <div className="text-sm text-textMuted">
              Already registered?{' '}
              <Link
                to="/login"
                className="text-secondary hover:text-primary font-medium"
              >
                Login here
              </Link>
            </div>
            <div className="text-sm text-textMuted">
              <Link
                to="/"
                className="text-border hover:text-textPrimary"
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

export default DepartmentSignup;
