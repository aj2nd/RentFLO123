import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
}

export function SuccessAnimation({ show, message = "Payment Successful" }: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          <div className="relative flex flex-col items-center">
            {/* Minimalist burst lines */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, rotate: i * 45 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0.5, 1.5], 
                  x: [0, Math.cos(i * 45 * (Math.PI / 180)) * 100],
                  y: [0, Math.sin(i * 45 * (Math.PI / 180)) * 100],
                }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="absolute w-24 h-0.5 bg-white origin-center"
              />
            ))}
            
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, delay: 0.1 }}
              className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center bg-white text-black mb-8"
            >
              <Check size={48} strokeWidth={3} />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold tracking-tighter text-white uppercase text-center"
            >
              {message}
            </motion.h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
