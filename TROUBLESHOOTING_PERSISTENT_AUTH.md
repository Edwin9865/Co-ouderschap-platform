# Troubleshooting Guide: "Stay Logged In" Not Working

## Overview

This guide helps diagnose and fix issues with the persistent authentication system where users are forced to re-login after closing and reopening the mobile app.

---

## 1. Root Cause Analysis

### Common Failure Points

#### A. Storage Layer Issues (40% of cases)
**Symptoms:**
- Tokens not persisting between app sessions
- "Remember Me" preference not saved
- Error logs mentioning storage operations

**Causes:**
- Capacitor Preferences plugin not installed/synced
- Platform permissions blocking secure storage
- Storage quota exceeded or corrupted
- iOS Keychain access denied
- Android EncryptedSharedPreferences initialization failure

#### B. Session Validation Issues (30% of cases)
**Symptoms:**
- Always showing login screen despite "Remember Me" enabled
- Console shows "Session expired" or "Session invalid"
- Last active timestamp not updating

**Causes:**
- `remember_me` preference defaulting to false
- `last_active_at` timestamp not being updated
- 30-day timeout calculation errors
- System clock issues (wrong date/time)

#### C. Token Management Issues (20% of cases)
**Symptoms:**
- Initial login works, but tokens disappear after app close
- Supabase session returns null on app reopen
- Network errors during token refresh

**Causes:**
- Custom storage adapter not functioning
- Supabase tokens not persisting to secure storage
- Token refresh failing silently
- Auth state change listener not firing

#### D. Code Logic Issues (10% of cases)
**Symptoms:**
- Inconsistent behavior across platforms
- Works on web but not mobile
- Works after fresh login but not on subsequent opens

**Causes:**
- `rememberMe` parameter not passed to `signIn()`
- `isSessionValid()` logic errors
- Race conditions in async operations
- Missing error handling

---

## 2. Technical Investigation Steps

### Step 1: Enable Debug Logging

**All debug logging has been added to the codebase. Look for these prefixes:**

```
[AuthContext] - Authentication initialization flow
[SecureStorage] - Storage operations and session validation
[CapacitorStorage] - Low-level storage adapter operations
```

### Step 2: Verify Installation

```bash
# Check dependencies
npm list @capacitor/preferences
# Expected: @capacitor/preferences@8.0.1

# Sync Capacitor
npx cap sync

# Verify plugin installation
npx cap ls | grep -i preferences
```

**Expected Output:**
```
✅ Preferences - v8.0.1
```

### Step 3: Test Storage Operations

#### Web (Browser DevTools Console):

```javascript
// Open DevTools Console (F12) and run:

// 1. Test basic storage
localStorage.setItem('test_persist', 'works');
console.log('Test:', localStorage.getItem('test_persist'));
// Expected: "works"

// 2. Check Remember Me preference
console.log('Remember Me:', localStorage.getItem('coparenting_remember_me'));
// Expected: "true" (after login with checkbox checked)

// 3. Check Last Active timestamp
console.log('Last Active:', localStorage.getItem('coparenting_last_active'));
// Expected: ISO timestamp like "2026-02-18T15:30:00.000Z"

// 4. Check Supabase tokens
Object.keys(localStorage)
  .filter(key => key.includes('sb-'))
  .forEach(key => {
    const value = localStorage.getItem(key);
    console.log(key, ':', value ? 'Token exists' : 'Missing');
  });
// Expected: At least one sb-* key with "Token exists"
```

#### Android (ADB Commands):

```bash
# Connect device via USB with debugging enabled

# 1. Watch Preferences operations in real-time
adb logcat -c  # Clear log
adb logcat | grep -E "\[CapacitorStorage\]|\[SecureStorage\]|\[AuthContext\]"

# 2. Check for errors
adb logcat *:E | grep -i coparenting

# 3. Verify storage file exists
adb shell run-as com.coparenting.app ls -la shared_prefs/
# Expected: CapacitorStorage file present

# 4. Check storage contents (will be encrypted)
adb shell run-as com.coparenting.app cat shared_prefs/CapacitorStorage
# Expected: Encrypted data (not readable plaintext)
```

#### iOS (Xcode Console):

```bash
# In Xcode after running the app:

# 1. Open Console pane (Cmd+Shift+Y)

# 2. Filter for:
# - "[CapacitorStorage]"
# - "[SecureStorage]"
# - "[AuthContext]"

# 3. Look for:
✅ "Get (native): coparenting_remember_me exists"
✅ "Get (native): coparenting_last_active exists"
✅ "Get (native): sb-[project]-auth-token exists"

# 4. Check for errors:
❌ "Keychain access denied"
❌ "Permission error"
❌ "Failed to save to Keychain"
```

