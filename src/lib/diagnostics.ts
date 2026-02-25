import { supabase } from './supabase';

export async function runJWTDiagnostics() {
  console.log('=== JWT DIAGNOSTICS START ===');

  // Test 1: Get current session
  console.log('\n[TEST 1] Getting current session...');
  const { data: { session: currentSession }, error: getError } = await supabase.auth.getSession();

  console.log('Current session:', {
    hasSession: !!currentSession,
    hasToken: !!currentSession?.access_token,
    hasRefreshToken: !!currentSession?.refresh_token,
    error: getError,
  });

  if (currentSession?.access_token) {
    try {
      const parts = currentSession.access_token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;

      console.log('Current JWT:', {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        expiresInSeconds: expiresIn,
        isExpired: expiresIn <= 0,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        aud: payload.aud,
      });
    } catch (e) {
      console.error('Failed to decode current JWT:', e);
    }
  }

  // Test 2: Refresh session
  console.log('\n[TEST 2] Refreshing session...');
  const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();

  console.log('Refresh result:', {
    hasSession: !!newSession,
    hasToken: !!newSession?.access_token,
    error: refreshError,
  });

  if (newSession?.access_token) {
    try {
      const parts = newSession.access_token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;

      console.log('Refreshed JWT:', {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        expiresInSeconds: expiresIn,
        isExpired: expiresIn <= 0,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        aud: payload.aud,
      });
    } catch (e) {
      console.error('Failed to decode refreshed JWT:', e);
    }
  }

  // Test 3: Verify with getUser
  console.log('\n[TEST 3] Verifying JWT with getUser...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('User verification:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: userError?.message,
  });

  // Test 4: Test edge function call
  console.log('\n[TEST 4] Testing edge function auth...');
  if (newSession?.access_token) {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`;

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          priceId: 'test_price_id',
          familyId: 'test_family_id'
        }),
      });

      console.log('Edge function response:', {
        status: response.status,
        statusText: response.statusText,
      });

      const data = await response.json();
      console.log('Edge function data:', data);
    } catch (e) {
      console.error('Edge function call failed:', e);
    }
  }

  console.log('\n=== JWT DIAGNOSTICS END ===');
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).runJWTDiagnostics = runJWTDiagnostics;
}
