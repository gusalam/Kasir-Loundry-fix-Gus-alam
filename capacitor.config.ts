import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.58dffe3cdb5d46ce974aba562bbc0a92',
  appName: 'Kasir Laundry',
  webDir: 'dist',
  server: {
    url: 'https://58dffe3c-db5d-46ce-974a-ba562bbc0a92.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0d9488',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0d9488',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
