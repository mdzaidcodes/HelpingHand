'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number;
  y?: number;
};

export function Reveal({ delay = 0, y = 16, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
