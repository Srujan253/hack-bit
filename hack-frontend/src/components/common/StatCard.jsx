import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'indigo' }) => {
  const gradientColors = {
    indigo: 'from-indigo-500 to-indigo-700',
    blue: 'from-blue-500 to-blue-700',
    emerald: 'from-emerald-400 to-emerald-600',
    violet: 'from-violet-500 to-violet-700',
    gold: 'from-yellow-400 to-yellow-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
      className={clsx(
        'bg-surface rounded-xl shadow-lg border border-border p-6 cursor-pointer',
        'transition-shadow duration-300 ease-in-out',
        'hover:shadow-2xl'
      )}
    >
      <div className={clsx('p-3 rounded-lg inline-block bg-gradient-to-r', gradientColors[color])}>
        <Icon className="w-8 h-8 text-white drop-shadow-lg" />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {subtitle && <p className="text-sm text-textMuted mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
