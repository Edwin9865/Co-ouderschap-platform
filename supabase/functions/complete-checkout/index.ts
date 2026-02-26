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

function mustEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function safeNowIso() {
  try {
    return new Date().toISOString();
  } catch {
    // theoretisch bijna onmogelijk, maar we houden 'm bulletproof
    return null;
  }
}

function toIsoFromStripeSeconds(v: unknown): string | null {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
      ? Number(v)
      : NaN;

  if (!Number.isFinite(n) || n <= 0) return null;

  const d = new Date(n * 1000);
  const t = d.getTime();
  if (!Number.isFinite(t)) return null;

  try {
    return d.toISOString();
  } catch {
    return null;
  }
}

async function stripeGet(url: string, secretKey: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
  const text = await res.text();

  let data: any;
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    // ---- Auth header ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Missing authorization header" });
    const jwt = authHeader.replace("Bearer ", "").trim();

    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");

    const STRIPE_PRICE_PLUS = Deno.env.get("STRIPE_PRICE_PLUS") ?? "";
    const STRIPE_PRICE_PRO = Deno.env.get("STRIPE_PRICE_PRO") ?? "";

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid JWT", message: userErr?.message ?? "Auth failed" });
    }

    // ---- Body ----
    let body: CompleteCheckoutRequest;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    const sessionId = body?.sessionId?.trim();
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    // ---- Fetch session ----
    const sessionUrl = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
    sessionUrl.searchParams.append("expand[]", "subscription");
    sessionUrl.searchParams.append("expand[]", "line_items");

    const session = await stripeGet(sessionUrl.toString(), STRIPE_SECRET_KEY);

    const familyId = session?.metadata?.family_id;
    const customerId = session?.customer;
    const subscriptionRef = session?.subscription;

    if (!familyId) return json(400, { error: "No family_id in session metadata" });
    if (!customerId) return json(400, { error: "No customer on session" });
    if (!subscriptionRef) return json(400, { error: "No subscription on session" });

    // ---- Ensure subscription ----
    let stripeSub: any;

    const fetchSub = async (subId: string) => {
      const subUrl = new URL(`https://api.stripe.com/v1/subscriptions/${subId}`);
      subUrl.searchParams.append("expand[]", "items.data.price");
      return stripeGet(subUrl.toString(), STRIPE_SECRET_KEY);
    };

    if (typeof subscriptionRef === "string") {
      stripeSub = await fetchSub(subscriptionRef);
    } else {
      stripeSub = subscriptionRef;
      if (!stripeSub?.id) return json(400, { error: "Subscription object missing id" });
      if (!stripeSub?.items?.data?.length) {
        stripeSub = await fetchSub(stripeSub.id);
      }
    }

    // Soms duurt Stripe 1-2s voordat period fields gevuld zijn (race)
    for (let i = 0; i < 4; i++) {
      const hasItems = !!stripeSub?.items?.data?.length;
      const hasPeriod = !!stripeSub?.current_period_end || stripeSub?.status === "canceled";
      if (hasItems && hasPeriod) break;
      await sleep(1200);
      stripeSub = await fetchSub(stripeSub.id);
    }

    const priceId = stripeSub?.items?.data?.[0]?.price?.id ?? "";

    let plan: "FREE" | "PLUS" | "PRO" = "FREE";
    if (priceId && STRIPE_PRICE_PLUS && priceId === STRIPE_PRICE_PLUS) plan = "PLUS";
    if (priceId && STRIPE_PRICE_PRO && priceId === STRIPE_PRICE_PRO) plan = "PRO";

    // Status mapping
    const stripeStatus = stripeSub?.status;
    let status = "ACTIVE";
    if (stripeStatus === "trialing") status = "TRIALING";
    else if (stripeStatus === "past_due") status = "PAST_DUE";
    else if (stripeStatus === "canceled") status = "CANCELLED";
    else if (stripeStatus === "unpaid") status = "PAST_DUE";
    else if (stripeStatus === "incomplete_expired") status = "INCOMPLETE";

    const current_period_start = toIsoFromStripeSeconds(stripeSub?.current_period_start);
    const current_period_end = toIsoFromStripeSeconds(stripeSub?.current_period_end);
    const trial_start = toIsoFromStripeSeconds(stripeSub?.trial_start);
    const trial_end = toIsoFromStripeSeconds(stripeSub?.trial_end);

    const valid_until = current_period_end ?? trial_end;
    const cancel_at_period_end = !!stripeSub?.cancel_at_period_end;

    console.log("[COMPLETE_CHECKOUT] OK", {
      sessionId,
      familyId,
      customerId,
      subscriptionId: stripeSub?.id,
      stripeStatus,
      plan,
      priceId,
      current_period_start,
      current_period_end,
      trial_start,
      trial_end,
      valid_until,
      cancel_at_period_end,
    });

    const payload = {
      family_id: familyId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub?.id ?? null,
      valid_until,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      trial_start,
      trial_end,
      updated_at: safeNowIso(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(payload, { onConflict: "family_id" });

    if (upsertError) {
      console.error("[COMPLETE_CHECKOUT] DB upsert failed:", upsertError);
      return json(500, {
        error: "DB update failed",
        message: upsertError.message,
        code: (upsertError as any).code ?? null,
        details: upsertError,
      });
    }

    return json(200, { success: true, plan, status });
  } catch (err) {
    console.error("[COMPLETE_CHECKOUT] Error:", err);
    return json(500, {
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});