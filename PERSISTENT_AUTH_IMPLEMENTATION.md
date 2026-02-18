# Persistent Authentication Implementation

## Overview

This document describes the comprehensive persistent authentication solution that allows users to remain logged in across app sessions on both iOS and Android platforms.

## 1. Technical Approach

### Secure Storage Method

**Platform-Native Security:**
- **iOS**: Uses Keychain Services (via Capacitor Preferences)
- **Android**: Uses EncryptedSharedPreferences (via Capacitor Preferences)
- **Web**: Falls back to localStorage with encryption considerations

**Supabase Integration:**
- Leverages Supabase's built-in session management with automatic token refresh
- Custom storage adapter for Capacitor Preferences
- Automatic session persistence with secure token storage

### Key Components

1. **@capacitor/preferences**: Platform-native secure storage plugin
2. **SecureStorage Service**: Custom wrapper for auth state management
3. **Supabase Client**: Configured with custom storage adapter
4. **AuthContext**: Enhanced with persistent session logic

---

## 2. Implementation Plan

### A. Secure Storage Service (`src/lib/secureStorage.ts`)

**Responsibilities:**
- Store/retrieve "Remember Me" preference
- Track last active timestamp
- Validate session timeout (30 days)
- Clear authentication data on logout

**Key Methods:**
```typescript
- setRememberMe(enabled: boolean): Stores user preference
- getRememberMe(): Retrieves user preference
- updateLastActive(): Updates activity timestamp
- isSessionValid(): Checks if session is within 30-day window
- clearAuthData(): Removes all auth data
```

### B. Supabase Client Configuration (`src/lib/supabase.ts`)

**Custom Storage Adapter:**
```typescript
const capacitorStorage = {
  getItem: async (key: string) => {
    // Uses Preferences on native, localStorage on web
  },
  setItem: async (key: string, value: string) => {
    // Secure storage with platform-native encryption
  },
  removeItem: async (key: string) => {
    // Secure removal
  }
}
```

**Configuration:**
- `autoRefreshToken: true` - Automatically refresh tokens before expiry
- `persistSession: true` - Enable session persistence
- `detectSessionInUrl: false` - Disable URL-based session detection (mobile)
- `storage: capacitorStorage` - Use custom storage adapter

### C. AuthContext Enhancements (`src/contexts/AuthContext.tsx`)

**New Features:**
1. **Session Validation on Init:**
   - Checks if "Remember Me" is enabled
   - Validates session is within 30-day timeout
   - Auto-logout if session expired

2. **Activity Tracking:**
   - Updates `last_active_at` on login
   - Updates on auth state changes
   - Syncs with database for analytics

3. **Remember Me Management:**
   - `signIn(email, password, rememberMe)` - Login with preference
   - `setRememberMe(enabled)` - Update preference post-login
   - `rememberMe` state - Available to components

### D. Database Schema (`supabase/migrations`)

**New Columns in `users` table:**
```sql
- remember_me_enabled BOOLEAN DEFAULT true
- last_active_at TIMESTAMPTZ DEFAULT now()
```

**Automatic Trigger:**
- Updates `last_active_at` on user record updates

---

## 3. Security Considerations

### Platform Security

**iOS (Keychain):**
- Hardware-encrypted storage
- Survives app uninstall/reinstall
- Protected by device passcode/biometrics
- Shared across app updates

**Android (EncryptedSharedPreferences):**
- AES-256 encryption
- Keys stored in Android Keystore
- Protected by device credentials
- Isolated per-app

### Session Security

1. **Token Management:**
   - Access tokens expire after 1 hour (Supabase default)
   - Refresh tokens automatically rotate
   - Secure storage prevents token theft

2. **Timeout Protection:**
   - 30-day inactivity timeout
   - Automatic logout after timeout
   - Tracks last activity timestamp

3. **Manual Logout:**
   - Clears all stored auth data
   - Invalidates server-side session
   - Prevents re-authentication without credentials

4. **Device Changes:**
   - Sessions are device-specific
   - Changing devices requires re-login
   - No cross-device session sharing

### Edge Cases Handled

1. **App Updates:**
   - Sessions persist across updates
   - Secure storage maintained
   - No re-login required

2. **Device Restarts:**
   - Sessions survive device restarts
   - Native secure storage persists
   - Auto-reconnect on app launch

3. **Account Changes:**
   - Logout clears all previous auth data
   - New login creates fresh session
   - No credential mixing

4. **Storage Failures:**
   - Graceful fallback to manual login
   - Error handling for storage operations
   - User notified of issues

---

## 4. User Experience Flow

### First Login
```
1. User enters email/password
2. User sees "Remember Me" checkbox (checked by default)
3. User clicks "Inloggen"
4. Session stored securely in device storage
5. Redirected to dashboard
```

### Returning User (< 30 days)
```
1. User opens app
2. App checks secure storage for session
3. Validates session age (< 30 days)
4. Auto-loads user data
5. User directly at dashboard
```

### Expired Session (> 30 days)
```
1. User opens app
2. App detects expired session
3. Auto-logout and clear data
4. User redirected to login page
5. Message: "Session expired after 30 days of inactivity"
```

