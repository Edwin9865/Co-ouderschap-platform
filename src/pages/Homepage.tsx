// src/pages/Homepage.tsx
import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "teal" | "emerald" | "cyan" | "sky" | "amber" | "rose";
}

function FeatureCard({ icon, title, description, tone = "teal" }: FeatureCardProps) {
  const tones: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:border-teal-200">
      <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center mb-5 ${tones[tone]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 border-2 border-emerald-200">
        <CheckCircle className="w-4 h-4 text-emerald-700" />
      </div>
      <span className="text-gray-700 text-lg">{text}</span>
    </div>
  );
}

function StatCard({ icon, stat, label }: { icon: React.ReactNode; stat: string; label: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center border-2 border-teal-100">
          {icon}
        </div>
        <div>
          <div className="text-4xl font-bold text-gray-900">{stat}</div>
          <div className="text-sm text-gray-600 mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-1 text-amber-500 mb-5" aria-label="5 sterren">
        <Star className="w-5 h-5 fill-current" />
        <Star className="w-5 h-5 fill-current" />
        <Star className="w-5 h-5 fill-current" />
        <Star className="w-5 h-5 fill-current" />
        <Star className="w-5 h-5 fill-current" />
      </div>
      <p className="text-gray-700 leading-relaxed text-lg italic">"{quote}"</p>
      <div className="mt-5 text-sm">
        <div className="font-bold text-gray-900 text-base">{author}</div>
        <div className="text-gray-500 mt-1">{role}</div>
      </div>
    </div>
  );
}

function MiniFaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 p-7 hover:shadow-lg transition-shadow">
      <div className="font-bold text-gray-900 text-lg mb-3">{q}</div>
      <div className="text-gray-600 leading-relaxed">{a}</div>
    </div>
  );
}

