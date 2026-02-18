# Persistent Auth - Quick Fixes Cheat Sheet

## 🚨 Problem: Users Have to Login Every Time

### 1️⃣ First Check (30 seconds)

```bash
# Verify plugin is installed
npm list @capacitor/preferences

# If missing or wrong version:
npm install @capacitor/preferences
npx cap sync
```

---

### 2️⃣ Check Console Logs (1 minute)

**Open DevTools Console (Web) or logcat (Android) and look for:**

✅ **GOOD:**
```
[SecureStorage] Get Remember Me: true
[AuthContext] Session valid: true
[CapacitorStorage] Get: sb-xxx-auth-token exists
[AuthContext] Supabase session: Found
```

❌ **BAD:**
```
[SecureStorage] Get Remember Me: null
[AuthContext] Session invalid: No last active timestamp
[CapacitorStorage] Get: sb-xxx-auth-token null
[AuthContext] Supabase session: Not found
```

---

### 3️⃣ Quick Diagnostic Test

**Run this in browser console:**

```javascript
// Check if storage is working
console.log('Remember Me:', localStorage.getItem('coparenting_remember_me'));
console.log('Last Active:', localStorage.getItem('coparenting_last_active'));

// Check if tokens exist
const tokens = Object.keys(localStorage).filter(k => k.includes('sb-'));
console.log('Supabase Tokens:', tokens.length > 0 ? 'Found' : 'MISSING!');
```

**Expected:**
- Remember Me: `"true"`
- Last Active: `"2026-02-18T..."`
- Tokens: `Found`

**If any are missing, proceed to fixes below.**

---

## 🔧 Common Fixes

### Fix #1: Plugin Not Synced (Most Common)

```bash
npx cap sync
```

Then rebuild and test.

---

### Fix #2: Remember Me Not Being Saved

**Check `src/pages/Login.tsx`:**

```typescript
// Line 9 - Should default to true
const [rememberMe, setRememberMe] = useState(true); // ✅

// Line 21 - Should pass rememberMe parameter
await signIn(email, password, rememberMe); // ✅
```

**Check the checkbox is rendered:**

```typescript
// Lines 88-99 - Should have this
<input
  type="checkbox"
  id="rememberMe"
  checked={rememberMe}  // ✅
  onChange={(e) => setRememberMe(e.target.checked)}
/>
<label htmlFor="rememberMe">
  Ingelogd blijven (30 dagen)
</label>
```

---

### Fix #3: Tokens Not Persisting

**Check `src/lib/supabase.ts` configuration:**

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage,  // ✅ Must use custom storage
    autoRefreshToken: true,     // ✅ Must be true
    persistSession: true,       // ✅ Must be true
    detectSessionInUrl: false,  // ✅ Should be false for mobile
  },
});
```

---

### Fix #4: Works on Web but Not Mobile

**Test native detection:**

```typescript
import { Capacitor } from '@capacitor/core';

console.log('Platform:', Capacitor.getPlatform());
// Should show 'ios' or 'android' on mobile

console.log('Is Native:', Capacitor.isNativePlatform());
// Should be true on mobile
```

**If detection fails:**

```bash
# Clean and rebuild
npx cap sync

# iOS
npx cap open ios
# In Xcode: Product > Clean Build Folder
# Then run

# Android
npx cap open android
# Build > Clean Project
# Build > Rebuild Project
```

---

### Fix #5: Session Expires Immediately

**Check device time settings:**
- Settings > Date & Time
- Enable "Set Automatically"

**Check last active is updating:**

```javascript
// In console after login
console.log('Last Active:', localStorage.getItem('coparenting_last_active'));
// Should be recent timestamp

// Close and reopen app, check again
console.log('Last Active:', localStorage.getItem('coparenting_last_active'));
// Should be same or newer (not 30+ days old)
```

---

### Fix #6: Clear Everything and Start Fresh

**Web:**
```
1. Open DevTools
2. Application tab
3. Clear site data
4. Refresh page
5. Login again
```

**iOS:**
```
1. Delete app from device
2. In Xcode: Product > Clean Build Folder
3. Rebuild and install
4. Login again
```

**Android:**
```
1. Settings > Apps > CoParenting
2. Storage > Clear data
3. Or uninstall and reinstall
4. Login again
```

---

## 🐛 Debugging Commands

### Web (Browser Console)

```javascript
// View all storage
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, ':', localStorage.getItem(key));
}

// Test write
localStorage.setItem('test', 'value');
console.log('Write test:', localStorage.getItem('test')); // Should be 'value'

// Clear specific auth data (for testing)
localStorage.removeItem('coparenting_remember_me');
localStorage.removeItem('coparenting_last_active');
```

### Android (Terminal)

```bash
# Real-time logs
adb logcat -c  # Clear first
adb logcat | grep -E "CapacitorStorage|SecureStorage|AuthContext"

# Check storage file
adb shell run-as com.coparenting.app ls -la shared_prefs/

# Force stop app
adb shell am force-stop com.coparenting.app

# Clear app data (for testing)
adb shell pm clear com.coparenting.app
```

### iOS (Xcode Console)

```
1. Run app in Xcode
2. Open Console (Cmd+Shift+Y)
3. Filter: CapacitorStorage OR SecureStorage OR AuthContext
4. Look for errors in red
```

---

## ✅ Verification Checklist

After implementing fixes:

```
☐ npm list @capacitor/preferences shows v8.0.1+
☐ npx cap sync runs without errors
☐ Login checkbox is checked by default
☐ Console shows "Setting Remember Me: true" on login
☐ Console shows storage operations succeeding
☐ Close app completely (not just minimize)
☐ Reopen app
☐ Console shows "Supabase session: Found"
☐ User automatically logged in to dashboard
☐ Test on all platforms (web, iOS, Android)
```

---

## 📞 Still Not Working?

### Collect Debug Info

```bash
# 1. Get platform info
echo "Platform: $(uname -a)"

# 2. Get dependency versions
npm list @capacitor/preferences @capacitor/core @supabase/supabase-js

# 3. Capture logs
# Web: Right-click console > Save as... > save-logs.txt
# Android: adb logcat > android-logs.txt
# iOS: Xcode Console > right-click > Export...

# 4. Take screenshots of:
# - Login screen with checkbox
# - Console logs
# - Settings > Account (Security section)
```

### Report Issue

Include:

1. Platform and version (iOS 17.2, Android 14, Chrome 120, etc.)
2. Exact steps to reproduce
3. Console logs with timestamps
4. Expected vs actual behavior
5. Screenshot of issue

---

## 🎯 Success Indicators

You know it's working when:

✅ Checkbox is checked by default on login
✅ Console shows: `[SecureStorage] Setting Remember Me: true`
✅ After login: `[CapacitorStorage] Set: coparenting_remember_me`
✅ After app restart: `[CapacitorStorage] Get: coparenting_remember_me exists`
✅ After app restart: `[AuthContext] Supabase session: Found`
✅ Dashboard loads automatically without login screen

---

## 💡 Pro Tips

1. **Always test on physical devices**, not just simulators
2. **Clear data between tests** to simulate fresh install
3. **Watch console logs** during the entire flow
4. **Test all platforms** - each has unique behavior
5. **Check "Remember Me" is checked** - unchecked = no persistence

---

## 🔒 Security Notes

- Tokens are encrypted on iOS (Keychain) and Android (EncryptedSharedPreferences)
- 30-day timeout enforced automatically
- Manual logout clears all stored data
- Storage is device-specific (not synced across devices)

---

**Last Updated:** 2026-02-18
**Version:** 1.0.1 (Enhanced Debugging)
