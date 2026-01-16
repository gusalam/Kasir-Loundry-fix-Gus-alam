import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { createNotification, NotificationTemplates } from '@/lib/notifications';
import { sendWhatsAppNotification } from '@/lib/whatsapp';
import { SoftCard } from '@/components/ui/SoftCard';
import { ReceiptPreviewDialog } from '@/components/printer/ReceiptPreviewDialog';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  Loader2,
  ShoppingCart,
  ScanBarcode,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
} from 'lucide-react';
import { QRScanner } from '@/components/qrcode/QRScanner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReceiptData } from '@/components/receipt/Receipt';

interface Service {
  id: number;
  name: string;
  type: string;
  price: number;
  is_active: boolean;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
}

interface CartItem {
  service: Service;
  qty: number;
  subtotal: number;
}

export default function KasirNewTransaction() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: receiptSettings } = useReceiptSettings();
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [serviceSearch, setServiceSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentType, setPaymentType] = useState<'lunas' | 'dp'>('lunas');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, customersRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('name'),
        supabase.from('customers').select('*').order('name'),
      ]);

      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (customersRes.data) setCustomers(customersRes.data as Customer[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (service: Service) => {
    const existing = cart.find(item => item.service.id === service.id);
    if (existing) {
      setCart(cart.map(item =>
        item.service.id === service.id
          ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.service.price }
          : item
      ));
    } else {
      setCart([...cart, { service, qty: 1, subtotal: service.price }]);
    }
  };

  const handleBarcodeScan = (data: { invoice: string; rawData: string }) => {
    setShowBarcodeScanner(false);
    
    // Try to find service by name or ID from barcode
    const scannedValue = data.invoice.toLowerCase().trim();
    
    // Try matching by service ID first (if barcode contains numeric ID)
    const numericId = parseInt(scannedValue, 10);
    let foundService = services.find(s => s.id === numericId);
    
    // If not found by ID, try matching by name
    if (!foundService) {
      foundService = services.find(s => 
        s.name.toLowerCase() === scannedValue ||
        s.name.toLowerCase().includes(scannedValue)
      );
    }
    
    if (foundService) {
      addToCart(foundService);
      toast.success(`${foundService.name} ditambahkan ke keranjang`);
    } else {
      toast.error(`Layanan "${data.invoice}" tidak ditemukan`);
    }
  };

  const updateQty = (serviceId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.service.id === serviceId) {
        const newQty = Math.max(0.5, item.qty + delta);
        return { ...item, qty: newQty, subtotal: newQty * item.service.price };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (serviceId: number) => {
    setCart(cart.filter(item => item.service.id !== serviceId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error('Nama customer wajib diisi');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ name: newCustomerName, phone: newCustomerPhone })
        .select()
        .single();

      if (error) throw error;

      setCustomers([...customers, data as Customer]);
      setSelectedCustomer(data as Customer);
      setShowCustomerDialog(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      toast.success('Customer berhasil ditambahkan');
    } catch (error: any) {
      toast.error('Gagal menambah customer: ' + error.message);
    }
  };

  const paidAmount = paymentType === 'lunas' ? totalAmount : Math.ceil(totalAmount / 2);
  const cashReceivedNum = Number(cashReceived) || 0;
  const changeAmount = cashReceivedNum > paidAmount ? cashReceivedNum - paidAmount : 0;

  const roundUp = (value: number, step: number) => Math.ceil(value / step) * step;

  const quickCashAmounts = (() => {
    if (paidAmount <= 0) return [] as number[];

    const candidates = [
      paidAmount,
      roundUp(paidAmount, 10000),
      roundUp(paidAmount, 20000),
      roundUp(paidAmount, 50000),
      roundUp(paidAmount, 100000),
    ];

    return Array.from(new Set(candidates)).sort((a, b) => a - b).slice(0, 5);
  })();


  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    if (paymentMethod === 'cash' && cashReceivedNum < paidAmount) {
      toast.error('Uang yang diterima kurang dari jumlah yang harus dibayar');
      return;
    }
    setShowCheckoutConfirm(true);
  };

  const handleConfirmTransaction = async (printReceipt: boolean) => {
    if (!user) {
      toast.error('Session tidak valid');
      return;
    }

    setIsSubmitting(true);
    setShowCheckoutConfirm(false);

    try {
      // Create transaction
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          customer_id: selectedCustomer?.id || null,
          user_id: user.id,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          payment_status: paymentType === 'lunas' ? 'lunas' : 'dp',
          notes,
          invoice_number: '', // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (transError) throw transError;

      // Create transaction items
      const items = cart.map(item => ({
        transaction_id: transaction.id,
        service_id: item.service.id,
        service_name: item.service.name,
        qty: item.qty,
        price: item.service.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          transaction_id: transaction.id,
          method: paymentMethod as any,
          amount: paidAmount,
          received_by: user.id,
        }]);

      if (paymentError) throw paymentError;

      toast.success('Transaksi berhasil dibuat!');

      // Send in-app notification to kasir
      const notifData = NotificationTemplates.transactionCreated(transaction.invoice_number);
      await createNotification({
        userId: user.id,
        ...notifData,
        relatedTable: 'transactions',
        relatedId: transaction.id,
      });

      // Send WhatsApp notification if enabled and customer has phone
      if (receiptSettings?.whatsapp_enabled && selectedCustomer?.phone) {
        sendWhatsAppNotification({
          to: selectedCustomer.phone,
          templateType: 'transaction_created',
          data: {
            invoiceNumber: transaction.invoice_number,
            businessName: receiptSettings.business_name,
            totalAmount: totalAmount,
            customerName: selectedCustomer.name,
          },
        }).catch(err => console.log('WhatsApp notification skipped:', err));
      }

      if (printReceipt) {
        // Prepare receipt data and show modal
        const newReceiptData: ReceiptData = {
          invoice_number: transaction.invoice_number,
          created_at: transaction.created_at,
          customer_name: selectedCustomer?.name || 'Walk-in Customer',
          customer_phone: selectedCustomer?.phone,
          items: cart.map(item => ({
            service_name: item.service.name,
            qty: item.qty,
            price: item.service.price,
            subtotal: item.subtotal,
          })),
          total_amount: totalAmount,
          paid_amount: paidAmount,
          cash_received: paymentMethod === 'cash' ? cashReceivedNum : undefined,
          change_amount: paymentMethod === 'cash' ? changeAmount : undefined,
          payment_method: paymentMethod,
          payment_status: paymentType === 'lunas' ? 'lunas' : 'dp',
          order_status: 'diterima',
          notes: notes || undefined,
        };

        setReceiptData(newReceiptData);
        setShowReceiptPreview(true);
      } else {
        navigate('/kasir/daftar-transaksi');
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast.error('Gagal membuat transaksi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  if (isLoading) {
    return (
      <KasirLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </KasirLayout>
    );
  }

  return (
    <KasirLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Services & Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <SoftCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Customer</h3>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Cari customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="bg-white/80"
                />
                {customerSearch && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl bg-white shadow-lg">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-3 text-muted-foreground text-sm">Tidak ditemukan</p>
                    ) : (
                      filteredCustomers.map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch('');
                          }}
                          className="w-full p-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/80">
                    <Plus className="h-4 w-4" />
                    Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Tambah Customer Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="Nama customer"
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. HP</Label>
                      <Input
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="bg-muted/50"
                      />
                    </div>
                    <Button onClick={handleAddCustomer} className="w-full bg-gradient-to-r from-primary to-primary/80">
                      Simpan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedCustomer && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedCustomer.phone || '-'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </motion.div>
            )}
          </SoftCard>

          {/* Services */}
          <SoftCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-secondary" />
                </div>
                <h3 className="font-semibold">Pilih Layanan</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBarcodeScanner(true)}
                className="gap-2 bg-white/80"
              >
                <ScanBarcode className="h-4 w-4" />
                Scan
              </Button>
            </div>
            
            {/* Search Input */}
            <div className="mb-4">
              <Input
                placeholder="Cari nama layanan..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="bg-white/80"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-white/80'}
              >
                Semua
              </Button>
              <Button
                variant={selectedCategory === 'kiloan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('kiloan')}
                className={selectedCategory === 'kiloan' ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-white/80'}
              >
                Kiloan
              </Button>
              <Button
                variant={selectedCategory === 'satuan' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('satuan')}
                className={selectedCategory === 'satuan' ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-white/80'}
              >
                Satuan
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services
                .filter(service => selectedCategory === 'all' || service.type === selectedCategory)
                .filter(service => service.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                .map((service, index) => (
                  <motion.button
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => addToCart(service)}
                    className="p-4 bg-white border-2 border-border/50 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left hover:shadow-md group"
                  >
                    <p className="font-medium truncate group-hover:text-primary transition-colors">{service.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{service.type}</p>
                    <p className="text-primary font-bold mt-2">
                      {formatCurrency(service.price)}
                    </p>
                  </motion.button>
                ))}
            </div>
            {services
              .filter(service => selectedCategory === 'all' || service.type === selectedCategory)
              .filter(service => service.name.toLowerCase().includes(serviceSearch.toLowerCase()))
              .length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {selectedCategory === 'all' ? 'Belum ada layanan aktif' : `Belum ada layanan ${selectedCategory}`}
              </div>
            )}
          </SoftCard>

          {/* Notes */}
          <SoftCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-warning" />
              </div>
              <h3 className="font-semibold">Catatan</h3>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk pesanan ini..."
              rows={3}
              className="bg-white/80"
            />
          </SoftCard>
        </div>

        {/* Right: Cart & Payment */}
        <div className="space-y-6">
          <SoftCard className="sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-success" />
              </div>
              <h3 className="font-semibold">Keranjang</h3>
              {cart.length > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {cart.length} item
                </span>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Belum ada item</p>
                <p className="text-sm text-muted-foreground/70">Pilih layanan untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <motion.div 
                    key={item.service.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.service.price)} × {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button size="icon-sm" variant="outline" onClick={() => updateQty(item.service.id, -0.5)} className="h-7 w-7">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <Button size="icon-sm" variant="outline" onClick={() => updateQty(item.service.id, 0.5)} className="h-7 w-7">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => removeFromCart(item.service.id)} className="h-7 w-7">
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Metode Pembayaran</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-col h-auto py-3 ${paymentMethod === 'cash' ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-white/80'}`}
                      >
                        <Banknote className="h-5 w-5 mb-1" />
                        <span className="text-xs">Cash</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('transfer')}
                        className={`flex-col h-auto py-3 ${paymentMethod === 'transfer' ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-white/80'}`}
                      >
                        <CreditCard className="h-5 w-5 mb-1" />
                        <span className="text-xs">Transfer</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('qris')}
                        className={`flex-col h-auto py-3 ${paymentMethod === 'qris' ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-white/80'}`}
                      >
                        <Smartphone className="h-5 w-5 mb-1" />
                        <span className="text-xs">QRIS</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipe Pembayaran</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={paymentType === 'dp' ? 'default' : 'outline'}
                        onClick={() => setPaymentType('dp')}
                        className={`flex-1 ${paymentType === 'dp' ? 'bg-gradient-to-r from-warning to-warning/80 text-warning-foreground' : 'bg-white/80'}`}
                      >
                        DP 50%
                      </Button>
                      <Button
                        size="sm"
                        variant={paymentType === 'lunas' ? 'default' : 'outline'}
                        onClick={() => setPaymentType('lunas')}
                        className={`flex-1 ${paymentType === 'lunas' ? 'bg-gradient-to-r from-success to-success/80 text-success-foreground' : 'bg-white/80'}`}
                      >
                        Lunas
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jumlah Bayar:</span>
                      <span className="font-bold text-primary">{formatCurrency(paidAmount)}</span>
                    </div>
                    {paymentType === 'dp' && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Sisa:</span>
                        <span className="text-warning font-medium">{formatCurrency(totalAmount - paidAmount)}</span>
                      </div>
                    )}
                  </div>
                  
                  {paymentMethod === 'cash' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Uang Diterima</Label>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCashReceived(String(paidAmount))}
                          className="bg-white/80"
                        >
                          Pas
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCashReceived('')}
                        >
                          Reset
                        </Button>
                      </div>

                      {quickCashAmounts.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {quickCashAmounts.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCashReceived(String(amount))}
                              className="text-xs bg-white/80"
                            >
                              {formatCurrency(amount)}
                            </Button>
                          ))}
                        </div>
                      )}

                      <Input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="Masukkan nominal"
                        min={0}
                        className="bg-white/80"
                      />

                      {cashReceivedNum >= paidAmount && cashReceivedNum > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-success/10 text-success p-4 rounded-xl"
                        >
                          <div className="flex justify-between font-bold text-lg">
                            <span>Kembalian:</span>
                            <span>{formatCurrency(changeAmount)}</span>
                          </div>
                        </motion.div>
                      )}
                      {cashReceivedNum > 0 && cashReceivedNum < paidAmount && (
                        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                          Kurang: {formatCurrency(paidAmount - cashReceivedNum)}
                        </p>
                      )}
                    </div>
                  )}

                </div>

                <Button
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-lg font-semibold mt-4"
                  onClick={handleCheckout}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Checkout
                    </>
                  )}
                </Button>
              </div>
            )}
          </SoftCard>
        </div>
      </div>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Konfirmasi Transaksi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bayar:</span>
                <span className="font-bold text-primary">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode:</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${paymentType === 'lunas' ? 'text-success' : 'text-warning'}`}>
                  {paymentType === 'lunas' ? 'Lunas' : 'DP 50%'}
                </span>
              </div>
              {paymentMethod === 'cash' && cashReceivedNum > 0 && (
                <>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-muted-foreground">Uang Diterima:</span>
                    <span className="font-medium">{formatCurrency(cashReceivedNum)}</span>
                  </div>
                  <div className="flex justify-between text-success font-bold">
                    <span>Kembalian:</span>
                    <span>{formatCurrency(changeAmount)}</span>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-center text-muted-foreground">
              Apakah Anda ingin mencetak struk?
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-white/80"
                onClick={() => handleConfirmTransaction(false)}
                disabled={isSubmitting}
              >
                Tidak, Simpan Saja
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                onClick={() => handleConfirmTransaction(true)}
                disabled={isSubmitting}
              >
                Ya, Cetak Struk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <QRScanner
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onScan={handleBarcodeScan}
          title="Scan Barcode Layanan"
          fullscreen={isMobile}
        />
      )}

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewDialog
        open={showReceiptPreview}
        onClose={() => {
          setShowReceiptPreview(false);
          navigate('/kasir/daftar-transaksi');
        }}
        receiptData={receiptData}
      />
    </KasirLayout>
  );
}
