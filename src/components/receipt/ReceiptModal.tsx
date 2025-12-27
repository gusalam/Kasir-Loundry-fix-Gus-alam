import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt, ReceiptData } from './Receipt';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
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
    // Print mode dikontrol via CSS @media print agar hanya #print-receipt yang tercetak
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
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4" />
            Tutup
          </Button>
          <Button className="flex-1" onClick={handlePrint} disabled={isLoading}>
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

