import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, Eye, EyeOff, Mail, Lock, DollarSign, TrendingUp, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const roles = [
  {
    key: 'user',
    label: 'User',
    description: 'Track & manage funds',
    icon: User,
    gradient: 'from-blue-500 to-purple-600',
    shadow: 'shadow-blue-500/25',
  },
  {
    key: 'department',
    label: 'Department',
    description: 'Department access',
    icon: Building,
    gradient: 'from-green-500 to-teal-600',
    shadow: 'shadow-green-500/25',
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Full system control',
    icon: Shield,
    gradient: 'from-purple-500 to-pink-600',
    shadow: 'shadow-purple-500/25',
  },
];

const floatingElements = [
  { icon: DollarSign, delay: 0, x: 100, y: 100 },
  { icon: TrendingUp, delay: 2, x: 300, y: 200 },
  { icon: Shield, delay: 4, x: 200, y: 300 },
  { icon: Building, delay: 1, x: 50, y: 250 },
];

const RoleBasedLogin = () => {
  const [selectedRole, setSelectedRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { setAuth, setLoading: setAuthLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const onSubmit = async (data) => {
    if (selectedRole === 'user') {
      navigate('/home');
      return;
    }

    setLoading(true);
    setAuthLoading(true);
    try {
      if (selectedRole === 'department') {
        const response = await authAPI.departmentLogin(data);
        setAuth(response.data.user, response.data.token);
        toast.success('Department login successful');
        navigate('/department');
      } else if (selectedRole === 'admin') {
        const response = await authAPI.adminLogin(data);
        setAuth(response.data.user, response.data.token);
        toast.success('Admin login successful');
        navigate('/admin');
      }
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
      setAuthLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    if (selectedRole === 'department') {
      setValue('email', 'department@example.com');
      setValue('password', 'department123');
    } else if (selectedRole === 'admin') {
      setValue('email', 'admin@example.com');
      setValue('password', 'admin123');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map(({ icon: Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute opacity-10"
            style={{ left: `${x}px`, top: `${y}px` }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 6,
              delay,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <Icon className="w-12 h-12 text-white" />
          </motion.div>
        ))}
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glowing Border Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
          animate={{
            opacity: isHovered ? 1 : 0.5,
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{ zIndex: -1 }}
        />

        {/* Header with Logo Animation */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg"
            whileHover={{ 
              rotate: [0, -10, 10, 0],
              scale: 1.1 
            }}
            transition={{ duration: 0.5 }}
          >
            <DollarSign className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h2
            className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Fund Tracker
          </motion.h2>
          <motion.p
            className="mt-2 text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Secure financial management portal
          </motion.p>
        </motion.div>

        {/* Enhanced Role Selector */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {roles.map(({ key, label, description, icon: Icon, gradient, shadow }, index) => {
            const isSelected = selectedRole === key;
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => setSelectedRole(key)}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 group overflow-hidden
                  ${isSelected 
                    ? `border-white/30 bg-gradient-to-br ${gradient} ${shadow} shadow-lg` 
                    : 'border-gray-600/50 bg-gray-800/50 hover:border-white/20 hover:bg-gray-700/50'
                  }
                `}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
                  transition={{ duration: 0.6 }}
                />
                
                <motion.div
                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className={`mb-2 h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                </motion.div>
                
                <span className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {label}
                </span>
                <span className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  {description}
                </span>

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Enhanced Demo Credentials Button */}
        <AnimatePresence>
          {(selectedRole === 'department' || selectedRole === 'admin') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 text-center"
            >
              {/* <motion.button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-full hover:bg-blue-500/20 transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Use Demo Credentials
              </motion.button> */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {selectedRole === 'user' && (
              <motion.div
                key="user"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.span
                    animate={loading ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    {loading ? '⚡' : '🚀'} {loading ? 'Signing in...' : 'Enter Fund Tracker'}
                  </motion.span>
                </motion.button>
              </motion.div>
            )}

            {(selectedRole === 'department' || selectedRole === 'admin') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Enhanced Email/Aadhaar Field */}
                {selectedRole === 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <motion.div 
                      className="relative rounded-2xl shadow-sm bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <motion.div 
                        className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center"
                        animate={{ scale: errors.email ? [1, 1.2, 1] : 1 }}
                      >
                        <Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                      </motion.div>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@fundtracker.com"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className={`
                          block w-full rounded-2xl border-0 bg-transparent py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all duration-300
                          ${errors.email ? 'ring-2 ring-red-500/50' : ''}
                        `}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 text-sm text-red-400"
                        >
                          {errors.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {selectedRole === 'department' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-white mb-2">
                      Aadhaar Number
                    </label>
                    <motion.div 
                      className="relative rounded-2xl shadow-sm bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <motion.div 
                        className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center"
                        animate={{ scale: errors.aadhaarNumber ? [1, 1.2, 1] : 1 }}
                      >
                        <Lock className={`h-5 w-5 transition-colors ${errors.aadhaarNumber ? 'text-red-400' : 'text-gray-400'}`} />
                      </motion.div>
                      <input
                        id="aadhaarNumber"
                        type="text"
                        autoComplete="off"
                        placeholder="XXXX XXXX XXXX"
                        {...register('aadhaarNumber', {
                          required: 'Aadhaar number is required',
                          pattern: {
                            value: /^\d{12}$/,
                            message: 'Aadhaar number must be 12 digits',
                          },
                        })}
                        className={`
                          block w-full rounded-2xl border-0 bg-transparent py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all duration-300
                          ${errors.aadhaarNumber ? 'ring-2 ring-red-500/50' : ''}
                        `}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {errors.aadhaarNumber && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 text-sm text-red-400"
                        >
                          {errors.aadhaarNumber.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Enhanced Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <motion.div 
                    className="relative rounded-2xl shadow-sm bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <motion.div 
                      className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center"
                      animate={{ scale: errors.password ? [1, 1.2, 1] : 1 }}
                    >
                      <Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                    </motion.div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter secure password"
                      {...register('password', {
                        required: 'Password is required',
                      })}
                      className={`
                        block w-full rounded-2xl border-0 bg-transparent py-3 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 sm:text-sm transition-all duration-300
                        ${errors.password ? 'ring-2 ring-red-500/50' : ''}
                      `}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white focus:outline-none transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <motion.div
                        animate={{ rotateY: showPassword ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.div>
                    </motion.button>
                  </motion.div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 text-sm text-red-400"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Enhanced Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full py-4 rounded-2xl font-semibold shadow-lg focus:outline-none focus:ring-4 transition-all duration-300 relative overflow-hidden
                    ${selectedRole === 'department' 
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:shadow-green-500/25 focus:ring-green-400/50' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-purple-500/25 focus:ring-purple-400/50'
                    }
                    ${loading ? 'cursor-not-allowed' : 'hover:scale-[1.02] hover:-translate-y-1'}
                  `}
                  whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                    animate={loading ? { translateX: ['100%', '200%'] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  
                  <span className="relative text-white flex items-center justify-center">
                    {loading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        ⚡
                      </motion.div>
                    )}
                    {loading ? 'Authenticating...' : `Access ${selectedRole === 'department' ? 'Department' : 'Admin'} Portal`}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Enhanced Signup Link */}
        {selectedRole === 'department' && (
          <motion.p
            className="mt-6 text-center text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            New department?{' '}
            <Link 
              to="/department/signup" 
              className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium"
            >
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-block"
              >
                Register here →
              </motion.span>
            </Link>
          </motion.p>
        )}

        {/* Security Badge */}
        <motion.div
          className="mt-6 flex items-center justify-center text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Shield className="w-3 h-3 mr-1" />
          Secured with enterprise-grade encryption
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RoleBasedLogin;