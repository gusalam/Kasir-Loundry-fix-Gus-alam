// Native Capacitor Bluetooth Printer Service for Android APK
// Supports ESC/POS thermal printers (58mm & 80mm)
// Uses @kduma-autoid/capacitor-bluetooth-printer for native Bluetooth

import { Capacitor } from '@capacitor/core';

// Interface for printer device
export interface BluetoothDevice {
  name: string;
  address: string;
  type: 'unknown' | 'classic' | 'le' | 'dual';
}

// ESC/POS Commands for text encoding
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const COMMANDS = {
  INIT: [ESC, 0x40],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  DOUBLE_WIDTH: [GS, 0x21, 0x10],
  DOUBLE_SIZE: [GS, 0x21, 0x11],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  CUT_PAPER: [GS, 0x56, 0x00],
  PARTIAL_CUT: [GS, 0x56, 0x01],
  FEED_LINES: (n: number) => [ESC, 0x64, n],
};

// Lazy-load the native plugin
let BluetoothPrinterPlugin: any = null;

async function getBluetoothPrinterPlugin() {
  if (BluetoothPrinterPlugin) return BluetoothPrinterPlugin;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@kduma-autoid/capacitor-bluetooth-printer');
      BluetoothPrinterPlugin = module.BluetoothPrinter;
      return BluetoothPrinterPlugin;
    } catch (error) {
      console.error('Failed to load Bluetooth printer plugin:', error);
      return null;
    }
  }
  return null;
}

// Storage key for saved printer
const SAVED_PRINTER_KEY = 'bluetooth_printer_saved';

interface SavedPrinter {
  name: string;
  address: string;
}

class CapacitorBluetoothPrinterService {
  private connectedDevice: SavedPrinter | null = null;
  private isConnecting = false;

  // Check if running on native platform (Android)
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Check if Bluetooth printing is supported
  isSupported(): boolean {
    // Always supported on Android native, never on web
    return Capacitor.isNativePlatform();
  }

