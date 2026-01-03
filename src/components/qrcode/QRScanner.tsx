import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Camera, X, QrCode, Loader2, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: { invoice: string; rawData: string }) => void;
  title?: string;
}

export function QRScanner({ isOpen, onClose, onScan, title = 'Scan QR Invoice' }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!scannerContainerRef.current) return;

    setError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-scanner-container', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Stop scanning on successful scan
          stopScanning();
          
          // Parse the QR data
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.invoice) {
              onScan({ invoice: parsed.invoice, rawData: decodedText });
            } else {
              // Treat as plain invoice number
              onScan({ invoice: decodedText, rawData: decodedText });
            }
          } catch {
            // Plain text (barcode/invoice number)
            onScan({ invoice: decodedText, rawData: decodedText });
          }
        },
        undefined // Error callback (ignore scan failures)
      );

      setHasPermission(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setIsScanning(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setHasPermission(false);
        setError('Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setError(err.message || 'Gagal memulai scanner');
      }
    }
  }, [onScan, stopScanning]);

  // Start scanning when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the container is mounted
      const timer = setTimeout(startScanning, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanning();
    }
  }, [isOpen, startScanning, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Scanner Container */}
          <div className="relative aspect-square bg-black overflow-hidden">
            <div
              id="qr-scanner-container"
              ref={scannerContainerRef}
              className="w-full h-full"
            />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner guides */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 relative">
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
                    
                    {/* Scanning Line */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      initial={{ top: 0 }}
                      animate={{ top: '100%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Memuat kamera...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-destructive mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startScanning}
                  >
                    Coba Lagi
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-muted/50">
            <p className="text-sm text-center text-muted-foreground">
              Arahkan kamera ke QR code atau barcode pada struk
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 pt-0">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={handleClose}
          >
            <X className="h-4 w-4 mr-2" />
            Tutup Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
