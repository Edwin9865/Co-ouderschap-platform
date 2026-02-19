# Firebase Cloud Messaging (FCM) Testing Guide

## Overview
This guide provides step-by-step instructions for testing FCM push notifications in your CoParenting Android app.

---

## ✅ Implementation Checklist

The following components have been implemented:

### 1. **AndroidManifest.xml** ✅
- ✅ Added `INTERNET` permission
- ✅ Added `WAKE_LOCK` permission
- ✅ Added `POST_NOTIFICATIONS` permission (Android 13+)
- ✅ Added `com.google.android.c2dm.permission.RECEIVE` permission
- ✅ Declared `MyFirebaseMessagingService`
- ✅ Added FCM metadata (icon, color, channel ID)

### 2. **MyFirebaseMessagingService.java** ✅
- ✅ Extends `FirebaseMessagingService`
- ✅ Overrides `onMessageReceived()` for incoming messages
- ✅ Overrides `onNewToken()` for token refresh
- ✅ Implements notification display with proper channel setup
- ✅ Handles both foreground and background notifications
- ✅ Includes comprehensive error handling and logging

### 3. **strings.xml** ✅
- ✅ Added notification channel ID
- ✅ Added user-friendly channel name (Dutch: "Algemene Meldingen")
- ✅ Added channel description

---

## 🔨 Build & Deploy

### Option 1: Using Build Script (Recommended)
```bash
# Run the automated build script
rebuild-android.cmd
```

### Option 2: Manual Build
```bash
# Step 1: Build web assets
npm run build

# Step 2: Sync with Capacitor
npx cap sync android

# Step 3: Clean Android build
cd android
gradlew clean

# Step 4: Build APK
gradlew assembleDebug

# Step 5: Go back to root
cd ..
```

### Option 3: Android Studio
1. Open `android/` folder in Android Studio
2. Click **Build → Clean Project**
3. Click **Build → Rebuild Project**
4. Click **Run → Run 'app'**

---

## 📱 Testing Procedure

### Step 1: Install the App
```bash
# Install APK to connected device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Or run from Android Studio
```

### Step 2: Open Logcat
Open a terminal and run:
```bash
adb logcat -s FirebaseMessaging FCMService PushNotifications
```

**Expected output on app start:**
```
FirebaseMessaging: Token retrieved successfully
FCMService: New FCM token generated: [TOKEN]
PushNotifications: Registration success
```

### Step 3: Get Your FCM Token
The token will be displayed in logcat or in your app logs:
```
✅ Native push token received: fC6h88bWRf6xljX4gJf1gK:APA91b...
```

**Copy this entire token** - you'll need it for testing.

### Step 4: Send Test Notification

#### Method A: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `co-ouderschap-platform`
3. Navigate to **Cloud Messaging** (left sidebar)
4. Click **"Send your first message"** or **"New campaign"**
5. Fill in:
   - **Notification title**: "Test Notificatie"
   - **Notification text**: "Dit is een test bericht van FCM"
6. Click **"Send test message"**
7. Paste your FCM token
8. Click **"Test"**

#### Method B: Using Curl
```bash
# Replace [YOUR_SERVER_KEY] with Firebase Server Key from Project Settings
# Replace [YOUR_FCM_TOKEN] with the device token

curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=[YOUR_SERVER_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "[YOUR_FCM_TOKEN]",
    "notification": {
      "title": "Test Notificatie",
      "body": "Dit is een test bericht van FCM",
      "icon": "ic_launcher"
    },
    "data": {
      "url": "/dashboard"
    }
  }'
```

---

## 🎯 Expected Results

### When App is in FOREGROUND:
**Logcat Output:**
```
FCMService: Message received from: [sender_id]
FCMService: Message notification - Title: Test Notificatie, Body: Dit is een test bericht van FCM
FCMService: Notification displayed with ID: [notification_id]
```

**Device:**
- Notification appears in system tray
- Sound/vibration (if enabled)
- Tapping notification opens the app

### When App is in BACKGROUND:
**Logcat Output:**
```
FirebaseMessaging: Received message from: [sender_id]
```

**Device:**
- Notification automatically displayed by Firebase
- Sound/vibration (if enabled)
- Tapping notification opens the app

### When App is KILLED:
**Device:**
- Notification still appears (handled by Google Play Services)
- Tapping notification launches the app

