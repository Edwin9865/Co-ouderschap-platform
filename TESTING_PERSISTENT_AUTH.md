# Persistent Authentication - Testing Guide

## Quick Test Scenarios

### 1. Basic Functionality Test (Web)

```bash
# Start the app
npm run dev
```

**Test Steps:**
1. Navigate to http://localhost:5173/login
2. Enter credentials
3. ✅ Verify "Ingelogd blijven (30 dagen)" checkbox is checked by default
4. Click "Inloggen"
5. ✅ Verify redirect to dashboard
6. Open browser DevTools > Application > Local Storage
7. ✅ Verify auth tokens are stored
8. Refresh the page (F5)
9. ✅ Verify you remain logged in
10. Close the browser completely
11. Reopen browser and navigate to http://localhost:5173
12. ✅ Verify automatic login to dashboard

### 2. Remember Me Toggle Test (Web)

**Test Steps:**
1. Login to the app
2. Navigate to Settings > Account
3. Scroll to "Beveiliging" section
4. ✅ Verify "Automatisch inloggen" toggle is ON
5. Click the toggle to turn it OFF
6. ✅ Verify success message appears
7. Close browser completely
8. Reopen and visit the app
9. ✅ Verify you need to login again

### 3. Logout Test

**Test Steps:**
1. Login with "Remember Me" enabled
2. Navigate to any page
3. Click logout (settings menu)
4. ✅ Verify redirect to login page
5. Open DevTools > Application > Local Storage
6. ✅ Verify auth tokens are cleared
7. Close browser and reopen
8. ✅ Verify login is required

### 4. Session Timeout Test (Manual)

**Test Steps:**
1. Login to the app
2. Open browser DevTools > Console
3. Run this code to simulate 31 days ago:
```javascript
localStorage.setItem('coparenting_last_active',
  new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
);
```
4. Refresh the page
5. ✅ Verify automatic logout
6. ✅ Verify console shows: "Session expired after 30 days of inactivity"
7. ✅ Verify redirect to login page

---

## Mobile Testing (Android)

### Prerequisites
```bash
npm run build
npx cap sync android
npx cap open android
```

### Test 1: App Restart Persistence

**Test Steps:**
1. Build and install app on Android device
2. Open app and login with "Remember Me" checked
3. Navigate to dashboard
4. **Force close the app** (swipe away from recent apps)
5. Reopen the app
6. ✅ Verify automatic login
7. ✅ Verify dashboard loads

### Test 2: Device Restart Persistence

**Test Steps:**
1. Login to app with "Remember Me" checked
2. **Restart the Android device**
3. Open the app after restart
4. ✅ Verify automatic login
5. ✅ Verify session restored

### Test 3: Secure Storage Verification

**Test Steps:**
1. Connect device via ADB
2. Login to app
3. Run: `adb logcat | grep -i preference`
4. ✅ Verify Capacitor Preferences usage
5. Run: `adb shell run-as com.coparenting.app ls -la shared_prefs/`
6. ✅ Verify encrypted preferences file exists

### Test 4: Logout Clears Data

**Test Steps:**
1. Login to app
2. Open Android Settings > Apps > CoParenting > Storage
3. Note storage usage
4. In app, click logout
5. Check storage usage again
6. ✅ Verify auth data cleared

---

## Mobile Testing (iOS)

### Prerequisites
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### Test 1: App Restart Persistence

**Test Steps:**
1. Build and run on iOS device/simulator
2. Login with "Remember Me" checked
3. **Close app completely** (swipe up and close)
4. Reopen app from home screen
5. ✅ Verify automatic login
6. ✅ Verify data loads correctly

### Test 2: Device Restart Persistence

**Test Steps:**
1. Login with "Remember Me" checked
2. **Restart iOS device/simulator**
3. Open app after restart
4. ✅ Verify automatic login
5. ✅ Verify Keychain data restored

### Test 3: Keychain Verification

