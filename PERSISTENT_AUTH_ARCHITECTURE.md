# Persistent Authentication - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │   Login.tsx      │              │  AccountSettings.tsx │    │
│  │                  │              │                      │    │
│  │  [Remember Me]   │              │  [Auto Login Toggle] │    │
│  │     Checkbox     │              │      Switch          │    │
│  └────────┬─────────┘              └──────────┬───────────┘    │
│           │                                    │                │
└───────────┼────────────────────────────────────┼────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     ┌──────────────────────┐                    │
│                     │   AuthContext.tsx    │                    │
│                     │                      │                    │
│                     │  • Session State     │                    │
│                     │  • User State        │                    │
│                     │  • Remember Me State │                    │
│                     │  • signIn()          │                    │
│                     │  • signOut()         │                    │
│                     │  • setRememberMe()   │                    │
│                     └───────┬──────────────┘                    │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
┌──────────────────┐ ┌────────────────┐ ┌─────────────────┐
│  SecureStorage   │ │ Supabase Auth  │ │   Database      │
│    Service       │ │     Client     │ │   (Users)       │
├──────────────────┤ ├────────────────┤ ├─────────────────┤
│                  │ │                │ │                 │
│ • getRememberMe()│ │ • getSession() │ │ • remember_me_  │
│ • setRememberMe()│ │ • signIn()     │ │   enabled       │
│ • updateLast     │ │ • signOut()    │ │ • last_active_  │
│   Active()       │ │ • refresh      │ │   at            │
│ • isSession      │ │   Token()      │ │                 │
│   Valid()        │ │                │ │                 │
│ • clearAuthData()│ │                │ │                 │
│                  │ │                │ │                 │
└────────┬─────────┘ └────────┬───────┘ └─────────┬───────┘
         │                    │                    │
         ▼                    ▼                    │
┌─────────────────────────────────────────┐       │
│         STORAGE ADAPTER LAYER           │       │
├─────────────────────────────────────────┤       │
│                                         │       │
│  capacitorStorage = {                  │       │
│    getItem(key)                        │       │
│    setItem(key, value)                 │       │
│    removeItem(key)                     │       │
│  }                                     │       │
│                                         │       │
└────────┬────────────────────────────────┘       │
         │                                        │
         ▼                                        ▼
┌─────────────────────────────────────────────────────┐
│           PLATFORM STORAGE LAYER                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │    iOS      │  │   Android    │  │    Web    │ │
│  │             │  │              │  │           │ │
│  │  Keychain   │  │  Encrypted   │  │  Local    │ │
│  │  Services   │  │  Shared      │  │  Storage  │ │
│  │             │  │  Preferences │  │           │ │
│  │  AES-256    │  │  AES-256     │  │  Base64   │ │
│  │  Hardware   │  │  Keystore    │  │  Text     │ │
│  │  Encrypted  │  │  Protected   │  │           │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Authentication Flow Diagram

### Initial Login Flow

```
User Opens App
      │
      ▼
Check Secure Storage
      │
      ├─── No Session ──────────────┐
      │                             │
      ▼                             ▼
Show Login Page              [First Time User]
      │
      ▼
User Enters Credentials
      │
      ▼
[Remember Me] Checkbox
   (checked by default)
      │
      ▼
Click "Inloggen"
      │
      ▼
AuthContext.signIn(email, password, rememberMe=true)
      │
      ├─── Supabase Auth ────> Validate Credentials
      │                              │
      │                              ▼
      │                         Generate Tokens
      │                              │
      ▼                              ▼
SecureStorage.setRememberMe(true)   │
      │                              │
      ▼                              │
SecureStorage.updateLastActive()    │
      │                              │
      ▼                              ▼
Store Tokens via Capacitor Preferences
      │
      ├─── iOS ──────> Keychain (Encrypted)
      │
      ├─── Android ──> EncryptedSharedPreferences
      │
      └─── Web ──────> localStorage
      │
      ▼
Fetch User Data
      │
      ▼
Update AuthContext State
      │
      ▼
Redirect to Dashboard
      │
      ▼
[User Successfully Logged In]
```

