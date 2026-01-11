import { useState, useEffect, useCallback } from 'react';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { MobileStatCard } from '@/components/dashboard/MobileStatCard';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Plus,
  Truck,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  pendingPickup: number;
  inProgress: number;
}

export default function KasirDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    pendingPickup: 0,
    inProgress: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Kasir';
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('kasir-dashboard-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => fetchDashboardData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments' },
          () => fetchDashboardData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const startISO = startOfDay.toISOString();
      const endISO = endOfDay.toISOString();

      // Fetch today's transactions by this kasir
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (transError) throw transError;

      // Fetch today's revenue from payments received by this kasir
      // Since payments don't have user filter, we get payments from kasir's transactions
      const { data: kasirTransactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      const transactionIds = kasirTransactions?.map(t => t.id) || [];
      
      let totalRevenue = 0;
      if (transactionIds.length > 0) {
        const { data: payments, error: payError } = await supabase
          .from('payments')
          .select('amount')
          .in('transaction_id', transactionIds)
          .gte('created_at', startISO)
          .lte('created_at', endISO);

        if (payError) throw payError;
        totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      }

      // Fetch pending pickup (selesai status) - kasir's transactions
      const { data: pendingPickup } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'selesai');

      // Fetch in progress (diterima, diproses, qc) - kasir's transactions
      const { data: inProgress } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['diterima', 'diproses', 'qc']);

      // Fetch recent transactions by this kasir
      const { data: recent } = await supabase
        .from('transactions')
        .select(`*, customers (name, phone)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        ordersToday: transactions?.length || 0,
        revenueToday: totalRevenue,
        pendingPickup: pendingPickup?.length || 0,
        inProgress: inProgress?.length || 0,
      });

      setRecentTransactions(recent || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    await fetchDashboardData();
    toast.success('Data diperbarui');
  }, [fetchDashboardData]);

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

  if (isLoading) {
    return (
      <KasirLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </KasirLayout>
    );
  }

  if (error) {
    return (
      <KasirLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" className="h-12 rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </KasirLayout>
    );
  }

  return (
    <KasirLayout>
      <PullToRefresh onRefresh={handleRefresh} className="h-full -mx-4 px-4">
        <div className="space-y-6 pb-6">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground">
              Halo, {displayName} 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Ringkasan transaksi Anda hari ini
            </p>
          </motion.div>

          {/* Stats Grid - 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <MobileStatCard
              title="Order Hari Ini"
              value={stats.ordersToday}
              subtitle="transaksi Anda"
              icon={<ShoppingCart className="h-5 w-5" />}
              variant="primary"
            />
            <MobileStatCard
              title="Uang Masuk"
              value={formatCurrency(stats.revenueToday)}
              subtitle="hari ini"
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
            />
            <MobileStatCard
              title="Belum Diambil"
              value={stats.pendingPickup}
              subtitle="siap diambil"
              icon={<Package className="h-5 w-5" />}
              variant="warning"
              onClick={() => navigate('/kasir/pengambilan')}
            />
            <MobileStatCard
              title="Dalam Proses"
              value={stats.inProgress}
              subtitle="sedang dikerjakan"
              icon={<Clock className="h-5 w-5" />}
              variant="info"
              onClick={() => navigate('/kasir/daftar-transaksi')}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/kasir/transaksi-baru')}
                className="w-full h-14 bg-gradient-primary text-primary-foreground rounded-2xl flex items-center justify-center gap-3 font-semibold shadow-lg active:scale-[0.98] touch-manipulation"
              >
                <Plus className="h-6 w-6" />
                Transaksi Baru
              </motion.button>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/kasir/pengambilan')}
                  className="h-14 bg-card border-2 border-border text-foreground rounded-2xl flex items-center justify-center gap-2 font-medium active:scale-[0.98] touch-manipulation"
                >
                  <Truck className="h-5 w-5 text-success" />
                  Pengambilan
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/kasir/tutup-kas')}
                  className="h-14 bg-card border-2 border-border text-foreground rounded-2xl flex items-center justify-center gap-2 font-medium active:scale-[0.98] touch-manipulation"
                >
                  <ClipboardList className="h-5 w-5 text-warning" />
                  Tutup Kas
                </motion.button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base">Transaksi Terakhir</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs"
                onClick={() => navigate('/kasir/daftar-transaksi')}
              >
                Semua
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada transaksi hari ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((trans) => (
                    <motion.div
                      key={trans.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {trans.invoice_number}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {trans.customers?.name || 'Walk-in'} • {format(new Date(trans.created_at), 'HH:mm', { locale: id })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant={getStatusBadge(trans.status) as any} className="text-[10px]">
                          {getStatusLabel(trans.status)}
                        </Badge>
                        <p className="font-semibold text-sm whitespace-nowrap">
                          {formatCurrency(Number(trans.total_amount))}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PullToRefresh>
    </KasirLayout>
  );
}
