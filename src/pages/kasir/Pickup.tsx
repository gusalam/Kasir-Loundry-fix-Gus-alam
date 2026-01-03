import { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: number;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
}

export default function KasirPickup() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pickupId, setPickupId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

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
      fetchTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setIsProcessing(false);
      setPickupId(null);
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

  const filteredTransactions = transactions.filter(t =>
    t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.phone?.includes(search)
  );

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

      {/* Search */}
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

      {/* Confirm Dialog */}
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
    </KasirLayout>
  );
}