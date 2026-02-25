// supabase/functions/complete-checkout/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};

interface CompleteCheckoutRequest {
  sessionId: string;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY) return json(500, { error: "Missing STRIPE_SECRET_KEY" });
    if (!SUPABASE_URL) return json(500, { error: "Missing SUPABASE_URL" });
    if (!SERVICE_ROLE) return json(500, { error: "Missing SUPABASE_SERVICE_ROLE_KEY" });

    // Auth header is optional if you turned Verify JWT off.
    // But we still accept it if present.
    const authHeader = req.headers.get("Authorization") || "";

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // If you want to require login even with Verify JWT off:
    // (recommended)
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { error: "Missing authorization header" });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid JWT", details: userErr?.message });
    }
    const user = userData.user;

    const { sessionId }: CompleteCheckoutRequest = await req.json();
    if (!sessionId) return json(400, { error: "Missing sessionId" });

    // 1) Fetch checkout session
    const sRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
    );

    const sText = await sRes.text();
    if (!sRes.ok) {
      return json(500, { error: "Stripe session fetch failed", status: sRes.status, details: sText });
    }

    const session = JSON.parse(sText);
    const familyId = session?.metadata?.family_id;

    if (!familyId) return json(400, { error: "No family_id in session.metadata" });

    // 2) Security: check that this user is a parent in that family
    const { data: fm, error: fmErr } = await supabaseAdmin
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (fmErr || !fm || fm.role !== "PARENT") {
      return json(403, { error: "Only parents can complete checkout for this family" });
    }

    // 3) Subscription could be object OR string
    let stripeSub: any = session.subscription;

    if (typeof stripeSub === "string") {
      const subId = stripeSub;
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });

      const subText = await subRes.text();
      if (!subRes.ok) {
        return json(500, { error: "Stripe subscription fetch failed", status: subRes.status, details: subText });
      }
      stripeSub = JSON.parse(subText);
    }

    if (!stripeSub || typeof stripeSub !== "object") {
      return json(400, { error: "No subscription found on session" });
    }

    // 4) Determine plan from priceId
    const priceId = stripeSub?.items?.data?.[0]?.price?.id;
    const PRICE_PLUS = Deno.env.get("STRIPE_PRICE_PLUS");
    const PRICE_PRO = Deno.env.get("STRIPE_PRICE_PRO");

    let plan = "FREE";
    if (priceId && PRICE_PLUS && priceId === PRICE_PLUS) plan = "PLUS";
    if (priceId && PRICE_PRO && priceId === PRICE_PRO) plan = "PRO";

    // 5) Map status
    let status = "ACTIVE";
    if (stripeSub.status === "trialing") status = "TRIALING";
    else if (stripeSub.status === "past_due") status = "PAST_DUE";
    else if (stripeSub.status === "canceled") status = "CANCELLED";
    else if (stripeSub.status === "incomplete") status = "INCOMPLETE";

    // 6) Update DB
    const { error: upErr } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan,
        status,
        stripe_customer_id: session.customer,
        stripe_subscription_id: stripeSub.id,
        current_period_start: stripeSub.current_period_start
          ? new Date(stripeSub.current_period_start * 1000).toISOString()
          : null,
        current_period_end: stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: !!stripeSub.cancel_at_period_end,
        trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000).toISOString() : null,
        trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", familyId);

    if (upErr) return json(500, { error: "DB update failed", details: upErr.message });

    return json(200, { success: true, plan, status });
  } catch (e) {
    return json(500, { error: "Unhandled error", details: e?.message ?? String(e) });
  }
});