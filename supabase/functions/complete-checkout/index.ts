import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CompleteCheckoutRequest {
  sessionId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !data?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid JWT" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { sessionId }: CompleteCheckoutRequest = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    console.log("[COMPLETE_CHECKOUT] Fetching session from Stripe:", sessionId);

    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription`,
      {
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      console.error("[COMPLETE_CHECKOUT] Stripe API error:", error);
      throw new Error(`Failed to fetch session: ${error}`);
    }

    const session = await sessionResponse.json();
    const familyId = session.metadata?.family_id;
    const subscription = session.subscription;

    if (!familyId) {
      return new Response(
        JSON.stringify({ error: "No family_id in session" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!subscription || typeof subscription !== 'object') {
      return new Response(
        JSON.stringify({ error: "No subscription in session" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let plan = "FREE";
    const priceId = subscription.items?.data?.[0]?.price?.id;

    if (priceId === Deno.env.get("STRIPE_PRICE_PLUS")) {
      plan = "PLUS";
    } else if (priceId === Deno.env.get("STRIPE_PRICE_PRO")) {
      plan = "PRO";
    }

    let status = "ACTIVE";
    if (subscription.status === "trialing") status = "TRIALING";
    else if (subscription.status === "past_due") status = "PAST_DUE";
    else if (subscription.status === "canceled") status = "CANCELLED";
    else if (subscription.status === "incomplete") status = "INCOMPLETE";

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

    if (updateError) {
      console.error("[COMPLETE_CHECKOUT] Failed to update subscription:", updateError);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    console.log(`[COMPLETE_CHECKOUT] Subscription updated for family ${familyId}: ${plan} - ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        plan,
        status
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[COMPLETE_CHECKOUT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