---

### Returning User Flow (Session Valid)

```
User Opens App
      │
      ▼
AuthContext.useEffect() Init
      │
      ▼
SecureStorage.getRememberMe()
      │
      ├─── false ──────────────────┐
      │                            │
      │                            ▼
      │                    Show Login Page
      │
      ├─── true ───────────────────┐
      │                            │
      ▼                            ▼
SecureStorage.isSessionValid()
      │
      ├─── Expired (>30 days) ────┐
      │                            │
      │                            ▼
      │                SecureStorage.clearAuthData()
      │                            │
      │                            ▼
      │                    Supabase.auth.signOut()
      │                            │
      │                            ▼
      │                    Show Login Page
      │
      ├─── Valid (<30 days) ──────┐
      │                            │
      ▼                            ▼
Supabase.auth.getSession()
      │
      ├─── No Token ──────────────┐
      │                            │
      │                            ▼
      │                    Show Login Page
      │
      ├─── Token Exists ──────────┐
      │                            │
      ▼                            ▼
Check Token Expiry
      │
      ├─── Expired ───────────────┐
      │                            │
      │                            ▼
      │                    Auto Refresh Token
      │                            │
      ├─── Valid ─────────────────┘
      │
      ▼
Fetch User Data from Database
      │
      ▼
Update AuthContext State
      │
      ▼
SecureStorage.updateLastActive()
      │
      ▼
Navigate to Dashboard
      │
      ▼
[User Auto-Logged In]
Total Time: < 100ms
```

---

### Logout Flow

```
User Clicks Logout
      │
      ▼
AuthContext.signOut()
      │
      ├────────────────────────────┐
      │                            │
      ▼                            ▼
localStorage.removeItem()    SecureStorage.clearAuthData()
  ('helper_selected_family')        │
      │                            ├─── Remove 'coparenting_remember_me'
      │                            │
      │                            ├─── Remove 'coparenting_last_active'
      │                            │
      ▼                            ▼
Supabase.auth.signOut()
      │
      ├─── Clear Tokens ──────────┐
      │                            │
      │                            ▼
      │                    Remove from Secure Storage
      │                            │
      │                            ├─── iOS: Clear Keychain
      │                            │
      │                            ├─── Android: Clear EncryptedPrefs
      │                            │
      │                            └─── Web: Clear localStorage
      │
      ▼
Invalidate Server Session
      │
      ▼
Clear AuthContext State
      │
      ├─── setSession(null)
      │
      ├─── setUser(null)
      │
      └─── setFamilyMemberships([])
      │
      ▼
Navigate to Login Page
      │
      ▼
[User Logged Out]
[All Auth Data Cleared]
```

---

## Data Flow Diagram

### Session Persistence Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                    APPLICATION STATE                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  AuthContext {                                           │
│    session: Session | null                               │
│    user: User | null                                     │
│    rememberMe: boolean                                   │
│  }                                                        │
│                                                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Persisted to
                     ▼
┌──────────────────────────────────────────────────────────┐
│                   SECURE STORAGE                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Keys:                                                    │
│  • coparenting_remember_me = "true" | "false"           │
│  • coparenting_last_active = "2026-02-18T10:30:00Z"     │
│                                                           │
│  Supabase Tokens:                                        │
│  • sb-[project]-auth-token = { access, refresh }        │
│                                                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ Encrypted Storage
                     ▼
