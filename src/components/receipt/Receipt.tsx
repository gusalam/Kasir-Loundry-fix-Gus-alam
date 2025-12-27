import { forwardRef } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Droplets } from 'lucide-react';

interface ReceiptItem {
  service_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface ReceiptData {
  invoice_number: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string;
  items: ReceiptItem[];
  total_amount: number;
  paid_amount: number;
  cash_received?: number;
  change_amount?: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  estimated_date?: string;
  notes?: string;
}

interface ReceiptProps {
  data: ReceiptData;
  laundryName?: string;
  laundryAddress?: string;
  laundryPhone?: string;
  footerText?: string;
  showLogo?: boolean;
  paperSize?: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({
  data,
  laundryName = 'POS Laundry',
  laundryAddress = 'Jl. Contoh No. 123',
  laundryPhone = '08123456789',
  footerText = 'Terima kasih atas kepercayaan Anda!',
  showLogo = true,
  paperSize = '58mm',
}, ref) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Tunai',
      transfer: 'Transfer Bank',
      qris: 'QRIS',
    };
    return methods[method] || method;
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      lunas: 'LUNAS',
      dp: 'DP (Uang Muka)',
      belum_lunas: 'BELUM LUNAS',
    };
    return statuses[status] || status;
  };

  const getOrderStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      diterima: 'Diterima',
      diproses: 'Sedang Diproses',
      qc: 'Quality Check',
      selesai: 'Selesai',
      diambil: 'Sudah Diambil',
    };
    return statuses[status] || status;
  };

  const remaining = data.total_amount - data.paid_amount;

  // Paper width based on size
  const getPaperWidth = () => {
    switch (paperSize) {
      case '58mm': return '58mm';
      case '80mm': return '80mm';
      case 'A4': return '210mm';
      default: return '80mm';
    }
  };

  const getFontSize = () => {
    switch (paperSize) {
      case '58mm': return 'text-[9px]';
      case '80mm': return 'text-xs';
      case 'A4': return 'text-sm';
      default: return 'text-xs';
    }
  };

  return (
    <div
      ref={ref}
      className={`receipt-paper bg-card text-card-foreground p-4 font-mono ${getFontSize()}`}
      style={{ width: getPaperWidth(), maxWidth: getPaperWidth() }}
    >
      {/* Header */}
      <div className="text-center border-b border-dashed border-foreground/70 pb-3 mb-3">
        {showLogo && (
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Droplets className="h-5 w-5" />
            </div>
          </div>
        )}
        <h1 className={`font-bold uppercase ${paperSize === 'A4' ? 'text-xl' : 'text-lg'}`}>
          {laundryName}
        </h1>
        {laundryAddress && (
          <p className={paperSize === '58mm' ? 'text-[8px]' : 'text-[10px]'}>{laundryAddress}</p>
        )}
        {laundryPhone && (
          <p className={paperSize === '58mm' ? 'text-[8px]' : 'text-[10px]'}>Telp: {laundryPhone}</p>
        )}
      </div>

      {/* Invoice Info */}
      <div className="border-b border-dashed border-foreground/70 pb-3 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>No. Invoice:</span>
          <span className="font-bold">{data.invoice_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal:</span>
          <span>{format(new Date(data.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{data.customer_name}</span>
        </div>
        {data.customer_phone && (
          <div className="flex justify-between">
            <span>Telp:</span>
            <span>{data.customer_phone}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-foreground/70 pb-3 mb-3">
        <table className="w-full">
          <thead>
            <tr className="border-b border-foreground">
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Harga</th>
              <th className="text-right py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="py-1 pr-2">{item.service_name}</td>
                <td className="text-right py-1">{item.qty}</td>
                <td className="text-right py-1">{formatCurrency(item.price)}</td>
                <td className="text-right py-1">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-b border-dashed border-foreground/70 pb-3 mb-3 space-y-1">
        <div className={`flex justify-between font-bold ${paperSize === 'A4' ? 'text-base' : 'text-sm'}`}>
          <span>TOTAL</span>
          <span>{formatCurrency(data.total_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar ({getPaymentMethodLabel(data.payment_method)})</span>
          <span>{formatCurrency(data.paid_amount)}</span>
        </div>
        {data.cash_received !== undefined && data.cash_received > 0 && (
          <>
            <div className="flex justify-between">
              <span>Uang Diterima</span>
              <span>{formatCurrency(data.cash_received)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>KEMBALIAN</span>
              <span>{formatCurrency(data.change_amount || 0)}</span>
            </div>
          </>
        )}
        {remaining > 0 && (
          <div className={`flex justify-between font-bold ${paperSize === 'A4' ? 'text-base' : 'text-sm'}`}>
            <span>SISA</span>
            <span>{formatCurrency(remaining)}</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="border-b border-dashed border-foreground/70 pb-3 mb-3 space-y-1">
        <div className="flex justify-between">
          <span>Status Pembayaran:</span>
          <span className="font-bold">{getPaymentStatusLabel(data.payment_status)}</span>
        </div>
        <div className="flex justify-between">
          <span>Status Order:</span>
          <span>{getOrderStatusLabel(data.order_status)}</span>
        </div>
        {data.estimated_date && (
          <div className="flex justify-between">
            <span>Estimasi Selesai:</span>
            <span>{format(new Date(data.estimated_date), 'dd/MM/yyyy', { locale: id })}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="border-b border-dashed border-foreground/70 pb-3 mb-3">
          <p className="font-bold">Catatan:</p>
          <p className={paperSize === '58mm' ? 'text-[8px]' : 'text-[10px]'}>{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-4 space-y-1">
        {footerText && <p className="font-bold">{footerText}</p>}
        <p className={paperSize === '58mm' ? 'text-[8px]' : 'text-[10px]'}>
          Simpan struk ini sebagai bukti pengambilan
        </p>
        <p className={`text-muted-foreground ${paperSize === '58mm' ? 'text-[7px]' : 'text-[9px]'}`}>
          Barang yang tidak diambil dalam 30 hari
          bukan tanggung jawab kami
        </p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export { Receipt };
export type { ReceiptData, ReceiptItem, ReceiptProps };
