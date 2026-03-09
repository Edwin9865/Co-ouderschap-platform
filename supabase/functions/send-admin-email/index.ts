// supabase/functions/send-admin-email/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ZEPTO_URL = "https://api.zeptomail.eu/v1.1/email";
const FROM_ADDRESS = "noreply@coparenting.nl";
const FROM_NAME = "CoParenting";
const ADMIN_EMAIL = "info@coparenting.nl";
const ADMIN_NAME = "CoParenting Admin";

function mustEnv(name: string) {
  const v = (Deno.env.get(name) ?? "").trim();
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function sendEmail(token: string, subject: string, htmlbody: string) {
  const resp = await fetch(ZEPTO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
    },
    body: JSON.stringify({
      from: { address: FROM_ADDRESS, name: FROM_NAME },
      to: [
        {
          email_address: {
            address: ADMIN_EMAIL,
            name: ADMIN_NAME,
          },
        },
      ],
      subject,
      htmlbody,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ZeptoMail fout: ${resp.status} ${text}`);
  }

  return await resp.json();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const ZEPTO_TOKEN = mustEnv("ZEPTO_API_TOKEN");

    const body = await req.json();

    // Supabase Database Webhooks sturen een ander formaat dan onze eigen aanroepen.
    // Detecteer het formaat en normaliseer naar { type, data }.
    let type: string;
    let data: Record<string, unknown>;

    if (
      body.type === "UPDATE" &&
      body.record &&
      body.record.email_confirmed_at &&
      !body.old_record?.email_confirmed_at
    ) {
      // Supabase Database Webhook: email is zojuist bevestigd
      const record = body.record;
      type = "registration";
      data = {
        email: record.email,
        name: record.raw_user_meta_data?.full_name ?? record.email,
        account_type: record.raw_user_meta_data?.account_type ?? "PARENT",
      };
    } else if (body.type === "UPDATE" && body.record) {
      // Andere UPDATE op auth.users — negeren
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    } else if (body.type === "INSERT" && body.record) {
      // INSERT wordt genegeerd — mail wordt pas na verificatie verstuurd
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    } else {
      // Eigen aanroep formaat (vanuit stripe-webhook)
      type = body.type;
      data = body.data;
    }

    const now = new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" });

    if (type === "registration") {
      const { email, name, account_type } = data as { email: string; name: string; account_type: string };
      const typeLabel = account_type === "HELPER" ? "Hulpverlener" : "Ouder";

      await sendEmail(
        ZEPTO_TOKEN,
        `Nieuwe inschrijving: ${name}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Nieuwe inschrijving op CoParenting</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Naam</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">E-mail</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Type account</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Datum</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${now}</td>
            </tr>
          </table>
        </div>
        `
      );

      console.log(`[send-admin-email] Registratie-mail verstuurd voor: ${email}`);

    } else if (type === "subscription") {
      const { plan, family_id, customer_email, status } = data;

      await sendEmail(
        ZEPTO_TOKEN,
        `Nieuw abonnement afgesloten: ${plan}`,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Nieuw abonnement op CoParenting</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Plan</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${plan}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Status</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${status ?? "ACTIVE"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">E-mail klant</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${customer_email ?? "onbekend"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Family ID</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${family_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">Datum</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${now}</td>
            </tr>
          </table>
        </div>
        `
      );

      console.log(`[send-admin-email] Abonnement-mail verstuurd voor family: ${family_id}, plan: ${plan}`);

    } else {
      return new Response(JSON.stringify({ error: `Onbekend type: ${type}` }), { status: 400 });
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("[send-admin-email] Fout:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Onbekende fout" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
