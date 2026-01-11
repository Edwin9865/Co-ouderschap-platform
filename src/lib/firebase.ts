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

let app;
let messaging;

export const initializeFirebase = async () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }

  const supported = await isSupported();
  if (supported && !messaging) {
    messaging = getMessaging(app);
  }

  return { app, messaging };
};

export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const { messaging } = await initializeFirebase();

    if (!messaging) {
      console.log('FCM not supported in this browser');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    console.log('FCM token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
  try {
    const { messaging } = await initializeFirebase();

    if (!messaging) {
      return () => {};
    }

    return onMessage(messaging, callback);
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
};
