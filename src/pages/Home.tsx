import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { TropicalBackground } from '@/components/landing/TropicalBackground';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { Droplets, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: shouldReduceMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated tropical background */}
      <TropicalBackground />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Main content */}
      <motion.div
        className="relative z-20 text-center px-6 max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary shadow-glow-primary"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Droplets className="w-10 h-10 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
        >
          <span className="text-foreground">Sistem Kasir</span>
          <br />
          <span className="text-gradient">Laundry</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed"
        >
          Solusi kasir modern untuk operasional laundry profesional
        </motion.p>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={() => navigate('/login')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-lg shadow-glow-primary overflow-hidden"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-shimmer bg-[length:200%_100%]"
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            
            <span className="relative">Masuk ke Sistem</span>
            <motion.div
              className="relative"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Subtle trust indicator */}
        <motion.p
          variants={itemVariants}
          className="mt-8 text-sm text-muted-foreground/70"
        >
          Dipercaya oleh laundry profesional
        </motion.p>
      </motion.div>

      {/* Bottom gradient fade for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
  );
}
