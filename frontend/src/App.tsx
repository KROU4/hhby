import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { ShortcutsModal } from './components/ShortcutsModal';
import { Onboarding } from './components/Onboarding';
import { UpgradeModal } from './components/UpgradeModal';
import { useUpgradeModalStore } from './store/upgradeModalStore';
import { Landing } from './pages/Landing';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Applications } from './pages/Applications';
import { History } from './pages/History';
import { Favorites } from './pages/Favorites';
import { Employers } from './pages/Employers';
import { Subscription } from './pages/Subscription';
import { Sessions } from './pages/Sessions';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const { isOpen, reason, lockedFeature, closeModal } = useUpgradeModalStore();
  useKeyboardShortcuts();

  useEffect(() => {
    // Fetch user on app load if token exists
    if (localStorage.getItem('token')) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <div className="min-h-screen dark:bg-gray-900 dark:text-white transition-colors">
        <Navbar />
        <ToastContainer />
        <ShortcutsModal />
        <Onboarding />
        <UpgradeModal
          isOpen={isOpen}
          onClose={closeModal}
          reason={reason}
          lockedFeature={lockedFeature}
        />
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<Landing />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employers"
            element={
              <ProtectedRoute>
                <Employers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
