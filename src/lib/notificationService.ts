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
  private nativeListenersRegistered: boolean = false;

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
      // Remove any existing listeners first to prevent duplicates
      if (this.nativeListenersRegistered) {
        await PushNotifications.removeAllListeners();
        this.nativeListenersRegistered = false;
      }

      // Set up listeners BEFORE requesting permissions
      this.setupNativeListeners();

      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();
      console.log('Current push permission status:', permStatus);

      // Request permissions if not granted
      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        console.log('Requesting push notification permissions...');
        permStatus = await PushNotifications.requestPermissions();
        console.log('Permission request result:', permStatus);
      }

      // Only proceed if permission is granted
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted:', permStatus.receive);
        // Update settings to reflect that push is not enabled
        if (this.userId) {
          await supabase
            .from('notification_settings')
            .update({ push_notifications_enabled: false })
            .eq('user_id', this.userId);
        }
        return;
      }

      // Register for push notifications with timeout
      console.log('Registering for push notifications...');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Native push registration timed out')), 10000)
      );

      await Promise.race([
        PushNotifications.register(),
        timeoutPromise
      ]);

      console.log('Push notification registration initiated successfully');
    } catch (error) {
      console.error('Native push initialization error:', error);
      // Don't throw, just log - we want the app to continue working
      if (this.userId) {
        await supabase
          .from('notification_settings')
          .update({ push_notifications_enabled: false })
          .eq('user_id', this.userId);
      }
    }
  }

  private setupNativeListeners() {
    if (this.nativeListenersRegistered) {
      console.log('Native listeners already registered');
      return;
    }

    console.log('Setting up native push listeners...');

    // Registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('✅ Native push token received:', token.value);

      try {
        if (token.value !== this.settings?.fcm_token && this.userId) {
          const { error } = await supabase
            .from('notification_settings')
            .update({ fcm_token: token.value })
            .eq('user_id', this.userId);

          if (error) {
            console.error('Failed to save FCM token:', error);
          } else {
            console.log('FCM token saved successfully');
            if (this.settings) {
              this.settings.fcm_token = token.value;
            }
          }
        }
      } catch (error) {
        console.error('Error saving FCM token:', error);
      }
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    // Push notification received (foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📬 Push notification received:', notification);

      try {
        const title = notification.title || 'CoParenting App';
        const body = notification.body || '';
        const url = notification.data?.url || '/';

        // Only show if browser notifications are also enabled
        if (this.settings?.browser_notifications_enabled) {
          this.showNotification(title, body, url);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    });

    // Push notification tapped (background)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Push notification action performed:', notification);

      try {
        const url = notification.notification.data?.url || '/';
        if (window.location.pathname !== url) {
          window.location.href = url;
        }
      } catch (error) {
        console.error('Error handling notification action:', error);
      }
    });

    this.nativeListenersRegistered = true;
    console.log('Native listeners registered successfully');
  }

  private async initializeWebPush() {
    try {
      const token = await requestFCMToken();

      if (token && token !== this.settings?.fcm_token && this.userId) {
        await supabase
          .from('notification_settings')
          .update({ fcm_token: token })
          .eq('user_id', this.userId);

        if (this.settings) {
          this.settings.fcm_token = token;
        }
      }

      // Clean up old listener
      if (this.foregroundUnsubscribe) {
        this.foregroundUnsubscribe();
        this.foregroundUnsubscribe = null;
      }

      this.foregroundUnsubscribe = await onForegroundMessage((payload) => {
        console.log('Foreground message received:', payload);

        const title = payload.notification?.title || 'CoParenting App';
        const body = payload.notification?.body || '';
        const url = payload.data?.url || '/';

        this.showNotification(title, body, url);
      });
    } catch (error) {
      console.error('Web push initialization error:', error);
    }
  }

  private async loadSettings() {
    if (!this.userId) return;

    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();

    this.settings = data;
  }

  async updateSettings(updates: Partial<NotificationSettings>) {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('user_id', this.userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating settings:', error);
        return { data: null, error };
      }

      if (data) {
        this.settings = data;

        // Handle push notifications enable/disable
        if ('push_notifications_enabled' in updates) {
          if (data.push_notifications_enabled) {
            await this.initializeFCM();
          } else {
            // Disable push notifications
            if (isNative() && this.nativeListenersRegistered) {
              try {
                await PushNotifications.removeAllListeners();
                this.nativeListenersRegistered = false;
                console.log('Push notifications disabled');
              } catch (error) {
                console.error('Error disabling push notifications:', error);
              }
            } else if (this.foregroundUnsubscribe) {
              this.foregroundUnsubscribe();
              this.foregroundUnsubscribe = null;
            }
          }
        }

        // Handle browser notifications enable/disable
        if ('browser_notifications_enabled' in updates) {
          if (data.browser_notifications_enabled) {
            await this.requestNotificationPermission();
            this.setupRealtimeSubscriptions();
          } else {
            this.cleanupRealtimeSubscriptions();
          }
        }

        // Refresh realtime subscriptions if specific notification types changed
        if (
          'requests_enabled' in updates ||
          'events_enabled' in updates ||
          'logs_enabled' in updates
        ) {
          if (data.browser_notifications_enabled) {
            this.setupRealtimeSubscriptions();
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Exception updating settings:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  getSettings(): NotificationSettings | null {
    return this.settings;
  }

  private async requestNotificationPermission(): Promise<boolean> {
    // Native apps handle this through PushNotifications API
    if (isNative()) {
      return true;
    }

    // Web notification permission
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  }

  private setupRealtimeSubscriptions() {
    this.cleanupRealtimeSubscriptions();

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
    // On native, don't show browser notifications (handled by OS)
    if (isNative()) {
      return;
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `coparenting-${Date.now()}`,
      });

      notification.onclick = () => {
        window.focus();
        if (window.location.pathname !== path) {
          window.location.href = path;
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  private cleanupRealtimeSubscriptions() {
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.subscriptions = [];
  }

  cleanup() {
    console.log('Cleaning up notification service...');

    this.cleanupRealtimeSubscriptions();

    if (this.foregroundUnsubscribe) {
      try {
        this.foregroundUnsubscribe();
        this.foregroundUnsubscribe = null;
      } catch (error) {
        console.error('Error cleaning up foreground subscription:', error);
      }
    }

    if (isNative() && this.nativeListenersRegistered) {
      try {
        PushNotifications.removeAllListeners();
        this.nativeListenersRegistered = false;
        console.log('Native push listeners removed');
      } catch (error) {
        console.error('Error removing native listeners:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();