---

## 🔍 Troubleshooting

### Problem: No token received
**Check:**
```bash
# Verify Google Play Services is installed
adb shell pm list packages | grep google.android.gms

# Check for errors
adb logcat -s FirebaseMessaging:E
```

**Solution:**
- Ensure device has Google Play Services
- Check internet connection
- Verify `google-services.json` is correct

### Problem: Notification not appearing
**Check Logcat:**
```bash
adb logcat -s FCMService NotificationManager
```

**Common Issues:**
1. **Channel not created**: Check for "Notification channel created" log
2. **Permissions denied**: Check notification settings on device
3. **Battery optimization**: Disable for your app

**Solution:**
1. Go to **Settings → Apps → CoParenting**
2. Enable **Notifications**
3. Check **Battery → Unrestricted**

### Problem: "MissingFirebaseMessagingService" error
**Check:**
```bash
# Verify service is declared
adb shell dumpsys package com.coparenting.app | grep Service
```

**Solution:**
- Ensure you've rebuilt the app after adding the service
- Check AndroidManifest.xml syntax
- Clean and rebuild

### Problem: Token changes frequently
**This is normal** - FCM tokens can refresh:
- After app reinstall
- After clearing app data
- After long periods of inactivity
- After Firebase updates

---

## 🧪 Advanced Testing

### Test Different Scenarios

#### 1. Data-only Message (Silent)
```json
{
  "to": "[FCM_TOKEN]",
  "data": {
    "type": "silent_update",
    "action": "refresh_data"
  }
}
```

#### 2. Notification with Data Payload
```json
{
  "to": "[FCM_TOKEN]",
  "notification": {
    "title": "Nieuw Verzoek",
    "body": "Je hebt een nieuw verzoek ontvangen"
  },
  "data": {
    "url": "/verzoeken",
    "request_id": "123"
  }
}
```

#### 3. High Priority Notification
```json
{
  "to": "[FCM_TOKEN]",
  "priority": "high",
  "notification": {
    "title": "Urgent",
    "body": "Dit is een urgente melding"
  }
}
```

### Monitor All FCM Activity
```bash
# Comprehensive logging
adb logcat | grep -E "(FCM|Firebase|Notification|GCM|PushNotifications)"
```

---

## 📊 Success Indicators

✅ **Token Successfully Registered:**
- Token appears in logcat
- Token saved to Supabase database
- No registration errors

✅ **Notifications Work:**
- Appear in foreground
- Appear in background
- Appear when app is killed
- Sound/vibration works
- Tapping opens correct screen

✅ **Service Running:**
```bash
# Check if service is running
adb shell dumpsys activity services | grep MyFirebaseMessagingService
```

---

## 🔐 Security Notes

1. **Never commit** your `google-services.json` to public repositories
2. **Server Key** should only be used on backend servers, never in client code
3. **Token storage** - ensure tokens are stored securely in database
4. **User privacy** - respect notification preferences

---

## 📝 Next Steps

After successful testing:

1. **Implement Backend Integration:**
   - Store FCM tokens in Supabase when users log in
   - Send targeted notifications via your backend
   - Handle token refresh

2. **Add Notification Features:**
   - Different notification types (requests, events, logs)
   - Notification preferences
   - Sound and vibration customization
   - Notification actions (reply, dismiss, etc.)

3. **Production Deployment:**
   - Test on multiple devices
   - Test different Android versions
   - Monitor FCM quota and limits
   - Set up error monitoring

---

## 📞 Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs/cloud-messaging
- **Capacitor Push Notifications**: https://capacitorjs.com/docs/apis/push-notifications
- **Android Notification Channels**: https://developer.android.com/training/notify-user/channels

---

## ✨ Testing Checklist

Before marking as complete, verify:

- [ ] App builds without errors
- [ ] FCM token is generated on app launch
- [ ] Token is saved to database
- [ ] Test notification received (foreground)
- [ ] Test notification received (background)
- [ ] Test notification received (app killed)
- [ ] Notification appears in system tray
- [ ] Tapping notification opens app
- [ ] Notification sound/vibration works
- [ ] Logcat shows proper FCM logs
- [ ] No errors in logcat

---

**Last Updated:** 2026-02-19
**Version:** 1.0.0