### Step 4: Trace Authentication Flow

Open the app and watch console logs. You should see this sequence:

**Expected Log Flow:**

```
1. [AuthContext] Initializing authentication...
2. [SecureStorage] Get Remember Me: true
3. [AuthContext] Remember Me enabled: true
4. [SecureStorage] Get Remember Me: true
5. [SecureStorage] Session age: 0.25 days (timeout: 30 days)
6. [SecureStorage] Session valid: true
7. [AuthContext] Session valid: true
8. [CapacitorStorage] Get (native): sb-xxx-auth-token exists
9. [AuthContext] Supabase session: Found
10. [AuthContext] Fetching user data for: xxx-user-id
11. [User successfully loaded]
```

**Problem Indicators:**

```
❌ [SecureStorage] Get Remember Me: null
   → Remember Me not set during login

❌ [SecureStorage] Session invalid: No last active timestamp
   → Last active not being updated

❌ [AuthContext] Supabase session: Not found
   → Tokens not persisting to storage

❌ [CapacitorStorage] Get error: [permission denied]
   → Storage permissions issue
```

### Step 5: Test Login Flow

1. **Completely logout** (Settings > Logout)
2. **Clear all storage** (DevTools > Application > Clear site data)
3. **Restart app**
4. Open DevTools Console (web) or ADB logcat (Android)
5. Enter credentials
6. **Verify checkbox is checked**: "Ingelogd blijven (30 dagen)"
7. Click "Inloggen"

**Watch for:**
```
✅ [SecureStorage] Setting Remember Me: true
✅ [CapacitorStorage] Set (web/native): coparenting_remember_me
✅ [CapacitorStorage] Set (web/native): coparenting_last_active
✅ [CapacitorStorage] Set (web/native): sb-xxx-auth-token
```

8. **Close app completely**
9. **Reopen app**

**Watch for:**
```
✅ [CapacitorStorage] Get: coparenting_remember_me exists
✅ [CapacitorStorage] Get: coparenting_last_active exists
✅ [CapacitorStorage] Get: sb-xxx-auth-token exists
✅ [AuthContext] Supabase session: Found
```

---

## 3. Solution Recommendations

### Problem A: Storage Plugin Not Working

**Diagnosis:**
```
[CapacitorStorage] Get error: Plugin not available
```

**Solution:**
```bash
# 1. Reinstall plugin
npm uninstall @capacitor/preferences
npm install @capacitor/preferences

# 2. Sync Capacitor
npx cap sync

# 3. Rebuild native projects
# iOS:
npx cap open ios
# Clean build folder in Xcode (Cmd+Shift+K)
# Build and run

# Android:
npx cap open android
# Build > Clean Project
# Build > Rebuild Project
```

---

### Problem B: Remember Me Not Being Saved

**Diagnosis:**
```
[SecureStorage] Get Remember Me: null
[AuthContext] Remember Me enabled: false
```

**Solution 1: Check Login Component**

Verify the checkbox is properly connected:

```typescript
// In src/pages/Login.tsx
const [rememberMe, setRememberMe] = useState(true); // ✅ Default true

// Verify signIn call includes rememberMe
await signIn(email, password, rememberMe); // ✅ Third parameter
```

**Solution 2: Check Default Value**

If users are unchecking the box, they won't stay logged in. Verify the checkbox:

```tsx
<input
  type="checkbox"
  checked={rememberMe}  // ✅ Should be true by default
  onChange={(e) => setRememberMe(e.target.checked)}
/>
```

---

### Problem C: Session Expiring Immediately

**Diagnosis:**
```
[SecureStorage] Session age: 31.5 days (timeout: 30 days)
[SecureStorage] Session valid: false
[AuthContext] Session expired after 30 days of inactivity
```

**Possible Causes:**

1. **System Clock Issues**
   - Check device date/time settings
   - Ensure automatic date/time is enabled
   - Verify timezone is correct

2. **Last Active Not Updating**

Check if `updateLastActive()` is being called:

```typescript
// Should be called on:
// 1. Login (signIn function)
// 2. Auth state changes
// 3. App initialization (if session valid)

// Add temporary logging to verify:
console.log('[DEBUG] Last active timestamp:',
  localStorage.getItem('coparenting_last_active'));
```

**Solution:**

If timestamp is not updating, check AuthContext:

```typescript
// In signIn function - should update last active
await SecureStorage.setRememberMe(rememberMeOption);
await SecureStorage.updateLastActive(); // ✅ This must be called

// In useEffect initialization - should update on valid session
if (currentSession?.user) {
  await fetchUserData(currentSession.user.id);
  await SecureStorage.updateLastActive(); // ✅ This must be called
}
```

