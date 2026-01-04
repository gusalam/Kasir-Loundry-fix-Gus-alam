import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  RefreshCw,
  Package,
  CheckCircle,
  Phone,
  QrCode,
  CreditCard,
  Printer,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QRScanner } from '@/components/qrcode/QRScanner';
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: number;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
}

interface ScannedTransaction extends Transaction {
  items?: { service_name: string; qty: number; price: number; subtotal: number }[];
}

export default function KasirPickup() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pickupId, setPickupId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Smart action states
  const [scannedTx, setScannedTx] = useState<ScannedTransaction | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'payment' | 'pickup' | 'info' | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle scanned invoice from URL
  useEffect(() => {
    const invoiceParam = searchParams.get('invoice');
    if (invoiceParam) {
      handleScannedInvoice(invoiceParam);
      // Clear the URL param
      setSearchParams({});
    }
  }, [searchParams]);

  // Handle scanned invoice from URL or scan
  const handleScannedInvoice = async (invoice: string) => {
    try {
      // Fetch full transaction data
      const { data: tx, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers (name, phone),
          transaction_items (service_name, qty, price, subtotal)
        `)
        .eq('invoice_number', invoice)
        .maybeSingle();

      if (error) throw error;

      if (!tx) {
        toast.error('Invoice tidak ditemukan');
        setActionType(null);
        return;
      }

      setScannedTx(tx as ScannedTransaction);

      // Determine action based on status and payment
      if (tx.status === 'diambil') {
        setActionType('info');
        toast.info('Transaksi ini sudah diambil sebelumnya');
      } else if (tx.payment_status !== 'lunas') {
        setActionType('payment');
        toast.info('Pembayaran belum lunas');
      } else if (tx.status === 'selesai') {
        setActionType('pickup');
        toast.success('Invoice ditemukan - siap diambil');
      } else {
        setActionType('info');
        toast.warning(`Status transaksi: ${tx.status}`);
      }

      setShowActionDialog(true);
    } catch (error: any) {
      toast.error('Gagal memuat data transaksi');
      console.error(error);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers (name, phone)
        `)
        .eq('status', 'selesai')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data as Transaction[]);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!pickupId || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'diambil' as any })
        .eq('id', pickupId);

      if (error) throw error;

      toast.success('Status berhasil diupdate ke Diambil');
      setShowReceipt(true); // Auto show receipt after pickup
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setIsProcessing(false);
      setPickupId(null);
    }
  };

  const handleScannedPickup = async () => {
    if (!scannedTx || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'diambil' as any })
        .eq('id', scannedTx.id);

      if (error) throw error;

      toast.success('Status berhasil diupdate ke Diambil');
      setShowActionDialog(false);
      setShowReceipt(true); // Auto show receipt
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, any> = {
      lunas: 'paid',
      dp: 'partial',
      belum_lunas: 'unpaid',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      diterima: 'Diterima',
      diproses: 'Diproses',
      qc: 'QC',
      selesai: 'Selesai',
      diambil: 'Sudah Diambil',
    };
    return labels[status] || status;
  };

  const filteredTransactions = transactions.filter(t =>
    t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.phone?.includes(search)
  );

  const handleScan = (data: { invoice: string; rawData: string }) => {
    setShowScanner(false);
    handleScannedInvoice(data.invoice);
  };

  // Build receipt data from scanned transaction
  const getReceiptData = () => {
    if (!scannedTx) return null;
    return {
      invoice_number: scannedTx.invoice_number,
      created_at: scannedTx.created_at,
      customer_name: scannedTx.customers?.name || 'Walk-in',
      customer_phone: scannedTx.customers?.phone || undefined,
      items: scannedTx.items?.map(item => ({
        service_name: item.service_name,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
      })) || [],
      total_amount: Number(scannedTx.total_amount),
      paid_amount: Number(scannedTx.paid_amount),
      cash_received: Number(scannedTx.paid_amount),
      change_amount: 0,
      payment_method: 'cash',
      payment_status: scannedTx.payment_status,
      order_status: scannedTx.status,
    };
  };

  return (
    <KasirLayout>
      {/* Header Stats */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-success/10 to-success/5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success text-success-foreground">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{transactions.length}</p>
            <p className="text-muted-foreground">Order siap diambil</p>
          </div>
        </div>
      </Card>

      {/* Search & Scan */}
      <Card className="p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari invoice, nama, atau no. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button variant="outline" onClick={() => setShowScanner(true)}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Tidak ada order yang siap diambil</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTransactions.map((trans) => (
            <Card key={trans.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-lg">{trans.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(trans.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
                <Badge variant="ready">Selesai</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{trans.customers?.name || 'Walk-in'}</p>
                    {trans.customers?.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {trans.customers.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold">{formatCurrency(Number(trans.total_amount))}</p>
                </div>
                <Badge variant={getPaymentBadge(trans.payment_status) as any}>
                  {trans.payment_status.replace('_', ' ')}
                </Badge>
              </div>

              {trans.payment_status !== 'lunas' && (
                <div className="p-2 bg-warning-light rounded mb-3 text-center">
                  <p className="text-sm font-medium text-warning">
                    Sisa: {formatCurrency(Number(trans.total_amount) - Number(trans.paid_amount))}
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={() => setPickupId(trans.id)}
              >
                <CheckCircle className="h-4 w-4" />
                Konfirmasi Pengambilan
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Pickup Dialog (from list) */}
      <AlertDialog open={!!pickupId} onOpenChange={() => setPickupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengambilan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah customer sudah mengambil cucian? Status akan diubah menjadi "Diambil".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePickup} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Ya, Sudah Diambil'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Smart Action Dialog (from scan) */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionType === 'payment' && <CreditCard className="h-5 w-5 text-warning" />}
              {actionType === 'pickup' && <Package className="h-5 w-5 text-success" />}
              {actionType === 'info' && <AlertCircle className="h-5 w-5 text-muted-foreground" />}
              {scannedTx?.invoice_number}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {scannedTx && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{scannedTx.customers?.name || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={scannedTx.status === 'diambil' ? 'completed' : 'ready'}>
                    {getStatusLabel(scannedTx.status)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatCurrency(Number(scannedTx.total_amount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span className={scannedTx.payment_status === 'lunas' ? 'text-success' : 'text-warning'}>
                    {formatCurrency(Number(scannedTx.paid_amount))}
                  </span>
                </div>
                {scannedTx.payment_status !== 'lunas' && (
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-warning font-medium">Sisa Bayar</span>
                    <span className="text-warning font-bold">
                      {formatCurrency(Number(scannedTx.total_amount) - Number(scannedTx.paid_amount))}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Message */}
              <AlertDialogDescription className="text-center">
                {actionType === 'payment' && 'Customer perlu menyelesaikan pembayaran terlebih dahulu.'}
                {actionType === 'pickup' && 'Konfirmasi pengambilan cucian oleh customer?'}
                {actionType === 'info' && 'Transaksi ini sudah diambil atau masih dalam proses.'}
              </AlertDialogDescription>
            </div>
          )}

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {actionType === 'payment' && (
              <Button 
                className="w-full h-12" 
                onClick={() => {
                  setShowActionDialog(false);
                  navigate(`/kasir/transaksi-baru?payment=${scannedTx?.id}`);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proses Pembayaran
              </Button>
            )}
            {actionType === 'pickup' && (
              <>
                <Button 
                  className="w-full h-12" 
                  onClick={handleScannedPickup}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Konfirmasi Pengambilan
                </Button>
              </>
            )}
            {actionType === 'info' && (
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => setShowReceipt(true)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Cetak Struk
              </Button>
            )}
            <AlertDialogCancel className="w-full h-12 mt-0">Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Scanner */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Scan Invoice untuk Pengambilan"
      />

      {/* Receipt Modal */}
      {scannedTx && getReceiptData() && (
        <ReceiptModal
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setScannedTx(null);
          }}
          data={getReceiptData()!}
        />
      )}
    </KasirLayout>
  );
}