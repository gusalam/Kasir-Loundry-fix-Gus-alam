import { useState } from 'react';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Shield,
  Smartphone,
  Printer,
  Bluetooth,
  WifiOff,
  CheckCircle,
  Fingerprint,
  ScanFace,
  Bell,
  BellOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PrinterSettings } from '@/components/printer/PrinterSettings';

export default function KasirAccount() {
  const { user, profile, refreshProfile } = useAuth();
  const { status, connect, printTestPage } = useBluetoothPrinter();
  const { 
    isAvailable: isBiometricAvailable, 
    isEnabled: isBiometricEnabled, 
    biometryType,
    isNative,
    enableBiometric,
    disableBiometric,
  } = useBiometricAuth();
  
  const {
    isSupported: isPushSupported,
    isRegistered: isPushRegistered,
    registerForPush,
  } = usePushNotifications();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTogglePush = async (enabled: boolean) => {
    if (enabled) {
      setIsEnablingPush(true);
      try {
        await registerForPush();
        toast.success('Notifikasi push diaktifkan');
      } catch (error) {
        toast.error('Gagal mengaktifkan notifikasi');
      } finally {
        setIsEnablingPush(false);
      }
    } else {
      // Note: Disabling push requires unregistering from FCM/APNS
      toast.info('Untuk menonaktifkan, ubah di pengaturan perangkat');
    }
  };

  const handleToggleBiometric = (enabled: boolean) => {
    if (enabled) {
      if (user?.email) {
        enableBiometric(user.email);
        toast.success('Login biometrik diaktifkan');
      }
    } else {
      disableBiometric();
      toast.success('Login biometrik dinonaktifkan');
    }
  };

  const getBiometricIcon = () => {
    switch (biometryType) {
      case 'faceId':
        return <ScanFace className="h-5 w-5 text-primary" />;
      case 'fingerprint':
      default:
        return <Fingerprint className="h-5 w-5 text-primary" />;
    }
  };

  const getBiometricLabel = () => {
    switch (biometryType) {
      case 'faceId':
        return 'Face ID';
      case 'fingerprint':
        return 'Sidik Jari';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometrik';
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profil berhasil diperbarui');
    } catch (error: any) {
      toast.error('Gagal memperbarui profil: ' + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password berhasil diperbarui');
    } catch (error: any) {
      toast.error('Gagal memperbarui password: ' + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <KasirLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Kasir</span>
          </div>
        </motion.div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Informasi Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdatingProfile}
              className="w-full"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Ubah Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label>Konfirmasi Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              variant="outline"
              className="w-full"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Memperbarui...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Ubah Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Biometric Authentication Card - Only show on native platforms */}
        {isNative && isBiometricAvailable && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Keamanan Biometrik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isBiometricEnabled ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {getBiometricIcon()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Login dengan {getBiometricLabel()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isBiometricEnabled 
                        ? 'Aktif - login lebih cepat dan aman' 
                        : 'Nonaktif - aktifkan untuk kemudahan'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isBiometricEnabled}
                  onCheckedChange={handleToggleBiometric}
                />
              </div>
              
              {isBiometricEnabled && (
                <p className="text-xs text-muted-foreground text-center">
                  {getBiometricLabel()} akan digunakan untuk verifikasi saat login
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Push Notifications Card - Only show on native platforms */}
        {isNative && isPushSupported && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifikasi Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPushRegistered ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {isPushRegistered ? (
                      <Bell className="h-5 w-5 text-primary" />
                    ) : (
                      <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Notifikasi Transaksi
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPushRegistered 
                        ? 'Aktif - terima notifikasi transaksi baru' 
                        : 'Nonaktif - aktifkan untuk update realtime'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isPushRegistered}
                  onCheckedChange={handleTogglePush}
                  disabled={isEnablingPush}
                />
              </div>
              
              {isPushRegistered && (
                <p className="text-xs text-muted-foreground text-center">
                  Anda akan menerima notifikasi untuk transaksi baru dan status pickup
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Printer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Printer Bluetooth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status.isConnected ? 'bg-success/10' : 'bg-muted'
                }`}>
                  {status.isConnected ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {status.isConnected ? status.deviceName : 'Tidak terhubung'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {status.isConnected ? 'Siap mencetak' : 'Hubungkan printer'}
                  </p>
                </div>
              </div>
              <Button
                variant={status.isConnected ? 'outline' : 'default'}
                size="sm"
                onClick={() => connect()}
                disabled={status.isConnecting}
              >
                {status.isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bluetooth className="h-4 w-4" />
                )}
              </Button>
            </div>

            {status.isConnected && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={printTestPage}
              >
                <Printer className="h-4 w-4 mr-2" />
                Test Print
              </Button>
            )}

            <Sheet open={showPrinterSettings} onOpenChange={setShowPrinterSettings}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="w-full text-muted-foreground">
                  Pengaturan Lanjutan
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>Pengaturan Printer</SheetTitle>
                </SheetHeader>
                <PrinterSettings autoPrint={autoPrint} onAutoPrintChange={setAutoPrint} />
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">POS Laundry</p>
                <p className="text-xs text-muted-foreground">Versi 1.0.0 • Clean & Fresh</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </KasirLayout>
  );
}
