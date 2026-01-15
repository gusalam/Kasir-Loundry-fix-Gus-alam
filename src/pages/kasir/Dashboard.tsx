import { useState, useEffect, useCallback } from 'react';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { IllustratedStatCard } from '@/components/dashboard/IllustratedStatCard';
import { SoftCard } from '@/components/ui/SoftCard';
import { SoftButton } from '@/components/ui/SoftButton';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
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
  Sparkles,
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
      
      const channel = supabase
        .channel('kasir-dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchDashboardData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchDashboardData())
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

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (transError) throw transError;

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

      const { data: pendingPickup } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'selesai');

      const { data: inProgress } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['diterima', 'diproses', 'qc']);

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
        <div className="space-y-5 pb-6">
          {/* Welcome Header - Soft Pastel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SoftCard variant="primary" padding="lg" className="border-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[hsl(200,80%,25%)]">
                    Halo, {displayName} 👋
                  </h2>
                  <p className="text-sm text-[hsl(200,60%,40%)]">
                    Ringkasan transaksi Anda hari ini
                  </p>
                </div>
              </div>
            </SoftCard>
          </motion.div>

          {/* Stats Grid - 2 columns with illustrations */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <IllustratedStatCard
                title="Order Hari Ini"
                value={stats.ordersToday}
                subtitle="transaksi Anda"
                icon={<ShoppingCart className="h-5 w-5" />}
                illustration="orders"
                variant="primary"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <IllustratedStatCard
                title="Uang Masuk"
                value={formatCurrency(stats.revenueToday)}
                subtitle="hari ini"
                icon={<TrendingUp className="h-5 w-5" />}
                illustration="revenue"
                variant="success"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <IllustratedStatCard
                title="Belum Diambil"
                value={stats.pendingPickup}
                subtitle="siap diambil"
                icon={<Package className="h-5 w-5" />}
                illustration="ready"
                variant="warning"
                onClick={() => navigate('/kasir/pengambilan')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <IllustratedStatCard
                title="Dalam Proses"
                value={stats.inProgress}
                subtitle="sedang dikerjakan"
                icon={<Clock className="h-5 w-5" />}
                illustration="process"
                variant="info"
                onClick={() => navigate('/kasir/daftar-transaksi')}
              />
            </motion.div>
          </div>

          {/* Quick Actions - Soft Button Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Aksi Cepat
            </p>
            <div className="grid grid-cols-1 gap-3">
              <SoftButton
                variant="primary"
                size="lg"
                fullWidth
                icon={<Plus className="h-6 w-6" />}
                onClick={() => navigate('/kasir/transaksi-baru')}
              >
                Transaksi Baru
              </SoftButton>
              
              <div className="grid grid-cols-2 gap-3">
                <SoftButton
                  variant="outline"
                  size="md"
                  fullWidth
                  icon={<Truck className="h-5 w-5 text-success" />}
                  onClick={() => navigate('/kasir/pengambilan')}
                >
                  Pengambilan
                </SoftButton>
                <SoftButton
                  variant="outline"
                  size="md"
                  fullWidth
                  icon={<ClipboardList className="h-5 w-5 text-warning" />}
                  onClick={() => navigate('/kasir/tutup-kas')}
                >
                  Tutup Kas
                </SoftButton>
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions - Soft Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <SoftCard className="p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="text-base font-semibold">Transaksi Terakhir</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => navigate('/kasir/daftar-transaksi')}
                >
                  Semua
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="p-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                      <ShoppingCart className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Belum ada transaksi hari ini</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.slice(0, 5).map((trans, idx) => (
                      <motion.div
                        key={trans.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-xl"
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
              </div>
            </SoftCard>
          </motion.div>
        </div>
      </PullToRefresh>
    </KasirLayout>
  );
}
