'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

export function HoverLift({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.985 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
