import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const signatureParts = signature.split(",");
  const timestamp = signatureParts.find(part => part.startsWith("t="))?.split("=")[1];
  const signatures = signatureParts
    .filter(part => part.startsWith("v1="))
    .map(part => part.split("=")[1]);

  const signedPayload = `${timestamp}.${payload}`;
  const signedData = encoder.encode(signedPayload);
  const signedBuffer = await crypto.subtle.sign("HMAC", key, signedData);
  const computedSignature = Array.from(new Uint8Array(signedBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some(sig => sig === computedSignature);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = await req.text();

    const isValid = await verifyStripeSignature(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const event = JSON.parse(payload);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Processing Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const familyId = session.metadata?.family_id;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!familyId) {
          console.error("No family_id in session metadata");
          break;
        }

        await supabaseClient
          .from("subscriptions")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: "ACTIVE",
            updated_at: new Date().toISOString(),
          })
          .eq("family_id", familyId);

        console.log(`Checkout completed for family ${familyId}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const familyId = subscription.metadata?.family_id;

        if (!familyId) {
          const { data: existingSub } = await supabaseClient
            .from("subscriptions")
            .select("family_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (!existingSub) {
            console.error("No family_id found for subscription:", subscription.id);
            break;
          }
        }

        const targetFamilyId = familyId || (await supabaseClient
          .from("subscriptions")
          .select("family_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()).data?.family_id;

        if (!targetFamilyId) {
          console.error("Could not determine family_id");
          break;
        }

        let plan = "FREE";
        const priceId = subscription.items.data[0]?.price.id;

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

        await supabaseClient
          .from("subscriptions")
          .update({
            plan,
            status,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("family_id", targetFamilyId);

        console.log(`Subscription ${event.type} for family ${targetFamilyId}: ${plan} - ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("family_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (!existingSub) {
          console.error("Subscription not found:", subscription.id);
          break;
        }

        await supabaseClient
          .from("subscriptions")
          .update({
            plan: "FREE",
            status: "CANCELLED",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("family_id", existingSub.family_id);

        console.log(`Subscription cancelled for family ${existingSub.family_id}`);
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object;
        console.log(`Trial ending soon for subscription ${subscription.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          await supabaseClient
            .from("subscriptions")
            .update({
              status: "PAST_DUE",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          console.log(`Payment failed for subscription ${subscriptionId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          await supabaseClient
            .from("subscriptions")
            .update({
              status: "ACTIVE",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          console.log(`Payment succeeded for subscription ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
