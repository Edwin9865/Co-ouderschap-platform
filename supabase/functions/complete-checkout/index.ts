// supabase/functions/complete-checkout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type CompleteCheckoutRequest = {
  sessionId: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mustEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function stripeGet(url: string, secretKey: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Stripe API error (${res.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    // ---- Auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Missing authorization header" });
    }
    const jwt = authHeader.replace("Bearer ", "").trim();

    // ---- Required envs (IMPORTANT: these are Supabase Function secrets, NOT Netlify envs)
    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");

    // Optional but recommended
    const STRIPE_PRICE_PLUS = Deno.env.get("STRIPE_PRICE_PLUS") ?? "";
    const STRIPE_PRICE_PRO = Deno.env.get("STRIPE_PRICE_PRO") ?? "";

    // ---- Verify user (service role)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid JWT", message: userErr?.message ?? "Auth failed" });
    }

    // ---- Body
    let body: CompleteCheckoutRequest;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const sessionId = body?.sessionId?.trim();
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    // ---- Fetch checkout session (try with expand)
    const sessionUrl = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
    sessionUrl.searchParams.append("expand[]", "subscription");
    sessionUrl.searchParams.append("expand[]", "line_items");

    const session = await stripeGet(sessionUrl.toString(), STRIPE_SECRET_KEY);

    const familyId = session?.metadata?.family_id;
    const customerId = session?.customer;
    const subscriptionRef = session?.subscription; // can be object OR string

    if (!familyId) return json(400, { error: "No family_id in session metadata" });
    if (!customerId) return json(400, { error: "No customer on session" });
    if (!subscriptionRef) return json(400, { error: "No subscription on session" });

    // ---- Ensure we have a full subscription object
    let stripeSub: any;
    if (typeof subscriptionRef === "string") {
      // fetch subscription by id
      stripeSub = await stripeGet(`https://api.stripe.com/v1/subscriptions/${subscriptionRef}`, STRIPE_SECRET_KEY);
    } else {
      stripeSub = subscriptionRef;
      // safety: if critical fields missing, fetch full object
      if (!stripeSub?.current_period_start || !stripeSub?.items?.data?.length) {
        const id = stripeSub?.id;
        if (!id) return json(400, { error: "Subscription object missing id" });
        stripeSub = await stripeGet(`https://api.stripe.com/v1/subscriptions/${id}`, STRIPE_SECRET_KEY);
      }
    }

    // ---- Determine plan via priceId
    const priceId = stripeSub?.items?.data?.[0]?.price?.id ?? "";
    let plan: "FREE" | "PLUS" | "PRO" = "FREE";
    if (priceId && STRIPE_PRICE_PLUS && priceId === STRIPE_PRICE_PLUS) plan = "PLUS";
    if (priceId && STRIPE_PRICE_PRO && priceId === STRIPE_PRICE_PRO) plan = "PRO";

    // ---- Determine status
    const stripeStatus = stripeSub?.status;
    let status: string = "ACTIVE";
    if (stripeStatus === "trialing") status = "TRIALING";
    else if (stripeStatus === "past_due") status = "PAST_DUE";
    else if (stripeStatus === "canceled") status = "CANCELLED";
    else if (stripeStatus === "incomplete") status = "INCOMPLETE";
    else if (stripeStatus === "unpaid") status = "PAST_DUE";

    // ---- Safe date conversion
    const cps = Number(stripeSub?.current_period_start);
    const cpe = Number(stripeSub?.current_period_end);

    const current_period_start = Number.isFinite(cps) && cps > 0 ? new Date(cps * 1000).toISOString() : null;
    const current_period_end = Number.isFinite(cpe) && cpe > 0 ? new Date(cpe * 1000).toISOString() : null;

    const trial_start = stripeSub?.trial_start ? new Date(Number(stripeSub.trial_start) * 1000).toISOString() : null;
    const trial_end = stripeSub?.trial_end ? new Date(Number(stripeSub.trial_end) * 1000).toISOString() : null;

    // ---- Upsert subscription row (works even if row didn't exist yet)
    const payload = {
      family_id: familyId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub.id,
      current_period_start,
      current_period_end,
      cancel_at_period_end: !!stripeSub.cancel_at_period_end,
      trial_start,
      trial_end,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(payload, { onConflict: "family_id" });

    if (upsertError) {
      return json(500, { error: "DB update failed", message: upsertError.message, details: upsertError });
    }

    return json(200, { success: true, plan, status, subscriptionId: stripeSub.id });
  } catch (err) {
    console.error("[complete-checkout] ERROR:", err);
    return json(500, { error: err?.message ?? "Unknown error" });
  }
});