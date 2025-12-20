import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import MarketingPage from './pages/MarketingPage';
import Dashboard from './components/layout/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, userType } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">403</h1>
              <p className="text-slate-600">You don't have permission to access this page.</p>
            </div>
          </div>
        }
      />

      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <MarketingPage />}
      />

      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
              <p className="text-slate-600">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
