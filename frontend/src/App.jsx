/**
 * App.jsx — Root router.
 * Public routes: /, /how-it-works, /about, /contact (wrapped in PublicLayout)
 * Auth routes: /login, /register (wrapped in AuthLayout internally)
 * Protected routes: /dashboard, /interview/:session_id
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';

// Layout
import PublicLayout from './components/layout/PublicLayout';

// Public Pages
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected Pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import InterviewPage from './pages/InterviewPage';

/* ── Route guards ── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* ── Public pages (with Navigation + Footer) ── */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

          {/* ── Auth pages (AuthLayout is internal to each page) ── */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* ── Protected pages ── */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/interview/:session_id" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
