import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Users,
  Settings,
  LogOut,
  Bell,
  Brain,
  MessageCircle,
  Cpu,
  Radio,
} from 'lucide-react';
import { BrandMark } from './BrandMark';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getUser = () => {
    try {
      const u = localStorage.getItem('user');
      if (!u || u === 'undefined') return {};
      return JSON.parse(u);
    } catch {
      return {};
    }
  };

  const user = getUser();
  const role = user.role || 'farmer';

  const menuItems = role === 'admin'
    ? [
        { path: '/dashboard/admin/stations', icon: <Radio size={22} />, label: 'Quản lý trạm' },
        { path: '/dashboard/admin/iot', icon: <Cpu size={22} />, label: 'Thiết bị IoT' },
        { path: '/dashboard/users', icon: <Users size={22} />, label: 'Người dùng' },
        { path: '/dashboard/settings', icon: <Settings size={22} />, label: 'Cấu hình' },
      ]
    : [
        { path: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Tổng quan' },
        { path: '/dashboard/farms', icon: <Sprout size={22} />, label: 'Trang trại' },
        { path: '/dashboard/alerts', icon: <Bell size={22} />, label: 'Cảnh báo' },
        { path: '/dashboard/analysis', icon: <Brain size={22} />, label: 'Phân tích' },
        { path: '/dashboard/chat', icon: <MessageCircle size={22} />, label: 'Trợ lý AI' },
        { path: '/dashboard/settings', icon: <Settings size={22} />, label: 'Cấu hình' },
      ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo sidebar-brand">
          <BrandMark className="sidebar-brand-mark" />
          <span>Mekong Sight AI</span>
        </div>

        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="secondary sidebar-logout"
          style={{ marginTop: 'auto', width: '100%', justifyContent: 'flex-start' }}
        >
          <LogOut size={22} />
          Đăng xuất
        </button>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <div className="flex items-center gap-2">
            <span className="text-secondary">Xin chào,</span>
            <span style={{ fontWeight: 600 }}>{user.full_name || user.phone_number || 'Khách'}</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--primary-gradient)',
                marginLeft: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              {(user.full_name || 'K').charAt(0)}
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};
