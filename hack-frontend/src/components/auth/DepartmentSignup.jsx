import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1 }
  }),
};

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
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 bg-surface bg-opacity-70 rounded-2xl shadow-lg p-8"
      >
        <div className="bg-gradient-to-r from-purple-600 to-teal-500 rounded-t-2xl p-6 text-center">
          <h2 className="text-3xl font-extrabold text-textPrimary">Department Registration</h2>
          <p className="mt-2 text-sm text-textMuted">Register your department with Aadhaar verification</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(handleSignup)}>
          {[
            {
              id: 'aadhaarNumber',
              label: 'Aadhaar Number',
              type: 'text',
              placeholder: 'Enter 12-digit Aadhaar number',
              validation: {
                required: 'Aadhaar number is required',
                pattern: {
                  value: /^\d{12}$/,
                  message: 'Aadhaar number must be 12 digits'
                }
              },
              maxLength: 12,
              style: {}
            },
            {
              id: 'email',
              label: 'Email Address',
              type: 'email',
              placeholder: 'Enter email address',
              validation: {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              }
            },
            {
              id: 'departmentName',
              label: 'Department Name',
              type: 'text',
              placeholder: 'e.g., Public Works Department',
              validation: {
                required: 'Department name is required',
                minLength: {
                  value: 3,
                  message: 'Department name must be at least 3 characters'
                }
              }
            },
            {
              id: 'departmentCode',
              label: 'Department Code',
              type: 'text',
              placeholder: 'e.g., PWD, HEALTH, EDU',
              validation: {
                required: 'Department code is required',
                pattern: {
                  value: /^[A-Z0-9]{2,6}$/,
                  message: 'Department code must be 2-6 uppercase letters/numbers'
                }
              },
              maxLength: 6,
              style: { textTransform: 'uppercase' }
            },
            {
              id: 'password',
              label: 'Password',
              type: 'password',
              placeholder: 'Enter password',
              validation: {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              }
            },
            {
              id: 'confirmPassword',
              label: 'Confirm Password',
              type: 'password',
              placeholder: 'Confirm password',
              validation: {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              }
            }
          ].map((field, index) => (
            <motion.div
              key={field.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={inputVariants}
            >
              <label htmlFor={field.id} className="block text-sm font-medium text-textPrimary">
                {field.label}
              </label>
              <input
                {...register(field.id, field.validation)}
                type={field.type}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-textMuted text-textPrimary rounded-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition-shadow duration-300"
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                style={field.style}
              />
              {errors[field.id] && (
                <p className="mt-1 text-sm text-error">{errors[field.id].message}</p>
              )}
            </motion.div>
          ))}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05, boxShadow: '0 0 8px #6366F1' }}
            whileTap={{ scale: 0.95 }}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-textPrimary bg-gradient-to-r from-purple-600 to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-textPrimary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Register Department'
            )}
          </motion.button>
        </form>

        <div className="text-center space-y-2 mt-6">
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
      </motion.div>
    </motion.div>
  );
};

export default DepartmentSignup;
