import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SwipeBackNavigation } from "@/components/gestures/SwipeBackNavigation";
import { ExitConfirmationDialog } from "@/components/app/ExitConfirmationDialog";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";
import { BluetoothAutoConnect } from "@/components/printer/BluetoothAutoConnect";
import { useExitConfirmation } from "@/hooks/useExitConfirmation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

// Auth pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminTransactionList from "./pages/admin/TransactionList";
import AdminPickup from "./pages/admin/Pickup";
import AdminCashClosing from "./pages/admin/CashClosing";
import AdminCustomers from "./pages/admin/Customers";
import AdminServices from "./pages/admin/Services";
import AdminUsers from "./pages/admin/Users";
import AdminExpenses from "./pages/admin/Expenses";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

// Kasir pages
import KasirDashboard from "./pages/kasir/Dashboard";
import KasirNewTransaction from "./pages/kasir/NewTransaction";
import KasirTransactionList from "./pages/kasir/TransactionList";
import KasirPickup from "./pages/kasir/Pickup";
import KasirCashClosing from "./pages/kasir/CashClosing";
import KasirAccount from "./pages/kasir/Account";

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}

// Protected Route wrapper with role checking
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: ('admin' | 'kasir')[];
}) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/kasir/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/kasir/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const redirectPath = role === 'admin' ? '/admin/dashboard' : '/kasir/dashboard';
  return <Navigate to={redirectPath} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { 
    showExitDialog, 
    handleConfirmExit, 
    handleCancelExit,
    isNative 
  } = useExitConfirmation();
  
  return (
    <>
      <SwipeBackNavigation>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: 'tween', 
              ease: 'anticipate', 
              duration: 0.25 
            }}
          >
          <Routes location={location}>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            
            {/* Dashboard redirect based on role */}
            <Route path="/dashboard" element={<RoleBasedRedirect />} />
            
            {/* ===== ADMIN ROUTES ===== */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/daftar-transaksi" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminTransactionList /></ProtectedRoute>
            } />
            <Route path="/admin/pengambilan" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminPickup /></ProtectedRoute>
            } />
            <Route path="/admin/tutup-kas" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminCashClosing /></ProtectedRoute>
            } />
            <Route path="/admin/customer" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminCustomers /></ProtectedRoute>
            } />
            <Route path="/admin/layanan" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminServices /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>
            } />
            <Route path="/admin/pengeluaran" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminExpenses /></ProtectedRoute>
            } />
            <Route path="/admin/laporan" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>
            } />
            <Route path="/admin/menu" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminMenu /></ProtectedRoute>
            } />
            <Route path="/admin/pengaturan" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>
            } />
            
            {/* ===== KASIR ROUTES ===== */}
            <Route path="/kasir/dashboard" element={
              <ProtectedRoute allowedRoles={['kasir']}><KasirDashboard /></ProtectedRoute>
            } />
            <Route path="/kasir/transaksi-baru" element={
              <ProtectedRoute allowedRoles={['kasir']}><KasirNewTransaction /></ProtectedRoute>
            } />
            <Route path="/kasir/daftar-transaksi" element={
              <ProtectedRoute allowedRoles={['kasir']}><KasirTransactionList /></ProtectedRoute>
            } />
            <Route path="/kasir/pengambilan" element={
              <ProtectedRoute allowedRoles={['kasir']}><KasirPickup /></ProtectedRoute>
            } />
            <Route path="/kasir/tutup-kas" element={
              <ProtectedRoute allowedRoles={['kasir']}><KasirCashClosing /></ProtectedRoute>
            } />
            <Route path="/kasir/akun" element={
              <ProtectedRoute allowedRoles={['kasir']}><KasirAccount /></ProtectedRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </SwipeBackNavigation>

      {/* Exit Confirmation Dialog for Native App */}
      {isNative && (
        <ExitConfirmationDialog
          open={showExitDialog}
          onConfirm={handleConfirmExit}
          onCancel={handleCancelExit}
        />
      )}

      {/* Push Notification Manager for Native App */}
      {Capacitor.isNativePlatform() && <PushNotificationManager />}
      
      {/* Bluetooth Auto-Connect for Native App */}
      {Capacitor.isNativePlatform() && <BluetoothAutoConnect />}
    </>
  );
}

function AppRoutes() {
  return <AnimatedRoutes />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;