import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bluetooth, ShieldCheck, MapPin, Loader2, AlertTriangle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface BluetoothPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestPermission: () => Promise<void>;
  isRequesting: boolean;
  error?: string | null;
  onOpenSettings?: () => void;
}

export function BluetoothPermissionDialog({
  open,
  onOpenChange,
  onRequestPermission,
  isRequesting,
  error,
  onOpenSettings,
}: BluetoothPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-xl">
        <DialogHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
          >
            <Bluetooth className="w-10 h-10 text-primary" />
          </motion.div>
          <DialogTitle className="text-xl font-semibold">
            Izin Bluetooth Diperlukan
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Untuk menghubungkan dan mencetak ke printer thermal, aplikasi memerlukan akses Bluetooth.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Permission Items */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 bg-pastel-blue/20 rounded-xl"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bluetooth className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Bluetooth</p>
              <p className="text-xs text-muted-foreground">
                Mencari dan menghubungkan printer
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 bg-pastel-green/20 rounded-xl"
          >
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-sm">Lokasi</p>
              <p className="text-xs text-muted-foreground">
                Diperlukan Android untuk scan Bluetooth
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 p-3 bg-pastel-purple/20 rounded-xl"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Aman & Privat</p>
              <p className="text-xs text-muted-foreground">
                Data lokasi tidak disimpan atau dikirim
              </p>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-pastel-pink/30 rounded-xl flex gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-medium">Izin Ditolak</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                {onOpenSettings && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={onOpenSettings}
                    className="px-0 h-auto mt-2 text-primary"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Buka Pengaturan Aplikasi
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onRequestPermission}
            disabled={isRequesting}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-medium"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Meminta Izin...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                Berikan Izin
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isRequesting}
            className="w-full h-10 rounded-xl text-muted-foreground"
          >
            Nanti Saja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
