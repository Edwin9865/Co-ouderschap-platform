import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { notificationService } from '../../lib/notificationService';
import { NotificationSettings } from '../../lib/types';
import { Bell, AlertCircle } from 'lucide-react';

export function Meldingen() {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotificationSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setNotificationSettings(data);
    }
  };

  useEffect(() => {
    fetchNotificationSettings();
  }, [user]);

  const handleNotificationToggle = async (
    setting: keyof NotificationSettings,
    value: boolean
  ) => {
    if (!user || !notificationSettings) return;

    setNotificationsLoading(true);
    setError('');

    try {
      const updates = { [setting]: value };
      const { data, error } = await notificationService.updateSettings(updates);

      if (error) throw error;

      if (data) {
        setNotificationSettings(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken instellingen');
    } finally {
      setNotificationsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meldingen</h1>
        <p className="text-gray-600">Beheer je notificatie voorkeuren</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificatie instellingen
          </h2>

          {notificationSettings ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Browser meldingen</p>
                  <p className="text-sm text-gray-600">
                    Schakel pushmeldingen in of uit voor alle meldingen
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.browser_notifications_enabled}
                    onChange={(e) =>
                      handleNotificationToggle('browser_notifications_enabled', e.target.checked)
                    }
                    disabled={notificationsLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              {notificationSettings.browser_notifications_enabled && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Verzoeken</p>
                      <p className="text-sm text-gray-600">
                        Meldingen bij nieuwe verzoeken en statuswijzigingen
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.requests_enabled}
                        onChange={(e) =>
                          handleNotificationToggle('requests_enabled', e.target.checked)
                        }
                        disabled={notificationsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Agenda items</p>
                      <p className="text-sm text-gray-600">
                        Meldingen bij nieuwe of gewijzigde agenda items
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.events_enabled}
                        onChange={(e) =>
                          handleNotificationToggle('events_enabled', e.target.checked)
                        }
                        disabled={notificationsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Logboek items</p>
                      <p className="text-sm text-gray-600">
                        Meldingen bij nieuwe logboek items
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.logs_enabled}
                        onChange={(e) =>
                          handleNotificationToggle('logs_enabled', e.target.checked)
                        }
                        disabled={notificationsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Abonnement</p>
                      <p className="text-sm text-gray-600">
                        Melding als co-ouder een abonnement activeert
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.subscription_notifications_enabled}
                        onChange={(e) =>
                          handleNotificationToggle('subscription_notifications_enabled', e.target.checked)
                        }
                        disabled={notificationsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Hulpverleners</p>
                      <p className="text-sm text-gray-600">
                        Meldingen bij hulpverlener gekoppeld, verzoeken en berichten
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.helper_notifications_enabled}
                        onChange={(e) =>
                          handleNotificationToggle('helper_notifications_enabled', e.target.checked)
                        }
                        disabled={notificationsLoading}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Push meldingen</p>
                    <p className="text-sm text-gray-600">
                      Ontvang meldingen zelfs als je browser gesloten is
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push_notifications_enabled}
                      onChange={(e) =>
                        handleNotificationToggle('push_notifications_enabled', e.target.checked)
                      }
                      disabled={notificationsLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Let op:</strong> Je browser kan om toestemming vragen om meldingen te
                  tonen. Als je meldingen inschakelt maar deze niet ontvangt, controleer dan je
                  browserinstellingen.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Bezig met laden van meldingsinstellingen...</p>
          )}
        </div>
      </div>
    </div>
  );
}
