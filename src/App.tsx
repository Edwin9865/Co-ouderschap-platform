// src/App.tsx
import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FamilyProvider } from "./contexts/FamilyContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { CookieConsent } from "./components/CookieConsent";

// Homepage eager laden – eerste pagina voor bezoekers
import { Homepage } from "./pages/Homepage";

// Overige pagina's lazy laden – verkleint de initiële bundel aanzienlijk
const Login               = React.lazy(() => import("./pages/Login").then(({ Login }) => ({ default: Login })));
const Register            = React.lazy(() => import("./pages/Register").then(({ Register }) => ({ default: Register })));
const ForgotPassword      = React.lazy(() => import("./pages/ForgotPassword").then(({ ForgotPassword }) => ({ default: ForgotPassword })));
const ResetPassword       = React.lazy(() => import("./pages/ResetPassword").then(({ ResetPassword }) => ({ default: ResetPassword })));
const Families            = React.lazy(() => import("./pages/Families").then(({ Families }) => ({ default: Families })));
const HelperFamilySelector = React.lazy(() => import("./pages/HelperFamilySelector").then(({ HelperFamilySelector }) => ({ default: HelperFamilySelector })));
const Dashboard           = React.lazy(() => import("./pages/Dashboard").then(({ Dashboard }) => ({ default: Dashboard })));
const Children            = React.lazy(() => import("./pages/Children").then(({ Children }) => ({ default: Children })));
const Agenda              = React.lazy(() => import("./pages/Agenda").then(({ Agenda }) => ({ default: Agenda })));
const Logboek             = React.lazy(() => import("./pages/Logboek").then(({ Logboek }) => ({ default: Logboek })));
const Verzoeken           = React.lazy(() => import("./pages/Verzoeken").then(({ Verzoeken }) => ({ default: Verzoeken })));
const Hulpverleners       = React.lazy(() => import("./pages/Hulpverleners").then(({ Hulpverleners }) => ({ default: Hulpverleners })));
const Vragen              = React.lazy(() => import("./pages/Vragen").then(({ Vragen }) => ({ default: Vragen })));
const Export              = React.lazy(() => import("./pages/Export").then(({ Export }) => ({ default: Export })));
const Instellingen        = React.lazy(() => import("./pages/Instellingen").then(({ Instellingen }) => ({ default: Instellingen })));
const Account             = React.lazy(() => import("./pages/Account").then(({ Account }) => ({ default: Account })));
const Koppelen            = React.lazy(() => import("./pages/settings/Koppelen").then(({ Koppelen }) => ({ default: Koppelen })));
const Abonnement          = React.lazy(() => import("./pages/settings/Abonnement").then(({ Abonnement }) => ({ default: Abonnement })));
const Meldingen           = React.lazy(() => import("./pages/settings/Meldingen").then(({ Meldingen }) => ({ default: Meldingen })));
const AccountSettings     = React.lazy(() => import("./pages/settings/AccountSettings").then(({ AccountSettings }) => ({ default: AccountSettings })));
const About               = React.lazy(() => import("./pages/settings/About").then(({ About }) => ({ default: About })));
const AppBlog             = React.lazy(() => import("./pages/AppBlog").then(({ AppBlog }) => ({ default: AppBlog })));
const AlgemeneVoorwaarden = React.lazy(() => import("./pages/AlgemeneVoorwaarden").then(({ AlgemeneVoorwaarden }) => ({ default: AlgemeneVoorwaarden })));
const Privacybeleid       = React.lazy(() => import("./pages/Privacybeleid").then(({ Privacybeleid }) => ({ default: Privacybeleid })));
const Cookieverklaring    = React.lazy(() => import("./pages/Cookieverklaring").then(({ Cookieverklaring }) => ({ default: Cookieverklaring })));
const Disclaimer          = React.lazy(() => import("./pages/Disclaimer").then(({ Disclaimer }) => ({ default: Disclaimer })));
const ContactSupport      = React.lazy(() => import("./pages/ContactSupport").then(({ ContactSupport }) => ({ default: ContactSupport })));
const Blog                = React.lazy(() => import("./pages/Blog"));
const BlogPost            = React.lazy(() => import("./pages/BlogPost"));
const Pricing             = React.lazy(() => import("./pages/Pricing"));
const FAQ                 = React.lazy(() => import("./pages/FAQ"));
const Contact             = React.lazy(() => import("./pages/Contact"));
const AboutUs             = React.lazy(() => import("./pages/AboutUs").then(({ AboutUs }) => ({ default: AboutUs })));

import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapApp } from "@capacitor/app";
import { isAndroid, isNative } from "./lib/capacitor";
import { supabase } from "./lib/supabase";

// ✅ NEW: back button hook
import { useBackButton } from "./lib/useBackButton";
import { useKeyboardScrollIntoView } from "./lib/useKeyboardScrollIntoView";
/**
 * Handles auth deep links on native (password reset via email).
 * Must be inside <BrowserRouter> to use useNavigate.
 */
function NativeAuthDeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative()) return;

    const listenerPromise = CapApp.addListener("appUrlOpen", async ({ url }) => {
      const fragment = url.split("#")[1] ?? "";
      const params = new URLSearchParams(fragment);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token") ?? "";
      const type = params.get("type");

      // Wachtwoord reset
      if (url.startsWith("nl.coouderschap.app://reset-password") && accessToken && type === "recovery") {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        navigate("/reset-password");
        return;
      }

      // Email bevestiging na registratie
      if (url.startsWith("nl.coouderschap.app://email-confirm") && accessToken && type === "signup") {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        navigate("/dashboard");
      }
    });

    return () => {
      listenerPromise.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
}

/**
 * Root behavior:
 * - WEB: always show Homepage (also when logged in)
 * - NATIVE: guests -> login, logged-in -> app
 */
function Root() {
  const { user } = useAuth();

  // Native: keep the old behavior (marketing pages are web-only anyway)
  if (isNative()) {
    if (!user) return <Navigate to="/login" replace />;
    if (user.account_type === "HELPER") return <Navigate to="/helper-families" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Web: ALWAYS show the marketing homepage
  return <Homepage />;
}

/**
 * Wrapper to block marketing routes on native platforms.
 * On web, these routes are always allowed (logged in or not).
 */
function WebOnlyRoute({ children }: { children: React.ReactNode }) {
  if (isNative()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * ✅ MUST be rendered INSIDE <BrowserRouter>
 * so useNavigate/useLocation work for useBackButton()
 */
function AppRoutes() {
  useBackButton();
  useKeyboardScrollIntoView();

  return (
    <AuthProvider>
      <FamilyProvider>
        <NativeAuthDeepLinkHandler />
        <ScrollToTop />
        <ScrollToTopButton />
        <CookieConsent />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
        <Routes>
          {/* ---------------- Public routes (web + native) ---------------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />
          <Route path="/privacybeleid" element={<Privacybeleid />} />
          <Route path="/cookieverklaring" element={<Cookieverklaring />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/contact" element={<ContactSupport />} />

          {/* ---------------- Marketing routes (WEB only) ---------------- */}
          <Route
            path="/blog"
            element={
              <WebOnlyRoute>
                <Blog />
              </WebOnlyRoute>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <WebOnlyRoute>
                <BlogPost />
              </WebOnlyRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <WebOnlyRoute>
                <Pricing />
              </WebOnlyRoute>
            }
          />
          <Route
            path="/faq"
            element={
              <WebOnlyRoute>
                <FAQ />
              </WebOnlyRoute>
            }
          />
          <Route
            path="/contactweb"
            element={
              <WebOnlyRoute>
                <Contact />
              </WebOnlyRoute>
            }
          />
          <Route
            path="/over-ons"
            element={
              <WebOnlyRoute>
                <AboutUs />
              </WebOnlyRoute>
            }
          />

          {/* ---------------- Protected routes (web + native) ---------------- */}
          <Route
            path="/families"
            element={
              <ProtectedRoute>
                <Families />
              </ProtectedRoute>
            }
          />

          <Route
            path="/helper-families"
            element={
              <ProtectedRoute>
                <HelperFamilySelector />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/kinderen"
            element={
              <ProtectedRoute>
                <Layout>
                  <Children />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <Layout>
                  <Agenda />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/logboek"
            element={
              <ProtectedRoute>
                <Layout>
                  <Logboek />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/verzoeken"
            element={
              <ProtectedRoute>
                <Layout>
                  <Verzoeken />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/hulpverleners"
            element={
              <ProtectedRoute>
                <Layout>
                  <Hulpverleners />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vragen"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vragen />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <Layout>
                  <Export />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/instellingen"
            element={
              <ProtectedRoute>
                <Layout>
                  <Instellingen />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/instellingen/account"
            element={
              <ProtectedRoute>
                <Layout>
                  <AccountSettings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/instellingen/koppelen"
            element={
              <ProtectedRoute>
                <Layout>
                  <Koppelen />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/instellingen/abonnement"
            element={
              <ProtectedRoute>
                <Layout>
                  <Abonnement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/instellingen/meldingen"
            element={
              <ProtectedRoute>
                <Layout>
                  <Meldingen />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/instellingen/about"
            element={
              <ProtectedRoute>
                <Layout>
                  <About />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Layout>
                  <Account />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/artikelen"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppBlog />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/artikelen/:slug"
            element={
              <ProtectedRoute>
                <Layout>
                  <AppBlog />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ---------------- Root path ---------------- */}
          <Route path="/" element={<Root />} />

          {/* ---------------- Fallback ---------------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </FamilyProvider>
    </AuthProvider>
  );
}

function App() {
  useEffect(() => {
    if (isAndroid()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
