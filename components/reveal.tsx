"use client";

import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "motion/react";

type RevealProps = PropsWithChildren<{
  delay?: number;
  className?: string;
}>;

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
