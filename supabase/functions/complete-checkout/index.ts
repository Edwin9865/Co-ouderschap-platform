// supabase/functions/complete-checkout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type CompleteCheckoutRequest = { sessionId: string };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string) {
  return (Deno.env.get(name) ?? "").trim();
}

function mustEnv(name: string) {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function toIsoFromStripeSeconds(v: unknown): string | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;

  const d = new Date(n * 1000);
  if (!Number.isFinite(d.getTime())) return null;

  return d.toISOString();
}

async function stripeGet(url: string, secretKey: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      `Stripe API error (${res.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`
    );
  }

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const executionId = req.headers.get("x-deno-execution-id") ?? null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Missing authorization header" });
    }

    // Debug: welke envs zijn aanwezig? (zonder values te tonen)
    console.log("[COMPLETE_CHECKOUT] env presence:", {
      SUPABASE_URL: !!getEnv("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: !!getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      STRIPE_SECRET_KEY: !!getEnv("STRIPE_SECRET_KEY"),
      STRIPE_PRICE_PLUS: !!getEnv("STRIPE_PRICE_PLUS"),
      STRIPE_PRICE_PRO: !!getEnv("STRIPE_PRICE_PRO"),
    });

    const jwt = authHeader.replace("Bearer ", "").trim();

    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");

    const STRIPE_PRICE_PLUS = getEnv("STRIPE_PRICE_PLUS");
    const STRIPE_PRICE_PRO = getEnv("STRIPE_PRICE_PRO");

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid JWT", message: userErr?.message ?? "Auth failed" });
    }

    let body: CompleteCheckoutRequest;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const sessionId = body?.sessionId?.trim();
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    console.log("[COMPLETE_CHECKOUT] Fetching Stripe session:", { sessionId });

    const sessionUrl = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
    sessionUrl.searchParams.append("expand[]", "subscription");

    const session = await stripeGet(sessionUrl.toString(), STRIPE_SECRET_KEY);

    const familyId = session?.metadata?.family_id;
    const customerId = session?.customer;
    const subscriptionRef = session?.subscription;

    console.log("[COMPLETE_CHECKOUT] Session basics:", {
      hasFamilyId: !!familyId,
      hasCustomerId: !!customerId,
      subscriptionRefType: typeof subscriptionRef,
    });

    if (!familyId) return json(400, { error: "No family_id in session metadata" });
    if (!customerId) return json(400, { error: "No customer on session" });
    if (!subscriptionRef) return json(400, { error: "No subscription on session" });

    let stripeSub: any;
    if (typeof subscriptionRef === "string") {
      stripeSub = await stripeGet(
        `https://api.stripe.com/v1/subscriptions/${subscriptionRef}`,
        STRIPE_SECRET_KEY
      );
    } else {
      stripeSub = subscriptionRef;
      if (!stripeSub?.items?.data?.length) {
        const id = stripeSub?.id;
        if (!id) return json(400, { error: "Subscription object missing id" });
        stripeSub = await stripeGet(
          `https://api.stripe.com/v1/subscriptions/${id}`,
          STRIPE_SECRET_KEY
        );
      }
    }

    const priceId = stripeSub?.items?.data?.[0]?.price?.id ?? "";
    console.log("[COMPLETE_CHECKOUT] Subscription details:", {
      subId: stripeSub?.id,
      status: stripeSub?.status,
      priceId,
      current_period_start: stripeSub?.current_period_start,
      current_period_end: stripeSub?.current_period_end,
    });

    let plan: "FREE" | "PLUS" | "PRO" = "FREE";
    if (priceId && STRIPE_PRICE_PLUS && priceId === STRIPE_PRICE_PLUS) plan = "PLUS";
    if (priceId && STRIPE_PRICE_PRO && priceId === STRIPE_PRICE_PRO) plan = "PRO";

    const stripeStatus = stripeSub?.status;
    let status = "ACTIVE";
    if (stripeStatus === "trialing") status = "TRIALING";
    else if (stripeStatus === "past_due") status = "PAST_DUE";
    else if (stripeStatus === "canceled") status = "CANCELLED";
    else if (stripeStatus === "incomplete") status = "INCOMPLETE";
    else if (stripeStatus === "unpaid") status = "PAST_DUE";

    const payload = {
      family_id: familyId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub?.id ?? null,
      current_period_start: toIsoFromStripeSeconds(stripeSub?.current_period_start),
      current_period_end: toIsoFromStripeSeconds(stripeSub?.current_period_end),
      cancel_at_period_end: !!stripeSub?.cancel_at_period_end,
      trial_start: toIsoFromStripeSeconds(stripeSub?.trial_start),
      trial_end: toIsoFromStripeSeconds(stripeSub?.trial_end),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(payload, { onConflict: "family_id" });

    if (upsertError) {
      console.error("[COMPLETE_CHECKOUT] DB upsert failed:", upsertError);
      return json(500, { error: "DB update failed", message: upsertError.message });
    }

    return json(200, { success: true, plan, status, subscriptionId: stripeSub?.id ?? null });
  } catch (err: any) {
    console.error("[COMPLETE_CHECKOUT] Error:", err);
    return json(500, {
      error: err?.message ?? "Unknown error",
      // handig tijdens debuggen:
      hint: "Check Supabase Edge Function logs using x-deno-execution-id from response headers.",
      executionId,
    });
  }
});