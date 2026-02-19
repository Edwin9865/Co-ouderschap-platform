# Push Notification Crash - Quick Fix Summary

## Problem
App crashed with `FirebaseApp is not initialized` when enabling push notifications.

## Root Cause
Firebase was only initialized in web layer, not in Android native layer. Capacitor's PushNotifications plugin requires native Firebase initialization.

## Solution Applied

### 1. Modified MainActivity.java ✅
**File**: `android/app/src/main/java/com/coparenting/app/MainActivity.java`

Added Firebase initialization in `onCreate()`:
```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
        FirebaseApp.initializeApp(this);
    } catch (IllegalStateException e) {
        // Already initialized, ignore
    }
}
```

### 2. Added Firebase Dependencies ✅
**File**: `android/app/build.gradle`

Added to dependencies:
```gradle
// Firebase dependencies for push notifications
implementation platform('com.google.firebase:firebase-bom:32.7.0')
implementation 'com.google.firebase:firebase-messaging'
```

## Required User Action

### CRITICAL: Add google-services.json
**You must add this file for notifications to work:**

1. Download from [Firebase Console](https://console.firebase.google.com/)
2. Place at: `android/app/google-services.json`
3. Rebuild app

**Without this file, push notifications will not work!**

## Test the Fix

### Quick Test (2 minutes)
```bash
# 1. Rebuild
npm run build
npx cap sync android
npx cap open android

# 2. Run on device and test
# - Open app
# - Go to Instellingen → Meldingen
# - Toggle Pushnotificaties ON
# - Accept permission
# - Should NOT crash ✅
```

### Expected Results

**Before Fix**:
```
Enable notifications → CRASH 💥
Process killed
```

**After Fix**:
```
Enable notifications → Success ✅
FCM token received
Ready for notifications
```

### Verify in Logcat
```bash
adb logcat -s chromium:V Capacitor:* | grep -E "Firebase|Push"
```

**Should see**:
```
✅ Firebase initialized successfully
✅ Registered for push notifications
✅ FCM token: eJw...
```

**Should NOT see**:
```
❌ FirebaseApp is not initialized
❌ FATAL EXCEPTION
```

## Files Modified

1. ✅ `android/app/src/main/java/com/coparenting/app/MainActivity.java`
2. ✅ `android/app/build.gradle`

## Files You Need to Add

1. ⚠️ `android/app/google-services.json` (download from Firebase)

## Documentation

- **Full technical details**: See `PUSH_NOTIFICATION_CRASH_FIX.md`
- **Firebase setup guide**: See `SETUP_FIREBASE.md`

## Status

**Code Fix**: ✅ Complete
**Ready to Test**: ⚠️ Need google-services.json
**Production Ready**: ⚠️ After adding google-services.json and testing

---

**Next Step**: Add `google-services.json` and rebuild to test!