interface Screenshot {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const screenshots: Screenshot[] = [
    {
      id: 1,
      title: "Gedeelde Agenda",
      description: "Overzicht van alle afspraken, wissels en activiteiten",
      imageUrl: "/api/placeholder/600/900",
    },
    {
      id: 2,
      title: "Verzoeken Systeem",
      description: "Duidelijke communicatie zonder eindeloze discussies",
      imageUrl: "/api/placeholder/600/900",
    },
    {
      id: 3,
      title: "Digitaal Logboek",
      description: "Bewaar belangrijke informatie over gezondheid en school",
      imageUrl: "/api/placeholder/600/900",
    },
    {
      id: 4,
      title: "Hulpverleners Portaal",
      description: "Veilige toegang voor professionals met juiste rechten",
      imageUrl: "/api/placeholder/600/900",
    },
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, screenshots.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl border-2 border-teal-100 p-8 overflow-hidden">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {screenshots[currentIndex].title}
          </h3>
          <p className="text-gray-600">{screenshots[currentIndex].description}</p>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl border-2 border-gray-200">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="w-full flex-shrink-0">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-teal-100 rounded-2xl mx-auto mb-4 flex items-center justify-center border-2 border-teal-200">
                      <Calendar className="w-10 h-10 text-teal-600" />
                    </div>
                    <p className="text-gray-500 font-semibold">Screenshot: {screenshot.title}</p>
                    <p className="text-gray-400 text-sm mt-2">App preview komt binnenkort</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg"
            aria-label="Vorige screenshot"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg"
            aria-label="Volgende screenshot"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-teal-600 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Ga naar screenshot ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Homepage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-white border-2 border-teal-200 text-teal-700 shadow-sm">
                <Sparkles className="w-5 h-5 text-teal-600" />
                Rust in communicatie • overzicht in planning
              </div>

              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
                Co-ouderschap, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                  overzichtelijk en rustig
                </span>
              </h1>

              <p className="mt-6 text-xl sm:text-2xl text-gray-700 leading-relaxed">
                Communiceer duidelijk, deel agenda's en leg belangrijke momenten vast — op één plek.
                Ontworpen om misverstanden te verminderen en kinderen voorspelbaarheid te geven.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Start vandaag gratis
                  <ArrowRight className="w-6 h-6" />
                </Link>

                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl text-lg font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all border-2 border-gray-200"
                >
                  Bekijk prijzen
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-600 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-600" />
                  Geen creditcard nodig
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Veilig delen met rechten
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-600" />
                  Web + mobiel
                </span>
              </div>
            </div>

            {/* Screenshot Carousel */}
            <div className="hidden lg:block">
              <ScreenshotCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Trust / quick benefits */}
      <section className="py-16 bg-white border-t-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-teal-200 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-teal-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Privacy-first</div>
                  <div className="text-gray-600 mt-1">Jij bepaalt wie wat ziet</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Duidelijk & rustig</div>
                  <div className="text-gray-600 mt-1">Minder misverstanden</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border-2 border-cyan-100 rounded-3xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-cyan-200 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-cyan-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Altijd bij de hand</div>
                  <div className="text-gray-600 mt-1">Web + mobiel, altijd sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
              Alles wat je nodig hebt — zonder ruis
            </h2>
            <p className="mt-5 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Planning, communicatie en logboek op één plek. Ontworpen om het makkelijker te maken
              voor ouders én ondersteuners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="w-7 h-7" />}
              title="Gedeelde agenda"
              description="Plan activiteiten, opvang en wisselmomenten. Met herinneringen en duidelijke afspraken."
              tone="teal"
            />
            <FeatureCard
              icon={<FileText className="w-7 h-7" />}
              title="Digitaal logboek"
              description="Leg gezondheid, school en belangrijke gebeurtenissen vast. Met notities en foto's."
              tone="emerald"
            />
            <FeatureCard
              icon={<MessageCircle className="w-7 h-7" />}
              title="Verzoeken-systeem"
              description="Maak afspraken en wijzigingen bespreekbaar zonder eindeloze appgesprekken."
              tone="cyan"
            />
            <FeatureCard
              icon={<Shield className="w-7 h-7" />}
              title="Privacy & veiligheid"
              description="Rechten per gebruiker. Jij bepaalt wat je deelt en met wie."
              tone="sky"
            />
            <FeatureCard
              icon={<Clock className="w-7 h-7" />}
              title="Web + mobiel"
              description="Altijd toegankelijk, automatisch gesynchroniseerd tussen apparaten."
              tone="amber"
            />
            <FeatureCard
              icon={<Heart className="w-7 h-7" />}
              title="Hulpverleners-portaal"
              description="Geef veilig toegang aan mediator/therapeut, zonder dat zij alles kunnen wijzigen."
              tone="rose"
            />
          </div>
        </div>
      </section>

      {/* Benefits + stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                Voor het welzijn van je kinderen
              </h2>
              <p className="mt-6 text-gray-700 leading-relaxed text-xl">
                Co-ouderschap kan uitdagend zijn. Structuur en voorspelbaarheid helpen kinderen.
                CoParenting ondersteunt met duidelijke afspraken, overzicht en veilige samenwerking.
              </p>

              <div className="mt-10 space-y-5">
                <BenefitItem text="Verminder stress met duidelijke communicatie en vaste formats" />
                <BenefitItem text="Voorkom misverstanden met één gedeelde agenda en heldere wissels" />
                <BenefitItem text="Bewaar belangrijke info (gezondheid/school) op één plek" />
                <BenefitItem text="Betrek hulpverleners veilig met rollen en rechten" />
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Gratis starten
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

            <div className="space-y-6">
              <StatCard icon={<Baby className="w-10 h-10 text-teal-600" />} stat="10.000+" label="Gezinnen gebruiken CoParenting" />
              <StatCard icon={<Scale className="w-10 h-10 text-emerald-600" />} stat="95%" label="Ervaart minder conflict over planning" />
              <StatCard icon={<Heart className="w-10 h-10 text-rose-600" />} stat="4.8/5" label="Gemiddelde waardering" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Zo werkt het</h2>
            <p className="mt-5 text-xl text-gray-600 max-w-2xl mx-auto">
              Binnen een paar minuten opgezet. Daarna heb je rust en overzicht.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 border-2 border-teal-200 flex items-center justify-center">
                <Users className="w-8 h-8 text-teal-700" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">1) Maak een account</h3>
              <p className="mt-3 text-gray-600 leading-relaxed text-lg">
                Start gratis en voeg je gezin toe. Je kunt later altijd upgraden.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-200 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">2) Nodig de co-ouder uit</h3>
              <p className="mt-3 text-gray-600 leading-relaxed text-lg">
                Nodig veilig uit en bepaal rechten. Communicatie en planning komen samen.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 border-2 border-cyan-200 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-cyan-700" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-900">3) Plan en leg vast</h3>
              <p className="mt-3 text-gray-600 leading-relaxed text-lg">
                Werk met afspraken, logboek en verzoeken. Alles blijft terug te vinden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 text-center">
            Wat anderen zeggen
          </h2>
          <p className="mt-5 text-xl text-gray-600 text-center max-w-2xl mx-auto">
            Ervaringen van ouders en professionals die met CoParenting werken.
          </p>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Veelgestelde vragen</h2>
            <p className="mt-5 text-xl text-gray-600 max-w-2xl mx-auto">
              Snel antwoord op de belangrijkste vragen. Meer? Bekijk de volledige FAQ.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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

          <div className="mt-12 text-center">
            <Link
              to="/faq"
              className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Naar de volledige FAQ
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Klaar voor beter co-ouderschap?
          </h2>
          <p className="mt-6 text-xl text-teal-50">
            Begin vandaag nog gratis. Geen creditcard nodig. Altijd opzegbaar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-3 bg-white text-teal-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              Maak een gratis account
              <ArrowRight className="w-6 h-6" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-3 bg-teal-700/30 text-white px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-teal-700/50 hover:-translate-y-0.5 transition-all backdrop-blur-sm"
            >
              Ik heb al een account
            </Link>
          </div>

          <div className="mt-8 text-teal-100 inline-flex items-center gap-2 text-lg font-semibold">
            <Lock className="w-5 h-5" />
            Privacy en veiligheid staan centraal
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
