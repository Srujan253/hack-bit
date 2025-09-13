import React from 'react';
import { motion } from 'framer-motion';

const gradients = {
  teal: 'bg-gradient-to-r from-teal-400 to-teal-600',
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-700',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-700',
  emerald: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
};

const Button = React.forwardRef(({ children, variant = 'indigo', className = '', ...props }, ref) => {
  const gradientClass = gradients[variant] || gradients.indigo;

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-block px-5 py-2 rounded-md text-white font-semibold shadow-md transition-colors focus:outline-none focus:ring-4 focus:ring-${variant}-300 ${gradientClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
