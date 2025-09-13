import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const gradients = {
  primary: 'bg-gradient-to-r from-indigo-500 to-indigo-700',
  secondary: 'bg-gradient-to-r from-blue-500 to-blue-700',
  success: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  danger: 'bg-gradient-to-r from-red-500 to-red-700',
  violet: 'bg-gradient-to-r from-violet-500 to-violet-700',
  gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
};

const ActionButton = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  const gradientClass = gradients[variant] || gradients.primary;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl text-white font-semibold',
        'shadow-lg transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-white/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        gradientClass,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </motion.button>
  );
});

ActionButton.displayName = 'ActionButton';

export default ActionButton;
