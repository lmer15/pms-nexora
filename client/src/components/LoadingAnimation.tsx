import { motion } from "framer-motion";

const LoadingAnimation = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated "n" letter */}
        <motion.path
          d="M8 8 L8 48 L28 48 L28 28 L48 28 L48 8"
          stroke="#16a34a"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.svg>
    </div>
  );
};

export default LoadingAnimation;
