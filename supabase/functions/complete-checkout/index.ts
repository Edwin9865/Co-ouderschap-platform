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
  try { return new Date().toISOString(); } catch { return null; }
}

function toIsoFromStripeSeconds(v: unknown): string | null {
  const n =
    typeof v === "number" ? v :
    typeof v === "string" ? Number(v) :
    NaN;

  if (!Number.isFinite(n) || n <= 0) return null;

  const d = new Date(n * 1000);
  if (!Number.isFinite(d.getTime())) return null;

  try { return d.toISOString(); } catch { return null; }
}

async function stripeGet(url: string, secretKey: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
  const text = await res.text();

  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    throw new Error(`Stripe API error (${res.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractPriceIdsFromLineItems(session: any): string[] {
  const items = session?.line_items?.data ?? [];
  const ids: string[] = [];
  for (const li of items) {
    const pid = li?.price?.id;
    if (typeof pid === "string" && pid.startsWith("price_")) ids.push(pid);
  }
  return Array.from(new Set(ids));
}

function extractPriceIdsFromSubscription(sub: any): string[] {
  const items = sub?.items?.data ?? [];
  const ids: string[] = [];
  for (const it of items) {
    const pid = it?.price?.id;
    if (typeof pid === "string" && pid.startsWith("price_")) ids.push(pid);
  }
  return Array.from(new Set(ids));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Missing authorization header" });
    const jwt = authHeader.replace("Bearer ", "").trim();

    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");

    // ⚠️ Deze moeten écht gevuld zijn in Supabase secrets
    const STRIPE_PRICE_PLUS = Deno.env.get("STRIPE_PRICE_PLUS") ?? "";
    const STRIPE_PRICE_PRO = Deno.env.get("STRIPE_PRICE_PRO") ?? "";

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid JWT", message: userErr?.message ?? "Auth failed" });
    }

    // --- Body ---
    let body: CompleteCheckoutRequest;
    try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON body" }); }

    const sessionId = body?.sessionId?.trim();
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    // --- Checkout session ---
    const sessionUrl = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
    sessionUrl.searchParams.append("expand[]", "subscription");
    sessionUrl.searchParams.append("expand[]", "line_items.data.price");

    const session = await stripeGet(sessionUrl.toString(), STRIPE_SECRET_KEY);

    const familyId = session?.metadata?.family_id;
    const customerId = session?.customer;
    const subscriptionRef = session?.subscription;

    if (!familyId) return json(400, { error: "No family_id in session metadata" });
    if (!customerId) return json(400, { error: "No customer on session" });
    if (!subscriptionRef) return json(400, { error: "No subscription on session" });

    // --- Subscription fetch (met expand) ---
    const fetchSub = async (subId: string) => {
      const subUrl = new URL(`https://api.stripe.com/v1/subscriptions/${subId}`);
      subUrl.searchParams.append("expand[]", "items.data.price");
      return stripeGet(subUrl.toString(), STRIPE_SECRET_KEY);
    };

    let stripeSub: any;
    const subId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
    if (!subId) return json(400, { error: "Subscription missing id" });

    stripeSub = await fetchSub(subId);

    // Soms duurt het even voordat current_period_* gevuld is → retry
    for (let i = 0; i < 6; i++) {
      const hasItems = !!stripeSub?.items?.data?.length;
      const hasPeriod = !!stripeSub?.current_period_end || !!stripeSub?.billing_cycle_anchor;
      if (hasItems && hasPeriod) break;
      await sleep(1000);
      stripeSub = await fetchSub(subId);
    }

    // --- Plan detectie (robust) ---
    const metaPlan = typeof session?.metadata?.plan === "string" ? session.metadata.plan : "";
    const linePriceIds = extractPriceIdsFromLineItems(session);
    const subPriceIds = extractPriceIdsFromSubscription(stripeSub);

    // kies eerst line_item price (die is het betrouwbaarst voor “wat is gekocht”)
    const pickedPriceId = linePriceIds[0] ?? subPriceIds[0] ?? "";

    let plan: "FREE" | "PLUS" | "PRO" = "FREE";

    if (metaPlan === "PLUS" || metaPlan === "PRO") {
      plan = metaPlan as any;
    } else if (pickedPriceId && STRIPE_PRICE_PLUS && pickedPriceId === STRIPE_PRICE_PLUS) {
      plan = "PLUS";
    } else if (pickedPriceId && STRIPE_PRICE_PRO && pickedPriceId === STRIPE_PRICE_PRO) {
      plan = "PRO";
    } else if (pickedPriceId) {
      // ✅ Niet stil terugvallen naar FREE: geef duidelijke fout terug
      return json(400, {
        error: "Unknown priceId mapping",
        pickedPriceId,
        linePriceIds,
        subPriceIds,
        hint: "Check STRIPE_PRICE_PLUS / STRIPE_PRICE_PRO secrets in Supabase and compare to Stripe price IDs.",
      });
    }

    // --- Status mapping ---
    const stripeStatus = stripeSub?.status;
    let status = "ACTIVE";
    if (stripeStatus === "trialing") status = "TRIALING";
    else if (stripeStatus === "past_due") status = "PAST_DUE";
    else if (stripeStatus === "canceled") status = "CANCELLED";
    else if (stripeStatus === "unpaid") status = "PAST_DUE";
    else if (stripeStatus === "incomplete" || stripeStatus === "incomplete_expired") status = "INCOMPLETE";

    // --- Date fields (met fallbacks) ---
    const current_period_start =
      toIsoFromStripeSeconds(stripeSub?.current_period_start) ??
      toIsoFromStripeSeconds(stripeSub?.billing_cycle_anchor); // fallback

    const current_period_end =
      toIsoFromStripeSeconds(stripeSub?.current_period_end);

    const trial_start = toIsoFromStripeSeconds(stripeSub?.trial_start);
    const trial_end = toIsoFromStripeSeconds(stripeSub?.trial_end);

    const valid_until = current_period_end ?? trial_end ?? null;

    const payload = {
      family_id: familyId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub?.id ?? null,
      valid_until,
      current_period_start,
      current_period_end,
      cancel_at_period_end: !!stripeSub?.cancel_at_period_end,
      trial_start,
      trial_end,
      updated_at: safeNowIso(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(payload, { onConflict: "family_id" });

    if (upsertError) {
      return json(500, { error: "DB update failed", message: upsertError.message, details: upsertError });
    }

    return json(200, {
      success: true,
      plan,
      status,
      pickedPriceId,
      linePriceIds,
      subPriceIds,
      dates: { current_period_start, current_period_end, trial_start, trial_end, valid_until },
    });
  } catch (err) {
    console.error("[COMPLETE_CHECKOUT] Error:", err);
    return json(500, { error: err instanceof Error ? err.message : "Unknown error" });
  }
});