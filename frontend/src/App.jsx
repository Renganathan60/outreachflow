import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import Navbar from './components/common/Navbar.jsx';
import { LoadingState } from './components/common/FeedbackStates.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import Campaigns from './pages/Campaigns.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import UsersPage from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Layout with Sidebar and Navbar
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path.startsWith('/leads/')) return 'Lead Detail & Scoring';
    if (path.startsWith('/leads')) return 'Lead Management';
    if (path.startsWith('/campaigns/')) return 'Campaign & Cadence Detail';
    if (path.startsWith('/campaigns')) return 'Outreach Campaigns';
    if (path.startsWith('/analytics')) return 'Performance Analytics';
    if (path.startsWith('/users')) return 'Team & Access Control';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'Dashboard Overview';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes inside AppLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Leads />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/leads/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LeadDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Campaigns />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/campaigns/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CampaignDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <AppLayout>
                    <UsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to /dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
