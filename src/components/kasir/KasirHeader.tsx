import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConnectionStatus } from '@/components/pwa/ConnectionStatus';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface KasirHeaderProps {
  storeName?: string;
}

export function KasirHeader({ storeName = 'Laundry POS' }: KasirHeaderProps) {
  const { profile, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Store Name & Shift Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{storeName}</h1>
            <p className="text-xs text-primary-foreground/80 truncate">
              Kasir: {profile?.name || 'Loading...'}
            </p>
          </div>

          {/* Realtime Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-lg mx-2">
            <Clock className="h-4 w-4" />
            <div className="text-center">
              <p className="text-sm font-semibold tabular-nums">
                {format(currentTime, 'HH:mm:ss')}
              </p>
              <p className="text-[10px] text-primary-foreground/80">
                {format(currentTime, 'EEEE, d MMM', { locale: id })}
              </p>
            </div>
          </div>

          {/* Connection Status & Logout */}
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari sesi kasir. Pastikan tidak ada transaksi yang belum selesai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
