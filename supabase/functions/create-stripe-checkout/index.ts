// supabase/functions/create-stripe-checkout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return { user: null, error: "Missing authorization header" };

  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { user, error: authErr, authHeader } = await requireUser(req);
    if (authErr || !user) return json(401, { error: "Invalid JWT", message: authErr });

    const body = (await req.json()) as CheckoutRequest;
    const { priceId, familyId } = body || {};
    if (!priceId || !familyId) return json(400, { error: "Missing priceId or familyId" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: familyMember } = await supabaseClient
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!familyMember || familyMember.role !== "PARENT") return json(403, { error: "Only parents can manage subscriptions" });

    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("family_id", familyId)
      .single();

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email ?? "",
          "metadata[family_id]": familyId,
          "metadata[user_id]": user.id,
        }),
      });

      if (!customerResponse.ok) return json(500, { error: "Failed to create Stripe customer", details: await customerResponse.text() });

      const customer = await customerResponse.json();
      customerId = customer.id;

      await supabaseClient.from("subscriptions").update({ stripe_customer_id: customerId }).eq("family_id", familyId);
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    const sessionParams: Record<string, string> = {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/instellingen/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/instellingen/abonnement?canceled=true`,
      allow_promotion_codes: "true",
      "metadata[family_id]": familyId,
      "metadata[user_id]": user.id,
      "subscription_data[metadata][family_id]": familyId, // belangrijk voor latere webhook events
    };

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(sessionParams),
    });

    if (!sessionResponse.ok) return json(500, { error: "Stripe API error", details: await sessionResponse.text() });

    const session = await sessionResponse.json();
    return json(200, { sessionId: session.id, url: session.url });
  } catch (e) {
    console.error(e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});