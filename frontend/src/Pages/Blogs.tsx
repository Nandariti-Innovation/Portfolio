import React from "react";
import { motion } from "framer-motion";

export const Blogs: React.FC = () => {
  return (
    <motion.main
      initial={{ translateX: 20 }}
      animate={{ translateX: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-background w-[calc(100vw-var(--sidebar-width))] h-full"
    >
      Blogs
    </motion.main>
  );
};
