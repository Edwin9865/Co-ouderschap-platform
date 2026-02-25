# Stripe Integratie Setup Guide

## Overzicht

Deze applicatie gebruikt Stripe voor het beheren van betaalde abonnementen (PLUS en PRO). Het FREE plan wordt alleen in de database beheerd en gebruikt geen Stripe.

## Setup Stappen

### 1. Stripe Configuratie

Je hebt de volgende Stripe gegevens nodig:

#### A. API Keys
Ga naar: https://dashboard.stripe.com/apikeys

- **Publishable key** (pk_test_... of pk_live_...)
- **Secret key** (sk_test_... of sk_live_...)

#### B. Price IDs
Je hebt al de volgende producten aangemaakt:
- **PLUS**: `prod_U2k2guyrQDfbM9`
- **PRO**: `prod_U2k2GdMm1mJglT`

Je hebt de **Price IDs** nodig (niet Product IDs). Vind deze via:
1. Ga naar: https://dashboard.stripe.com/products
2. Klik op het PLUS product
3. Kopieer de Price ID (bijv. `price_xxxxx`)
4. Herhaal voor PRO product

### 2. Environment Variabelen Instellen

#### Frontend (.env bestand)
```bash
# Stripe Public Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs
VITE_STRIPE_PRICE_PLUS=price_xxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxx
```

#### Supabase Secrets
Deze secrets moeten worden ingesteld in je Supabase project dashboard:

1. Ga naar: Supabase Dashboard > Project Settings > Edge Functions > Secrets
2. Voeg de volgende secrets toe:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Zie stap 3
STRIPE_PRICE_PLUS=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
```

### 3. Webhook Setup

#### A. Webhook Endpoint Configureren
1. Ga naar: https://dashboard.stripe.com/webhooks
2. Klik op "Add endpoint"
3. Voer de URL in:
   ```
   https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
   ```
4. Selecteer de volgende events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

5. Kopieer de **Signing secret** (whsec_...)
6. Voeg deze toe aan Supabase secrets als `STRIPE_WEBHOOK_SECRET`

#### B. Test Webhook (Optioneel)
Voor lokale development kun je Stripe CLI gebruiken:
```bash
stripe listen --forward-to https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

### 4. Customer Portal Configureren

1. Ga naar: https://dashboard.stripe.com/settings/billing/portal
2. Activeer de Customer Portal
3. Configureer welke acties klanten kunnen uitvoeren:
   - ✅ Bekijk facturen
   - ✅ Update betaalmethode
   - ✅ Annuleer abonnement
   - ✅ Update abonnement (upgrade/downgrade tussen PLUS en PRO)

### 5. Kortingscodes (Coupons) Instellen

#### Coupon Aanmaken
1. Ga naar: https://dashboard.stripe.com/coupons
2. Klik op "Create coupon"
3. Kies type:
   - **Percentage discount**: bijv. 20% korting
   - **Fixed amount**: bijv. €5 korting
4. Stel duur in:
   - **Once**: Eenmalig
   - **Forever**: Voor altijd
   - **Repeating**: Aantal maanden

#### Promotion Code Aanmaken
1. Ga naar: https://dashboard.stripe.com/promotion_codes
2. Klik op "Create promotion code"
3. Selecteer de coupon
4. Voer de code in (bijv. MEDIATOR20, TRIAL2026)
5. Stel expiratie datum en max. gebruik in (optioneel)

**Voorbeeldcodes die je kunt aanmaken:**
- `MEDIATOR20` - 20% korting voor mediators
- `TRIAL2026` - 3 maanden €5 korting voor trial gebruikers
- `FAMILY10` - €10 eenmalige korting

**Let op:** Kortingscodes worden automatisch getoond in het Stripe Checkout proces als je `allow_promotion_codes: true` hebt ingesteld (dit is al gedaan in de code).

## Deployed Edge Functions

De volgende Edge Functions zijn gedeployed:

