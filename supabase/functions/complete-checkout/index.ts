// supabase/functions/complete-checkout/index.ts
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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data?.user) return { user: null, error: error?.message || "Invalid JWT" };

  return { user: data.user, error: null };
}

interface CompleteCheckoutRequest {
  sessionId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { error: authErr } = await requireUser(req);
    if (authErr) return json(401, { error: "Invalid JWT", message: authErr });

    const { sessionId } = (await req.json()) as CompleteCheckoutRequest;
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
    );

    if (!sessionResponse.ok) return json(500, { error: "Failed to fetch session", details: await sessionResponse.text() });

    const session = await sessionResponse.json();
    const familyId = session.metadata?.family_id;
    const subscription = session.subscription;

    if (!familyId) return json(400, { error: "No family_id in session" });
    if (!subscription || typeof subscription !== "object") return json(400, { error: "No subscription in session" });

    let plan = "FREE";
    const priceId = subscription.items?.data?.[0]?.price?.id;

    if (priceId === Deno.env.get("STRIPE_PRICE_PLUS")) plan = "PLUS";
    else if (priceId === Deno.env.get("STRIPE_PRICE_PRO")) plan = "PRO";

    let status = "ACTIVE";
    if (subscription.status === "trialing") status = "TRIALING";
    else if (subscription.status === "past_due") status = "PAST_DUE";
    else if (subscription.status === "canceled") status = "CANCELLED";
    else if (subscription.status === "incomplete") status = "INCOMPLETE";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan,
        status,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", familyId);

    if (updateError) return json(500, { error: "Failed to update subscription", details: updateError.message });

    return json(200, { success: true, plan, status });
  } catch (e) {
    console.error(e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});