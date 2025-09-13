import React from 'react';
import { motion } from 'framer-motion';

const Icon = ({ as: IconComponent, size = 24, color = 'text-textMuted', hoverColor = 'text-primary', className = '', ...props }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.2, rotate: 15 }}
      className={`transition-colors duration-300 ${color} hover:${hoverColor} cursor-pointer inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <IconComponent size={size} />
    </motion.div>
  );
};

export default Icon;
