'use client';

import { 
  motion, 
  AnimatePresence, 
  useScroll,
  useSpring,
  type MotionProps
} from 'framer-motion';
import type { HTMLAttributes } from 'react';

export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionP = motion.p;
export const MotionH1 = motion.h1;
export const MotionButton = motion.button;
export const FramerAnimatePresence = AnimatePresence;

type MotionDivProps = HTMLAttributes<HTMLDivElement> & MotionProps;

export const MotionDivWrapper = (props: MotionDivProps) => <motion.div {...props} />;

export { useScroll, useSpring };
