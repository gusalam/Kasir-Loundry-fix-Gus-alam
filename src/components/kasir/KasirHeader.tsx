import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Clock, Droplets } from 'lucide-react';
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

export function KasirHeader() {
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
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-foreground/20">
              <Droplets className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate leading-tight">POS Laundry</h1>
              <p className="text-[11px] text-primary-foreground/80 truncate leading-tight">
                Clean & Fresh
              </p>
            </div>
          </div>

          {/* Shift Info */}
          <div className="hidden sm:block px-3 py-1 bg-primary-foreground/10 rounded-lg mx-2">
            <p className="text-xs text-primary-foreground/80">Kasir</p>
            <p className="text-sm font-medium truncate max-w-[120px]">
              {profile?.name || 'Loading...'}
            </p>
          </div>

          {/* Realtime Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-lg mx-2">
            <Clock className="h-4 w-4" />
            <div className="text-center">
              <p className="text-sm font-semibold tabular-nums">
                {format(currentTime, 'HH:mm:ss')}
              </p>
              <p className="text-[10px] text-primary-foreground/80 hidden sm:block">
                {format(currentTime, 'EEEE, d MMM', { locale: id })}
              </p>
            </div>
          </div>

          {/* Connection Status & Logout */}
          <div className="flex items-center gap-1">
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

        {/* Mobile Shift Info */}
        <div className="sm:hidden px-4 pb-2">
          <p className="text-xs text-primary-foreground/70">
            Kasir: <span className="font-medium text-primary-foreground">{profile?.name || 'Loading...'}</span>
            <span className="mx-2">•</span>
            {format(currentTime, 'EEEE, d MMMM yyyy', { locale: id })}
          </p>
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
