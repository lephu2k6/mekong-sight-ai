import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Farms } from './pages/Farms'
import { Users } from './pages/Users'
import { Settings } from './pages/Settings'
import { Alerts } from './pages/Alerts'
import { Analysis } from './pages/Analysis'
import { ChatAI } from './pages/ChatAI'
import { PublicHome } from './pages/PublicHome'
import { Services } from './pages/Services'
import { AdminIoT } from './pages/AdminIoT'
import { AdminStations } from './pages/AdminStations'
import { Layout } from './components/Layout'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const DashboardRedirect = () => {
  const userStr = localStorage.getItem('user');
  let role = 'farmer';
  try {
    role = JSON.parse(userStr || '{}').role || 'farmer';
  } catch (e) { }

  if (role === 'admin') {
    return <Navigate to="/dashboard/admin/stations" replace />;
  }
  return <Dashboard />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardRedirect />} />
          <Route path="farms" element={<Farms />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="chat" element={<ChatAI />} />
          <Route path="admin/iot" element={<AdminIoT />} />
          <Route path="admin/stations" element={<AdminStations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
