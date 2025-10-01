import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.masushi.app',
  appName: 'Masushi',
  webDir: 'out',
  server: {
    url: 'https://www.masushi.cl',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
