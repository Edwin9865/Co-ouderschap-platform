import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutRequest {
  priceId: string;
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
    const apiKey = req.headers.get("apikey");

    console.log("[EDGE] Headers received:", {
      hasAuth: !!authHeader,
      hasApiKey: !!apiKey,
      authPreview: authHeader?.substring(0, 30) + "...",
      allHeaders: Array.from(req.headers.entries()).map(([k]) => k),
    });

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract JWT from "Bearer <token>" format
    const jwt = authHeader.replace("Bearer ", "");
    console.log("[EDGE] JWT extracted:", {
      length: jwt.length,
      preview: jwt.substring(0, 50) + "...",
      isBearer: authHeader.startsWith("Bearer "),
    });

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the JWT token using service role client
    let user;
    try {
      const { data, error: authError } = await supabaseAdmin.auth.getUser(jwt);

      console.log("[EDGE] User verification:", {
        userId: data?.user?.id,
        email: data?.user?.email,
        hasError: !!authError,
        errorMessage: authError?.message,
        errorStatus: authError?.status,
        errorCode: authError?.code,
      });

      if (authError || !data?.user) {
        console.error("[EDGE] JWT verification failed:", {
          error: authError,
          errorName: authError?.name,
          errorCode: authError?.code,
          jwtPreview: jwt.substring(0, 50) + "...",
        });

        return new Response(
          JSON.stringify({
            error: "Invalid JWT",
            code: 401,
            message: authError?.message || "Authentication failed",
            details: authError?.code || "Please log in again"
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      user = data.user;
    } catch (verifyError) {
      console.error("[EDGE] JWT verification exception:", verifyError);
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

    // Create client with user's auth for RLS queries
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { priceId, familyId }: CheckoutRequest = await req.json();

    if (!priceId || !familyId) {
      return new Response(
        JSON.stringify({ error: "Missing priceId or familyId" }),
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
        JSON.stringify({ error: "Only parents can manage subscriptions" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("family_id", familyId)
      .single();

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      console.log("[EDGE] Creating Stripe customer for:", { email: user.email, familyId });

      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email!,
          "metadata[family_id]": familyId,
          "metadata[user_id]": user.id,
        }),
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error("[EDGE] Stripe customer creation failed:", {
          status: customerResponse.status,
          statusText: customerResponse.statusText,
          error: errorText,
        });
        throw new Error(`Failed to create Stripe customer: ${errorText}`);
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      await supabaseClient
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("family_id", familyId);
    }

    const mode = subscription?.stripe_subscription_id ? "subscription" : "subscription";
    const sessionParams: Record<string, string> = {
      customer: customerId,
      mode: mode,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${req.headers.get("origin")}/instellingen/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/instellingen/abonnement?canceled=true`,
      allow_promotion_codes: "true",
      "metadata[family_id]": familyId,
      "metadata[user_id]": user.id,
    };

    if (subscription?.stripe_subscription_id) {
      sessionParams["subscription_data[metadata][family_id]"] = familyId;
    }

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(sessionParams),
    });

    if (!sessionResponse.ok) {
      const error = await sessionResponse.json();
      throw new Error(`Stripe API error: ${JSON.stringify(error)}`);
    }

    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