┌──────────────────────────────────────────────────────────┐
│                PLATFORM NATIVE STORAGE                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  iOS Keychain:                                           │
│  Service: com.coparenting.app                            │
│  Account: coparenting_*                                  │
│  Data: [AES-256 Encrypted Blob]                          │
│  Access: kSecAttrAccessibleAfterFirstUnlock              │
│                                                           │
│  Android EncryptedSharedPreferences:                     │
│  File: CapacitorStorage                                  │
│  Master Key: AndroidKeyStore                             │
│  Encryption: AES-256-GCM                                  │
│  Key Encryption: RSA-2048                                │
│                                                           │
│  Web localStorage:                                       │
│  Origin: https://your-app.com                            │
│  Keys: coparenting_*, sb-*                               │
│  Data: [Base64 Encoded]                                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌───────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                      │
└───────────────────────────────────────────────────────┘

Layer 1: Transport Security
┌───────────────────────────────────────────────────────┐
│  • HTTPS/TLS 1.3                                      │
│  • Certificate Pinning (optional)                     │
│  • Secure WebSocket (wss://)                          │
└───────────────────────────────────────────────────────┘
                        ▼

Layer 2: Authentication Tokens
┌───────────────────────────────────────────────────────┐
│  • JWT Access Token (1 hour expiry)                   │
│  • JWT Refresh Token (auto-rotating)                  │
│  • Token Rotation on each refresh                     │
│  • Server-side token validation                       │
└───────────────────────────────────────────────────────┘
                        ▼

Layer 3: Session Management
┌───────────────────────────────────────────────────────┐
│  • 30-day inactivity timeout                          │
│  • Activity timestamp tracking                        │
│  • Automatic session validation                       │
│  • Graceful token refresh                             │
└───────────────────────────────────────────────────────┘
                        ▼

Layer 4: Client-Side Storage
┌───────────────────────────────────────────────────────┐
│  iOS: Keychain Services                               │
│  • AES-256 Hardware Encryption                        │
│  • Secure Enclave (on supported devices)              │
│  • Biometric Protection (optional)                    │
│                                                        │
│  Android: EncryptedSharedPreferences                  │
│  • AES-256-GCM Encryption                             │
│  • Android Keystore for key management                │
│  • Hardware-backed encryption (on supported devices)  │
│                                                        │
│  Web: localStorage                                    │
│  • Base64 encoded (not encrypted)                     │
│  • Same-origin policy protection                      │
│  • HttpOnly cookies for sensitive data (future)       │
└───────────────────────────────────────────────────────┘
                        ▼

Layer 5: Application Security
┌───────────────────────────────────────────────────────┐
│  • No logging of sensitive data                       │
│  • Memory cleared on logout                           │
│  • Secure random for token generation                 │
│  • CORS policies enforced                             │
└───────────────────────────────────────────────────────┘
```

---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                      COMPONENT TREE                          │
└─────────────────────────────────────────────────────────────┘

App.tsx
  │
  ├─── AuthProvider (Context)
  │      │
  │      ├─── Provides: session, user, rememberMe
  │      ├─── Provides: signIn, signOut, setRememberMe
  │      │
  │      ├─── Uses: SecureStorage
  │      ├─── Uses: Supabase Auth
  │      └─── Uses: Database
  │
  ├─── Router
  │      │
  │      ├─── Public Routes
  │      │      │
  │      │      └─── Login.tsx
  │      │             │
  │      │             ├─── Reads: rememberMe checkbox state
  │      │             ├─── Calls: signIn(email, password, rememberMe)
  │      │             └─── Redirects: /dashboard on success
  │      │
  │      └─── Protected Routes (requires auth)
  │             │
  │             ├─── Dashboard.tsx
  │             │      │
  │             │      └─── Uses: session, user
  │             │
  │             ├─── Settings
  │             │      │
  │             │      └─── Instellingen.tsx
  │             │             │
  │             │             └─── AccountSettings.tsx
  │             │                    │
  │             │                    ├─── Reads: rememberMe state
  │             │                    ├─── Displays: Auto-login toggle
  │             │                    └─── Calls: setRememberMe(enabled)
  │             │
  │             └─── Other protected pages...
  │
  └─── ProtectedRoute Component
         │
         ├─── Checks: session !== null
         ├─── Redirects: /login if no session
         └─── Renders: children if authenticated
```

---

## Token Lifecycle

```
┌──────────────────────────────────────────────────────┐
│                  TOKEN LIFECYCLE                      │
└──────────────────────────────────────────────────────┘

 Time: 0 min               Token Created
    │                            │
    │                            ▼
    │                   ┌──────────────────┐
    │                   │  Access Token    │
    │                   │  Expires: 60 min │
    │                   │  Refresh Token   │
    │                   │  Expires: Never  │
    │                   └──────────────────┘
    │                            │
    │                            ▼
    │                    Stored in Secure Storage
    │                            │
    ▼                            ▼
 Time: 59 min          Token About to Expire
    │                            │
    │                            ▼
    │                   Auto-Refresh Triggered
    │                            │
    │                            ├─── Send Refresh Token
    │                            │
    │                            ▼
    │                   Server Validates Refresh Token
    │                            │
    │                            ├─── Generate New Access Token
    │                            │
    │                            ├─── Rotate Refresh Token
    │                            │
    │                            ▼
    │                   Update Secure Storage
    │                            │
    │                            ▼
    │                   ┌──────────────────┐
    │                   │  New Access Token│
    │                   │  Expires: 60 min │
    │                   │  New Refresh Token│
    │                   └──────────────────┘
    │                            │
    ▼                            ▼
 Time: continues...    Cycle Repeats Every Hour

 Special Cases:
 ├─── User Inactive for 30 days
 │      │
 │      ├─── Session Marked Expired
 │      │
 │      ├─── Auto-Logout on Next Open
 │      │
 │      └─── Clear All Tokens
 │
 └─── User Clicks Logout
        │
        ├─── Invalidate Server Session
        │
        ├─── Clear All Tokens
        │
        └─── Remove from Secure Storage
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────┐
│                ERROR HANDLING                         │
└──────────────────────────────────────────────────────┘

Storage Operation Failure
    │
    ├─── SecureStorage.setItem() throws error
    │      │
    │      ├─── Catch error
    │      │
    │      ├─── Log to console (not to user)
    │      │
    │      ├─── Fallback: Continue without persistence
    │      │
    │      └─── Return: success=false
    │
    ├─── SecureStorage.getItem() throws error
    │      │
    │      ├─── Catch error
    │      │
    │      ├─── Return: null (no session found)
    │      │
    │      └─── Show login page
    │
    └─── SecureStorage.removeItem() throws error
           │
           ├─── Catch error
           │
           ├─── Log warning
           │
           └─── Continue (best effort)

Token Refresh Failure
    │
    ├─── Network Error
    │      │
    │      ├─── Retry once (exponential backoff)
    │      │
    │      ├─── If retry fails
    │      │
    │      └─── Continue with cached session (offline mode)
    │
    ├─── Invalid Refresh Token
    │      │
    │      ├─── Clear all auth data
    │      │
    │      ├─── Logout user
    │      │
    │      └─── Redirect to login
    │
    └─── Server Error (5xx)
           │
           ├─── Retry 3 times
           │
           ├─── If all fail
           │
           └─── Show error message + logout

Session Validation Failure
    │
    ├─── Expired Session (>30 days)
    │      │
    │      ├─── Clear auth data
    │      │
    │      ├─── Show message: "Session expired"
    │      │
    │      └─── Redirect to login
    │
    ├─── Corrupted Session Data
    │      │
    │      ├─── Clear auth data
    │      │
    │      ├─── Log error details
    │      │
    │      └─── Redirect to login
    │
    └─── Missing Required Data
           │
           ├─── Attempt to restore from server
           │
           ├─── If restore fails
           │
           └─── Logout and redirect to login
```

---

This architecture ensures robust, secure, and user-friendly persistent authentication across all platforms.
