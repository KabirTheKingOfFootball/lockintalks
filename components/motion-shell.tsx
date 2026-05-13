"use client";

import { motion } from "framer-motion";

export function MotionShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