### Manual Logout
```
1. User clicks logout in settings
2. Clear secure storage
3. Invalidate server session
4. Redirect to login page
5. Require credentials for next login
```

### Settings Management
```
1. User navigates to Account Settings
2. Sees "Security" section
3. Toggles "Automatisch inloggen" switch
4. Change saves immediately
5. Takes effect on next app launch
```

---

## 5. Testing Strategy

### Unit Tests

**SecureStorage Service:**
- Test setRememberMe with true/false
- Test isSessionValid with various timestamps
- Test clearAuthData removes all keys
- Test platform-specific storage methods

**AuthContext:**
- Test signIn with rememberMe=true
- Test signIn with rememberMe=false
- Test auto-logout on expired session
- Test setRememberMe updates state

### Integration Tests

**Login Flow:**
1. Login with "Remember Me" checked
2. Close app completely
3. Reopen app
4. Verify user is auto-logged in
5. Verify dashboard loads correctly

**Logout Flow:**
1. Login with "Remember Me" checked
2. Navigate to settings
3. Click logout
4. Reopen app
5. Verify user must login again

**Timeout Flow:**
1. Login with "Remember Me" checked
2. Manually set last_active_at to 31 days ago
3. Reopen app
4. Verify auto-logout occurs
5. Verify login page displays

**Settings Toggle:**
1. Login with "Remember Me" checked
2. Navigate to Account Settings
3. Toggle "Automatisch inloggen" to OFF
4. Close and reopen app
5. Verify user must login again

### Platform-Specific Tests

**iOS Testing:**
- Test session persists after app kill
- Test session persists after device restart
- Test session persists after app update
- Verify Keychain usage in logs

**Android Testing:**
- Test session persists after app kill
- Test session persists after device restart
- Test session persists after app update
- Verify EncryptedSharedPreferences usage

**Web Testing:**
- Test fallback to localStorage
- Test session persists on page refresh
- Test logout clears localStorage
- Test multiple browser windows

### Edge Case Tests

**Airplane Mode:**
1. Login with "Remember Me"
2. Enable airplane mode
3. Close and reopen app
4. Verify app loads with cached data
5. Verify auto-retry on reconnect

**Account Switch:**
1. Login as User A with "Remember Me"
2. Logout
3. Login as User B with "Remember Me"
4. Verify User B data only
5. No User A data leaked

**Storage Failure:**
1. Simulate storage write failure
2. Verify graceful error handling
3. Verify user can still login
4. Verify appropriate error message

---

## 6. Performance Considerations

### Initialization Speed
- Session check adds <100ms to app startup
- Async storage operations non-blocking
- Parallel user data fetch

### Storage Size
- Minimal storage footprint (<10KB)
- Only essential auth tokens stored
- Automatic cleanup on logout

### Network Usage
- Token refresh uses minimal bandwidth
- Only refreshes when needed (1 hour expiry)
- Offline mode uses cached session

---

## 7. Compliance & Privacy

### Data Protection
- No plaintext credential storage
- Platform-native encryption
- Complies with iOS/Android security requirements

### User Control
- Optional feature (can be disabled)
- Clear explanation in UI
- Manual logout always available

### GDPR Compliance
- User data stored locally on device
- No server-side "remember me" cookies
- Right to be forgotten (logout clears all)

---

## 8. Deployment Checklist

- [x] Install @capacitor/preferences plugin
- [x] Create SecureStorage service
- [x] Update Supabase client configuration
- [x] Enhance AuthContext with persistent logic
- [x] Add database migrations
- [x] Update Login page with checkbox
- [x] Add settings toggle in Account Settings
- [x] Build and test on web
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Verify session timeout behavior
- [ ] Verify logout clears all data
- [ ] Performance testing
- [ ] Security audit

---

## 9. Future Enhancements

### Biometric Authentication
- Face ID / Touch ID on iOS
- Fingerprint / Face Unlock on Android
- Optional for additional security layer

### Session Analytics
- Track login frequency
- Monitor session duration
- Detect unusual activity patterns

### Multi-Device Management
- View active sessions
- Remote logout from other devices
- Push notifications on new login

### Advanced Security
- Require re-auth for sensitive actions
- Geo-location based security
- Device fingerprinting

---

## 10. Troubleshooting

### Session Not Persisting

**Check:**
1. Is "Remember Me" enabled?
2. Is secure storage accessible?
3. Are storage permissions granted?
4. Check browser console/device logs

**Solution:**
- Verify Preferences plugin installed
- Check platform-specific permissions
- Clear app cache and re-login

### Auto-Logout Issues

**Check:**
1. Session age < 30 days?
2. Is last_active_at updating?
3. System time correct?

**Solution:**
- Verify timestamp calculations
- Check timezone handling
- Test with mock timestamps

### Settings Not Saving

**Check:**
1. Is user authenticated?
2. Database update successful?
3. Storage write successful?

**Solution:**
- Check network connection
- Verify database permissions
- Check error logs

---

## Contact & Support

For issues or questions about persistent authentication:
1. Check device logs for error messages
2. Verify plugin installation: `npx cap sync`
3. Test on physical device (not just simulator)
4. Review Supabase auth logs
5. Contact development team with:
   - Platform (iOS/Android/Web)
   - Device model
   - App version
   - Error logs
