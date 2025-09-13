import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Icon = ({
  as: IconComponent,
  size = 24,
  color = 'text-textMuted',
  hoverColor = 'text-primary',
  glow = true,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.1,
        rotate: 5,
        filter: glow ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6)) brightness(1.2)' : 'brightness(1.2)'
      }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        'transition-all duration-300 cursor-pointer inline-flex items-center justify-center',
        color,
        `hover:${hoverColor}`,
        className
      )}
      {...props}
    >
      <IconComponent size={size} />
    </motion.div>
  );
};

export default Icon;