**Test Steps:**
1. Login to app
2. In Xcode, open Debug > View Memory
3. Check app's keychain access
4. ✅ Verify Capacitor Preferences in Keychain
5. ✅ Verify data is encrypted

### Test 4: App Update Preservation

**Test Steps:**
1. Install version 1.0.0 and login
2. Close app
3. Build and install version 1.0.1 (update)
4. Open app
5. ✅ Verify session persists across update
6. ✅ Verify no re-login required

---

## Advanced Testing

### Test: Offline Mode

**Test Steps:**
1. Login with internet connection
2. Enable airplane mode
3. Close and reopen app
4. ✅ Verify app loads with cached session
5. ✅ Verify offline-accessible data displays
6. Re-enable internet
7. ✅ Verify automatic reconnection

### Test: Multiple Account Switch

**Test Steps:**
1. Login as user1@example.com
2. Note displayed data
3. Logout
4. Login as user2@example.com
5. ✅ Verify user2 data displayed
6. ✅ Verify no user1 data visible
7. Logout and login as user1 again
8. ✅ Verify user1 session restored correctly

### Test: Storage Quota

**Test Steps:**
1. Login to app
2. Use extensive app features
3. Check storage usage
4. ✅ Verify auth storage remains < 10KB
5. ✅ Verify no memory leaks

### Test: Token Refresh

**Test Steps:**
1. Login to app
2. Open browser DevTools > Network
3. Wait 60 minutes (or simulate)
4. Perform an authenticated action
5. ✅ Verify token refresh request
6. ✅ Verify no logout occurred
7. ✅ Verify action completed successfully

---

## Automated Testing Commands

### Run TypeScript Checks
```bash
npm run typecheck
```

### Build Test
```bash
npm run build
```

### Sync Capacitor
```bash
npx cap sync
```

---

## Expected Behaviors

### ✅ Pass Criteria

- **Login:** Checkbox defaults to checked
- **Persistence:** Session survives app close/reopen
- **Timeout:** Auto-logout after 30 days inactivity
- **Toggle:** Settings toggle changes behavior immediately
- **Logout:** Completely clears stored auth data
- **Security:** Uses platform-native encryption
- **Performance:** < 100ms session check on startup

### ❌ Fail Criteria

- Session lost on app restart
- Timeout not working (no auto-logout)
- Toggle changes don't persist
- Auth data visible in plaintext
- Multiple accounts mixed/leaked
- Significant performance degradation

---

## Debugging Tips

### View Stored Data (Web)

```javascript
// Open browser console and run:
console.log('Remember Me:', localStorage.getItem('coparenting_remember_me'));
console.log('Last Active:', localStorage.getItem('coparenting_last_active'));

// View all auth tokens
Object.keys(localStorage)
  .filter(key => key.includes('sb-'))
  .forEach(key => console.log(key, localStorage.getItem(key)));
```

### Android Debug Logs

```bash
# Watch all app logs
adb logcat | grep -i coparenting

# Watch Preferences logs
adb logcat | grep -i "CapacitorPreferences"

# Watch Supabase auth logs
adb logcat | grep -i "supabase"
```

### iOS Debug Logs

```bash
# In Xcode: Product > Scheme > Edit Scheme > Run > Arguments
# Add environment variable:
# OS_ACTIVITY_MODE = disable

# Then run and watch console for:
# - "Capacitor Preferences"
# - "Supabase"
# - "Auth"
```

---

## Reporting Issues

When reporting issues, include:

1. **Platform:** Web / iOS / Android
2. **Device:** Model and OS version
3. **Steps:** Exact reproduction steps
4. **Expected:** What should happen
5. **Actual:** What actually happened
6. **Logs:** Console/logcat output
7. **Screenshots:** If applicable

Example:
```
Platform: Android 14, Pixel 6
Steps:
1. Login with Remember Me enabled
2. Close app
3. Reopen after 1 minute
Expected: Auto-login to dashboard
Actual: Stuck on login screen
Logs: "Session expired" in logcat
```
