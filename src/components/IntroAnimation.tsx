import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

export default function IntroAnimation() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F2ED]"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            {/* Mandala-inspired SVG */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 100 100"
              className="text-[#800000] drop-shadow-lg"
            >
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              <motion.path
                d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z"
                fill="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
              />
              <circle cx="50" cy="50" r="5" fill="#FFD700" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <motion.circle
                  key={angle}
                  cx={50 + 30 * Math.cos((angle * Math.PI) / 180)}
                  cy={50 + 30 * Math.sin((angle * Math.PI) / 180)}
                  r="3"
                  fill="#FFD700"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + angle / 1000 }}
                />
              ))}
            </svg>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-3xl font-bold text-[#800000] tracking-widest"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Saraswati General Stores
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-2 text-[#5C4033] italic"
            >
              All Your Stationery, One Place
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
