// Bluetooth Thermal Printer Service using ESC/POS commands
// Supports 58mm and 80mm thermal printers

// Web Bluetooth API types (for TypeScript compatibility)
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: any): Promise<any>;
    };
  }
}

interface PrinterDevice {
  device: any;
  characteristic: any | null;
}

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const COMMANDS = {
  INIT: [ESC, 0x40], // Initialize printer
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

// Common Bluetooth printer service UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some ESC/POS printers
  '0000ff00-0000-1000-8000-00805f9b34fb', // Alternative
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Some Chinese printers
];

const PRINTER_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];

class BluetoothPrinterService {
  private connectedDevice: PrinterDevice | null = null;
  private isConnecting = false;

  // Check if Web Bluetooth is supported
  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Get connected device name
  getConnectedDeviceName(): string | null {
    return this.connectedDevice?.device.name || null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connectedDevice?.device.gatt?.connected || false;
  }

  // Connect to a Bluetooth printer
  async connect(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Bluetooth tidak didukung di browser ini' };
    }

    if (this.isConnecting) {
      return { success: false, error: 'Sedang menghubungkan...' };
    }

    try {
      this.isConnecting = true;

      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      if (!device.gatt) {
        return { success: false, error: 'Perangkat tidak mendukung GATT' };
      }

      // Connect to GATT server
      const server = await device.gatt.connect();

      // Try to find the printer service and characteristic
      let characteristic: any | null = null;

      for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          
          for (const charUuid of PRINTER_CHARACTERISTIC_UUIDS) {
            try {
              characteristic = await service.getCharacteristic(charUuid);
              if (characteristic) break;
            } catch {
              continue;
            }
          }
          
          if (characteristic) break;
        } catch {
          continue;
        }
      }

      // If no known characteristic found, try to find any writable characteristic
      if (!characteristic) {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const chars = await service.getCharacteristics();
            for (const char of chars) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                characteristic = char;
                break;
              }
            }
            if (characteristic) break;
          } catch {
            continue;
          }
        }
      }

      this.connectedDevice = { device, characteristic };

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        this.connectedDevice = null;
      });

      return { success: true, deviceName: device.name || 'Printer' };
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        return { success: false, error: 'Tidak ada printer yang dipilih' };
      }
      return { success: false, error: error.message || 'Gagal menghubungkan ke printer' };
    } finally {
      this.isConnecting = false;
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    if (this.connectedDevice?.device.gatt?.connected) {
      this.connectedDevice.device.gatt.disconnect();
    }
    this.connectedDevice = null;
  }

  // Send data to printer
  private async sendData(data: Uint8Array): Promise<boolean> {
    if (!this.connectedDevice?.characteristic) {
      // Try direct write if no characteristic
      if (!this.connectedDevice?.device.gatt?.connected) {
        return false;
      }
      return false;
    }

    try {
      // Send in chunks (most printers have MTU limit around 512 bytes)
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (this.connectedDevice.characteristic.properties.writeWithoutResponse) {
          await this.connectedDevice.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.connectedDevice.characteristic.writeValue(chunk);
        }
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return true;
    } catch (error) {
      console.error('Error sending data to printer:', error);
      return false;
    }
  }

  // Text encoder
  private textToBytes(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  // Build print command
  private buildCommand(...parts: (number[] | Uint8Array)[]): Uint8Array {
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      if (Array.isArray(part)) {
        result.set(new Uint8Array(part), offset);
        offset += part.length;
      } else {
        result.set(part, offset);
        offset += part.length;
      }
    }
    return result;
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
    if (!this.isConnected()) {
      return { success: false, error: 'Printer tidak terhubung' };
    }

    const paperWidth = receiptData.paperSize === '80mm' ? 48 : 32; // Characters per line
    const separator = '='.repeat(paperWidth);
    const dashLine = '-'.repeat(paperWidth);

    const formatCurrency = (amount: number) => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const padRight = (text: string, width: number) => {
      return text.substring(0, width).padEnd(width);
    };

    const padLeft = (text: string, width: number) => {
      return text.substring(0, width).padStart(width);
    };

    const centerText = (text: string, width: number) => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    try {
      const commands: (number[] | Uint8Array)[] = [];

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

      // Build and send
      const data = this.buildCommand(...commands);
      const success = await this.sendData(data);

      return { success, error: success ? undefined : 'Gagal mengirim ke printer' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mencetak' };
    }
  }

  // Print test page
  async printTestPage(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConnected()) {
      return { success: false, error: 'Printer tidak terhubung' };
    }

    try {
      const commands: (number[] | Uint8Array)[] = [];

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

      const data = this.buildCommand(...commands);
      const success = await this.sendData(data);

      return { success, error: success ? undefined : 'Gagal mengirim ke printer' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal mencetak test' };
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
export type { PrinterDevice };
