import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const InteractiveTable = ({
  headers,
  data,
  renderRow,
  className = '',
  onRowClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        'bg-surface rounded-xl shadow-lg border border-border overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-gradient-to-r from-surface to-surface/80">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-textMuted uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {data.map((item, index) => (
              <motion.tr
                key={item.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
                className={clsx(
                  'cursor-pointer transition-colors duration-200',
                  onRowClick && 'hover:bg-indigo-500/10'
                )}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {renderRow(item, index)}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default InteractiveTable;
