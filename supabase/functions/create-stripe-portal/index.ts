import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VERSION = "v2026-02-26-create-portal-safe-1";

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

  const supabaseAdmin = createClient(
    (Deno.env.get("SUPABASE_URL") ?? "").trim(),
    (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim()
  );

  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data?.user) return { user: null, error: error?.message || "Invalid JWT" };

  return { user: data.user, error: null, authHeader: `Bearer ${jwt}` };
}

interface PortalRequest {
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

  try {
    const { user, error: authErr, authHeader } = await requireUser(req);
    if (authErr || !user) return json(401, { error: "Invalid JWT", message: authErr, version: VERSION });

    const { familyId } = (await req.json()) as PortalRequest;
    const famId = (familyId ?? "").trim();
    if (!famId) return json(400, { error: "Missing familyId", message: "Selecteer eerst een gezin.", version: VERSION });

    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SUPABASE_ANON_KEY = mustEnv("SUPABASE_ANON_KEY");
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
    const APP_URL = (Deno.env.get("APP_URL") ?? Deno.env.get("SITE_URL") ?? "").trim();
    if (!APP_URL) return json(500, { error: "Missing APP_URL (or SITE_URL)", version: VERSION });

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: familyMember, error: fmErr } = await supabaseClient
      .from("family_members")
      .select("role,status")
      .eq("family_id", famId)
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (fmErr) return json(500, { error: "Membership check failed", message: fmErr.message, version: VERSION });
    if (!familyMember) return json(403, { error: "Not a family member", message: "Je bent geen actief gezinslid van dit gezin.", version: VERSION });
    if (familyMember.role !== "PARENT") return json(403, { error: "Only parents can access billing portal", version: VERSION });

    const { data: subscription, error: subErr } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("family_id", famId)
      .maybeSingle();

    if (subErr) return json(500, { error: "Failed to read subscription", message: subErr.message, version: VERSION });
    if (!subscription?.stripe_customer_id) return json(404, { error: "No Stripe customer found", version: VERSION });

    const params = new URLSearchParams();
    params.set("customer", subscription.stripe_customer_id);
    params.set("return_url", `${APP_URL}/settings/abonnement`);

    const session = await stripePostForm("https://api.stripe.com/v1/billing_portal/sessions", STRIPE_SECRET_KEY, params);
    return json(200, { url: session.url, version: VERSION });
  } catch (e) {
    console.error("[CREATE_PORTAL] Error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error", version: VERSION });
  }
});