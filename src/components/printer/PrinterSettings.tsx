import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { toast } from 'sonner';
import { Printer, Bluetooth, BluetoothOff, Check, X, Loader2, TestTube2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrinterSettingsProps {
  autoPrint: boolean;
  onAutoPrintChange: (value: boolean) => void;
}

export function PrinterSettings({ autoPrint, onAutoPrintChange }: PrinterSettingsProps) {
  const { status, connect, disconnect, printTestPage } = useBluetoothPrinter();
  const [isPrintingTest, setIsPrintingTest] = useState(false);

  const handleConnect = useCallback(async () => {
    const result = await connect();
    if (result.success) {
      toast.success(`Terhubung ke ${result.deviceName}`);
    } else {
      toast.error(result.error || 'Gagal menghubungkan');
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    toast.info('Printer terputus');
  }, [disconnect]);

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

  if (!status.isSupported) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BluetoothOff className="h-5 w-5 text-muted-foreground" />
            Printer Bluetooth
          </CardTitle>
          <CardDescription>
            Web Bluetooth tidak didukung di browser ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gunakan Chrome atau Edge di Android untuk fitur printer Bluetooth.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          Printer Bluetooth
        </CardTitle>
        <CardDescription>
          Hubungkan printer thermal untuk cetak struk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              status.isConnected ? 'bg-success/10' : 'bg-muted'
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
                {status.isConnected ? 'Printer siap digunakan' : 'Klik untuk menghubungkan'}
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

        {/* Error Message */}
        {status.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2"
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
            <Button
              onClick={handleConnect}
              disabled={status.isConnecting}
              className="col-span-2 h-12 rounded-xl"
            >
              {status.isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bluetooth className="h-4 w-4 mr-2" />
              )}
              Hubungkan Printer
            </Button>
          )}
        </div>

        {/* Auto Print Setting */}
        {status.isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
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
      </CardContent>
    </Card>
  );
}