  // Get connected device name
  getConnectedDeviceName(): string | null {
    return this.connectedDevice?.name || null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  // Get saved printer from storage
  getSavedPrinter(): SavedPrinter | null {
    try {
      const saved = localStorage.getItem(SAVED_PRINTER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  // Save printer to storage
  savePrinter(device: SavedPrinter): void {
    try {
      localStorage.setItem(SAVED_PRINTER_KEY, JSON.stringify(device));
    } catch (e) {
      console.error('Failed to save printer:', e);
    }
  }

  // Remove saved printer
  removeSavedPrinter(): void {
    localStorage.removeItem(SAVED_PRINTER_KEY);
  }

  // List available Bluetooth devices
  async listDevices(): Promise<{ success: boolean; devices?: BluetoothDevice[]; error?: string }> {
    if (!this.isNativePlatform()) {
      return { success: false, error: 'Fitur ini hanya tersedia di aplikasi Android' };
    }

    try {
      const plugin = await getBluetoothPrinterPlugin();
      if (!plugin) {
        return { success: false, error: 'Plugin Bluetooth tidak tersedia' };
      }

      const result = await plugin.list();
      return { 
        success: true, 
        devices: result.devices || [] 
      };
    } catch (error: any) {
      console.error('Error listing devices:', error);
      return { 
        success: false, 
        error: error.message || 'Gagal mencari perangkat Bluetooth' 
      };
    }
  }

  // Connect to a specific printer by address
  async connect(address?: string): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isNativePlatform()) {
      return { success: false, error: 'Fitur ini hanya tersedia di aplikasi Android' };
    }

    if (this.isConnecting) {
      return { success: false, error: 'Sedang menghubungkan...' };
    }

    this.isConnecting = true;

    try {
      const plugin = await getBluetoothPrinterPlugin();
      if (!plugin) {
        return { success: false, error: 'Plugin Bluetooth tidak tersedia' };
      }

      // If no address provided, try to use saved printer
      let targetAddress = address;
      let targetName = 'Printer';

      if (!targetAddress) {
        const saved = this.getSavedPrinter();
        if (saved) {
          targetAddress = saved.address;
          targetName = saved.name;
        } else {
          // List devices and let user pick
          const listResult = await this.listDevices();
          if (!listResult.success || !listResult.devices?.length) {
            return { success: false, error: 'Tidak ada printer Bluetooth yang ditemukan. Pastikan printer sudah di-pair di pengaturan Android.' };
          }
          // Use first device (or we could show a picker)
          targetAddress = listResult.devices[0].address;
          targetName = listResult.devices[0].name;
        }
      }

      // Connect to the printer
      await plugin.connect({ address: targetAddress });

      this.connectedDevice = { name: targetName, address: targetAddress };
      this.savePrinter(this.connectedDevice);

      return { success: true, deviceName: targetName };
    } catch (error: any) {
      console.error('Connection error:', error);
      return { 
        success: false, 
        error: error.message || 'Gagal menghubungkan ke printer' 
      };
    } finally {
      this.isConnecting = false;
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    if (!this.isNativePlatform()) return;

    try {
      const plugin = await getBluetoothPrinterPlugin();
      if (plugin) {
        await plugin.disconnect();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
    this.connectedDevice = null;
  }

  // Convert bytes to base64 string (for sending to native plugin)
  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Text encoder
  private textToBytes(text: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else {
        // For non-ASCII, use '?' or encode as UTF-8
        bytes.push(0x3f);
      }
    }
    return bytes;
  }

  // Build ESC/POS command string for native plugin
  private buildPrintData(commands: number[][]): string {
    const allBytes: number[] = [];
    for (const cmd of commands) {
      allBytes.push(...cmd);
    }
    const uint8 = new Uint8Array(allBytes);
    return this.bytesToBase64(uint8);
  }

  // Print receipt
  async printReceipt(receiptData: {
    laundryName: string;
    address?: string;
    phone?: string;
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerPhone?: string;
    items: Array<{
      name: string;
      qty: number;
      price: number;
      subtotal: number;
    }>;
    totalAmount: number;
    paidAmount: number;
    cashReceived?: number;
    changeAmount?: number;
    paymentMethod: string;
    paymentStatus: string;
    estimatedDate?: string;
    notes?: string;
    footerText?: string;
    paperSize?: '58mm' | '80mm';
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isNativePlatform()) {
      return { success: false, error: 'Fitur ini hanya tersedia di aplikasi Android' };
    }

    if (!this.connectedDevice) {
      // Try to auto-connect
      const connectResult = await this.connect();
      if (!connectResult.success) {
        return { success: false, error: 'Printer tidak terhubung. ' + (connectResult.error || '') };
      }
    }

    const paperWidth = receiptData.paperSize === '80mm' ? 48 : 32;
    const separator = '='.repeat(paperWidth);
    const dashLine = '-'.repeat(paperWidth);

    const formatCurrency = (amount: number) => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    try {
      const plugin = await getBluetoothPrinterPlugin();
      if (!plugin) {
        return { success: false, error: 'Plugin Bluetooth tidak tersedia' };
      }

      const commands: number[][] = [];

      // Initialize printer
      commands.push(COMMANDS.INIT);

      // Header - Business Name (centered, bold, double size)
      commands.push(COMMANDS.ALIGN_CENTER);
      commands.push(COMMANDS.BOLD_ON);
      commands.push(COMMANDS.DOUBLE_SIZE);
      commands.push(this.textToBytes(receiptData.laundryName.toUpperCase()));
      commands.push([LF]);
      commands.push(COMMANDS.NORMAL_SIZE);
      commands.push(COMMANDS.BOLD_OFF);

      // Address and Phone
      if (receiptData.address) {
        commands.push(this.textToBytes(receiptData.address));
        commands.push([LF]);
      }
      if (receiptData.phone) {
        commands.push(this.textToBytes(`Telp: ${receiptData.phone}`));
        commands.push([LF]);
      }

      commands.push(this.textToBytes(separator));
      commands.push([LF]);

      // Invoice Info
      commands.push(COMMANDS.ALIGN_LEFT);
      commands.push(this.textToBytes(`No.Invoice: ${receiptData.invoiceNumber}`));
      commands.push([LF]);
      commands.push(this.textToBytes(`Tanggal  : ${receiptData.date}`));
      commands.push([LF]);
      commands.push(this.textToBytes(`Customer : ${receiptData.customerName}`));
      commands.push([LF]);
      if (receiptData.customerPhone) {
        commands.push(this.textToBytes(`Telp     : ${receiptData.customerPhone}`));
        commands.push([LF]);
      }

      commands.push(this.textToBytes(dashLine));
      commands.push([LF]);

      // Items
      for (const item of receiptData.items) {
        commands.push(this.textToBytes(item.name));
        commands.push([LF]);
        const itemLine = `  ${item.qty} x ${formatCurrency(item.price)}`;
        const subtotalStr = formatCurrency(item.subtotal);
        const spacer = ' '.repeat(Math.max(1, paperWidth - itemLine.length - subtotalStr.length));
        commands.push(this.textToBytes(itemLine + spacer + subtotalStr));
        commands.push([LF]);
      }

      commands.push(this.textToBytes(dashLine));
      commands.push([LF]);

      // Totals
      commands.push(COMMANDS.BOLD_ON);
      const totalLabel = 'TOTAL';
      const totalValue = formatCurrency(receiptData.totalAmount);
      const totalSpacer = ' '.repeat(Math.max(1, paperWidth - totalLabel.length - totalValue.length));
      commands.push(this.textToBytes(totalLabel + totalSpacer + totalValue));
      commands.push([LF]);
      commands.push(COMMANDS.BOLD_OFF);

      const paidLabel = `Bayar (${receiptData.paymentMethod})`;
      const paidValue = formatCurrency(receiptData.paidAmount);
      const paidSpacer = ' '.repeat(Math.max(1, paperWidth - paidLabel.length - paidValue.length));
      commands.push(this.textToBytes(paidLabel + paidSpacer + paidValue));
      commands.push([LF]);

      if (receiptData.cashReceived && receiptData.changeAmount) {
        const cashLabel = 'Tunai';
        const cashValue = formatCurrency(receiptData.cashReceived);
        const cashSpacer = ' '.repeat(Math.max(1, paperWidth - cashLabel.length - cashValue.length));
        commands.push(this.textToBytes(cashLabel + cashSpacer + cashValue));
        commands.push([LF]);

        commands.push(COMMANDS.BOLD_ON);
        const changeLabel = 'KEMBALIAN';
        const changeValue = formatCurrency(receiptData.changeAmount);
        const changeSpacer = ' '.repeat(Math.max(1, paperWidth - changeLabel.length - changeValue.length));
        commands.push(this.textToBytes(changeLabel + changeSpacer + changeValue));
        commands.push([LF]);
        commands.push(COMMANDS.BOLD_OFF);
      }

      const remaining = receiptData.totalAmount - receiptData.paidAmount;
      if (remaining > 0) {
        commands.push(COMMANDS.BOLD_ON);
        const remainLabel = 'SISA';
        const remainValue = formatCurrency(remaining);
        const remainSpacer = ' '.repeat(Math.max(1, paperWidth - remainLabel.length - remainValue.length));
        commands.push(this.textToBytes(remainLabel + remainSpacer + remainValue));
        commands.push([LF]);
        commands.push(COMMANDS.BOLD_OFF);
      }

      commands.push(this.textToBytes(dashLine));
      commands.push([LF]);

      // Status
      const statusLabel = 'Status Bayar';
      const statusValue = receiptData.paymentStatus.toUpperCase();
      const statusSpacer = ' '.repeat(Math.max(1, paperWidth - statusLabel.length - statusValue.length));
      commands.push(this.textToBytes(statusLabel + statusSpacer + statusValue));
      commands.push([LF]);

      if (receiptData.estimatedDate) {
        const estLabel = 'Est. Selesai';
        const estValue = receiptData.estimatedDate;
        const estSpacer = ' '.repeat(Math.max(1, paperWidth - estLabel.length - estValue.length));
        commands.push(this.textToBytes(estLabel + estSpacer + estValue));
        commands.push([LF]);
      }

      // Notes
      if (receiptData.notes) {
        commands.push([LF]);
        commands.push(this.textToBytes(`Catatan: ${receiptData.notes}`));
        commands.push([LF]);
      }

      commands.push(this.textToBytes(separator));
      commands.push([LF]);

      // Footer
      commands.push(COMMANDS.ALIGN_CENTER);
      if (receiptData.footerText) {
        commands.push(COMMANDS.BOLD_ON);
        commands.push(this.textToBytes(receiptData.footerText));
        commands.push([LF]);
        commands.push(COMMANDS.BOLD_OFF);
      }
      commands.push(this.textToBytes('Simpan struk ini sebagai'));
      commands.push([LF]);
      commands.push(this.textToBytes('bukti pengambilan'));
      commands.push([LF, LF]);
      commands.push(this.textToBytes('* * * * *'));
      commands.push([LF]);

      // Feed and cut
      commands.push(COMMANDS.FEED_LINES(4));
      commands.push(COMMANDS.PARTIAL_CUT);

      // Build data and print
      const printData = this.buildPrintData(commands);
      await plugin.print({ data: printData });

      return { success: true };
    } catch (error: any) {
      console.error('Print error:', error);
      // If connection lost, reset
      if (error.message?.includes('connect') || error.message?.includes('socket')) {
        this.connectedDevice = null;
      }
      return { success: false, error: error.message || 'Gagal mencetak' };
    }
  }

  // Print test page
  async printTestPage(): Promise<{ success: boolean; error?: string }> {
    if (!this.isNativePlatform()) {
      return { success: false, error: 'Fitur ini hanya tersedia di aplikasi Android' };
    }

    if (!this.connectedDevice) {
      const connectResult = await this.connect();
      if (!connectResult.success) {
        return { success: false, error: 'Printer tidak terhubung' };
      }
    }

    try {
      const plugin = await getBluetoothPrinterPlugin();
      if (!plugin) {
        return { success: false, error: 'Plugin Bluetooth tidak tersedia' };
      }

      const commands: number[][] = [];

      commands.push(COMMANDS.INIT);
      commands.push(COMMANDS.ALIGN_CENTER);
      commands.push(COMMANDS.BOLD_ON);
      commands.push(COMMANDS.DOUBLE_SIZE);
      commands.push(this.textToBytes('TEST PRINT'));
      commands.push([LF]);
      commands.push(COMMANDS.NORMAL_SIZE);
      commands.push(COMMANDS.BOLD_OFF);
      commands.push(this.textToBytes('================================'));
      commands.push([LF]);
      commands.push(this.textToBytes('Printer berhasil terhubung!'));
      commands.push([LF]);
      commands.push(this.textToBytes('Sistem Kasir Laundry'));
      commands.push([LF]);
      commands.push(this.textToBytes('================================'));
      commands.push([LF, LF]);
      commands.push(COMMANDS.FEED_LINES(3));
      commands.push(COMMANDS.PARTIAL_CUT);

      const printData = this.buildPrintData(commands);
      await plugin.print({ data: printData });

      return { success: true };
    } catch (error: any) {
      console.error('Test print error:', error);
      return { success: false, error: error.message || 'Gagal mencetak test' };
    }
  }
}

export const capacitorBluetoothPrinter = new CapacitorBluetoothPrinterService();
