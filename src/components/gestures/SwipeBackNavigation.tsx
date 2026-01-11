import { ReactNode, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeBackNavigationProps {
  children: ReactNode;
  enabled?: boolean;
  threshold?: number;
}

export function SwipeBackNavigation({ 
  children, 
  enabled = true,
  threshold = 100 
}: SwipeBackNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { impactLight } = useHapticFeedback();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, threshold], [1, 0.5]);
  const scale = useTransform(x, [0, threshold], [1, 0.95]);
  const indicatorOpacity = useTransform(x, [0, 50, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(x, [0, threshold], [0.5, 1]);

  // Check if we're on a root page (shouldn't swipe back)
  const rootPaths = ['/', '/login', '/admin/dashboard', '/kasir/dashboard'];
  const isRootPage = rootPaths.includes(location.pathname);

  const handleDragStart = () => {
    if (!enabled || isRootPage) return;
    setIsDragging(true);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (!enabled || isRootPage) return;
    
    // Only allow right swipe (positive offset)
    if (info.offset.x < 0) {
      x.set(0);
      return;
    }
    
    // Provide haptic feedback when reaching threshold
    if (info.offset.x >= threshold && x.get() < threshold) {
      impactLight();
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (!enabled || isRootPage) {
      x.set(0);
      return;
    }

    // If swiped past threshold with enough velocity, navigate back
    if (info.offset.x >= threshold || (info.velocity.x > 500 && info.offset.x > 50)) {
      impactLight();
      navigate(-1);
    }
    
    // Reset position
    x.set(0);
  };

  if (!enabled || isRootPage) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Back indicator */}
      <motion.div 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
        style={{ opacity: indicatorOpacity }}
      >
        <motion.div 
          className="flex items-center justify-center w-12 h-12 ml-2 rounded-full bg-primary/20 backdrop-blur-sm"
          style={{ scale: indicatorScale }}
        >
          <svg 
            className="w-6 h-6 text-primary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Edge swipe indicator line */}
      <motion.div
        className="fixed left-0 top-0 bottom-0 w-1 bg-primary/30 z-40 pointer-events-none rounded-r-full"
        style={{ opacity: indicatorOpacity }}
      />

      <motion.div
        drag={isDragging || enabled ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        className="touch-pan-y"
        onPointerDown={(e) => {
          // Only enable drag from left edge (first 30px)
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect && e.clientX - rect.left < 30) {
            setIsDragging(true);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
