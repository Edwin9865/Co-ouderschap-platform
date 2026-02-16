// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FamilyProvider } from "./contexts/FamilyContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Families } from "./pages/Families";
import { HelperFamilySelector } from "./pages/HelperFamilySelector";
import { Dashboard } from "./pages/Dashboard";
import { Children } from "./pages/Children";
import { Agenda } from "./pages/Agenda";
import { Logboek } from "./pages/Logboek";
import { Verzoeken } from "./pages/Verzoeken";
import { Hulpverleners } from "./pages/Hulpverleners";
import { Vragen } from "./pages/Vragen";
import { Export } from "./pages/Export";
import { Instellingen } from "./pages/Instellingen";
import { Account } from "./pages/Account";

import { Koppelen } from "./pages/settings/Koppelen";
import { Abonnement } from "./pages/settings/Abonnement";
import { Meldingen } from "./pages/settings/Meldingen";
import { AccountSettings } from "./pages/settings/AccountSettings";
import { About } from "./pages/settings/About";

import { AlgemeneVoorwaarden } from "./pages/AlgemeneVoorwaarden";
import { Privacybeleid } from "./pages/Privacybeleid";
import { ContactSupport } from "./pages/ContactSupport";

import { Homepage } from "./pages/Homepage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";

import { StatusBar, Style } from "@capacitor/status-bar";
import { isAndroid, isNative, isWeb } from "./lib/capacitor";

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

function App() {
  useEffect(() => {
    if (isAndroid()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <FamilyProvider>
          <Routes>
            {/* ---------------- Public routes (web + native) ---------------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />
            <Route path="/privacybeleid" element={<Privacybeleid />} />
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

            {/* ---------------- Root path ---------------- */}
            <Route path="/" element={<Root />} />

            {/* ---------------- Fallback ---------------- */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FamilyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
