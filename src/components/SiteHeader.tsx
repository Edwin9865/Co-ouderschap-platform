// src/components/SiteHeader.tsx
import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { isNative, isWeb } from "../lib/capacitor";
import { Logo } from "./Logo";

type NavItem = { label: string; to: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = useMemo<NavItem[]>(
    () => [
      { label: "Prijzen", to: "/pricing" },
      { label: "Blog", to: "/blog" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contactweb" },
    ],
    []
  );

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  // Header is bedoeld voor marketing (web). Als je hem toch ergens op native rendert,
  // houden we het netjes, maar marketing routes zijn daar sowieso geblokkeerd.
  const showMarketingNav = isWeb() && !isNative();

  const closeMobile = () => setOpen(false);

  const dashboardTarget =
    user?.account_type === "HELPER" ? "/helper-families" : "/dashboard";

  const handleSignOut = async () => {
    closeMobile();
    await signOut();
  };

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={closeMobile}>
          <Logo className="w-9 h-9 transition-transform group-hover:scale-105" />
          <span className="text-lg sm:text-xl font-extrabold text-slate-900">
            CoParenting
          </span>
          <span className="ml-2 hidden sm:inline-flex text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Beta
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {showMarketingNav &&
            navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  "text-sm font-semibold transition-colors",
                  isActive(item.to)
                    ? "text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* Auth area */}
          {!user ? (
            <>
              <Link
                to="/login"
                className={cx(
                  "text-sm font-semibold transition-colors",
                  isActive("/login")
                    ? "text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Inloggen
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-2xl hover:bg-blue-700 transition font-semibold shadow-sm"
              >
                Gratis starten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to={dashboardTarget}
                className={cx(
                  "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-2xl border transition",
                  isActive("/dashboard") || isActive("/helper-families")
                    ? "border-slate-300 bg-slate-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                title="Uitloggen"
              >
                <LogOut className="w-4 h-4" />
                Uitloggen
              </button>
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          {!user ? (
            <Link
              to="/register"
              onClick={closeMobile}
              className="inline-flex items-center bg-blue-600 text-white px-3.5 py-2 rounded-2xl hover:bg-blue-700 transition text-sm font-semibold"
            >
              Start gratis
            </Link>
          ) : (
            <Link
              to={dashboardTarget}
              onClick={closeMobile}
              className="inline-flex items-center gap-2 bg-white text-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 transition text-sm font-semibold"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition"
            aria-label={open ? "Menu sluiten" : "Menu openen"}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-2">
            {showMarketingNav &&
              navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={cx(
                    "px-3 py-2 rounded-2xl text-sm font-semibold",
                    isActive(item.to)
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}

            <div className="h-px bg-slate-200 my-2" />

            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className={cx(
                    "px-3 py-2 rounded-2xl text-sm font-semibold",
                    isActive("/login")
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  Inloggen
                </Link>

                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="px-3 py-2 rounded-2xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition inline-flex items-center justify-between"
                >
                  Gratis starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={dashboardTarget}
                  onClick={closeMobile}
                  className={cx(
                    "px-3 py-2 rounded-2xl text-sm font-semibold inline-flex items-center gap-2",
                    isActive("/dashboard") || isActive("/helper-families")
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-2xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition inline-flex items-center gap-2 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Uitloggen
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