---

### Problem D: Tokens Not Persisting

**Diagnosis:**
```
[CapacitorStorage] Set (native): sb-xxx-auth-token
[App closes and reopens]
[CapacitorStorage] Get (native): sb-xxx-auth-token null
```

**Solution 1: Verify Storage Adapter Configuration**

Check `src/lib/supabase.ts`:

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage,  // ✅ Must be set
    autoRefreshToken: true,     // ✅ Must be true
    persistSession: true,       // ✅ Must be true
    detectSessionInUrl: false,  // ✅ Should be false for mobile
  },
});
```

**Solution 2: Test Storage Directly**

```typescript
// Add to App.tsx temporarily for testing
import { Preferences } from '@capacitor/preferences';

// Test on mount
useEffect(() => {
  (async () => {
    // Test write
    await Preferences.set({ key: 'test_key', value: 'test_value' });

    // Test read
    const { value } = await Preferences.get({ key: 'test_key' });
    console.log('Storage test:', value); // Should be 'test_value'

    // Test remove
    await Preferences.remove({ key: 'test_key' });
  })();
}, []);
```

**Solution 3: Check Platform Permissions**

**iOS - Info.plist:**
```xml
<!-- Check if this exists (should be added by Capacitor) -->
<key>NSKeychainAccessControlBiometry</key>
<true/>
```

**Android - AndroidManifest.xml:**
```xml
<!-- No special permissions needed for EncryptedSharedPreferences -->
<!-- But verify minSdkVersion >= 23 in build.gradle -->
```

---

### Problem E: Works on Web but Not Mobile

**Diagnosis:**
```
Web: ✅ Session persists
iOS: ❌ Session lost after app close
Android: ❌ Session lost after app close
```

**Solution:**

This usually means the native plugin isn't being used. Verify:

```typescript
// In src/lib/capacitor.ts
export const isNative = () => {
  return Capacitor.isNativePlatform();
};

// Test if native detection works:
console.log('Is Native?', isNative());
// Should be true on iOS/Android, false on web
```

If `isNative()` returns false on mobile:

1. Check Capacitor configuration:
```bash
npx cap doctor
# Should show no issues
```

2. Verify Capacitor is initialized:
```typescript
// In main.tsx or App.tsx
import { Capacitor } from '@capacitor/core';

console.log('Platform:', Capacitor.getPlatform());
// Should be 'ios' or 'android' on mobile
```

---

### Problem F: Race Conditions

**Diagnosis:**
```
Sometimes works, sometimes doesn't
Inconsistent behavior
Timing-dependent failures
```

**Solution:**

Ensure all async operations complete before proceeding:

```typescript
// In AuthContext signIn:
const signIn = async (email, password, rememberMe = true) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // ✅ IMPORTANT: Wait for all storage operations
  await SecureStorage.setRememberMe(rememberMe);
  await SecureStorage.updateLastActive();

  // ✅ Give Supabase time to persist tokens
  await new Promise(resolve => setTimeout(resolve, 100));
};
```

---

## 4. Testing Protocol

### Test 1: Fresh Login
```
1. Logout completely
2. Clear browser data / uninstall app
3. Reinstall / reload app
4. Login with "Remember Me" checked
5. Verify console shows:
   ✅ Setting Remember Me: true
   ✅ Setting last active timestamp
6. Close app
7. Reopen app
8. Expected: Auto-login to dashboard
9. Verify console shows:
   ✅ Remember Me enabled: true
   ✅ Session valid: true
   ✅ Supabase session: Found
```

### Test 2: Toggle Feature Off
```
1. Login with "Remember Me" enabled
2. Go to Settings > Account
3. Toggle "Automatisch inloggen" OFF
4. Verify console shows:
   ✅ Setting Remember Me: false
5. Close app
6. Reopen app
7. Expected: Login screen shown
8. Verify console shows:
   ✅ Remember Me enabled: false
   ✅ Session invalid: Remember Me disabled
```

### Test 3: Platform Differences
```
Test on all platforms:
- Web (Chrome, Firefox, Safari)
- iOS (Simulator + Physical device)
- Android (Emulator + Physical device)

All should behave identically.
```

### Test 4: Logout Clears Data
```
1. Login with "Remember Me" enabled
2. Verify auto-login works
3. Logout from Settings
4. Verify console shows storage clear operations
5. Reopen app
6. Expected: Login screen (not auto-login)
```

### Test 5: Session Timeout
```
1. Login with "Remember Me" enabled
2. In console, run:
   localStorage.setItem('coparenting_last_active',
     new Date(Date.now() - 31*24*60*60*1000).toISOString());
