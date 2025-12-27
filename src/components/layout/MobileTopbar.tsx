import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MobileTopbarProps {
  title: string;
  showBack?: boolean;
}

export function MobileTopbar({ title, showBack }: MobileTopbarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back button or spacing */}
        <div className="w-12">
          {showBack && (
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 active:bg-muted transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </motion.button>
          )}
        </div>

        {/* Center: Title */}
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>

        {/* Right: Notifications */}
        <div className="w-12 flex justify-end">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
