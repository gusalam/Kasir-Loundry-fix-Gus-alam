import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { toast } from 'sonner';
import { Printer, Bluetooth, BluetoothOff, Check, X, Loader2, TestTube2, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { BluetoothDevice } from '@/lib/capacitor-bluetooth-printer';

interface PrinterSettingsProps {
  autoPrint: boolean;
  onAutoPrintChange: (value: boolean) => void;
}

export function PrinterSettings({ autoPrint, onAutoPrintChange }: PrinterSettingsProps) {
  const { status, availableDevices, scanDevices, connect, disconnect, printTestPage, forgetPrinter } = useBluetoothPrinter();
  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const handleScanDevices = useCallback(async () => {
    setIsScanning(true);
    const result = await scanDevices();
    setIsScanning(false);
    
    if (result.success && result.devices && result.devices.length > 0) {
      setShowDeviceList(true);
      toast.success(`Ditemukan ${result.devices.length} perangkat`);
    } else if (result.success && result.devices?.length === 0) {
      toast.info('Tidak ada perangkat ditemukan. Pastikan printer sudah di-pair di pengaturan Bluetooth Android.');
    } else {
      toast.error(result.error || 'Gagal mencari perangkat');
    }
  }, [scanDevices]);

  const handleConnectDevice = useCallback(async (device: BluetoothDevice) => {
    const result = await connect(device.address);
    if (result.success) {
      toast.success(`Terhubung ke ${result.deviceName}`);
      setShowDeviceList(false);
    } else {
      toast.error(result.error || 'Gagal menghubungkan');
    }
  }, [connect]);

  const handleConnect = useCallback(async () => {
    if (isNative) {
      // On native, scan for devices first
      await handleScanDevices();
    } else {
      // On web, use browser's device picker
      const result = await connect();
      if (result.success) {
        toast.success(`Terhubung ke ${result.deviceName}`);
      } else {
        toast.error(result.error || 'Gagal menghubungkan');
      }
    }
  }, [isNative, handleScanDevices, connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    toast.info('Printer terputus');
  }, [disconnect]);

  const handleForgetPrinter = useCallback(() => {
    forgetPrinter();
    toast.info('Printer dihapus dari memori');
  }, [forgetPrinter]);

  const handleTestPrint = useCallback(async () => {
    setIsPrintingTest(true);
    const result = await printTestPage();
    setIsPrintingTest(false);
    
    if (result.success) {
      toast.success('Test print berhasil!');
    } else {
      toast.error(result.error || 'Gagal test print');
    }
  }, [printTestPage]);

  // Show info for web platform when not supported
  if (!isNative && !status.isSupported) {
    return (
      <Card className="rounded-2xl shadow-soft border-0 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Printer Bluetooth
          </CardTitle>
          <CardDescription>
            Cetak struk via printer thermal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-pastel-blue/20 rounded-xl">
            <p className="text-sm text-foreground/70">
              <strong>Fitur printer Bluetooth tersedia di aplikasi Android.</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Install aplikasi APK untuk menggunakan fitur cetak struk via Bluetooth printer.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-soft border-0 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          Printer Bluetooth
          {isNative && (
            <span className="text-xs bg-pastel-green/30 text-success px-2 py-0.5 rounded-full ml-auto">
              Native
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Hubungkan printer thermal untuk cetak struk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-pastel-blue/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              status.isConnected ? 'bg-pastel-green/30' : 'bg-muted'
            }`}>
              <Bluetooth className={`h-5 w-5 ${
                status.isConnected ? 'text-success' : 'text-muted-foreground'
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">
                {status.isConnected ? status.deviceName : 'Tidak Terhubung'}
              </p>
              <p className="text-xs text-muted-foreground">
                {status.isConnected 
                  ? 'Printer siap digunakan' 
                  : isNative 
                    ? 'Tap untuk mencari printer' 
                    : 'Klik untuk menghubungkan'}
              </p>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {status.isConnecting ? (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </motion.div>
            ) : status.isConnected ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Check className="h-5 w-5 text-success" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Device List (Native only) */}
        {isNative && showDeviceList && availableDevices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <p className="text-sm font-medium">Pilih Printer:</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableDevices.map((device) => (
                <button
                  key={device.address}
                  onClick={() => handleConnectDevice(device)}
                  className="w-full p-3 bg-muted/50 hover:bg-muted rounded-xl text-left transition-colors flex items-center gap-3"
                >
                  <Bluetooth className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{device.name || 'Unknown Device'}</p>
                    <p className="text-xs text-muted-foreground">{device.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {status.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-pastel-pink/30 text-destructive text-sm rounded-lg flex items-center gap-2"
          >
            <X className="h-4 w-4 flex-shrink-0" />
            {status.error}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {status.isConnected ? (
            <>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="h-12 rounded-xl"
              >
                <BluetoothOff className="h-4 w-4 mr-2" />
                Putuskan
              </Button>
              <Button
                variant="outline"
                onClick={handleTestPrint}
                disabled={isPrintingTest}
                className="h-12 rounded-xl"
              >
                {isPrintingTest ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube2 className="h-4 w-4 mr-2" />
                )}
                Test Print
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleConnect}
                disabled={status.isConnecting || isScanning}
                className="col-span-2 h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                {status.isConnecting || isScanning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bluetooth className="h-4 w-4 mr-2" />
                )}
                {isNative ? 'Cari Printer' : 'Hubungkan Printer'}
              </Button>
            </>
          )}
        </div>

        {/* Native-only: Rescan & Forget */}
        {isNative && status.isConnected && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScanDevices}
              disabled={isScanning}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              Cari Ulang
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForgetPrinter}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Hapus Printer
            </Button>
          </div>
        )}

        {/* Auto Print Setting */}
        {status.isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-between p-4 bg-pastel-blue/10 rounded-xl"
          >
            <div>
              <Label htmlFor="auto-print" className="font-medium text-sm">
                Auto Print
              </Label>
              <p className="text-xs text-muted-foreground">
                Cetak otomatis setelah transaksi
              </p>
            </div>
            <Switch
              id="auto-print"
              checked={autoPrint}
              onCheckedChange={onAutoPrintChange}
            />
          </motion.div>
        )}

        {/* Help Text */}
        {isNative && !status.isConnected && (
          <p className="text-xs text-muted-foreground text-center">
            Pastikan printer sudah di-pair di Pengaturan Bluetooth Android sebelum menghubungkan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
