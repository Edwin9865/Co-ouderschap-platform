import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SyncRequest {
  familyId: string;
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

    const jwt = authHeader.replace("Bearer ", "");
    console.log("[SYNC] JWT extracted:", {
      length: jwt.length,
      preview: jwt.substring(0, 50) + "...",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let user;
    try {
      const { data, error: authError } = await supabaseAdmin.auth.getUser(jwt);

      if (authError || !data?.user) {
        console.error("[SYNC] JWT verification failed:", authError);
        return new Response(
          JSON.stringify({
            error: "Invalid JWT",
            message: authError?.message || "Authentication failed",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      user = data.user;
    } catch (verifyError) {
      console.error("[SYNC] JWT verification exception:", verifyError);
      return new Response(
        JSON.stringify({
          error: "JWT verification failed",
          message: verifyError.message || "Authentication error",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { familyId }: SyncRequest = await req.json();

    if (!familyId) {
      return new Response(
        JSON.stringify({ error: "Missing familyId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: familyMember } = await supabaseClient
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!familyMember || familyMember.role !== "PARENT") {
      return new Response(
        JSON.stringify({ error: "Only parents can sync subscriptions" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("family_id", familyId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({
          error: "No subscription found to sync",
          subscription: null
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    console.log("[SYNC] Fetching subscription from Stripe:", subscription.stripe_subscription_id);

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
      {
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      console.error("[SYNC] Stripe API error:", error);
      throw new Error(`Failed to fetch subscription: ${error}`);
    }

    const stripeSubscription = await stripeResponse.json();

    console.log("[SYNC] Stripe subscription status:", stripeSubscription.status);

    let plan = "FREE";
    const priceId = stripeSubscription.items.data[0]?.price.id;

    if (priceId === Deno.env.get("STRIPE_PRICE_PLUS")) {
      plan = "PLUS";
    } else if (priceId === Deno.env.get("STRIPE_PRICE_PRO")) {
      plan = "PRO";
    }

    let status = "ACTIVE";
    if (stripeSubscription.status === "trialing") status = "TRIALING";
    else if (stripeSubscription.status === "past_due") status = "PAST_DUE";
    else if (stripeSubscription.status === "canceled") status = "CANCELLED";
    else if (stripeSubscription.status === "incomplete") status = "INCOMPLETE";

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan,
        status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : null,
        trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("family_id", familyId);

    if (updateError) {
      console.error("[SYNC] Failed to update subscription:", updateError);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    console.log("[SYNC] Subscription synced successfully:", { plan, status });

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
    console.error("[SYNC] Error syncing subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
