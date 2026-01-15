import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { IllustratedStatCard } from '@/components/dashboard/IllustratedStatCard';
import { SoftCard } from '@/components/ui/SoftCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart,
  TrendingUp,
  Wallet,
  TrendingDown,
  Package,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  expensesToday: number;
  profitToday: number;
  pendingOrders: number;
  readyOrders: number;
}

export default function AdminDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    expensesToday: 0,
    profitToday: 0,
    pendingOrders: 0,
    readyOrders: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (transError) throw transError;

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (payError) throw payError;

      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today);

      if (expError) throw expError;

      const { data: pendingData } = await supabase
        .from('transactions')
        .select('id')
        .in('status', ['diterima', 'diproses', 'qc']);

      const { data: readyData } = await supabase
        .from('transactions')
        .select('id')
        .eq('status', 'selesai');

      const { data: recent } = await supabase
        .from('transactions')
        .select(`*, customers (name, phone)`)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        ordersToday: transactions?.length || 0,
        revenueToday: totalRevenue,
        expensesToday: totalExpenses,
        profitToday: totalRevenue - totalExpenses,
        pendingOrders: pendingData?.length || 0,
        readyOrders: readyData?.length || 0,
      });

      setRecentTransactions(recent || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await fetchDashboardData();
    toast.success('Data berhasil diperbarui');
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
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" className="h-12 rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-5">
          {/* Welcome Header - Soft Pastel Style */}
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
                    Ringkasan bisnis hari ini
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
                subtitle="transaksi"
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
                title="Omzet"
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
                title="Pengeluaran"
                value={formatCurrency(stats.expensesToday)}
                subtitle="hari ini"
                icon={<TrendingDown className="h-5 w-5" />}
                illustration="expense"
                variant="warning"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <IllustratedStatCard
                title="Laba Bersih"
                value={formatCurrency(stats.profitToday)}
                subtitle={stats.profitToday >= 0 ? 'profit' : 'rugi'}
                icon={<Wallet className="h-5 w-5" />}
                illustration="profit"
                variant={stats.profitToday >= 0 ? 'success' : 'danger'}
              />
            </motion.div>
          </div>

          {/* Quick Status Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            <IllustratedStatCard
              title="Siap Diambil"
              value={stats.readyOrders}
              icon={<Package className="h-5 w-5" />}
              illustration="ready"
              variant="success"
              onClick={() => navigate('/admin/pengambilan')}
            />
            <IllustratedStatCard
              title="Dalam Proses"
              value={stats.pendingOrders}
              icon={<Clock className="h-5 w-5" />}
              illustration="process"
              variant="warning"
              onClick={() => navigate('/admin/daftar-transaksi?status=diproses')}
            />
          </motion.div>

          {/* Recent Transactions - Soft Card Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <SoftCard className="p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="text-base font-semibold text-foreground">
                  Transaksi Terbaru
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                  onClick={() => navigate('/admin/daftar-transaksi')}
                >
                  Semua
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="p-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Belum ada transaksi hari ini</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.slice(0, 5).map((trans, index) => (
                      <motion.button
                        key={trans.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        onClick={() => navigate(`/admin/daftar-transaksi?id=${trans.id}`)}
                        className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 rounded-xl active:scale-[0.99] touch-manipulation text-left transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
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
                          <p className="font-semibold text-sm text-foreground whitespace-nowrap">
                            {formatCurrency(Number(trans.total_amount))}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </SoftCard>
          </motion.div>
        </div>
      </PullToRefresh>
    </AdminLayout>
  );
}
