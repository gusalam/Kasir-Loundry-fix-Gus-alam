import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { MobileStatCard } from '@/components/dashboard/MobileStatCard';
import { MobileActionButton } from '@/components/ui/MobileActionButton';
import { MobileCard } from '@/components/ui/MobileCard';
import { MobileStatusBadge } from '@/components/ui/MobileStatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  CreditCard,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  unpaidOrders: number;
  readyOrders: number;
}

export default function KasirDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    unpaidOrders: 0,
    readyOrders: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Kasir';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const startISO = startOfDay.toISOString();
      const endISO = endOfDay.toISOString();

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (transError) throw transError;

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (payError) throw payError;
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const { data: unpaidData } = await supabase
        .from('transactions')
        .select('id')
        .eq('payment_status', 'belum_lunas');

      const { data: readyData } = await supabase
        .from('transactions')
        .select('id')
        .eq('status', 'selesai');

      const { data: recent } = await supabase
        .from('transactions')
        .select(`*, customers (name, phone)`)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        ordersToday: transactions?.length || 0,
        revenueToday: totalRevenue,
        unpaidOrders: unpaidData?.length || 0,
        readyOrders: readyData?.length || 0,
      });

      setRecentTransactions(recent || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <MobileLayout title="Dashboard" role="kasir">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">Memuat data...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout title="Dashboard" role="kasir">
        <div className="flex flex-col items-center justify-center h-64 gap-6 p-6">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <p className="text-destructive font-semibold text-lg text-center">{error}</p>
          <MobileActionButton onClick={fetchDashboardData} variant="primary" size="lg">
            <RefreshCw className="h-5 w-5" />
            Coba Lagi
          </MobileActionButton>
        </div>
      </MobileLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <MobileLayout title="Dashboard" role="kasir">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="pt-2">
          <h2 className="text-2xl font-bold text-foreground">
            Halo, {displayName} 👋
          </h2>
          <p className="text-muted-foreground text-base mt-1">
            Siap melayani pelanggan hari ini
          </p>
        </motion.div>

        {/* Primary CTA - New Transaction */}
        <motion.div variants={itemVariants}>
          <MobileActionButton 
            onClick={() => navigate('/kasir/transaksi-baru')}
            variant="primary"
            size="xl"
          >
            <Plus className="h-6 w-6" />
            Transaksi Baru
          </MobileActionButton>
        </motion.div>

        {/* Secondary CTA - Pickup */}
        <motion.div variants={itemVariants}>
          <MobileActionButton 
            onClick={() => navigate('/kasir/pengambilan')}
            variant="outline"
            size="lg"
          >
            <Package className="h-5 w-5" />
            Ambil Laundry ({stats.readyOrders})
          </MobileActionButton>
        </motion.div>

        {/* Stats Grid 2x2 */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <MobileStatCard
            title="Order Hari Ini"
            value={stats.ordersToday}
            subtitle="transaksi"
            icon={<ShoppingCart className="h-6 w-6" />}
            variant="primary"
            onClick={() => navigate('/kasir/daftar-transaksi')}
          />
          <MobileStatCard
            title="Uang Masuk"
            value={formatCurrency(stats.revenueToday)}
            subtitle="hari ini"
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
        </motion.div>

        {/* Quick Status Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <MobileCard onClick={() => navigate('/kasir/pengambilan')} showArrow>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success/20">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.readyOrders}</p>
                <p className="text-xs text-muted-foreground">Siap Ambil</p>
              </div>
            </div>
          </MobileCard>
          <MobileCard onClick={() => navigate('/kasir/daftar-transaksi?status=belum_lunas')} showArrow>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/20">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.unpaidOrders}</p>
                <p className="text-xs text-muted-foreground">Belum Lunas</p>
              </div>
            </div>
          </MobileCard>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Transaksi Terbaru</h3>
            <button 
              onClick={() => navigate('/kasir/daftar-transaksi')}
              className="text-primary font-medium text-sm active:opacity-70"
            >
              Lihat Semua
            </button>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <MobileCard>
                <div className="text-center py-6">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Belum ada transaksi</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Tekan tombol + untuk membuat transaksi baru
                  </p>
                </div>
              </MobileCard>
            ) : (
              recentTransactions.map((trans) => (
                <MobileCard 
                  key={trans.id} 
                  onClick={() => navigate(`/kasir/daftar-transaksi?id=${trans.id}`)}
                  showArrow
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{trans.invoice_number}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {trans.customers?.name || 'Walk-in'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-foreground">{formatCurrency(Number(trans.total_amount))}</p>
                      <MobileStatusBadge status={trans.status} size="sm" />
                    </div>
                  </div>
                </MobileCard>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
}
