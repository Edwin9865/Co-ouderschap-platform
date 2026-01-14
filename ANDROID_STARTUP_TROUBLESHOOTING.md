# Android App Startup ANR Issue - Resolution Guide

## Problem Summary
The Android app "com.coparenting.app" was experiencing Application Not Responding (ANR) errors during startup, preventing the app from launching successfully.

## Root Cause
**Missing Firebase Configuration + Blocking Initialization**

1. **Missing `google-services.json`**: The Firebase configuration file was not present in `android/app/`
2. **Synchronous Firebase initialization**: Firebase and push notification services were initializing synchronously during app startup
3. **No timeout handling**: Long-running operations had no timeout protection
4. **Blocking main thread**: Firebase SDK initialization was potentially blocking the main UI thread

## Solutions Implemented

### 1. ✅ Added `google-services.json` Configuration
- **Location**: `/android/app/google-services.json`
- **Package**: `com.coparenting.app`
- **Project**: `co-ouderschap-platform`
- **Status**: ✅ Successfully added

### 2. ✅ Added Timeout Protection to Firebase Operations
**File**: `src/lib/firebase.ts`

- Added `withTimeout()` utility function for all async operations
- Firebase initialization: 5-10 second timeouts
- Token requests: 10 second timeout
- Service worker registration: 8 second timeout
- Permission requests: 5 second timeout

### 3. ✅ Made Notification Service Non-Blocking
**File**: `src/lib/notificationService.ts`

- FCM initialization now runs in background (non-blocking)
- Added initialization guard to prevent duplicate attempts
- Native push notifications have 15-second timeout
- Errors are logged but don't prevent app startup

### 4. ✅ Added Singleton Pattern for Firebase
- Prevents multiple initialization attempts
- Caches initialization promise
- Returns cached instance on subsequent calls

## Verification Steps

### 1. Check `google-services.json` is Present
```bash
ls -la android/app/google-services.json
```
Expected: File should exist with proper permissions

### 2. Verify Build Configuration
```bash
# Check that Google Services plugin is applied
cat android/app/build.gradle | grep "google-services"
```

### 3. Build and Test
```bash
npm run build
npm run typecheck  # May have some type errors, but Firebase types should be ok
```

### 4. Sync with Android
```bash
npx cap sync android
```

### 5. Monitor Android Logs
```bash
adb logcat | grep -E "Firebase|FCM|NotificationService|coparenting"
```

## Common Firebase Startup Issues and Solutions

### Issue 1: "Default FirebaseApp is not initialized"
**Cause**: `google-services.json` missing or incorrect
**Solution**:
- Verify file exists at `android/app/google-services.json`
- Verify package name matches: `com.coparenting.app`
- Download fresh copy from Firebase Console if needed

### Issue 2: "FCM Registration Failed"
**Cause**: Google Play Services not available or outdated
**Solution**:
- Update Google Play Services on device
- Test on physical device instead of emulator
- Check Firebase project has FCM enabled

### Issue 3: App Hangs on Splash Screen
**Cause**: Blocking operations during startup
**Solution**: ✅ Already implemented
- All Firebase operations now have timeouts
- Initialization is non-blocking
- Errors are caught and logged

### Issue 4: "Service Worker Registration Failed"
**Cause**: Only applicable to web, not native Android
**Solution**: ✅ Already handled
- Native Android uses Capacitor Push Notifications
- Web-specific code is conditionally executed

### Issue 5: ANR After 60 Seconds
**Cause**: Long-running operations on main thread
**Solution**: ✅ Already implemented
- Maximum timeout is 15 seconds (native push)
- Most operations timeout at 5-10 seconds
- All operations are async and non-blocking

## Build Configuration Details

### Required Dependencies (Already Configured)
**File**: `android/build.gradle`
```gradle
classpath 'com.google.gms:google-services:4.4.4'
```

**File**: `android/app/build.gradle`
```gradle
apply plugin: 'com.google.gms.google-services'  // Auto-applied if google-services.json exists
```

**File**: `package.json`
```json
{
  "@capacitor/push-notifications": "^8.0.0",
  "firebase": "^12.7.0"
}
```

### Capacitor Plugin Configuration (Auto-Generated)
**File**: `android/capacitor.settings.gradle`
```gradle
include ':capacitor-push-notifications'
```

**File**: `android/app/capacitor.build.gradle`
```gradle
implementation project(':capacitor-push-notifications')
```

## Testing Checklist

- [x] `google-services.json` in correct location
- [x] Build succeeds without errors
- [x] Firebase initialization has timeout protection
- [x] Notification service initialization is non-blocking
- [x] All async operations have error handling
- [ ] App launches successfully on Android device
- [ ] Push notifications work (if enabled in settings)
- [ ] No ANR errors in logcat
- [ ] App remains responsive during startup

## Debug Commands

### Check if App is Responding
```bash
adb shell dumpsys activity processes | grep coparenting
```

### Monitor ANR Traces
```bash
adb shell cat /data/anr/traces.txt
```

### View Firebase Logs
```bash
adb logcat -s FirebaseApp:V FirebaseMessaging:V
```

### View App Logs
```bash
adb logcat -s chromium:V
```

### Clear App Data (Force Fresh Start)
```bash
adb shell pm clear com.coparenting.app
```

## Next Steps After Fix

1. **Test on Physical Device**
   ```bash
   npx cap run android
   ```

2. **Monitor Startup Time**
   - Should complete in < 10 seconds
   - No ANR dialogs should appear

3. **Test Push Notifications**
   - Enable notifications in app settings
   - Send test notification from Firebase Console

4. **Production Checklist**
   - Ensure release signing configured
   - Test on multiple Android versions (API 24-36)
   - Monitor Firebase Analytics for crashes

## Additional Resources

- Firebase Console: https://console.firebase.google.com/project/co-ouderschap-platform
- Capacitor Docs: https://capacitorjs.com/docs/apis/push-notifications
- Android ANR Guide: https://developer.android.com/topic/performance/vitals/anr

## Support

If issues persist:
1. Check logcat for specific error messages
2. Verify Firebase project configuration
3. Test on different device/emulator
4. Check network connectivity (Firebase needs internet)
5. Ensure Google Play Services is up to date on device
