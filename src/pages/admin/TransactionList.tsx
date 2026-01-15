import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SoftCard } from '@/components/ui/SoftCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Eye,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingCart,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
import type { ReceiptData } from '@/components/receipt/Receipt';
import { motion } from 'framer-motion';

interface Transaction {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
  notes: string | null;
}

export default function AdminTransactionList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || 'all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
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
        .select(`*, customers (name, phone)`, { count: 'exact' })
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Transaksi berhasil dihapus');
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateStatus = async (transactionId: number, newStatus: string) => {
    try {
      const { error } = await supabase.from('transactions').update({ status: newStatus as any }).eq('id', transactionId);
      if (error) throw error;
      toast.success('Status berhasil diupdate');
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    }
  };

  const handleViewDetail = async (trans: Transaction) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', trans.id);

      if (itemsError) throw itemsError;

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
      setShowReceipt(true);
    } catch (error) {
      console.error('Error preparing receipt:', error);
      toast.error('Gagal memuat detail transaksi');
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

  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredTransactions = transactions.filter(t =>
    t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Daftar Transaksi">
      {/* Filters - Soft Card */}
      <SoftCard className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari invoice, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-12 rounded-xl">
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
              <SelectTrigger className="w-[130px] h-12 rounded-xl">
                <SelectValue placeholder="Bayar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="dp">DP</SelectItem>
                <SelectItem value="belum_lunas">Belum</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTransactions} className="h-12 w-12 rounded-xl p-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SoftCard>

      {/* Transaction List - Card based for mobile */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <SoftCard className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
        </SoftCard>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((trans, idx) => (
            <motion.div
              key={trans.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <SoftCard className="p-0 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-foreground">{trans.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {trans.customers?.name || 'Walk-in'}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(trans.status) as any}>
                      {getStatusLabel(trans.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(Number(trans.total_amount))}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getPaymentBadge(trans.payment_status) as any} className="text-[10px]">
                          {trans.payment_status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(trans.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleViewDetail(trans)} className="rounded-xl">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(trans.id)} className="rounded-xl">
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Quick Status Update */}
                {trans.status !== 'diambil' && (
                  <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                      {['diterima', 'diproses', 'qc', 'selesai', 'diambil'].map((status) => (
                        <Button
                          key={status}
                          variant={trans.status === status ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 rounded-lg text-xs flex-shrink-0"
                          onClick={() => handleUpdateStatus(trans.id, status)}
                        >
                          {getStatusLabel(status)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </SoftCard>
            </motion.div>
          ))}

          {/* Pagination */}
          <SoftCard className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} dari {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">{page}/{totalPages || 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </SoftCard>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-danger text-danger-foreground hover:bg-danger/90 rounded-xl">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceiptModal open={showReceipt} onClose={() => setShowReceipt(false)} data={receiptData} />
    </AdminLayout>
  );
}
