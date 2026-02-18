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
    <span className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-white border-2 border-teal-200 text-teal-700 shadow-sm">
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
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3">
              <Pill>
                <Lock className="w-5 h-5 text-teal-600" />
                Geen creditcard nodig
              </Pill>
              <Pill>
                <Shield className="w-5 h-5 text-emerald-600" />
                Privacy-first
              </Pill>
              <Pill>
                <MessageCircle className="w-5 h-5 text-cyan-600" />
                Duidelijke communicatie
              </Pill>
            </div>

            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Transparante prijzen, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">geen verrassingen</span>
            </h1>
            <p className="mt-6 text-xl text-gray-700 leading-relaxed">
              Begin gratis en upgrade wanneer je meer functionaliteit nodig hebt. Alle abonnementen zijn maandelijks opzegbaar.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Start vandaag gratis
                <ArrowRight className="w-6 h-6" />
              </Link>

              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Bekijk FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => {
              const isPro = tier.highlighted;

              return (
                <div
                  key={tier.name}
                  className={cx(
                    "relative rounded-3xl p-8 border-2 transition-all",
                    isPro
                      ? "bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-2xl shadow-teal-200/50 border-teal-400 md:-translate-y-2 md:scale-105"
                      : "bg-white text-gray-900 border-gray-100 hover:shadow-xl hover:-translate-y-1"
                  )}
                >
                  {isPro ? (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-2 bg-amber-400 text-gray-900 px-5 py-2 rounded-full text-sm font-extrabold shadow-xl">
                        <Sparkles className="w-5 h-5" />
                        <span>Meest gekozen</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <div className={cx("inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border-2", isPro ? "border-white/30 bg-white/15 text-white" : "border-gray-200 bg-gray-50 text-gray-700")}>
                      <TierIcon name={tier.name} />
                      {tier.name}
                    </div>

                    {tier.name === "Familie" ? (
                      <div className={cx("text-xs font-bold px-3 py-1.5 rounded-full border-2", isPro ? "border-white/30 bg-white/15 text-white" : "border-gray-200 bg-white text-gray-700")}>
                        Voor hulpverleners
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-8 text-center">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className={cx("text-6xl font-extrabold", isPro ? "text-white" : "text-gray-900")}>
                        €{tier.price}
                      </span>
                      <span className={cx("text-base font-semibold", isPro ? "text-teal-100" : "text-gray-500")}>
                        {tier.period === "gratis" ? tier.period : tier.period}
                      </span>
                    </div>

                    <p className={cx("mt-4 text-base leading-relaxed", isPro ? "text-teal-100" : "text-gray-600")}>
                      {tier.description}
                    </p>
                  </div>

                  <div className={cx("mt-8 rounded-2xl p-6 border-2", isPro ? "border-white/20 bg-white/10" : "border-gray-100 bg-gray-50")}>
                    <div className={cx("text-sm font-bold mb-4", isPro ? "text-teal-100" : "text-gray-700")}>
                      Inbegrepen
                    </div>
                    <ul className="space-y-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={cx("w-6 h-6 flex-shrink-0 mt-0.5", isPro ? "text-teal-100" : "text-emerald-600")} />
                          <span className={cx("text-base", isPro ? "text-teal-50" : "text-gray-700")}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to="/register"
                    className={cx(
                      "mt-8 block w-full py-4 px-6 rounded-2xl text-center font-bold text-lg transition-all",
                      isPro
                        ? "bg-white text-teal-700 hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-0.5"
                        : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:shadow-xl hover:-translate-y-0.5"
                    )}
                  >
                    {tier.cta}
                  </Link>

                  <div className={cx("mt-4 text-sm text-center font-semibold", isPro ? "text-teal-100" : "text-gray-500")}>
                    {tier.name === "Basis" ? "Upgrade wanneer jij er klaar voor bent." : "Maandelijks opzegbaar."}
                  </div>
                </div>
              );
            })}
          </div>

          {/* What you get (summary blocks) */}
          <div className="mt-20 grid lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl border-2 border-teal-100 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-teal-200 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Planning zonder ruis</div>
                  <div className="text-gray-600 mt-1">Wissels, school, sport en afspraken.</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border-2 border-emerald-100 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Logboek & documentatie</div>
                  <div className="text-gray-600 mt-1">Alles terugvindbaar en chronologisch.</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border-2 border-amber-100 p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
                  <Download className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Exports (PDF)</div>
                  <div className="text-gray-600 mt-1">Handig voor administratie of overleg.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12 text-center">
              Veelgestelde vragen over prijzen
            </h3>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-gray-900 mb-3 text-xl">Kan ik mijn abonnement opzeggen?</h4>
                <p className="text-gray-700 text-base leading-relaxed">
                  Ja. Alle betaalde abonnementen zijn maandelijks opzegbaar. Je behoudt toegang tot het einde van je lopende periode.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-gray-900 mb-3 text-xl">Wat gebeurt er met mijn data als ik stop?</h4>
                <p className="text-gray-700 text-base leading-relaxed">
                  Je kunt altijd exporteren (bij Pro/Familie). Bij stoppen ga je terug naar het gratis plan. We raden aan om vóór downgrade je gewenste exports te maken.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-gray-900 mb-3 text-xl">Betalen beide ouders apart?</h4>
                <p className="text-gray-700 text-base leading-relaxed">
                  Nee. Eén abonnement is bedoeld voor het gezin en geeft toegang aan beide ouders (en eventueel extra gezinsleden).
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-gray-900 mb-3 text-xl">Is er korting voor jaarabonnementen?</h4>
                <p className="text-gray-700 text-base leading-relaxed">
                  Vaak wel (bijv. een voordeel t.o.v. maandelijks). Als je dit wilt, stuur even een bericht via contact—dan regelen we het.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Meer vragen? Bekijk de FAQ
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 text-center bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 border-2 border-gray-100 shadow-lg">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Nog vragen?</h3>
            <p className="text-gray-700 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              We helpen je graag bij het kiezen van het juiste abonnement voor jouw situatie.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Neem contact op
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
