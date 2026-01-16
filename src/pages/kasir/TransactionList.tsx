import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SoftCard } from '@/components/ui/SoftCard';
import { ReceiptPreviewDialog } from '@/components/printer/ReceiptPreviewDialog';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Printer,
  ArrowRight,
  Receipt,
  ClipboardList,
  Phone,
  Calendar,
  User,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { ReceiptData } from '@/components/receipt/Receipt';

interface Transaction {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  created_at: string;
  notes: string | null;
  customers: { name: string; phone: string } | null;
}

interface TransactionItem {
  id: number;
  service_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export default function KasirTransactionList() {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const pageSize = 10;

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, paymentFilter, page]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customers (name, phone)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter as any);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setTransactions(data as Transaction[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionItems = async (transactionId: number) => {
    try {
      const { data, error } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', transactionId);

      if (error) throw error;
      setTransactionItems(data as TransactionItem[]);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleViewDetail = async (trans: Transaction) => {
    setSelectedTransaction(trans);
    await fetchTransactionItems(trans.id);
  };

  const handlePrintReceipt = async (trans: Transaction) => {
    try {
      // Fetch transaction items
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', trans.id);

      if (itemsError) throw itemsError;

      // Fetch payment info
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('method')
        .eq('transaction_id', trans.id)
        .limit(1);

      if (payError) throw payError;

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
        notes: trans.notes || undefined,
      };

      setReceiptData(newReceiptData);
      setShowReceiptPreview(true);
    } catch (error) {
      console.error('Error preparing receipt:', error);
      toast.error('Gagal menyiapkan struk');
    }
  };

  // Status transitions allowed for kasir
  const getNextStatus = (currentStatus: string): string | null => {
    const transitions: Record<string, string> = {
      diterima: 'diproses',
      diproses: 'qc',
      qc: 'selesai',
      selesai: 'diambil',
    };
    return transitions[currentStatus] || null;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      diterima: 'Diterima',
      diproses: 'Diproses',
      qc: 'QC',
      selesai: 'Selesai',
      diambil: 'Diambil',
    };
    return labels[status] || status;
  };

  const handleUpdateStatus = async (trans: Transaction) => {
    const nextStatus = getNextStatus(trans.status);
    if (!nextStatus) {
      toast.info('Status sudah final (Diambil)');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: nextStatus as any })
        .eq('id', trans.id);

      if (error) throw error;

      toast.success(`Status diubah ke ${getStatusLabel(nextStatus)}`);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Gagal mengubah status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      diterima: 'pending',
      diproses: 'processing',
      qc: 'processing',
      selesai: 'ready',
      diambil: 'completed',
    };
    return variants[status] || 'default';
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, any> = {
      lunas: 'paid',
      dp: 'partial',
      belum_lunas: 'unpaid',
    };
    return variants[status] || 'default';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredTransactions = transactions.filter(t =>
    t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <KasirLayout>
      {/* Header Stats */}
      <SoftCard variant="primary" className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{totalCount}</p>
            <p className="text-muted-foreground">Total Transaksi</p>
          </div>
        </div>
      </SoftCard>

      {/* Filters */}
      <SoftCard className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Cari invoice, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="bg-white/80"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white/80">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="diterima">Diterima</SelectItem>
              <SelectItem value="diproses">Diproses</SelectItem>
              <SelectItem value="qc">QC</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="diambil">Diambil</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[140px] bg-white/80">
              <SelectValue placeholder="Pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="dp">DP</SelectItem>
              <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchTransactions} className="bg-white/80">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </SoftCard>

      {/* Transaction Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <SoftCard className="p-12 text-center">
          <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">Tidak ada transaksi ditemukan</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Coba ubah filter pencarian</p>
        </SoftCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTransactions.map((trans, index) => (
              <motion.div
                key={trans.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <SoftCard className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg text-foreground">{trans.invoice_number}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(trans.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 h-auto p-1.5 rounded-lg hover:bg-muted">
                          <Badge variant={getStatusBadge(trans.status) as any}>
                            {getStatusLabel(trans.status)}
                          </Badge>
                          {trans.status !== 'diambil' && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {trans.status !== 'diambil' ? (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(trans)}>
                            Ubah ke: <Badge variant={getStatusBadge(getNextStatus(trans.status) || '') as any} className="ml-2">
                              {getStatusLabel(getNextStatus(trans.status) || '')}
                            </Badge>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            Status sudah final
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Customer */}
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

                  {/* Amount */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(Number(trans.total_amount))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Dibayar</p>
                      <p className="font-semibold">{formatCurrency(Number(trans.paid_amount))}</p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={getPaymentBadge(trans.payment_status) as any} className="flex-shrink-0">
                      {trans.payment_status.replace('_', ' ')}
                    </Badge>
                    {trans.payment_status !== 'lunas' && (
                      <span className="text-sm text-warning font-medium">
                        Sisa: {formatCurrency(Number(trans.total_amount) - Number(trans.paid_amount))}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 bg-white/50"
                      onClick={() => handleViewDetail(trans)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                      onClick={() => handlePrintReceipt(trans)}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Cetak Ulang
                    </Button>
                  </div>
                </SoftCard>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <SoftCard className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} dari {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-white/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-3 py-1 bg-primary/10 rounded-lg font-medium">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="bg-white/50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SoftCard>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Invoice</p>
                  <p className="font-bold">{selectedTransaction.invoice_number}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-bold">{selectedTransaction.customers?.name || 'Walk-in'}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadge(selectedTransaction.status) as any} className="mt-1">
                    {getStatusLabel(selectedTransaction.status)}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Pembayaran</p>
                  <Badge variant={getPaymentBadge(selectedTransaction.payment_status) as any} className="mt-1">
                    {selectedTransaction.payment_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-3">Item Layanan:</p>
                <div className="space-y-2">
                  {transactionItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/30 rounded-lg">
                      <span>{item.service_name} × {item.qty}</span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg mt-4 pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(Number(selectedTransaction.total_amount))}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Dibayar</span>
                  <span>{formatCurrency(Number(selectedTransaction.paid_amount))}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
              Tutup
            </Button>
            {selectedTransaction && (
              <Button onClick={() => {
                setSelectedTransaction(null);
                handlePrintReceipt(selectedTransaction);
              }} className="bg-gradient-to-r from-primary to-primary/80">
                <Printer className="h-4 w-4 mr-2" />
                Cetak Struk
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewDialog
        open={showReceiptPreview}
        onClose={() => setShowReceiptPreview(false)}
        receiptData={receiptData}
      />
    </KasirLayout>
  );
}
