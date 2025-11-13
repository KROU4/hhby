import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { Landing } from './pages/Landing';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Applications } from './pages/Applications';

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

  useEffect(() => {
    // Fetch user on app load if token exists
    if (localStorage.getItem('token')) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <ToastContainer />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
