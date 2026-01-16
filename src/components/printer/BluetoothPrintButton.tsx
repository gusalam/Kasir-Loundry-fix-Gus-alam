import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { toast } from 'sonner';
import { Printer, Loader2, Bluetooth, Smartphone, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Capacitor } from '@capacitor/core';
import type { ReceiptData } from '@/components/receipt/Receipt';
import { ReceiptPreviewDialog } from './ReceiptPreviewDialog';

interface BluetoothPrintButtonProps {
  receiptData: ReceiptData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  className?: string;
  showPreview?: boolean;
}

export function BluetoothPrintButton({ 
  receiptData, 
  variant = 'outline',
  size = 'default',
  className,
  showPreview = true,
}: BluetoothPrintButtonProps) {
  const { status, connect, printReceipt } = useBluetoothPrinter();
  const { getReceiptProps } = useReceiptSettings();
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();

  // Direct print (no preview)
  const handleDirectPrint = useCallback(async () => {
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

      const getPaymentStatusLabel = (paymentStatus: string) => {
        const statuses: Record<string, string> = {
          lunas: 'LUNAS',
          dp: 'DP',
          belum_lunas: 'BELUM LUNAS',
        };
        return statuses[paymentStatus] || paymentStatus;
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
        toast.success('Struk berhasil dicetak!');
      } else {
        toast.error(result.error || 'Gagal mencetak');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mencetak struk');
    } finally {
      setIsPrinting(false);
    }
  }, [status.isConnected, connect, printReceipt, receiptData, getReceiptProps]);

  // Handle button click - show preview or print directly
  const handleClick = useCallback(() => {
    if (showPreview) {
      setPreviewOpen(true);
    } else {
      handleDirectPrint();
    }
  }, [showPreview, handleDirectPrint]);

  // On web without support, show disabled state with info
  if (!isNative && !status.isSupported) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
        title="Fitur ini tersedia di aplikasi Android"
      >
        <Smartphone className="h-4 w-4" />
        {size !== 'icon' && size !== 'icon-sm' && (
          <span className="ml-2">Cetak Bluetooth (APK)</span>
        )}
      </Button>
    );
  }

  const isIconOnly = size === 'icon' || size === 'icon-sm';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isPrinting}
        className={className}
        title={showPreview ? 'Preview & Cetak' : status.isConnected ? 'Cetak via Bluetooth' : 'Hubungkan & Cetak'}
      >
        {isPrinting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showPreview ? (
          <Eye className="h-4 w-4" />
        ) : status.isConnected ? (
          <Printer className="h-4 w-4" />
        ) : (
          <Bluetooth className="h-4 w-4" />
        )}
        {!isIconOnly && (
          <span className="ml-2">
            {showPreview 
              ? 'Preview & Cetak'
              : status.isConnected 
                ? 'Cetak Bluetooth' 
                : 'Cetak via Bluetooth'}
          </span>
        )}
      </Button>

      {/* Preview Dialog */}
      <ReceiptPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        receiptData={receiptData}
      />
    </>
  );
}
