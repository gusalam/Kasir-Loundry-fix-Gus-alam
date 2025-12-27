import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Settings, Save, Printer, CheckCircle2, Eye, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Receipt, ReceiptData } from './Receipt';

interface ReceiptSettingsData {
  id?: number;
  user_id: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  footer_text: string | null;
  show_logo: boolean;
  paper_size: string;
  whatsapp_enabled: boolean;
}

interface ReceiptSettingsProps {
  trigger?: React.ReactNode;
}

// Sample data for preview
const SAMPLE_RECEIPT_DATA: ReceiptData = {
  invoice_number: 'INV-20241227-0001',
  created_at: new Date().toISOString(),
  customer_name: 'John Doe',
  customer_phone: '08123456789',
  items: [
    { service_name: 'Cuci Kering', qty: 3, price: 7000, subtotal: 21000 },
    { service_name: 'Setrika', qty: 2, price: 5000, subtotal: 10000 },
  ],
  total_amount: 31000,
  paid_amount: 31000,
  payment_method: 'cash',
  payment_status: 'lunas',
  order_status: 'diterima',
  estimated_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Harap hati-hati dengan baju merah',
};

export function ReceiptSettings({ trigger }: ReceiptSettingsProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');
  const [settings, setSettings] = useState<ReceiptSettingsData>({
    user_id: user?.id || '',
    business_name: 'POS Laundry',
    address: '',
    phone: '',
    footer_text: 'Terima kasih atas kepercayaan Anda!',
    show_logo: true,
    paper_size: '58mm',
    whatsapp_enabled: false,
  });

  // Fetch settings on mount
  useEffect(() => {
    if (open && user?.id) {
      fetchSettings();
    }
  }, [open, user?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('receipt-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipt_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Receipt settings changed:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as ReceiptSettingsData;
            setSettings(prev => ({
              ...prev,
              ...newData,
            }));
            toast.info('Pengaturan struk diperbarui');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // No settings yet, use defaults with user_id
        setSettings(prev => ({
          ...prev,
          user_id: user.id,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching receipt settings:', error);
      toast.error('Gagal memuat pengaturan struk');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const settingsToSave = {
        user_id: user.id,
        business_name: settings.business_name,
        address: settings.address || null,
        phone: settings.phone || null,
        footer_text: settings.footer_text || null,
        show_logo: settings.show_logo,
        paper_size: settings.paper_size,
        whatsapp_enabled: settings.whatsapp_enabled,
      };

      // Use upsert to insert or update
      const { error } = await supabase
        .from('receipt_settings')
        .upsert(settingsToSave, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast.success('Pengaturan struk berhasil disimpan');
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving receipt settings:', error);
      toast.error('Gagal menyimpan pengaturan struk');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ReceiptSettingsData, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
            Pengaturan Struk
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Pengaturan Cetak Struk
          </DialogTitle>
          <DialogDescription>
            Atur informasi yang akan ditampilkan di struk
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'settings' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Pengaturan
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nama Usaha</Label>
                    <Input
                      id="business_name"
                      value={settings.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Nama Laundry Anda"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      value={settings.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Alamat lengkap usaha"
                      rows={2}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input
                      id="phone"
                      value={settings.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>

                  {/* Footer Text */}
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Teks Footer</Label>
                    <Textarea
                      id="footer_text"
                      value={settings.footer_text || ''}
                      onChange={(e) => handleInputChange('footer_text', e.target.value)}
                      placeholder="Terima kasih atas kepercayaan Anda!"
                      rows={2}
                    />
                  </div>

                  {/* Paper Size */}
                  <div className="space-y-2">
                    <Label htmlFor="paper_size">Ukuran Kertas</Label>
                    <Select
                      value={settings.paper_size}
                      onValueChange={(value) => handleInputChange('paper_size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih ukuran kertas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58mm">58mm (Thermal Mini)</SelectItem>
                        <SelectItem value="80mm">80mm (Thermal Standard)</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show Logo Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show_logo">Tampilkan Logo</Label>
                      <p className="text-sm text-muted-foreground">
                        Tampilkan logo di bagian atas struk
                      </p>
                    </div>
                    <Switch
                      id="show_logo"
                      checked={settings.show_logo}
                      onCheckedChange={(checked) => handleInputChange('show_logo', checked)}
                    />
                  </div>

                  {/* WhatsApp Notifications Toggle */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="whatsapp_enabled" className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                          Notifikasi WhatsApp
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Kirim notifikasi WhatsApp ke customer (memerlukan Twilio API)
                        </p>
                      </div>
                      <Switch
                        id="whatsapp_enabled"
                        checked={settings.whatsapp_enabled}
                        onCheckedChange={(checked) => handleInputChange('whatsapp_enabled', checked)}
                      />
                    </div>
                    {settings.whatsapp_enabled && (
                      <p className="text-xs text-amber-600 mt-2 p-2 bg-amber-500/10 rounded">
                        ⚠️ Pastikan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, dan TWILIO_WHATSAPP_FROM sudah dikonfigurasi di Supabase Secrets.
                      </p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
                  <div className="shadow-lg">
                    <Receipt
                      data={SAMPLE_RECEIPT_DATA}
                      laundryName={settings.business_name}
                      laundryAddress={settings.address || ''}
                      laundryPhone={settings.phone || ''}
                      footerText={settings.footer_text || ''}
                      showLogo={settings.show_logo}
                      paperSize={settings.paper_size}
                    />
                  </div>
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground text-center mt-2">
                * Ini adalah contoh preview dengan data sampel
              </p>
            </TabsContent>

            {/* Save Button - Always visible */}
            <div className="mt-4 space-y-3">
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Pengaturan
                  </>
                )}
              </Button>

              {/* Real-time indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Sinkronisasi real-time aktif
              </div>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
