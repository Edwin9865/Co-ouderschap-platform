import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: any = null;
let messaging: any = null;
let initializationPromise: Promise<{ app: any; messaging: any }> | null = null;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

export const initializeFirebase = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      if (!app) {
        app = initializeApp(firebaseConfig);
      }

      const supported = await withTimeout(
        isSupported(),
        5000,
        'Firebase messaging support check timed out'
      );

      if (supported && !messaging) {
        messaging = getMessaging(app);
      }

      return { app, messaging };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return { app: null, messaging: null };
    }
  })();

  return initializationPromise;
};

export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const { messaging } = await withTimeout(
      initializeFirebase(),
      10000,
      'Firebase initialization timed out while requesting FCM token'
    );

    if (!messaging) {
      console.log('FCM not supported in this browser');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const permission = await withTimeout(
      Notification.requestPermission(),
      5000,
      'Notification permission request timed out'
    );

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const registration = await withTimeout(
      navigator.serviceWorker.register('/firebase-messaging-sw.js'),
      8000,
      'Service worker registration timed out'
    );

    const token = await withTimeout(
      getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      }),
      10000,
      'FCM token request timed out'
    );

    console.log('FCM token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
  try {
    const { messaging } = await withTimeout(
      initializeFirebase(),
      8000,
      'Firebase initialization timed out while setting up foreground listener'
    );

    if (!messaging) {
      return () => {};
    }

    return onMessage(messaging, callback);
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
};
