import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SoftCard } from '@/components/ui/SoftCard';
import { IllustratedStatCard } from '@/components/dashboard/IllustratedStatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  totalCash: number;
  totalTransfer: number;
  totalQris: number;
  dailyData: { date: string; revenue: number; expenses: number }[];
}

export default function AdminReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalOrders: 0,
    totalCash: 0,
    totalTransfer: 0,
    totalQris: 0,
    dailyData: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, method, created_at')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (paymentsError) throw paymentsError;

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (expensesError) throw expensesError;

      const { count: ordersCount, error: ordersError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact' })
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (ordersError) throw ordersError;

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalCash = payments?.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalTransfer = payments?.filter(p => p.method === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalQris = payments?.filter(p => p.method === 'qris').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const revenueByDate: Record<string, number> = {};
      const expensesByDate: Record<string, number> = {};

      payments?.forEach(p => {
        const date = format(new Date(p.created_at), 'yyyy-MM-dd');
        revenueByDate[date] = (revenueByDate[date] || 0) + Number(p.amount);
      });

      expenses?.forEach(e => {
        expensesByDate[e.expense_date] = (expensesByDate[e.expense_date] || 0) + Number(e.amount);
      });

      const allDates = new Set([...Object.keys(revenueByDate), ...Object.keys(expensesByDate)]);
      const dailyData = Array.from(allDates).sort().map(date => ({
        date,
        revenue: revenueByDate[date] || 0,
        expenses: expensesByDate[date] || 0,
      }));

      setReportData({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalOrders: ordersCount || 0,
        totalCash,
        totalTransfer,
        totalQris,
        dailyData,
      });
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickDate = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date();
    switch (type) {
      case 'today':
        const todayStr = format(today, 'yyyy-MM-dd');
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setStartDate(format(weekAgo, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
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
      <AdminLayout title="Laporan">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Laporan">
      {/* Date Filter */}
      <SoftCard className="mb-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Button variant="outline" size="sm" onClick={() => setQuickDate('today')} className="rounded-xl flex-shrink-0">
              Hari Ini
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate('week')} className="rounded-xl flex-shrink-0">
              7 Hari
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate('month')} className="rounded-xl flex-shrink-0">
              Bulan Ini
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate('lastMonth')} className="rounded-xl flex-shrink-0">
              Bulan Lalu
            </Button>
          </div>
        </div>
      </SoftCard>

      {/* Summary Cards with Illustrations */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <IllustratedStatCard
            title="Total Omzet"
            value={formatCurrency(reportData.totalRevenue)}
            icon={<TrendingUp className="h-5 w-5" />}
            illustration="revenue"
            variant="success"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <IllustratedStatCard
            title="Pengeluaran"
            value={formatCurrency(reportData.totalExpenses)}
            icon={<TrendingDown className="h-5 w-5" />}
            illustration="expense"
            variant="danger"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <IllustratedStatCard
            title="Laba Bersih"
            value={formatCurrency(reportData.netProfit)}
            icon={<Wallet className="h-5 w-5" />}
            illustration="profit"
            variant={reportData.netProfit >= 0 ? 'success' : 'danger'}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <IllustratedStatCard
            title="Total Order"
            value={reportData.totalOrders}
            icon={<FileBarChart className="h-5 w-5" />}
            illustration="orders"
            variant="info"
          />
        </motion.div>
      </div>

      {/* Revenue by Payment Method */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SoftCard className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Omzet per Metode</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[hsl(155,60%,95%)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-success"></div>
                <span className="text-sm font-medium">Cash</span>
              </div>
              <span className="font-bold text-success">{formatCurrency(reportData.totalCash)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[hsl(200,85%,95%)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-info"></div>
                <span className="text-sm font-medium">Transfer</span>
              </div>
              <span className="font-bold text-info">{formatCurrency(reportData.totalTransfer)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[hsl(270,60%,95%)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[hsl(270,60%,50%)]"></div>
                <span className="text-sm font-medium">QRIS</span>
              </div>
              <span className="font-bold text-[hsl(270,60%,50%)]">{formatCurrency(reportData.totalQris)}</span>
            </div>
          </div>
        </SoftCard>
      </motion.div>

      {/* Daily Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <SoftCard>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Rekap Harian</h3>
          </div>
          {reportData.dailyData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Tidak ada data</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
              {reportData.dailyData.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                  <span className="text-sm font-medium">
                    {format(new Date(day.date), 'dd MMM yyyy', { locale: id })}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-success font-semibold">+{formatCurrency(day.revenue)}</p>
                    {day.expenses > 0 && (
                      <p className="text-xs text-danger">-{formatCurrency(day.expenses)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SoftCard>
      </motion.div>
    </AdminLayout>
  );
}
