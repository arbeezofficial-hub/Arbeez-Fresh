import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import brandLogo from '../assets/logo';

export const AnimatedSplash = ({ onFinish }: { onFinish?: () => void }) => {
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlow(true);
    }, 600);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Background Soft Glow Radial Effect */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: glow ? 0.35 : 0.1, scale: glow ? 1.2 : 0.9 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute w-96 h-96 bg-emerald-500 rounded-full filter blur-[100px] pointer-events-none"
      />

      {/* Main Container with Motion */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.85, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <div className="relative mb-6">
          {/* Logo Frame */}
          <motion.div
            animate={{ 
              boxShadow: glow 
                ? '0 0 50px rgba(16, 185, 129, 0.4)' 
                : '0 0 10px rgba(16, 185, 129, 0.1)' 
            }}
            transition={{ duration: 1 }}
            className="p-5 bg-slate-900/90 rounded-[32px] border border-emerald-500/30 backdrop-blur-xl"
          >
            <img 
              src={brandLogo} 
              alt="Arbeez Fresh Logo" 
              className="h-20 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg"
          >
            <Sparkles size={14} className="animate-spin-slow" />
          </motion.div>
        </div>

        {/* Brand Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-md"
        >
          Arbeez <span className="text-emerald-400">Fresh</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-slate-300 text-xs font-bold uppercase tracking-[0.2em] mt-2"
        >
          Fresh Grocery Marketplace
        </motion.p>

        {/* Loading Indicator Dots */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center gap-2 mt-10"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </motion.div>
      </motion.div>
    </div>
  );
};
