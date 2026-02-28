import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sprout, Users, Settings, LogOut, Waves, Bell, Brain, MessageCircle, Cpu, Radio } from 'lucide-react';

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
        } catch (e) {
            return {};
        }
    };

    const user = getUser();
    const role = user.role || 'farmer';

    const menuItems = role === 'admin' ? [
        { path: '/dashboard/admin/stations', icon: <Radio size={20} />, label: 'Quản lý Trạm' },
        { path: '/dashboard/admin/iot', icon: <Cpu size={20} />, label: 'Thiết bị IoT' },
        { path: '/dashboard/users', icon: <Users size={20} />, label: 'Người dùng' },
        { path: '/dashboard/analysis', icon: <Brain size={20} />, label: 'Phân tích' },
        { path: '/dashboard/chat', icon: <MessageCircle size={20} />, label: 'Trợ lý AI' },
        { path: '/dashboard/settings', icon: <Settings size={20} />, label: 'Cấu hình' },
    ] : [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
        { path: '/dashboard/farms', icon: <Sprout size={20} />, label: 'Trang trại' },
        { path: '/dashboard/alerts', icon: <Bell size={20} />, label: 'Cảnh báo' },
        { path: '/dashboard/analysis', icon: <Brain size={20} />, label: 'Phân tích' },
        { path: '/dashboard/chat', icon: <MessageCircle size={20} />, label: 'Trợ lý AI' },
        { path: '/dashboard/settings', icon: <Settings size={20} />, label: 'Cấu hình' },
    ];

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="logo" style={{ background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
                    <Waves size={32} color="var(--primary-green)" style={{ marginRight: '10px' }} />
                    Mekong AI
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
                    className="secondary"
                    style={{ marginTop: 'auto', width: '100%', justifyContent: 'flex-start' }}
                >
                    <LogOut size={20} />
                    Đăng xuất
                </button>
            </aside>

            <main className="main-content">
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-secondary">Xin chào,</span>
                        <span style={{ fontWeight: 600 }}>{user.full_name || user.phone_number || 'Khách'}</span>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-gradient)', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {(user.full_name || 'K').charAt(0)}
                        </div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
};