1. **create-stripe-checkout**
   - Creëert Stripe Checkout sessie
   - Ondersteunt promotion codes
   - URL: `https://[PROJECT].supabase.co/functions/v1/create-stripe-checkout`

2. **create-stripe-portal**
   - Opent Stripe Customer Portal
   - Voor factuurbeheer en annuleren
   - URL: `https://[PROJECT].supabase.co/functions/v1/create-stripe-portal`

3. **stripe-webhook**
   - Verwerkt Stripe webhooks
   - Synchroniseert subscription status met database
   - URL: `https://[PROJECT].supabase.co/functions/v1/stripe-webhook`

## Database Schema

De `subscriptions` tabel bevat de volgende Stripe-gerelateerde velden:

```sql
- stripe_customer_id text          -- Stripe Customer ID
- stripe_subscription_id text      -- Stripe Subscription ID
- plan text                        -- FREE, PLUS, PRO
- status text                      -- ACTIVE, TRIALING, CANCELLED, PAST_DUE, EXPIRED, INCOMPLETE
- current_period_start timestamptz -- Start huidige periode
- current_period_end timestamptz   -- Einde huidige periode
- cancel_at_period_end boolean     -- Annuleren aan einde periode
- trial_start timestamptz          -- Start trial
- trial_end timestamptz            -- Einde trial
```

## Testen

### Test Kaarten (Test Mode)
Gebruik deze kaarten voor testen:

- **Succesvol**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

**CVV**: Elk 3-cijferig getal
**Expiry**: Elke datum in de toekomst
**Postcode**: Elk getal

### Test Flow

1. **Upgrade naar PLUS/PRO:**
   - Ga naar Instellingen > Abonnement
   - Klik op "Upgraden" voor PLUS of PRO
   - Voer test kaart in
   - Voer optionele promocode in
   - Bevestig betaling
   - Controleer dat status wordt bijgewerkt

2. **Customer Portal:**
   - Klik op "Klantenportaal"
   - Bekijk facturen
   - Test abonnement annuleren
   - Test betaalmethode wijzigen

3. **Webhook Testen:**
   - Monitoor webhook events in Stripe Dashboard
   - Controleer database updates na events
   - Test trial periode (indien ingesteld)

## Troubleshooting

### Webhook niet werkend
1. Controleer of `STRIPE_WEBHOOK_SECRET` correct is ingesteld
2. Bekijk webhook logs in Stripe Dashboard
3. Controleer Edge Function logs in Supabase

### Checkout niet openend
1. Controleer of `VITE_STRIPE_PUBLISHABLE_KEY` correct is
2. Controleer of Price IDs kloppen
3. Bekijk browser console voor errors

### Database niet ge-update
1. Controleer webhook events in Stripe Dashboard
2. Bekijk Edge Function logs
3. Controleer of `family_id` in metadata staat

## Live Deployment Checklist

Wanneer je naar productie gaat:

- [ ] Wissel naar Live mode API keys (pk_live_... en sk_live_...)
- [ ] Update webhook endpoint naar production URL
- [ ] Test alle flows met echte kaarten (klein bedrag)
- [ ] Configureer Customer Portal production settings
- [ ] Activeer email notificaties in Stripe Dashboard
- [ ] Test kortingscodes in productie
- [ ] Monitor eerste echte betalingen nauwkeurig

## Belangrijke Notities

1. **FREE plan**: Wordt NIET in Stripe beheerd, alleen in database
2. **Gezin-niveau**: Abonnement geldt voor hele gezin, niet individuele gebruikers
3. **Trial beheer**: Trial periodes worden in Stripe ingesteld per product
4. **Kortingscodes**: Volledig in Stripe beheerd, geen eigen logica nodig
5. **Webhooks**: ESSENTIEEL voor correcte synchronisatie
6. **Customer Portal**: Gebruikers kunnen zelf hun abonnement beheren

## Support

Voor vragen over Stripe integratie:
- Stripe Documentatie: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
