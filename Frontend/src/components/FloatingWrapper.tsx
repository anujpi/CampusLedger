import React from 'react';
import { motion } from 'framer-motion';

interface FloatingWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingWrapper: React.FC<FloatingWrapperProps> = ({ 
  children, 
  className = '',
  delay = 0 
}) => {
  return (
    <motion.div
      className={className}
      animate={{ 
        y: ['-10px', '10px'] 
      }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: delay
        }
      }}
    >
      {children}
    </motion.div>
  );
};
