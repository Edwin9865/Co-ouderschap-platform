// src/pages/Contact.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, FileText, HelpCircle, ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import Seo from "../components/Seo";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SupportCard = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  label: string;
  email: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
};

const SUPPORT_CARDS: SupportCard[] = [
  {
    icon: <Mail className="w-7 h-7" />,
    title: "E-mail Support",
    desc: "Stuur ons een e-mail met uw vraag of probleem. We streven ernaar binnen 24 uur te reageren.",
    label: "Algemene vragen",
    email: "info@co-ouderschap.nl",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-200",
    accentText: "text-teal-600",
  },
  {
    icon: <MessageCircle className="w-7 h-7" />,
    title: "Technische Support",
    desc: "Ondervindt u technische problemen? Neem contact op met ons technisch support team.",
    label: "Technische vragen",
    email: "support@co-ouderschap.nl",
    accentBg: "bg-cyan-50",
    accentBorder: "border-cyan-200",
    accentText: "text-cyan-600",
  },
  {
    icon: <FileText className="w-7 h-7" />,
    title: "Privacy & Juridisch",
    desc: "Vragen over privacy, gegevensbescherming of juridische zaken? We staan voor u klaar.",
    label: "Privacy vragen",
    email: "privacy@co-ouderschap.nl",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentText: "text-emerald-600",
  },
  {
    icon: <HelpCircle className="w-7 h-7" />,
    title: "Feedback & Suggesties",
    desc: "We waarderen uw feedback! Help ons het platform te verbeteren met uw ideeën.",
    label: "Feedback & ideeën",
    email: "feedback@co-ouderschap.nl",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-600",
  },
];

const FAQ_QUICK = [
  {
    q: "Hoe kan ik mijn co-ouder uitnodigen?",
    a: `Ga naar het Dashboard en zoek naar het vak "Co-ouder uitnodigen". Deel de koppelcode met uw co-ouder.
Deze kan de code gebruiken bij het registreren om toegang te krijgen tot het gezin.`,
  },
  {
    q: "Kan ik mijn gegevens verwijderen?",
    a: (
      <>
        Alle gegevens worden permanent opgeslagen voor dossierbeheer. U kunt wel uw account deactiveren,
        waarna de gegevens niet meer toegankelijk zijn. Voor meer informatie, zie ons{" "}
        <Link to="/privacybeleid" className="text-teal-600 hover:underline font-semibold">
          Privacybeleid
        </Link>
        .
      </>
    ),
  },
  {
    q: "Hoe exporteer ik mijn gegevens?",
    a: "Ga naar Export in het menu. Daar kunt u een volledig overzicht downloaden van alle gegevens in uw gezin.",
  },
  {
    q: "Wat zijn de verschillen tussen de abonnementen?",
    a: "Ga naar Instellingen → Abonnement om een volledig overzicht te zien van de beschikbare abonnementen en hun functies.",
  },
  {
    q: "Hoe voeg ik een hulpverlener toe?",
    a: `Ga naar Hulpverleners in het menu en klik op "Uitnodigen". U heeft de koppelcode nodig
die de hulpverlener bij registratie heeft ontvangen.`,
  },
  {
    q: "Is mijn data veilig?",
    a: (
      <>
        Ja, we nemen beveiliging zeer serieus. Alle gegevens worden versleuteld opgeslagen en verzonden.
        We gebruiken Row Level Security om ervoor te zorgen dat gebruikers alleen toegang hebben tot hun eigen gegevens.
        Lees meer in ons{" "}
        <Link to="/privacybeleid" className="text-teal-600 hover:underline font-semibold">
          Privacybeleid
        </Link>
        .
      </>
    ),
  },
];

