// src/pages/Homepage.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  FileText,
  MessageCircle,
  Shield,
  Clock,
  CheckCircle,
  Heart,
  Baby,
  Scale,
  ArrowRight,
  Star,
  Lock,
  Users,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "blue" | "green" | "orange" | "red" | "purple" | "pink";
}

function FeatureCard({ icon, title, description, tone = "blue" }: FeatureCardProps) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    pink: "bg-pink-50 text-pink-700 border-pink-100",
  };

  return (
    <div className="bg-white p-7 rounded-2xl border border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${tones[tone]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-4 h-4 text-green-600" />
      </div>
      <span className="text-slate-700">{text}</span>
    </div>
  );
}

function StatCard({ icon, stat, label }: { icon: React.ReactNode; stat: string; label: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <div className="text-3xl font-bold text-slate-900">{stat}</div>
          <div className="text-sm text-slate-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-1 text-amber-500 mb-4" aria-label="5 sterren">
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
        <Star className="w-4 h-4 fill-current" />
      </div>
      <p className="text-slate-700 leading-relaxed italic">“{quote}”</p>
      <div className="mt-4 text-sm">
        <div className="font-semibold text-slate-900">{author}</div>
        <div className="text-slate-500">{role}</div>
      </div>
    </div>
  );
}

function MiniFaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="font-semibold text-slate-900">{q}</div>
      <div className="mt-2 text-slate-600 leading-relaxed text-sm">{a}</div>
    </div>
  );
}

