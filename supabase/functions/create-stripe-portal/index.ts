// supabase/functions/create-stripe-portal/index.ts
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

  return { user: data.user, error: null, authHeader: `Bearer ${jwt}` };
}

interface PortalRequest {
  familyId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { user, error: authErr, authHeader } = await requireUser(req);
    if (authErr || !user) return json(401, { error: "Invalid JWT", message: authErr });

    const { familyId } = (await req.json()) as PortalRequest;
    if (!familyId) return json(400, { error: "Missing familyId" });

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

    if (!familyMember || familyMember.role !== "PARENT") return json(403, { error: "Only parents can access billing portal" });

    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("family_id", familyId)
      .single();

    if (!subscription?.stripe_customer_id) return json(404, { error: "No Stripe customer found" });

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) return json(500, { error: "Stripe secret key not configured" });

    const origin = req.headers.get("origin") || "http://localhost:5173";

    const sessionResponse = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: subscription.stripe_customer_id,
        return_url: `${origin}/instellingen/abonnement`,
      }),
    });

    if (!sessionResponse.ok) return json(500, { error: "Stripe API error", details: await sessionResponse.text() });

    const session = await sessionResponse.json();
    return json(200, { url: session.url });
  } catch (e) {
    console.error(e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});