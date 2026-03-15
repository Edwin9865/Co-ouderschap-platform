import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.coouderschap.app',
  appName: 'CoParenting',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
