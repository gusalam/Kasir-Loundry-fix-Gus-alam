import { useState, useEffect } from 'react';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { QuickStatCard } from '@/components/kasir/QuickStatCard';
import { MenuGrid } from '@/components/kasir/MenuGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  itemsSold: number;
}

export default function KasirDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    itemsSold: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Kasir';

  useEffect(() => {
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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const startISO = startOfDay.toISOString();
      const endISO = endOfDay.toISOString();

      // Fetch today's transactions count
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (transError) throw transError;

      // Fetch today's revenue
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (payError) throw payError;
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Fetch items sold today
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('qty, transaction_id, transactions!inner(created_at)')
        .gte('transactions.created_at', startISO)
        .lte('transactions.created_at', endISO);

      if (itemsError) throw itemsError;
      const totalItems = items?.reduce((sum, i) => sum + Number(i.qty), 0) || 0;

      // Fetch recent transactions
      const { data: recent } = await supabase
        .from('transactions')
        .select(`*, customers (name, phone)`)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        ordersToday: transactions?.length || 0,
        revenueToday: totalRevenue,
        itemsSold: totalItems,
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
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </KasirLayout>
    );
  }

  return (
    <KasirLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-foreground">
            Halo, {displayName} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Siap melayani pelanggan hari ini
          </p>
        </motion.div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickStatCard
            title="Transaksi Hari Ini"
            value={stats.ordersToday}
            icon={<ShoppingCart className="h-5 w-5" />}
            variant="primary"
          />
          <QuickStatCard
            title="Omzet Hari Ini"
            value={formatCurrency(stats.revenueToday)}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <QuickStatCard
            title="Item Terjual"
            value={stats.itemsSold}
            icon={<Package className="h-5 w-5" />}
            variant="warning"
          />
        </div>

        {/* Menu Grid */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Menu Utama
          </h3>
          <MenuGrid />
        </div>

        {/* Recent Transactions */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs"
              onClick={() => navigate('/kasir/daftar-transaksi')}
            >
              Lihat Semua
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 3).map((trans) => (
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
    </KasirLayout>
  );
}
