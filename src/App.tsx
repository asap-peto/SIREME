import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewCasePage } from './pages/NewCasePage';
import { RecommendationPage } from './pages/RecommendationPage';
import { HistoryPage } from './pages/HistoryPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { SimulationPage } from './pages/SimulationPage';
import { NirPage } from './pages/NirPage';
import { HospitalNirPage } from './pages/HospitalNirPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useApp();

  // Determine default redirect based on role
  const defaultRedirect = user?.role === 'hospital_nir' ? '/hospital-nir' : '/dashboard';

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={defaultRedirect} replace /> : <LoginPage />}
      />

      {/* Hospital NIR standalone route (no sidebar layout) */}
      <Route
        path="/hospital-nir"
        element={
          <ProtectedRoute>
            {user?.role === 'hospital_nir' ? <HospitalNirPage /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />

      {/* Main app routes (with sidebar layout) */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to={defaultRedirect} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cases/new" element={<NewCasePage />} />
        <Route path="recommendation" element={<RecommendationPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="hospitals" element={<HospitalsPage />} />
        <Route path="nir" element={<NirPage />} />
        <Route path="simulation" element={<SimulationPage />} />
      </Route>

      <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
