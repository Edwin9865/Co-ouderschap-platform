import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VERSION = "v2026-02-26-checkout-2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};

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

async function requireUser(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return { user: null, error: "Missing authorization header" };

  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  const url = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const service = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!url || !service) return { user: null, error: "Missing SUPABASE_URL or SERVICE_ROLE key" };

  const supabaseAdmin = createClient(url, service);
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data?.user) return { user: null, error: error?.message || "Invalid JWT" };

  return { user: data.user, error: null, authHeader: `Bearer ${jwt}` };
}

interface CheckoutRequest {
  priceId: string;
  familyId: string;
}

async function stripePostForm(url: string, secretKey: string, params: URLSearchParams) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  console.log("[CREATE_CHECKOUT] VERSION:", VERSION);

  try {
    const { user, error: authErr, authHeader } = await requireUser(req);
    if (authErr || !user) return json(401, { error: "Invalid JWT", message: authErr, version: VERSION });

    const body = (await req.json()) as CheckoutRequest;
    const priceId = (body?.priceId ?? "").trim();
    const familyId = (body?.familyId ?? "").trim();

    // ✅ Solution 2: family is mandatory
    if (!familyId) return json(400, { error: "Missing familyId", message: "Selecteer eerst een gezin.", version: VERSION });
    if (!priceId) return json(400, { error: "Missing priceId", version: VERSION });

    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SUPABASE_ANON = mustEnv("SUPABASE_ANON_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");

    // ✅ Use a fixed app URL (origin is unreliable in mobile / webviews)
    const APP_URL = (Deno.env.get("APP_URL") ?? Deno.env.get("SITE_URL") ?? "").trim();
    if (!APP_URL) {
      return json(500, { error: "APP_URL not configured", message: "Set APP_URL (or SITE_URL) in function env.", version: VERSION });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader! } },
    });

    // ✅ Must be ACTIVE PARENT in this family
    const { data: familyMember, error: fmErr } = await supabaseClient
      .from("family_members")
      .select("role,status")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (fmErr) {
      console.error("[CREATE_CHECKOUT] family_members error:", fmErr);
      return json(500, { error: "Membership check failed", message: fmErr.message, version: VERSION });
    }
    if (!familyMember) return json(403, { error: "Not a family member", message: "Je bent geen actief gezinslid van dit gezin.", version: VERSION });
    if (familyMember.role !== "PARENT") return json(403, { error: "Only parents can manage subscriptions", version: VERSION });

    // Read subscription row (may not exist)
    const { data: subscription, error: subErr } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("family_id", familyId)
      .maybeSingle();

    if (subErr) {
      console.error("[CREATE_CHECKOUT] subscriptions read error:", subErr);
      return json(500, { error: "Failed to read subscription", message: subErr.message, version: VERSION });
    }

    let customerId = subscription?.stripe_customer_id ?? null;

    // Create Stripe customer if missing
    if (!customerId) {
      const customerParams = new URLSearchParams();
      if (user.email) customerParams.set("email", user.email);
      customerParams.set("metadata[family_id]", familyId);
      customerParams.set("metadata[user_id]", user.id);

      const customer = await stripePostForm("https://api.stripe.com/v1/customers", STRIPE_SECRET_KEY, customerParams);
      customerId = customer?.id ?? null;

      if (!customerId) return json(500, { error: "Stripe customer creation failed", version: VERSION });

      // Ensure subscription row exists, then set customer id
      // (update may affect 0 rows if row doesn't exist yet, so we upsert minimal row)
      const { error: upsertErr } = await supabaseClient
        .from("subscriptions")
        .upsert({ family_id: familyId, stripe_customer_id: customerId }, { onConflict: "family_id" });

      if (upsertErr) {
        console.error("[CREATE_CHECKOUT] subscriptions upsert error:", upsertErr);
        return json(500, { error: "Failed to persist Stripe customer", message: upsertErr.message, version: VERSION });
      }
    }

    // Checkout session
    const successUrl = `${APP_URL}/settings/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${APP_URL}/settings/abonnement?canceled=true`;

    const sessionParams = new URLSearchParams();
    sessionParams.set("customer", customerId);
    sessionParams.set("mode", "subscription");
    sessionParams.set("line_items[0][price]", priceId);
    sessionParams.set("line_items[0][quantity]", "1");
    sessionParams.set("success_url", successUrl);
    sessionParams.set("cancel_url", cancelUrl);

    // If you want promo codes:
    sessionParams.set("allow_promotion_codes", "true");

    // ✅ Metadata for complete-checkout + webhook usage
    sessionParams.set("metadata[family_id]", familyId);
    sessionParams.set("metadata[user_id]", user.id);
    sessionParams.set("subscription_data[metadata][family_id]", familyId);
    sessionParams.set("subscription_data[metadata][user_id]", user.id);

    const session = await stripePostForm("https://api.stripe.com/v1/checkout/sessions", STRIPE_SECRET_KEY, sessionParams);

    if (!session?.url) return json(500, { error: "No checkout URL returned", version: VERSION });

    return json(200, { sessionId: session.id, url: session.url, version: VERSION });
  } catch (e) {
    console.error("[CREATE_CHECKOUT] Error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error", version: VERSION });
  }
});