import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SoftCard } from '@/components/ui/SoftCard';
import { ReceiptPreviewDialog } from '@/components/printer/ReceiptPreviewDialog';
import { motion } from 'framer-motion';
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
  User,
  Calendar,
  PackageCheck,
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { ReceiptData } from '@/components/receipt/Receipt';

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
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

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
      
      // Get transaction data for receipt
      const trans = transactions.find(t => t.id === pickupId);
      if (trans) {
        await prepareReceiptData(trans);
      }
      
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setIsProcessing(false);
      setPickupId(null);
    }
  };

  const prepareReceiptData = async (trans: Transaction | ScannedTransaction) => {
    try {
      // Fetch transaction items if not available
      let items = (trans as ScannedTransaction).items;
      if (!items) {
        const { data: fetchedItems } = await supabase
          .from('transaction_items')
          .select('service_name, qty, price, subtotal')
          .eq('transaction_id', trans.id);
        items = fetchedItems || [];
      }

      // Fetch payment info
      const { data: payments } = await supabase
        .from('payments')
        .select('method')
        .eq('transaction_id', trans.id)
        .limit(1);

      const paymentMethod = payments?.[0]?.method || 'cash';

      const newReceiptData: ReceiptData = {
        invoice_number: trans.invoice_number,
        created_at: trans.created_at,
        customer_name: trans.customers?.name || 'Walk-in Customer',
        customer_phone: trans.customers?.phone,
        items: (items || []).map(item => ({
          service_name: item.service_name,
          qty: Number(item.qty),
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
        total_amount: Number(trans.total_amount),
        paid_amount: Number(trans.paid_amount),
        payment_method: paymentMethod,
        payment_status: trans.payment_status,
        order_status: 'diambil',
      };

      setReceiptData(newReceiptData);
      setShowReceiptPreview(true);
    } catch (error) {
      console.error('Error preparing receipt:', error);
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
      await prepareReceiptData(scannedTx);
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = async (trans: Transaction) => {
    try {
      const { data: items } = await supabase
        .from('transaction_items')
        .select('service_name, qty, price, subtotal')
        .eq('transaction_id', trans.id);

      const { data: payments } = await supabase
        .from('payments')
        .select('method')
        .eq('transaction_id', trans.id)
        .limit(1);

      const paymentMethod = payments?.[0]?.method || 'cash';

      const newReceiptData: ReceiptData = {
        invoice_number: trans.invoice_number,
        created_at: trans.created_at,
        customer_name: trans.customers?.name || 'Walk-in Customer',
        customer_phone: trans.customers?.phone,
        items: (items || []).map(item => ({
          service_name: item.service_name,
          qty: Number(item.qty),
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
        total_amount: Number(trans.total_amount),
        paid_amount: Number(trans.paid_amount),
        payment_method: paymentMethod,
        payment_status: trans.payment_status,
        order_status: trans.status,
      };

      setReceiptData(newReceiptData);
      setShowReceiptPreview(true);
    } catch (error) {
      console.error('Error preparing receipt:', error);
      toast.error('Gagal menyiapkan struk');
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
      <SoftCard variant="success" className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg">
            <PackageCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{transactions.length}</p>
            <p className="text-muted-foreground">Order siap diambil</p>
          </div>
        </div>
      </SoftCard>

      {/* Search & Scan */}
      <SoftCard className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari invoice, nama, atau no. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="bg-white/80"
            />
          </div>
          <Button variant="outline" onClick={() => setShowScanner(true)} className="bg-white/80">
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchTransactions} className="bg-white/80">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </SoftCard>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <SoftCard className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">Tidak ada order yang siap diambil</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Order yang selesai akan muncul di sini</p>
        </SoftCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTransactions.map((trans, index) => (
            <motion.div
              key={trans.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <SoftCard className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-lg">{trans.invoice_number}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(trans.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </p>
                  </div>
                  <Badge variant="ready">Selesai</Badge>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{trans.customers?.name || 'Walk-in'}</p>
                    {trans.customers?.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {trans.customers.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(Number(trans.total_amount))}</p>
                  </div>
                  <Badge variant={getPaymentBadge(trans.payment_status) as any}>
                    {trans.payment_status.replace('_', ' ')}
                  </Badge>
                </div>

                {trans.payment_status !== 'lunas' && (
                  <div className="p-3 bg-warning-light rounded-xl mb-4 text-center">
                    <p className="text-sm font-medium text-warning">
                      Sisa: {formatCurrency(Number(trans.total_amount) - Number(trans.paid_amount))}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-border/50">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white/50"
                    onClick={() => handlePrintReceipt(trans)}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Cetak
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-success to-success/80 text-success-foreground" 
                    onClick={() => setPickupId(trans.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Konfirmasi
                  </Button>
                </div>
              </SoftCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirm Pickup Dialog (from list) */}
      <AlertDialog open={!!pickupId} onOpenChange={() => setPickupId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-success" />
              Konfirmasi Pengambilan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah customer sudah mengambil cucian? Status akan diubah menjadi "Diambil".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePickup} 
              disabled={isProcessing}
              className="bg-gradient-to-r from-success to-success/80"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
        <AlertDialogContent className="max-w-sm rounded-2xl">
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
                  <span className={scannedTx.payment_status === 'lunas' ? 'text-success font-medium' : 'text-warning font-medium'}>
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
              <Button 
                className="w-full h-12 bg-gradient-to-r from-success to-success/80" 
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
            )}
            {actionType === 'info' && (
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => {
                  setShowActionDialog(false);
                  if (scannedTx) {
                    prepareReceiptData(scannedTx);
                  }
                }}
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
        title="Scan Invoice"
      />

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewDialog
        open={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        receiptData={receiptData}
      />
    </KasirLayout>
  );
}
