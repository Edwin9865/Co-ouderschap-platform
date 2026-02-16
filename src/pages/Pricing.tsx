// src/pages/Pricing.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Lock,
  MessageCircle,
  Users,
  FileText,
  Calendar,
  Download,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import Seo from "../components/Seo";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function TierIcon({ name }: { name: string }) {
  if (name === "Basis") return <Users className="w-5 h-5" />;
  if (name === "Pro") return <Sparkles className="w-5 h-5" />;
  return <Shield className="w-5 h-5" />;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

export default function Pricing() {
  const tiers: PricingTier[] = useMemo(
    () => [
      {
        name: "Basis",
        price: "0",
        period: "gratis",
        description: "Perfect om te starten met overzicht en structuur.",
        features: [
          "Agenda voor 1 kind",
          "Basis logboek",
          "Verzoeken versturen",
          "Mobiele app + web",
          "Notificaties",
          "Tot 2 gezinsleden",
        ],
        highlighted: false,
        cta: "Start gratis",
      },
      {
        name: "Pro",
        price: "9,99",
        period: "per maand",
        description: "Voor gezinnen die alles goed willen organiseren.",
        features: [
          "Onbeperkt aantal kinderen",
          "Uitgebreid logboek",
          "Verzoeken & voorstellen",
          "Gedeelde documenten",
          "Export (PDF)",
          "Onbeperkt gezinsleden",
          "Prioriteitsondersteuning",
          "Extra opslagruimte",
        ],
        highlighted: true,
        cta: "Start met Pro",
      },
      {
        name: "Familie",
        price: "14,99",
        period: "per maand",
        description: "Voor gezinnen met hulpverleners of extra ondersteuning.",
        features: [
          "Alles van Pro",
          "Toegang voor hulpverleners",
          "Hulpverlenerscommunicatie",
          "Veiligheidsmeldingen",
          "Geavanceerde rapportages",
          "Teamondersteuning",
          "Persoonlijke onboarding",
          "Maandelijkse check-in",
        ],
        highlighted: false,
        cta: "Kies Familie",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Prijzen | CoParenting"
        description="Transparante prijzen voor CoParenting. Start gratis en upgrade wanneer je meer functies nodig hebt. Maandelijks opzegbaar."
        canonicalUrl={(import.meta as any).env?.VITE_SITE_URL ? `${(import.meta as any).env.VITE_SITE_URL}/pricing` : undefined}
        ogTitle="Prijzen | CoParenting"
        ogDescription="Start gratis, upgrade wanneer nodig. Transparante abonnementen zonder verrassingen."
      />

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill>
                <Lock className="w-4 h-4 text-blue-600" />
                Geen creditcard nodig
              </Pill>
              <Pill>
                <Shield className="w-4 h-4 text-blue-600" />
                Privacy-first
              </Pill>
              <Pill>
                <MessageCircle className="w-4 h-4 text-blue-600" />
                Duidelijke communicatie
              </Pill>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
              Transparante prijzen, <span className="text-blue-600">geen verrassingen</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Begin gratis en upgrade wanneer je meer functionaliteit nodig hebt. Alle abonnementen zijn maandelijks opzegbaar.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                Start vandaag gratis
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-2xl font-semibold border border-slate-200 hover:bg-slate-50 transition"
              >
                Bekijk FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-3 gap-7">
            {tiers.map((tier) => {
              const isPro = tier.highlighted;

              return (
                <div
                  key={tier.name}
                  className={cx(
                    "relative rounded-3xl p-8 border transition",
                    isPro
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl shadow-blue-200/60 border-blue-400/60 md:-translate-y-1"
                      : "bg-white text-slate-900 border-slate-200 hover:shadow-lg"
                  )}
                >
                  {isPro ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                        <Sparkles className="w-4 h-4" />
                        <span>Meest gekozen</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <div className={cx("inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full border", isPro ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700")}>
                      <TierIcon name={tier.name} />
                      {tier.name}
                    </div>

                    {tier.name === "Familie" ? (
                      <div className={cx("text-xs font-semibold px-3 py-1 rounded-full border", isPro ? "border-white/20 bg-white/10" : "border-slate-200 bg-white")}>
                        Voor hulpverleners
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 text-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={cx("text-5xl font-extrabold", isPro ? "text-white" : "text-slate-900")}>
                        €{tier.price}
                      </span>
                      <span className={cx("text-sm", isPro ? "text-blue-100" : "text-slate-500")}>
                        {tier.period === "gratis" ? tier.period : tier.period}
                      </span>
                    </div>

                    <p className={cx("mt-3 text-sm leading-relaxed", isPro ? "text-blue-100" : "text-slate-600")}>
                      {tier.description}
                    </p>
                  </div>

                  <div className={cx("mt-7 rounded-2xl p-4 border", isPro ? "border-white/15 bg-white/10" : "border-slate-200 bg-slate-50")}>
                    <div className={cx("text-xs font-semibold mb-3", isPro ? "text-blue-50" : "text-slate-700")}>
                      Inbegrepen
                    </div>
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={cx("w-5 h-5 flex-shrink-0 mt-0.5", isPro ? "text-blue-100" : "text-green-600")} />
                          <span className={cx("text-sm", isPro ? "text-blue-50" : "text-slate-700")}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to="/register"
                    className={cx(
                      "mt-7 block w-full py-3.5 px-6 rounded-2xl text-center font-semibold transition-all",
                      isPro
                        ? "bg-white text-blue-700 hover:bg-blue-50 shadow-lg"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {tier.cta}
                  </Link>

                  <div className={cx("mt-4 text-xs text-center", isPro ? "text-blue-100" : "text-slate-500")}>
                    {tier.name === "Basis" ? "Upgrade wanneer jij er klaar voor bent." : "Maandelijks opzegbaar."}
                  </div>
                </div>
              );
            })}
          </div>

          {/* What you get (summary blocks) */}
          <div className="mt-12 grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Planning zonder ruis</div>
                  <div className="text-sm text-slate-600">Wissels, school, sport en afspraken.</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Logboek & documentatie</div>
                  <div className="text-sm text-slate-600">Alles terugvindbaar en chronologisch.</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Download className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Exports (PDF)</div>
                  <div className="text-sm text-slate-600">Handig voor administratie of overleg.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini FAQ */}
          <div className="mt-14 max-w-3xl mx-auto">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-8 text-center">
              Veelgestelde vragen over prijzen
            </h3>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Kan ik mijn abonnement opzeggen?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ja. Alle betaalde abonnementen zijn maandelijks opzegbaar. Je behoudt toegang tot het einde van je lopende periode.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Wat gebeurt er met mijn data als ik stop?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Je kunt altijd exporteren (bij Pro/Familie). Bij stoppen ga je terug naar het gratis plan. We raden aan om vóór downgrade je gewenste exports te maken.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Betalen beide ouders apart?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Nee. Eén abonnement is bedoeld voor het gezin en geeft toegang aan beide ouders (en eventueel extra gezinsleden).
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">Is er korting voor jaarabonnementen?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Vaak wel (bijv. een voordeel t.o.v. maandelijks). Als je dit wilt, stuur even een bericht via contact—dan regelen we het.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-2xl font-semibold border border-slate-200 hover:bg-slate-50 transition"
              >
                Meer vragen? Bekijk de FAQ
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-14 text-center bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
            <h3 className="text-3xl font-extrabold text-slate-900 mb-3">Nog vragen?</h3>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              We helpen je graag bij het kiezen van het juiste abonnement voor jouw situatie.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200"
              >
                Neem contact op
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-semibold border border-slate-200 hover:bg-slate-50 transition"
              >
                Start gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
