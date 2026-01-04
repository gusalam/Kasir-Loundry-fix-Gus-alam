import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingCart, QrCode, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KasirHeader } from './KasirHeader';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { QRScanner } from '@/components/qrcode/QRScanner';

interface KasirLayoutProps {
  children: ReactNode;
}

const bottomNavItems = [
  { icon: Home, label: 'Beranda', path: '/kasir/dashboard' },
  { icon: ShoppingCart, label: 'Transaksi', path: '/kasir/transaksi-baru' },
  { icon: QrCode, label: 'Scan', path: 'scan', isAction: true },
  { icon: ClipboardList, label: 'Tutup Kas', path: '/kasir/tutup-kas' },
  { icon: User, label: 'Akun', path: '/kasir/akun' },
];

export function KasirLayout({ children }: KasirLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cacheDataForOffline } = useOfflineSync();
  const [showScanner, setShowScanner] = useState(false);

  // Cache data for offline use when component mounts
  useEffect(() => {
    cacheDataForOffline();
  }, [cacheDataForOffline]);

  // Check if current path matches or starts with the nav item path
  const isPathActive = (itemPath: string) => {
    if (itemPath === '/kasir/dashboard') {
      return location.pathname === itemPath;
    }
    return location.pathname.startsWith(itemPath);
  };

  const handleNavClick = (item: typeof bottomNavItems[0]) => {
    if (item.isAction && item.path === 'scan') {
      setShowScanner(true);
    } else {
      navigate(item.path);
    }
  };

  const handleScanResult = (data: { invoice: string; rawData: string }) => {
    setShowScanner(false);
    // Navigate to pickup page with the scanned invoice
    navigate(`/kasir/pengambilan?invoice=${encodeURIComponent(data.invoice)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Fixed Header - NO SIDEBAR */}
      <KasirHeader />

      {/* Spacer for fixed header (taller on mobile due to shift info) */}
      <div className="h-[88px] sm:h-[72px] safe-area-top" />

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Main content - FULL WIDTH, no sidebar margin */}
      <main className="flex-1 overflow-y-auto pb-20 w-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 w-full max-w-md mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation - ONLY NAVIGATION, NO SIDEBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {bottomNavItems.map((item, index) => {
            const isActive = !item.isAction && isPathActive(item.path);
            const isScanButton = item.isAction && item.path === 'scan';
            
            if (isScanButton) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className="flex flex-col items-center justify-center -mt-6 touch-manipulation"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 rounded-full bg-gradient-primary shadow-lg flex items-center justify-center"
                  >
                    <QrCode className="h-7 w-7 text-primary-foreground" />
                  </motion.div>
                  <span className="text-[10px] font-medium text-muted-foreground mt-1">
                    {item.label}
                  </span>
                </button>
              );
            }
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative',
                  'active:scale-95 touch-manipulation',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="kasirBottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  'h-6 w-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <QRScanner 
              onScan={handleScanResult}
              onClose={() => setShowScanner(false)}
              fullscreen
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