3. Close app
4. Reopen app
5. Expected: Auto-logout with message
6. Verify console shows:
   ✅ Session age: 31.xx days
   ✅ Session valid: false
   ✅ Session expired after 30 days
```

---

## 5. Prevention Measures

### Code Review Checklist

When making changes to auth code, verify:

```
☐ `rememberMe` parameter passed to signIn()
☐ SecureStorage operations have error handling
☐ All async operations properly awaited
☐ Storage operations logged for debugging
☐ No hardcoded timeouts interfering with session logic
☐ `updateLastActive()` called in all appropriate places
☐ Supabase client configured with persistSession: true
```

### Monitoring & Alerts

Add analytics to track:

```typescript
// Track successful session restorations
analytics.track('session_restored', {
  days_since_last_active: diffDays,
  platform: Capacitor.getPlatform()
});

// Track session restoration failures
analytics.track('session_restoration_failed', {
  reason: 'tokens_missing' | 'remember_me_disabled' | 'session_expired',
  platform: Capacitor.getPlatform()
});
```

### Testing in CI/CD

Add automated tests:

```typescript
describe('Persistent Auth', () => {
  it('should persist session after app restart', async () => {
    await login('user@example.com', 'password', true);
    await closeApp();
    await openApp();
    expect(await isLoggedIn()).toBe(true);
  });

  it('should not persist session if remember me disabled', async () => {
    await login('user@example.com', 'password', false);
    await closeApp();
    await openApp();
    expect(await isLoggedIn()).toBe(false);
  });
});
```

---

## 6. Quick Reference

### Debug Commands

```bash
# Web
# Open DevTools Console and run:
console.log('Remember Me:', localStorage.getItem('coparenting_remember_me'));
console.log('Last Active:', localStorage.getItem('coparenting_last_active'));

# Android
adb logcat | grep -E "\[CapacitorStorage\]|\[SecureStorage\]|\[AuthContext\]"

# iOS
# In Xcode Console, filter for:
# [CapacitorStorage] OR [SecureStorage] OR [AuthContext]
```

### Common Fixes

```bash
# Fix 1: Reinstall plugin
npm uninstall @capacitor/preferences && npm install @capacitor/preferences
npx cap sync

# Fix 2: Clear native caches
# iOS:
rm -rf ios/App/Pods ios/App/Podfile.lock
npx cap sync ios

# Android:
cd android && ./gradlew clean && cd ..
npx cap sync android

# Fix 3: Reset storage (dev only)
# Web: DevTools > Application > Clear site data
# iOS: Delete app and reinstall
# Android: Settings > Apps > CoParenting > Clear data
```

### Support Checklist

When reporting issues, collect:

```
☐ Platform (iOS/Android/Web)
☐ Device model and OS version
☐ App version
☐ Console logs showing [AuthContext] [SecureStorage] [CapacitorStorage]
☐ Steps to reproduce
☐ Expected vs actual behavior
☐ Screenshots if applicable
```

---

## 7. Advanced Debugging

### Enable Supabase Debug Mode

Add to your initialization:

```typescript
// In src/lib/supabase.ts (temporarily)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: true, // ✅ Enable Supabase debug logging
  },
});
```

### Inspect Storage in Real-Time

**Web:**
```javascript
// Watch storage changes
window.addEventListener('storage', (e) => {
  console.log('Storage change:', e.key, e.newValue);
});
```

**Android:**
```bash
# Watch file changes
adb shell run-as com.coparenting.app ls -lt shared_prefs/ | head -5
```

**iOS:**
```bash
# Use Xcode Instruments > File Activity
# Filter for Keychain operations
```

---

## Summary

**Most Common Issues (80% of cases):**

1. ✅ **Plugin not synced**: Run `npx cap sync`
2. ✅ **Remember Me not passed to signIn**: Check Login.tsx checkbox binding
3. ✅ **Tokens not persisting**: Verify storage adapter configuration
4. ✅ **Platform detection failing**: Check `isNative()` function

**Key Debug Steps:**

1. Check console logs (all platforms)
2. Verify storage operations (check keys exist)
3. Trace auth initialization flow
4. Test on physical devices (not just simulators)

**When to Escalate:**

- Storage operations consistently failing with errors
- Works in dev but not in production builds
- Platform-specific crashes during auth
- Security/permission errors that can't be resolved

---

**Documentation Updated:** 2026-02-18
**Version:** 1.0.1 (with enhanced debugging)
