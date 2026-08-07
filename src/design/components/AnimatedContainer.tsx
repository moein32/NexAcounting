import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { fadeInUp, staggerContainer } from '../motion/animations';

interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  stagger?: boolean;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  stagger = false,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={stagger ? staggerContainer : fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
