import { supabase } from './supabase';
import type { NotificationSettings, Request, Event, LogEntry } from './types';
import { requestFCMToken, onForegroundMessage } from './firebase';
import { isNative, isWeb } from './capacitor';
import { PushNotifications } from '@capacitor/push-notifications';

export class NotificationService {
  private settings: NotificationSettings | null = null;
  private userId: string | null = null;
  private familyId: string | null = null;
  private subscriptions: (() => void)[] = [];
  private foregroundUnsubscribe: (() => void) | null = null;
  private initializationInProgress: boolean = false;

  async initialize(userId: string, familyId: string) {
    if (this.initializationInProgress) {
      console.log('Notification service initialization already in progress');
      return;
    }

    this.initializationInProgress = true;
    this.userId = userId;
    this.familyId = familyId;

    try {
      await this.loadSettings();

      if (this.settings?.push_notifications_enabled) {
        this.initializeFCM().catch(error => {
          console.error('Non-blocking FCM initialization failed:', error);
        });
      }

      if (this.settings?.browser_notifications_enabled) {
        this.requestNotificationPermission().catch(error => {
          console.error('Non-blocking notification permission request failed:', error);
        });
        this.setupRealtimeSubscriptions();
      }
    } catch (error) {
      console.error('Error during notification service initialization:', error);
    } finally {
      this.initializationInProgress = false;
    }
  }

  private async initializeFCM() {
    try {
      if (isNative()) {
        await this.initializeNativePush();
      } else {
        await this.initializeWebPush();
      }
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  private async initializeNativePush() {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Native push initialization timed out')), 15000)
      );

      await Promise.race([
        (async () => {
          let permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== 'granted') {
            console.log('Push notification permission denied');
            return;
          }

          await PushNotifications.register();
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Native push initialization error:', error);
      throw error;
    }

    PushNotifications.addListener('registration', async (token) => {
      console.log('Native push token:', token.value);

      if (token.value !== this.settings?.fcm_token) {
        await supabase
          .from('notification_settings')
          .update({ fcm_token: token.value })
          .eq('user_id', this.userId!);

        if (this.settings) {
          this.settings.fcm_token = token.value;
        }
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);

      const title = notification.title || 'Co-oudering App';
      const body = notification.body || '';
      const url = notification.data?.url || '/';

      this.showNotification(title, body, url);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action:', notification);

      const url = notification.notification.data?.url || '/';
      window.location.href = url;
    });
  }

  private async initializeWebPush() {
    const token = await requestFCMToken();

    if (token && token !== this.settings?.fcm_token) {
      await supabase
        .from('notification_settings')
        .update({ fcm_token: token })
        .eq('user_id', this.userId!);

      if (this.settings) {
        this.settings.fcm_token = token;
      }
    }

    this.foregroundUnsubscribe = await onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);

      const title = payload.notification?.title || 'Co-oudering App';
      const body = payload.notification?.body || '';
      const url = payload.data?.url || '/';

      this.showNotification(title, body, url);
    });
  }

  private async loadSettings() {
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', this.userId!)
      .maybeSingle();

    this.settings = data;
  }

  async updateSettings(updates: Partial<NotificationSettings>) {
    if (!this.userId) return;

    const { data, error } = await supabase
      .from('notification_settings')
      .update(updates)
      .eq('user_id', this.userId)
      .select()
      .maybeSingle();

    if (!error && data) {
      this.settings = data;

      if (data.push_notifications_enabled) {
        await this.initializeFCM();
      } else if (this.foregroundUnsubscribe) {
        this.foregroundUnsubscribe();
        this.foregroundUnsubscribe = null;
      }

      if (data.browser_notifications_enabled) {
        await this.requestNotificationPermission();
        this.setupRealtimeSubscriptions();
      } else {
        this.cleanup();
      }
    }

    return { data, error };
  }

  getSettings(): NotificationSettings | null {
    return this.settings;
  }

  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  private setupRealtimeSubscriptions() {
    this.cleanup();

    if (!this.familyId || !this.settings?.browser_notifications_enabled) {
      return;
    }

    if (this.settings.requests_enabled) {
      const requestsChannel = supabase
        .channel('requests-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'requests',
            filter: `family_id=eq.${this.familyId}`,
          },
          (payload) => {
            const request = payload.new as Request;
            if (request.created_by !== this.userId) {
              this.showNotification(
                'Nieuw Verzoek',
                `${request.title}`,
                '/verzoeken'
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'requests',
            filter: `family_id=eq.${this.familyId}`,
          },
          (payload) => {
            const request = payload.new as Request;
            const oldRequest = payload.old as Request;

            if (request.last_action_by !== this.userId && request.status !== oldRequest.status) {
              let message = '';
              if (request.status === 'ACCEPTED') {
                message = 'Je verzoek is geaccepteerd';
              } else if (request.status === 'DECLINED') {
                message = 'Je verzoek is afgewezen';
              } else if (request.status === 'COUNTERED') {
                message = 'Er is een tegenvoorstel gedaan';
              }

              if (message) {
                this.showNotification(
                  request.title,
                  message,
                  '/verzoeken'
                );
              }
            }
          }
        )
        .subscribe();

      this.subscriptions.push(() => requestsChannel.unsubscribe());
    }

    if (this.settings.events_enabled) {
      const eventsChannel = supabase
        .channel('events-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
            filter: `family_id=eq.${this.familyId}`,
          },
          (payload) => {
            const event = payload.new as Event;
            if (event.created_by !== this.userId) {
              const date = new Date(event.start_at).toLocaleDateString('nl-NL');
              this.showNotification(
                'Nieuwe Agenda Item',
                `${event.title} - ${date}`,
                '/agenda'
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'events',
            filter: `family_id=eq.${this.familyId}`,
          },
          (payload) => {
            const event = payload.new as Event;
            const oldEvent = payload.old as Event;

            if (event.start_at !== oldEvent.start_at || event.title !== oldEvent.title) {
              const date = new Date(event.start_at).toLocaleDateString('nl-NL');
              this.showNotification(
                'Agenda Item Gewijzigd',
                `${event.title} - ${date}`,
                '/agenda'
              );
            }
          }
        )
        .subscribe();

      this.subscriptions.push(() => eventsChannel.unsubscribe());
    }

    if (this.settings.logs_enabled) {
      const logsChannel = supabase
        .channel('logs-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'log_entries',
            filter: `family_id=eq.${this.familyId}`,
          },
          (payload) => {
            const log = payload.new as LogEntry;
            if (log.created_by !== this.userId) {
              this.showNotification(
                'Nieuw Logboek Item',
                log.title,
                '/logboek'
              );
            }
          }
        )
        .subscribe();

      this.subscriptions.push(() => logsChannel.unsubscribe());
    }
  }

  private showNotification(title: string, body: string, path: string) {
    if (Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `coparenting-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = path;
      notification.close();
    };
  }

  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];

    if (this.foregroundUnsubscribe) {
      this.foregroundUnsubscribe();
      this.foregroundUnsubscribe = null;
    }

    if (isNative()) {
      PushNotifications.removeAllListeners();
    }
  }
}

export const notificationService = new NotificationService();
