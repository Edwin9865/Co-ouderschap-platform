// supabase/functions/sync-stripe-subscription/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VERSION = "v2026-03-23-cancel-at-date-fallback";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SyncRequest {
  familyId: string;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mustEnv(name: string) {
  const v = (Deno.env.get(name) ?? "").trim();
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed", version: VERSION });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing authorization header", version: VERSION });

    const jwt = authHeader.replace("Bearer ", "").trim();

    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    const ANON = mustEnv("SUPABASE_ANON_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");

    const PRICE_PLUS = (Deno.env.get("STRIPE_PRICE_PLUS") ?? "").trim();
    const PRICE_PRO = (Deno.env.get("STRIPE_PRICE_PRO") ?? "").trim();

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !authData?.user) {
      return json(401, { error: "Invalid JWT", message: authError?.message || "Authentication failed", version: VERSION });
    }
    const user = authData.user;

    const { familyId }: SyncRequest = await req.json();
    const famId = (familyId ?? "").trim();
    if (!famId) return json(400, { error: "Missing familyId", version: VERSION });

    const supabaseClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    // ✅ Must be ACTIVE PARENT
    const { data: familyMember, error: fmErr } = await supabaseClient
      .from("family_members")
      .select("role,status")
      .eq("family_id", famId)
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (fmErr) return json(500, { error: "Membership check failed", message: fmErr.message, version: VERSION });
    if (!familyMember || familyMember.role !== "PARENT") {
      return json(403, { error: "Only parents can sync subscriptions", version: VERSION });
    }

    const { data: subscription, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("family_id", famId)
      .maybeSingle();

    if (subErr) return json(500, { error: "Failed to read subscription", message: subErr.message, version: VERSION });

    if (!subscription?.stripe_subscription_id) {
      return json(404, { error: "No subscription found to sync", subscription: null, version: VERSION });
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}?expand[]=items.data.price`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
    );

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      return json(500, { error: "Stripe API error", details: errorText, version: VERSION });
    }

    const stripeSubscription = await stripeResponse.json();

    // Diagnostische logging — zichtbaar in Supabase Edge Function logs
    console.log("[SYNC] Stripe response:", JSON.stringify({
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      cancel_at: stripeSubscription.cancel_at,
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
      trial_start: stripeSubscription.trial_start,
      trial_end: stripeSubscription.trial_end,
    }));

    const priceId = stripeSubscription?.items?.data?.[0]?.price?.id ?? "";

    let plan = "FREE";
    if (priceId && PRICE_PLUS && priceId === PRICE_PLUS) plan = "PLUS";
    else if (priceId && PRICE_PRO && priceId === PRICE_PRO) plan = "PRO";

    // Plan altijd FREE als subscription geannuleerd is
    if (stripeSubscription.status === "canceled") plan = "FREE";

    let status = "ACTIVE";
    if (stripeSubscription.status === "trialing") status = "TRIALING";
    else if (stripeSubscription.status === "past_due") status = "PAST_DUE";
    else if (stripeSubscription.status === "canceled") status = "CANCELLED";
    else if (stripeSubscription.status === "incomplete") status = "INCOMPLETE";
    else if (stripeSubscription.status === "unpaid") status = "PAST_DUE";

    const cps = stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start * 1000).toISOString() : null;
    // Stripe gebruikt cancel_at_period_end voor normale opzeggingen,
    // maar cancel_at (specifieke datum) voor trial-opzeggingen via de portal.
    // Gebruik cancel_at als fallback wanneer current_period_end null is.
    const cpe_raw = stripeSubscription.current_period_end ?? stripeSubscription.cancel_at;
    const cpe = cpe_raw ? new Date(cpe_raw * 1000).toISOString() : null;
    const ts = stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : null;
    const te_raw = stripeSubscription.trial_end ?? stripeSubscription.cancel_at;
    const te = te_raw ? new Date(te_raw * 1000).toISOString() : null;
    const cape = !!stripeSubscription.cancel_at_period_end || !!stripeSubscription.cancel_at;

    const payload = {
      plan,
      status,
      current_period_start: cps,
      current_period_end: cpe,
      cancel_at_period_end: cape,
      trial_start: ts,
      trial_end: te,
      updated_at: new Date().toISOString(),
    };

    console.log("[SYNC] Update payload:", JSON.stringify(payload));

    // .select() teruggeven zodat we kunnen zien wat er werkelijk in de DB terechtkomt
    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("family_id", famId)
      .select("plan, status, current_period_start, current_period_end, cancel_at_period_end, trial_start, trial_end")
      .maybeSingle();

    if (updateError) {
      console.error("[SYNC] Update error:", updateError);
      return json(500, { error: "Failed to update subscription", message: updateError.message, version: VERSION });
    }

    console.log("[SYNC] Updated row:", JSON.stringify(updatedRow));

    return json(200, {
      success: true,
      plan,
      status,
      stripe: { status: stripeSubscription.status, cancel_at_period_end: cape, cps, cpe, ts, te },
      db: updatedRow,
      version: VERSION,
    });
  } catch (error: any) {
    console.error("[SYNC] Error:", error);
    return json(500, { error: error?.message ?? "Unknown error", version: VERSION });
  }
});