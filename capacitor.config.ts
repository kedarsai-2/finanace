import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qobox.app',
  appName: 'QOBOX',
  webDir: 'dist/client',
  server: {
    // Force all native API calls through the production backend.
    // This takes precedence over any VITE_API_BASE_URL env var baked into the bundle.
    androidScheme: 'https',
  },
};

export default config;
