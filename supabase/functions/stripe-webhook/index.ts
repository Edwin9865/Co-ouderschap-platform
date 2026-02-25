// supabase/functions/stripe-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, stripe-signature",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return hex(sig);
}

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = header.split(",").map(s => s.trim());
  const t = parts.find(p => p.startsWith("t="))?.slice(2);
  const v1s = parts.filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || v1s.length === 0) return false;

  const signedPayload = `${t}.${payload}`;
  const computed = await hmacSha256(secret, signedPayload);
  return v1s.some(v1 => v1 === computed);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const signature = req.headers.get("stripe-signature");
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !secret) return json(400, { error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" });

    const payload = await req.text();
    const ok = await verifyStripeSignature(payload, signature, secret);
    if (!ok) return json(400, { error: "Invalid signature" });

    const event = JSON.parse(payload);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[WEBHOOK] Event:", event.type);

    // jouw bestaande switch kan blijven, maar let op:
    // - checkout.session.completed geeft subscription id, maar om plan te bepalen is subscription ophalen prima.

    // >>> Plak hier jouw bestaande switch block (met minimale wijziging) <<<
    // Tip: zorg dat je altijd metadata.family_id verwacht: die zetten we nu ook in checkout (subscription_data metadata)

    return json(200, { received: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});