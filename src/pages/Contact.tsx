// src/pages/Contact.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, FileText, HelpCircle, ArrowRight } from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import Seo from "../components/Seo";

type SupportCard = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  label: string;
  email: string;
  accentBg: string;
  accentText: string;
};

const SUPPORT_CARDS: SupportCard[] = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: "E-mail Support",
    desc: "Stuur ons een e-mail met uw vraag of probleem. We streven ernaar binnen 24 uur te reageren.",
    label: "Algemene vragen",
    email: "info@co-ouderschap.nl",
    accentBg: "bg-blue-100",
    accentText: "text-blue-600",
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Technische Support",
    desc: "Ondervindt u technische problemen? Neem contact op met ons technisch support team.",
    label: "Technische vragen",
    email: "support@co-ouderschap.nl",
    accentBg: "bg-purple-100",
    accentText: "text-purple-600",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Privacy & Juridisch",
    desc: "Vragen over privacy, gegevensbescherming of juridische zaken? We staan voor u klaar.",
    label: "Privacy vragen",
    email: "privacy@co-ouderschap.nl",
    accentBg: "bg-green-100",
    accentText: "text-green-600",
  },
  {
    icon: <HelpCircle className="w-6 h-6" />,
    title: "Feedback & Suggesties",
    desc: "We waarderen uw feedback! Help ons het platform te verbeteren met uw ideeën.",
    label: "Feedback & ideeën",
    email: "feedback@co-ouderschap.nl",
    accentBg: "bg-orange-100",
    accentText: "text-orange-600",
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
        <Link to="/privacybeleid" className="text-blue-600 hover:underline">
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
        <Link to="/privacybeleid" className="text-blue-600 hover:underline">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
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
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                Support & Service
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Contact & Support
              </h1>
              <p className="mt-3 text-slate-600 text-lg leading-relaxed max-w-xl">
                Heeft u vragen of hulp nodig? We helpen u graag verder. Kies het onderwerp dat het beste past,
                dan komt uw bericht direct bij het juiste team.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/faq"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  Bekijk FAQ
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition"
                >
                  Bekijk prijzen
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Richtlijn: reactie binnen 24 uur op werkdagen (controleer ook uw spam-map).
              </p>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Snelle tips</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
                <li className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  Voeg bij technische issues uw apparaat + browser/OS toe (bijv. “Chrome op Windows 11”).
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  Vermeld bij export/problemen liefst een datum + welk scherm u gebruikte.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  Bij dringende technische problemen: zet <span className="font-semibold text-slate-800">[URGENT]</span> in het onderwerp.
                </li>
              </ul>

              <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="font-semibold text-blue-900">Krijg geen antwoord?</div>
                <p className="mt-1 text-sm text-blue-800">
                  Controleer of uw e-mail correct is verzonden en kijk in uw spam-map.
                  We streven ernaar binnen 24 uur te reageren op werkdagen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support cards */}
      <section className="pb-12 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUPPORT_CARDS.map((c) => (
              <div key={c.email} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
                <div className={cx("w-12 h-12 rounded-xl flex items-center justify-center mb-4", c.accentBg)}>
                  <div className={cx(c.accentText)}>{c.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{c.desc}</p>

                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-500">{c.label}</div>
                  <a className="mt-1 inline-block text-blue-600 hover:underline font-semibold" href={`mailto:${c.email}`}>
                    {c.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ quick */}
      <section className="pb-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Veelgestelde vragen (kort)</h2>
                <p className="mt-2 text-slate-600">
                  Hieronder alvast de meest voorkomende vragen. Voor alle antwoorden:{" "}
                  <Link to="/faq" className="text-blue-600 hover:underline font-semibold">
                    ga naar de FAQ
                  </Link>
                  .
                </p>
              </div>

              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              >
                Alle FAQ’s
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {FAQ_QUICK.map((item) => (
                <div key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="font-bold text-slate-900">{item.q}</div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">{item.a as any}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 text-sm text-slate-600">
              Meer informatie:{" "}
              <Link to="/algemene-voorwaarden" className="text-blue-600 hover:underline font-semibold">
                Algemene Voorwaarden
              </Link>{" "}
              •{" "}
              <Link to="/privacybeleid" className="text-blue-600 hover:underline font-semibold">
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
