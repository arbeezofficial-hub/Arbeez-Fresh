import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import brandLogo from '../assets/logo';

export const AnimatedSplash = ({ onFinish }: { onFinish?: () => void }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = () => setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    }

    // Timeline:
    // 0.0s - 0.3s: Scene 1 (Calm Ambient Entrance)
    // 0.3s - 1.1s: Scene 2 (Logo Smooth Scale & Upward Float)
    // 0.8s - 1.6s: Scene 3 (Brand Reveal with Blur-to-Sharp & Horizontal Motion)
    // 1.8s - 2.6s: Scene 4 (Premium Subtle Diagonal Light Sweep)
    // 3.2s - 3.6s: Scene 5 (Smooth Screen Fade Out & Transition)

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3200);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, [onFinish]);

  // Cubic bezier curve for smooth Apple-style motion (cubic-bezier(0.16, 1, 0.3, 1))
  const appleEase = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center font-sans overflow-hidden select-none"
    >
      {/* Scene 1: Subtle moving ambient radial light */}
      {!prefersReducedMotion ? (
        <motion.div 
          animate={{ 
            x: [-20, 20, -20],
            y: [-15, 15, -15],
            opacity: [0.12, 0.22, 0.12] 
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="absolute w-[420px] h-[420px] bg-emerald-500/15 rounded-full filter blur-[120px] pointer-events-none"
        />
      ) : (
        <div className="absolute w-[360px] h-[360px] bg-emerald-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      )}

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        
        {/* Scene 2 & 4: Logo Entrance & Light Sweep */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: prefersReducedMotion ? 0.4 : 0.9, 
            delay: prefersReducedMotion ? 0 : 0.2, 
            ease: appleEase 
          }}
          className="relative mb-8 p-6 bg-slate-900/60 rounded-[32px] border border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden group"
        >
          {/* Logo image */}
          <img 
            src={brandLogo} 
            alt="Arbeez Fresh" 
            className="h-20 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative z-10" 
          />

          {/* Scene 4: Premium Diagonal Light Sweep across Logo */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ 
                duration: 1.0, 
                delay: 1.8, 
                ease: [0.4, 0, 0.2, 1] 
              }}
              className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-20"
            />
          )}
        </motion.div>

        {/* Scene 3: Brand Name Reveal */}
        <motion.h1 
          initial={prefersReducedMotion 
            ? { opacity: 0 } 
            : { opacity: 0, x: -24, filter: 'blur(8px)' }
          }
          animate={{ 
            opacity: 1, 
            x: 0, 
            filter: 'blur(0px)' 
          }}
          transition={{ 
            duration: prefersReducedMotion ? 0.4 : 0.8, 
            delay: prefersReducedMotion ? 0.1 : 0.8, 
            ease: appleEase 
          }}
          className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-wider drop-shadow-md"
        >
          Arbeez <span className="text-emerald-400 font-black">Fresh</span>
        </motion.h1>

        {/* Scene 3: Tagline Reveal */}
        <motion.p
          initial={prefersReducedMotion 
            ? { opacity: 0 } 
            : { opacity: 0, x: -18, filter: 'blur(6px)' }
          }
          animate={{ 
            opacity: 0.75, 
            x: 0, 
            filter: 'blur(0px)' 
          }}
          transition={{ 
            duration: prefersReducedMotion ? 0.4 : 0.8, 
            delay: prefersReducedMotion ? 0.2 : 1.1, 
            ease: appleEase 
          }}
          className="text-slate-300 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mt-2.5"
        >
          Fresh Grocery Marketplace
        </motion.p>

        {/* Loader: Understated Minimal Progress Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="w-20 h-[2px] bg-slate-800/80 rounded-full overflow-hidden mt-10 relative"
        >
          {!prefersReducedMotion && (
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="w-full h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            />
          )}
        </motion.div>

      </div>
    </motion.div>
  );
};


