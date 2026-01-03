import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface InvoiceQRCodeProps {
  invoiceNumber: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function InvoiceQRCode({ 
  invoiceNumber, 
  size = 100, 
  className,
  showLabel = true 
}: InvoiceQRCodeProps) {
  // Generate QR data - can be used to redirect to transaction detail
  const qrData = JSON.stringify({
    type: 'laundry-invoice',
    invoice: invoiceNumber,
    timestamp: Date.now(),
  });

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground text-center font-mono">
          {invoiceNumber}
        </p>
      )}
    </div>
  );
}
