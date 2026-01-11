import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Families } from './pages/Families';
import { HelperFamilySelector } from './pages/HelperFamilySelector';
import { Dashboard } from './pages/Dashboard';
import { Children } from './pages/Children';
import { Agenda } from './pages/Agenda';
import { Logboek } from './pages/Logboek';
import { Verzoeken } from './pages/Verzoeken';
import { Hulpverleners } from './pages/Hulpverleners';
import { Vragen } from './pages/Vragen';
import { Export } from './pages/Export';
import { Instellingen } from './pages/Instellingen';
import { Account } from './pages/Account';
import { Koppelen } from './pages/settings/Koppelen';
import { Abonnement } from './pages/settings/Abonnement';
import { Meldingen } from './pages/settings/Meldingen';
import { AccountSettings } from './pages/settings/AccountSettings';
import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isAndroid } from './lib/capacitor';

function RootRedirect() {
  const { user } = useAuth();

  if (user?.account_type === 'HELPER') {
    return <Navigate to="/helper-families" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  useEffect(() => {
    if (isAndroid()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#ffffff' });
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <FamilyProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
              path="/"
              element={
                <ProtectedRoute>
                  <RootRedirect />
                </ProtectedRoute>
              }
            />
          </Routes>
        </FamilyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