export default function Contact() {
  const siteUrl = (import.meta as any).env?.VITE_SITE_URL || "";
  const canonicalPath = "/contact";
  const canonicalUrl = siteUrl ? `${siteUrl.replace(/\/+$/, "")}${canonicalPath}` : canonicalPath;

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Contact & Support | CoParenting"
        description="Neem contact op met CoParenting voor vragen, technische support, privacy en feedback. We reageren meestal binnen 24 uur op werkdagen."
        canonicalUrl={canonicalUrl}
        ogTitle="Contact & Support | CoParenting"
        ogDescription="Vragen of hulp nodig? Neem contact op met ons support team. Meestal reactie binnen 24 uur op werkdagen."
        ogImage=""
        keywords={[
          "contact co-ouderschap",
          "support co-ouderschap app",
          "helpdesk co-ouderschap",
          "privacy co-ouderschap",
          "technische support co-ouderschap",
        ]}
      />

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-teal-200 text-sm font-bold text-teal-700 shadow-sm">
                <Sparkles className="w-5 h-5 text-teal-600" />
                Support & Service
              </div>

              <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Contact & Support
              </h1>
              <p className="mt-6 text-xl text-gray-700 leading-relaxed">
                Heeft u vragen of hulp nodig? We helpen u graag verder. Kies het onderwerp dat het beste past,
                dan komt uw bericht direct bij het juiste team.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/faq"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Bekijk FAQ
                  <ArrowRight className="w-6 h-6" />
                </Link>

                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold text-lg border-2 border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Bekijk prijzen
                </Link>
              </div>

              <p className="mt-6 text-base text-gray-600 font-medium">
                Richtlijn: reactie binnen 24 uur op werkdagen (controleer ook uw spam-map).
              </p>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-8 sm:p-10">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Snelle tips</h2>
              <ul className="space-y-4 text-base text-gray-700 leading-relaxed">
                <li className="flex gap-3">
                  <span className="mt-2 w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                  <span>Voeg bij technische issues uw apparaat + browser/OS toe (bijv. "Chrome op Windows 11").</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                  <span>Vermeld bij export/problemen liefst een datum + welk scherm u gebruikte.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 w-2 h-2 rounded-full bg-cyan-600 flex-shrink-0" />
                  <span>Bij dringende technische problemen: zet <span className="font-bold text-gray-900">[URGENT]</span> in het onderwerp.</span>
                </li>
              </ul>

              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-100">
                <div className="font-bold text-gray-900 text-lg mb-2">Krijg geen antwoord?</div>
                <p className="text-base text-gray-700 leading-relaxed">
                  Controleer of uw e-mail correct is verzonden en kijk in uw spam-map.
                  We streven ernaar binnen 24 uur te reageren op werkdagen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support cards */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {SUPPORT_CARDS.map((c) => (
              <div key={c.email} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={cx("w-14 h-14 rounded-2xl border-2 flex items-center justify-center mb-5", c.accentBg, c.accentBorder)}>
                  <div className={cx(c.accentText)}>{c.icon}</div>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">{c.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed mb-5">{c.desc}</p>

                <div className="rounded-2xl bg-gray-50 border-2 border-gray-100 p-5">
                  <div className="text-sm font-bold text-gray-600 mb-2">{c.label}</div>
                  <a className="inline-block text-teal-600 hover:underline font-bold text-base" href={`mailto:${c.email}`}>
                    {c.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ quick */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-8 sm:p-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Veelgestelde vragen (kort)</h2>
                <p className="mt-3 text-base text-gray-600 leading-relaxed">
                  Hieronder alvast de meest voorkomende vragen. Voor alle antwoorden:{" "}
                  <Link to="/faq" className="text-teal-600 hover:underline font-bold">
                    ga naar de FAQ
                  </Link>
                  .
                </p>
              </div>

              <Link
                to="/faq"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Alle FAQ's
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              {FAQ_QUICK.map((item) => (
                <div key={item.q} className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-6">
                  <div className="font-bold text-gray-900 text-lg mb-2">{item.q}</div>
                  <div className="text-base text-gray-700 leading-relaxed">{item.a as any}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t-2 border-gray-100 text-base text-gray-600">
              Meer informatie:{" "}
              <Link to="/algemene-voorwaarden" className="text-teal-600 hover:underline font-bold">
                Algemene Voorwaarden
              </Link>{" "}
              •{" "}
              <Link to="/privacybeleid" className="text-teal-600 hover:underline font-bold">
                Privacybeleid
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
