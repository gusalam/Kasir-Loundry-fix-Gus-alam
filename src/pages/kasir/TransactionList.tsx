import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Printer,
  ArrowRight,
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
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
    // Use the print receipt function to show the receipt modal for viewing
    await handlePrintReceipt(trans);
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
      setShowReceipt(true);
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
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Cari invoice, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="dp">DP</SelectItem>
              <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p>Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Invoice</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Total</th>
                    <th className="text-left p-4 font-medium">Bayar</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Pembayaran</th>
                    <th className="text-left p-4 font-medium">Tanggal</th>
                    <th className="text-left p-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((trans) => (
                    <tr key={trans.id} className="hover:bg-muted/50">
                      <td className="p-4 font-medium">{trans.invoice_number}</td>
                      <td className="p-4">{trans.customers?.name || 'Walk-in'}</td>
                      <td className="p-4">{formatCurrency(Number(trans.total_amount))}</td>
                      <td className="p-4">{formatCurrency(Number(trans.paid_amount))}</td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 h-auto p-1">
                              <Badge variant={getStatusBadge(trans.status) as any}>
                                {getStatusLabel(trans.status)}
                              </Badge>
                              {trans.status !== 'diambil' && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-popover">
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
                      </td>
                      <td className="p-4">
                        <Badge variant={getPaymentBadge(trans.payment_status) as any}>
                          {trans.payment_status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(trans.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => handleViewDetail(trans)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {trans.payment_status !== 'belum_lunas' && (
                            <Button size="icon-sm" variant="ghost" onClick={() => handlePrintReceipt(trans)} title="Cetak Struk">
                              <Printer className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} dari {totalCount} transaksi
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Invoice</p>
                  <p className="font-medium">{selectedTransaction.invoice_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedTransaction.customers?.name || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadge(selectedTransaction.status) as any}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Pembayaran</p>
                  <Badge variant={getPaymentBadge(selectedTransaction.payment_status) as any}>
                    {selectedTransaction.payment_status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Item:</p>
                <div className="space-y-2">
                  {transactionItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.service_name} × {item.qty}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-4 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(Number(selectedTransaction.total_amount))}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Dibayar</span>
                  <span>{formatCurrency(Number(selectedTransaction.paid_amount))}</span>
                </div>
              </div>

              {selectedTransaction.notes && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">Catatan:</p>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={receiptData}
      />
    </KasirLayout>
  );
}