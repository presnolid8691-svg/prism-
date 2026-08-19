import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.prism.app',
  appName: 'Prism',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
  },
}

export default config