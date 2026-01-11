import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  familyId: string;
  title: string;
  body: string;
  url: string;
  excludeUserId?: string;
}

async function getAccessToken(): Promise<string> {
  const serviceAccount = {
    client_email: Deno.env.get("FCM_CLIENT_EMAIL")!,
    private_key: Deno.env.get("FCM_PRIVATE_KEY")!.replace(/\\n/g, "\n"),
  };

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const privateKeyPem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureArray = new Uint8Array(signatureBuffer);
  const signature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const projectId = Deno.env.get("FCM_PROJECT_ID")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { familyId, title, body, url, excludeUserId } = payload;

    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", familyId)
      .eq("status", "ACTIVE");

    if (!familyMembers || familyMembers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No family members found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userIds = familyMembers
      .map((m) => m.user_id)
      .filter((id) => id !== excludeUserId);

    const { data: notificationSettings } = await supabase
      .from("notification_settings")
      .select("fcm_token, push_notifications_enabled")
      .in("user_id", userIds)
      .eq("push_notifications_enabled", true)
      .not("fcm_token", "is", null);

    if (!notificationSettings || notificationSettings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No FCM tokens found", sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokens = notificationSettings
      .map((s) => s.fcm_token)
      .filter((token): token is string => token !== null);

    const accessToken = await getAccessToken();

    const sendPromises = tokens.map(async (token) => {
      try {
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title,
                  body,
                },
                webpush: {
                  fcm_options: {
                    link: url,
                  },
                  notification: {
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                  },
                },
                data: {
                  url,
                },
              },
            }),
          }
        );

        const result = await fcmResponse.json();
        return { success: fcmResponse.ok, result };
      } catch (error) {
        console.error("Error sending FCM notification:", error);
        return { success: false, error };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-fcm-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});