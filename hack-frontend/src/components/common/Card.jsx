import React from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const Card = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={`bg-surface border border-border rounded-lg shadow-md p-6 text-textPrimary ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
