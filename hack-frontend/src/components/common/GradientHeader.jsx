import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const GradientHeader = ({
  title,
  subtitle,
  actions,
  filterOptions = [],
  selectedFilter,
  onFilterChange,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={clsx(
        'bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 rounded-xl p-8 text-white shadow-2xl',
        className
      )}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="text-indigo-100 text-lg">
              {subtitle}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 md:mt-0 flex items-center space-x-4"
        >
          {filterOptions.length > 0 && (
            <select
              value={selectedFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value} className="text-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {actions && (
            <div className="flex space-x-3">
              {actions}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GradientHeader;
