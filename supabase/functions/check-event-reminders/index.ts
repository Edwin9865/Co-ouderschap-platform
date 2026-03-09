import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// This function should be called by a pg_cron job every minute:
// SELECT cron.schedule('check-event-reminders', '* * * * *',
//   $$SELECT net.http_post(url:='<SUPABASE_URL>/functions/v1/check-event-reminders',
//     headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
//     body:='{}'::jsonb) as request_id$$);

// Database migration required:
// ALTER TABLE events
//   ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
//   ADD COLUMN IF NOT EXISTS reminder_minutes integer DEFAULT 15,
//   ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
//
// ALTER TABLE notification_settings
//   ADD COLUMN IF NOT EXISTS subscription_notifications_enabled boolean NOT NULL DEFAULT true,
//   ADD COLUMN IF NOT EXISTS helper_notifications_enabled boolean NOT NULL DEFAULT true;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function getAccessToken(): Promise<string> {
  const serviceAccount = {
    client_email: Deno.env.get("FCM_CLIENT_EMAIL")!,
    private_key: Deno.env.get("FCM_PRIVATE_KEY")!.replace(/\\n/g, "\n"),
  };

  const header = { alg: "RS256", typ: "JWT" };
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
    "pkcs8", binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signatureInput));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${signatureInput}.${signature}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const projectId = Deno.env.get("FCM_PROJECT_ID")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find events with reminders due (not yet sent, happening in the future, within the reminder window)
    const { data: events, error } = await supabase
      .from("events")
      .select("id, family_id, title, start_at, reminder_minutes, child_id, description")
      .eq("reminder_enabled", true)
      .is("reminder_sent_at", null)
      .gt("start_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching events:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const now = new Date();
    const eventsToNotify = (events || []).filter((event: any) => {
      const eventTime = new Date(event.start_at);
      const reminderTime = new Date(eventTime.getTime() - (event.reminder_minutes || 15) * 60 * 1000);
      // Check if we're within a 2-minute window of the reminder time (to account for cron delay)
      return reminderTime <= now && now <= new Date(reminderTime.getTime() + 2 * 60 * 1000);
    });

    console.log(`Found ${eventsToNotify.length} events to remind`);

    // Fetch child names for all events that have a child_id
    const childIds = [...new Set(eventsToNotify.filter((e: any) => e.child_id).map((e: any) => e.child_id))];
    let childNames: Record<string, string> = {};
    if (childIds.length > 0) {
      const { data: children } = await supabase
        .from("children")
        .select("id, first_name")
        .in("id", childIds);
      if (children) {
        childNames = Object.fromEntries(children.map((c: any) => [c.id, c.first_name]));
      }
    }

    let successCount = 0;

    for (const event of eventsToNotify) {
      // Get family members' FCM tokens
      const { data: members } = await supabase
        .from("family_members")
        .select("user_id")
        .eq("family_id", event.family_id)
        .eq("status", "ACTIVE");

      if (!members?.length) continue;

      const userIds = members.map((m: any) => m.user_id);

      const { data: settings } = await supabase
        .from("notification_settings")
        .select("fcm_token, user_id")
        .in("user_id", userIds)
        .eq("push_notifications_enabled", true)
        .not("fcm_token", "is", null);

      if (!settings?.length) {
        // Mark as sent even if no tokens, to prevent re-checking
        await supabase.from("events").update({ reminder_sent_at: now.toISOString() }).eq("id", event.id);
        continue;
      }

      const eventTime = new Date(event.start_at);
      const timeStr = eventTime.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
      const dateStr = eventTime.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      const minutesLabel = event.reminder_minutes >= 60
        ? `${event.reminder_minutes / 60} uur`
        : `${event.reminder_minutes} minuten`;

      const childName: string | null = event.child_id ? (childNames[event.child_id] || null) : null;
      const notificationTitle = childName
        ? `Herinnering: ${event.title} — ${childName}`
        : `Herinnering: ${event.title}`;
      const bodyParts = [`${dateStr} om ${timeStr} (over ${minutesLabel})`];
      if (event.description) bodyParts.push(event.description);
      const notificationBody = bodyParts.join("\n");

      const accessToken = await getAccessToken();

      for (const setting of settings) {
        try {
          const fcmPayload = {
            message: {
              token: setting.fcm_token,
              notification: {
                title: notificationTitle,
                body: notificationBody,
              },
              android: {
                priority: "high",
                notification: { channel_id: "fcm_default_channel", sound: "default" },
                data: { url: "/agenda", event_id: event.id, is_reminder: "true", child_name: childName || "", description: event.description || "" },
              },
              webpush: {
                fcm_options: { link: "/agenda" },
                notification: { icon: "/favicon.ico" },
              },
              data: { url: "/agenda", event_id: event.id, is_reminder: "true", child_name: childName || "", description: event.description || "" },
            },
          };

          const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
              body: JSON.stringify(fcmPayload),
            }
          );

          if (response.ok) successCount++;
        } catch (err) {
          console.error("Error sending FCM:", err);
        }
      }

      // Mark reminder as sent
      await supabase.from("events").update({ reminder_sent_at: now.toISOString() }).eq("id", event.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed: eventsToNotify.length, sent: successCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
