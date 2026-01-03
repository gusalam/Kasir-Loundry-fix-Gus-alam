import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt, ReceiptData } from './Receipt';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { BluetoothPrintButton } from '@/components/printer/BluetoothPrintButton';
import { Printer, X, Loader2 } from 'lucide-react';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export function ReceiptModal({ open, onClose, data }: ReceiptModalProps) {
  const { getReceiptProps, isLoading } = useReceiptSettings();
  const receiptProps = getReceiptProps();

  const handlePrint = () => {
    window.print();
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Struk Pembayaran
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
          <div className="flex justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div id="print-receipt">
                <Receipt
                  data={data}
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
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handlePrint} disabled={isLoading}>
              <Printer className="h-4 w-4 mr-2" />
              Cetak Browser
            </Button>
            <BluetoothPrintButton receiptData={data} className="flex-1" />
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

