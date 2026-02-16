// src/components/SiteFooter.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-300" />
              </div>
              <span className="text-lg font-bold text-white">CoParenting</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Rust, overzicht en duidelijke afspraken voor moderne co-ouders.  
              Communiceer, plan en leg belangrijke momenten veilig vast.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-300">
              Privacy-first • EU-hosting • Veilig delen
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/pricing" className="hover:text-white transition">Prijzen</Link></li>
              <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Juridisch</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacybeleid" className="hover:text-white transition">Privacybeleid</Link></li>
              <li><Link to="/algemene-voorwaarden" className="hover:text-white transition">Algemene voorwaarden</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contactweb" className="hover:text-white transition">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-white transition">Veelgestelde vragen</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Inloggen</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-slate-500">
          <span>© {new Date().getFullYear()} CoParenting. Alle rechten voorbehouden.</span>
          <span>Gemaakt voor rust en voorspelbaarheid voor kinderen.</span>
        </div>
      </div>
    </footer>
  );
}
