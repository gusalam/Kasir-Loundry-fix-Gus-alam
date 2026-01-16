import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt, ReceiptData } from '@/components/receipt/Receipt';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Printer, 
  Loader2, 
  Bluetooth, 
  Eye, 
  X,
  FileText,
  Check
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useReactToPrint } from 'react-to-print';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReceiptPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  onPrintComplete?: () => void;
}

export function ReceiptPreviewDialog({
  open,
  onClose,
  receiptData,
  onPrintComplete,
}: ReceiptPreviewDialogProps) {
  const { settings, isLoading: settingsLoading, getReceiptProps } = useReceiptSettings();
  const { status, connect, printReceipt } = useBluetoothPrinter();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const isNative = Capacitor.isNativePlatform();

  // Browser print
  const handleBrowserPrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receiptData?.invoice_number || 'Receipt',
  });

  // Bluetooth print handler
  const handleBluetoothPrint = useCallback(async () => {
    if (!receiptData) return;

    // If not connected, try to connect first
    if (!status.isConnected) {
      const connectResult = await connect();
      if (!connectResult.success) {
        toast.error(connectResult.error || 'Gagal menghubungkan ke printer');
        return;
      }
      toast.success(`Terhubung ke ${connectResult.deviceName}`);
    }

    setIsPrinting(true);
    setPrintSuccess(false);

    try {
      const receiptProps = getReceiptProps();
      
      const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
          cash: 'Tunai',
          transfer: 'Transfer',
          qris: 'QRIS',
        };
        return methods[method] || method;
      };

      const getPaymentStatusLabel = (status: string) => {
        const statuses: Record<string, string> = {
          lunas: 'LUNAS',
          dp: 'DP',
          belum_lunas: 'BELUM LUNAS',
        };
        return statuses[status] || status;
      };

      const result = await printReceipt({
        laundryName: receiptProps.laundryName,
        address: receiptProps.laundryAddress,
        phone: receiptProps.laundryPhone,
        invoiceNumber: receiptData.invoice_number,
        date: format(new Date(receiptData.created_at), 'dd/MM/yyyy HH:mm', { locale: id }),
        customerName: receiptData.customer_name,
        customerPhone: receiptData.customer_phone,
        items: receiptData.items.map(item => ({
          name: item.service_name,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
        })),
        totalAmount: receiptData.total_amount,
        paidAmount: receiptData.paid_amount,
        cashReceived: receiptData.cash_received,
        changeAmount: receiptData.change_amount,
        paymentMethod: getPaymentMethodLabel(receiptData.payment_method),
        paymentStatus: getPaymentStatusLabel(receiptData.payment_status),
        estimatedDate: receiptData.estimated_date 
          ? format(new Date(receiptData.estimated_date), 'dd/MM/yyyy', { locale: id })
          : undefined,
        notes: receiptData.notes,
        footerText: receiptProps.footerText,
        paperSize: receiptProps.paperSize as '58mm' | '80mm',
      });

      if (result.success) {
        setPrintSuccess(true);
        toast.success('Struk berhasil dicetak!');
        onPrintComplete?.();
      } else {
        toast.error(result.error || 'Gagal mencetak');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mencetak struk');
    } finally {
      setIsPrinting(false);
    }
  }, [status.isConnected, connect, printReceipt, receiptData, getReceiptProps, onPrintComplete]);

  if (!receiptData) return null;

  const receiptProps = getReceiptProps();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-soft-blue/30 to-soft-purple/30">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-primary" />
            Preview Struk
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Periksa struk sebelum mencetak
          </DialogDescription>
        </DialogHeader>
        
        {/* Receipt Preview Area */}
        <ScrollArea className="flex-1 px-6 py-4 max-h-[50vh]">
          <div className="flex justify-center">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="transform scale-90 origin-top shadow-lg rounded-lg overflow-hidden">
                <Receipt
                  ref={receiptRef}
                  data={receiptData}
                  laundryName={receiptProps.laundryName}
                  laundryAddress={receiptProps.laundryAddress}
                  laundryPhone={receiptProps.laundryPhone}
                  footerText={receiptProps.footerText}
                  showLogo={receiptProps.showLogo}
                  paperSize={receiptProps.paperSize}
                  showQRCode={true}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Print Actions */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col gap-3 sm:flex-col">
          {/* Success indicator */}
          {printSuccess && (
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg py-2 px-4 w-full">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Struk berhasil dicetak!</span>
            </div>
          )}
          
          {/* Print buttons */}
          <div className="flex gap-2 w-full">
            {/* Bluetooth Print */}
            {(isNative || status.isSupported) && (
              <Button
                onClick={handleBluetoothPrint}
                disabled={isPrinting}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : status.isConnected ? (
                  <Printer className="h-4 w-4 mr-2" />
                ) : (
                  <Bluetooth className="h-4 w-4 mr-2" />
                )}
                {isPrinting 
                  ? 'Mencetak...' 
                  : status.isConnected 
                    ? 'Cetak Bluetooth' 
                    : 'Hubungkan & Cetak'}
              </Button>
            )}
            
            {/* Browser Print */}
            <Button
              variant="outline"
              onClick={() => handleBrowserPrint()}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Cetak Browser
            </Button>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
