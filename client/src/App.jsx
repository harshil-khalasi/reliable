import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import NotFound from './pages/NotFound';

// Main Application Layout Shell
const AppLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile sidebar automatically on navigation
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Determine navbar title based on path
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Overview Dashboard';
      case '/employees':
        return 'Employee Management';
      case '/projects':
        return 'Project Management';
      default:
        return 'Reliable Solution Portal';
    }
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={mobileSidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="main-content">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          title={getPageTitle(location.pathname)}
        />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/employees"
              element={
                <AppLayout>
                  <Employees />
                </AppLayout>
              }
            />
            <Route
              path="/projects"
              element={
                <AppLayout>
                  <Projects />
                </AppLayout>
              }
            />
            {/* Default redirect to /dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
