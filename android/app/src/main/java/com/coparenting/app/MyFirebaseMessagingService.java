package com.coparenting.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Firebase Cloud Messaging Service
 *
 * This service handles incoming FCM messages and displays notifications
 * when the app is in the background or foreground.
 *
 * Note: Capacitor's PushNotifications plugin also handles FCM messages,
 * so this service acts as a fallback/enhancement for better control.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String DEFAULT_CHANNEL_ID = "fcm_default_channel";

    /**
     * Called when a new FCM message is received
     * This method is called whether the app is in foreground or background
     *
     * @param remoteMessage The FCM message received from Firebase
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());

            // Handle data payload here if needed
            // Data messages are always delivered to onMessageReceived
        }

        // Check if message contains a notification payload
        if (remoteMessage.getNotification() != null) {
            RemoteMessage.Notification notification = remoteMessage.getNotification();

            String title = notification.getTitle();
            String body = notification.getBody();

            Log.d(TAG, "Message notification - Title: " + title + ", Body: " + body);

            // Display the notification
            // Note: When app is in background, Firebase automatically displays notifications
            // But when in foreground, we need to manually display them
            showNotification(title, body, remoteMessage.getData());
        }
    }

    /**
     * Called when a new FCM token is generated
     * This happens on app install and when the token is refreshed
     *
     * @param token The new FCM registration token
     */
    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);

        Log.d(TAG, "New FCM token generated: " + token);

        // Note: Capacitor's PushNotifications plugin handles token registration
        // This method is here for logging and any additional token handling if needed

        // If you need to send token to your backend server, do it here
        // sendTokenToServer(token);
    }

    /**
     * Displays a notification with the given title and message
     * Creates a notification channel for Android O and above
     *
     * @param title The notification title
     * @param message The notification message body
     * @param data Additional data from the FCM message
     */
    private void showNotification(String title, String message, java.util.Map<String, String> data) {
        // Get notification manager
        NotificationManager notificationManager =
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        if (notificationManager == null) {
            Log.e(TAG, "NotificationManager is null");
            return;
        }

        // Create notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = notificationManager.getNotificationChannel(DEFAULT_CHANNEL_ID);

            if (channel == null) {
                // Channel doesn't exist, create it
                CharSequence channelName = getString(R.string.default_notification_channel_name);
                String channelDescription = getString(R.string.default_notification_channel_description);
                int importance = NotificationManager.IMPORTANCE_DEFAULT;

                channel = new NotificationChannel(DEFAULT_CHANNEL_ID, channelName, importance);
                channel.setDescription(channelDescription);
                channel.enableVibration(true);
                channel.enableLights(true);

                notificationManager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel created: " + DEFAULT_CHANNEL_ID);
            }
        }

        // Create intent to open app when notification is tapped
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        // Add any custom data to the intent
        if (data != null && !data.isEmpty()) {
            for (java.util.Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }

        // Create pending intent with immutable flag for Android 12+
        int flags = PendingIntent.FLAG_ONE_SHOT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            flags
        );

        // Build the notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, DEFAULT_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher) // Use app icon
            .setContentTitle(title != null ? title : getString(R.string.app_name))
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message)) // Show full message
            .setAutoCancel(true) // Dismiss notification when tapped
            .setPriority(NotificationCompat.PRIORITY_DEFAULT) // For Android 7.1 and lower
            .setContentIntent(pendingIntent)
            .setColor(getResources().getColor(android.R.color.white)); // Notification color

        // Show the notification with a unique ID
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, builder.build());

        Log.d(TAG, "Notification displayed with ID: " + notificationId);
    }

    /**
     * Called when messages are deleted on the server
     * This may occur when too many messages are queued
     */
    @Override
    public void onDeletedMessages() {
        super.onDeletedMessages();
        Log.w(TAG, "Messages were deleted on the server");
    }

    /**
     * Called when a message is sent upstream and fails
     *
     * @param msgId The message ID
     * @param exception The exception that occurred
     */
    @Override
    public void onMessageSent(String msgId) {
        super.onMessageSent(msgId);
        Log.d(TAG, "Message sent successfully: " + msgId);
    }

    /**
     * Called when a message couldn't be sent
     *
     * @param msgId The message ID
     * @param exception The exception that occurred
     */
    @Override
    public void onSendError(String msgId, Exception exception) {
        super.onSendError(msgId, exception);
        Log.e(TAG, "Failed to send message: " + msgId, exception);
    }
}