export function Homepage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Rust in communicatie • overzicht in planning
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                Co-ouderschap, <br />
                <span className="text-blue-600">overzichtelijk en rustig</span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-slate-600 leading-relaxed">
                TESTESTTEST:::Communiceer duidelijk, deel agenda’s en leg belangrijke momenten vast — op één plek.
                Ontworpen om misverstanden te verminderen en kinderen voorspelbaarheid te geven.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-2xl text-base font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  Start vandaag gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-2xl text-base font-semibold hover:bg-slate-50 transition border border-slate-200"
                >
                  Bekijk prijzen
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Geen creditcard nodig
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Veilig delen met rechten
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Web + mobiel
                </span>
              </div>
            </div>

            {/* Hero “product preview” */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Voorbeeld: weekoverzicht</div>
                  <div className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    Live sync
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Gedeelde agenda</div>
                      <div className="text-sm text-slate-600">School, sport, opvang en wissels</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">Vandaag</div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Verzoeken & reacties</div>
                      <div className="text-sm text-slate-600">Rustig en duidelijk, zonder gedoe</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">2 open</div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Logboek</div>
                      <div className="text-sm text-slate-600">Gezondheid, school, belangrijke notities</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">+ foto’s</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                    <div className="text-lg font-bold text-slate-900">4.8</div>
                    <div className="text-xs text-slate-500">Waardering</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                    <div className="text-lg font-bold text-slate-900">1 min</div>
                    <div className="text-xs text-slate-500">Setup</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                    <div className="text-lg font-bold text-slate-900">∞</div>
                    <div className="text-xs text-slate-500">Rust</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Gebouwd voor co-ouders én hulpverleners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / quick benefits */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Privacy-first</div>
                  <div className="text-sm text-slate-600">Jij bepaalt wie wat ziet</div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Duidelijk & rustig</div>
                  <div className="text-sm text-slate-600">Minder misverstanden</div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Altijd bij de hand</div>
                  <div className="text-sm text-slate-600">Web + mobiel, altijd sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Alles wat je nodig hebt — zonder ruis
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
              Planning, communicatie en logboek op één plek. Ontworpen om het makkelijker te maken
              voor ouders én ondersteuners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Gedeelde agenda"
              description="Plan activiteiten, opvang en wisselmomenten. Met herinneringen en duidelijke afspraken."
              tone="blue"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Digitaal logboek"
              description="Leg gezondheid, school en belangrijke gebeurtenissen vast. Met notities en foto’s."
              tone="green"
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title="Verzoeken-systeem"
              description="Maak afspraken en wijzigingen bespreekbaar zonder eindeloze appgesprekken."
              tone="orange"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Privacy & veiligheid"
              description="Rechten per gebruiker. Jij bepaalt wat je deelt en met wie."
              tone="red"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Web + mobiel"
              description="Altijd toegankelijk, automatisch gesynchroniseerd tussen apparaten."
              tone="purple"
            />
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Hulpverleners-portaal"
              description="Geef veilig toegang aan mediator/therapeut, zonder dat zij alles kunnen wijzigen."
              tone="pink"
            />
          </div>
        </div>
      </section>

      {/* Benefits + stats */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Voor het welzijn van je kinderen
              </h2>
              <p className="mt-5 text-slate-600 leading-relaxed text-lg">
                Co-ouderschap kan uitdagend zijn. Structuur en voorspelbaarheid helpen kinderen.
                CoParenting ondersteunt met duidelijke afspraken, overzicht en veilige samenwerking.
              </p>

              <div className="mt-8 space-y-4">
                <BenefitItem text="Verminder stress met duidelijke communicatie en vaste formats" />
                <BenefitItem text="Voorkom misverstanden met één gedeelde agenda en heldere wissels" />
                <BenefitItem text="Bewaar belangrijke info (gezondheid/school) op één plek" />
                <BenefitItem text="Betrek hulpverleners veilig met rollen en rechten" />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition"
                >
                  Gratis starten
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

            <div className="space-y-5">
              <StatCard icon={<Baby className="w-8 h-8 text-blue-600" />} stat="10.000+" label="Gezinnen gebruiken CoParenting" />
              <StatCard icon={<Scale className="w-8 h-8 text-green-600" />} stat="95%" label="Ervaart minder conflict over planning" />
              <StatCard icon={<Heart className="w-8 h-8 text-red-600" />} stat="4.8/5" label="Gemiddelde waardering" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Zo werkt het</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Binnen een paar minuten opgezet. Daarna heb je rust en overzicht.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">1) Maak een account</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Start gratis en voeg je gezin toe. Je kunt later altijd upgraden.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">2) Nodig de co-ouder uit</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Nodig veilig uit en bepaal rechten. Communicatie en planning komen samen.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">3) Plan en leg vast</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Werk met afspraken, logboek en verzoeken. Alles blijft terug te vinden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center">
            Wat anderen zeggen
          </h2>
          <p className="mt-4 text-lg text-slate-600 text-center max-w-2xl mx-auto">
            Ervaringen van ouders en professionals die met CoParenting werken.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-7">
            <TestimonialCard
              quote="We hebben eindelijk minder discussie over afspraken. Alles staat op één plek en is terug te vinden."
              author="Linda"
              role="Moeder van 2"
            />
            <TestimonialCard
              quote="De gedeelde agenda voorkomt frustratie. Onze zoon merkt vooral dat er meer rust is."
              author="Mark"
              role="Vader van 1"
            />
            <TestimonialCard
              quote="Als mediator vind ik het fijn dat afspraken en verzoeken overzichtelijk zijn. Dat helpt gezinnen vooruit."
              author="Dr. Peters"
              role="Gezinstherapeut"
            />
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Veelgestelde vragen</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Snel antwoord op de belangrijkste vragen. Meer? Bekijk de volledige FAQ.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            <MiniFaqItem
              q="Is er een gratis plan?"
              a="Ja. Je kunt gratis starten zonder creditcard. Upgraden kan altijd later."
            />
            <MiniFaqItem
              q="Werkt dit ook bij veel conflict?"
              a="Ja. Je kunt communicatie beperken en met verzoeken werken om misverstanden te verminderen."
            />
            <MiniFaqItem
              q="Kan een hulpverlener meekijken?"
              a="Ja. Je kunt veilige toegang geven met duidelijke rechten (alleen lezen of beperkt beheren)."
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/faq"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-2xl font-semibold border border-slate-200 hover:bg-slate-50 transition"
            >
              Naar de volledige FAQ
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Klaar voor beter co-ouderschap?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Begin vandaag nog gratis. Geen creditcard nodig. Altijd opzegbaar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-2xl font-semibold hover:bg-slate-50 transition shadow-sm"
            >
              Maak een gratis account
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-700/30 text-white px-7 py-3.5 rounded-2xl font-semibold border border-blue-200/20 hover:bg-blue-700/40 transition"
            >
              Ik heb al een account
            </Link>
          </div>

          <div className="mt-6 text-sm text-blue-100 inline-flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Privacy en veiligheid staan centraal
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
