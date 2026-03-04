// supabase/functions/stripe-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const VERSION = "v2026-02-26-webhook-2";

function mustEnv(name: string) {
  const v = (Deno.env.get(name) ?? "").trim();
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toIsoFromStripeSeconds(v: unknown): string | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n * 1000);
  try {
    return d.toISOString();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = mustEnv("STRIPE_WEBHOOK_SECRET");
    const SUPABASE_URL = mustEnv("SUPABASE_URL");
    const SERVICE_ROLE = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

    const STRIPE_PRICE_PLUS = (Deno.env.get("STRIPE_PRICE_PLUS") ?? "").trim();
    const STRIPE_PRICE_PRO = (Deno.env.get("STRIPE_PRICE_PRO") ?? "").trim();

    const sig = req.headers.get("stripe-signature");
    if (!sig) return json(400, { error: "Missing stripe-signature" });

    // IMPORTANT: raw body (exact)
    const rawBody = await req.text();

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("[WEBHOOK] Signature verification failed:", err?.message);
      return json(400, { error: "Invalid signature", message: err?.message, version: VERSION });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

    console.log("[WEBHOOK] Event:", event.type);

    const upsertFromSubscription = async (sub: Stripe.Subscription) => {
      const familyId =
        (sub.metadata?.family_id ?? "").trim() ||
        (sub.items.data[0]?.price?.metadata?.family_id ?? "").trim();

      // We enforce family-based billing (solution 2), so we require family_id
      if (!familyId) {
        console.warn("[WEBHOOK] Missing metadata.family_id on subscription", sub.id);
        return;
      }

      const priceId = sub.items.data[0]?.price?.id ?? "";

      // Als de subscription geannuleerd/verwijderd is → altijd FREE
      let plan: "FREE" | "PLUS" | "PRO" = "FREE";
      if (sub.status !== "canceled") {
        if (priceId && STRIPE_PRICE_PLUS && priceId === STRIPE_PRICE_PLUS) plan = "PLUS";
        if (priceId && STRIPE_PRICE_PRO && priceId === STRIPE_PRICE_PRO) plan = "PRO";
      }

      let status = "ACTIVE";
      if (sub.status === "trialing") status = "TRIALING";
      else if (sub.status === "past_due") status = "PAST_DUE";
      else if (sub.status === "canceled") status = "CANCELLED";
      else if (sub.status === "incomplete") status = "INCOMPLETE";
      else if (sub.status === "unpaid") status = "PAST_DUE";

      const payload = {
        family_id: familyId,
        plan,
        status,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
        stripe_subscription_id: sub.id,
        current_period_start: toIsoFromStripeSeconds(sub.current_period_start),
        current_period_end: toIsoFromStripeSeconds(sub.current_period_end),
        cancel_at_period_end: !!sub.cancel_at_period_end || !!sub.cancel_at,
        trial_start: toIsoFromStripeSeconds(sub.trial_start),
        trial_end: toIsoFromStripeSeconds(sub.trial_end),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert(payload, { onConflict: "family_id" });

      if (error) {
        console.error("[WEBHOOK] Upsert failed:", error);
        throw new Error(error.message);
      }
    };

    switch (event.type) {
      // Best signals to keep DB correct:
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(sub);
        break;
      }

      // Optional: checkout completed (sometimes useful if you want immediate write)
      // But your complete-checkout already handles this.
      case "checkout.session.completed": {
        // You can ignore or log; subscription events will come anyway.
        break;
      }

      default:
        // ignore other events
        break;
    }

    return json(200, { received: true, version: VERSION });
  } catch (e: any) {
    console.error("[WEBHOOK] Error:", e);
    return json(500, { error: e?.message ?? "Unknown error", version: VERSION });
  }
});