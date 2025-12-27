import { motion, useReducedMotion } from 'framer-motion';

export function TropicalBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Clouds - very subtle and slow */}
      <motion.div
        className="absolute top-[10%] left-0 w-[300px] h-[80px] bg-white/20 dark:bg-white/5 rounded-full blur-3xl"
        animate={shouldReduceMotion ? {} : {
          x: ['0%', '150vw'],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute top-[5%] -left-20 w-[200px] h-[60px] bg-white/15 dark:bg-white/5 rounded-full blur-2xl"
        animate={shouldReduceMotion ? {} : {
          x: ['0%', '180vw'],
        }}
        transition={{
          duration: 80,
          repeat: Infinity,
          ease: 'linear',
          delay: 10,
        }}
      />

      {/* Ocean - bottom section */}
      <div className="absolute bottom-0 left-0 right-0 h-[35%]">
        {/* Ocean base */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-secondary/20 to-transparent dark:from-secondary/30 dark:via-secondary/15" />
        
        {/* Calm waves */}
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,60 C360,100 720,20 1080,60 C1260,80 1380,70 1440,60 L1440,120 L0,120 Z"
            className="fill-secondary/30 dark:fill-secondary/20"
            animate={shouldReduceMotion ? {} : {
              d: [
                "M0,60 C360,100 720,20 1080,60 C1260,80 1380,70 1440,60 L1440,120 L0,120 Z",
                "M0,70 C360,30 720,90 1080,50 C1260,40 1380,60 1440,70 L1440,120 L0,120 Z",
                "M0,60 C360,100 720,20 1080,60 C1260,80 1380,70 1440,60 L1440,120 L0,120 Z",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.path
            d="M0,80 C480,50 960,100 1440,70 L1440,120 L0,120 Z"
            className="fill-secondary/40 dark:fill-secondary/25"
            animate={shouldReduceMotion ? {} : {
              d: [
                "M0,80 C480,50 960,100 1440,70 L1440,120 L0,120 Z",
                "M0,70 C480,90 960,50 1440,80 L1440,120 L0,120 Z",
                "M0,80 C480,50 960,100 1440,70 L1440,120 L0,120 Z",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </svg>

        {/* Light reflection on water */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[200px] h-[60px] bg-white/10 dark:bg-gold/10 rounded-full blur-2xl" />
      </div>

      {/* Palm tree silhouettes */}
      <div className="absolute bottom-[30%] left-[5%] origin-bottom">
        <motion.div
          animate={shouldReduceMotion ? {} : { rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PalmTree className="w-24 h-48 text-primary/20 dark:text-primary/15" />
        </motion.div>
      </div>
      <div className="absolute bottom-[28%] right-[8%] origin-bottom">
        <motion.div
          animate={shouldReduceMotion ? {} : { rotate: [2, -2, 2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <PalmTree className="w-20 h-40 text-primary/15 dark:text-primary/10 scale-x-[-1]" />
        </motion.div>
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
      
      {/* Dark mode: sunset glow */}
      <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-orange-500/20 via-purple-500/10 to-transparent rounded-full blur-[80px]" />

      {/* Subtle mist overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
    </div>
  );
}

function PalmTree({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 200" className={className} fill="currentColor">
      {/* Trunk */}
      <path d="M48,200 Q50,150 52,100 Q53,80 50,80 Q47,80 48,100 Q46,150 48,200 Z" />
      {/* Fronds */}
      <path d="M50,85 Q30,60 10,70 Q35,55 50,80 Z" />
      <path d="M50,80 Q25,40 5,45 Q30,35 50,75 Z" />
      <path d="M50,75 Q40,30 25,20 Q45,25 52,70 Z" />
      <path d="M50,85 Q70,60 90,70 Q65,55 50,80 Z" />
      <path d="M50,80 Q75,40 95,45 Q70,35 50,75 Z" />
      <path d="M50,75 Q60,30 75,20 Q55,25 48,70 Z" />
      <path d="M50,70 Q50,20 50,10 Q52,25 52,70 Z" />
    </svg>
  );
}
