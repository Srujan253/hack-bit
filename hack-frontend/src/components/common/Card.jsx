import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={hover ? { scale: 1.02, rotateX: 2, rotateY: 2, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' } : {}}
      className={clsx(
        'bg-surface border border-border rounded-xl shadow-lg p-6 text-textPrimary',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
