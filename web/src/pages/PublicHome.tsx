import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Droplets, Brain, BarChart3, Shield, Zap, ArrowRight, Leaf } from 'lucide-react';

export const PublicHome: React.FC = () => {
    return (
        <div className="public-container">
            {/* Header */}
            <header className="public-header">
                <div className="public-header-content">
                    <Link to="/" className="public-logo">
                        <Leaf size={32} />
                        Mekong Sight AI
                    </Link>
                    <nav className="public-nav">
                        <Link to="/services">Dịch vụ</Link>
                        <a href="#features">Tính năng</a>
                        <a href="#about">Giới thiệu</a>
                        <Link to="/login">
                            <button className="primary">Đăng nhập</button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="public-main">
                <section className="hero">
                    <div className="hero-content">
                        <h1>Nông nghiệp thông minh<br />cho Đồng bằng sông Cửu Long</h1>
                        <p>
                            Giải pháp AI toàn diện giúp nông dân theo dõi, phân tích và tối ưu hóa
                            sản xuất tôm - lúa. Từ cảnh báo độ mặn đến chẩn đoán bệnh qua hình ảnh.
                        </p>
                        <div className="hero-cta">
                            <Link to="/login">
                                <button className="primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                                    Bắt đầu ngay <ArrowRight size={20} />
                                </button>
                            </Link>
                            <a href="#services">
                                <button className="secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                                    Tìm hiểu thêm
                                </button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="services" style={{ padding: '6rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>
                            Dịch vụ của chúng tôi
                        </h2>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            <div className="service-card">
                                <div className="service-icon">
                                    <Droplets size={40} />
                                </div>
                                <h3>Giám sát độ mặn</h3>
                                <p>
                                    Theo dõi độ mặn thời gian thực qua cảm biến IoT.
                                    Cảnh báo tự động khi vượt ngưỡng an toàn cho từng loại cây trồng.
                                </p>
                            </div>

                            <div className="service-card">
                                <div className="service-icon">
                                    <Brain size={40} />
                                </div>
                                <h3>Trợ lý AI</h3>
                                <p>
                                    Chatbot thông minh hỗ trợ chẩn đoán bệnh tôm, lúa qua hình ảnh.
                                    Tư vấn kỹ thuật canh tác phù hợp với điều kiện địa phương.
                                </p>
                            </div>

                            <div className="service-card">
                                <div className="service-icon">
                                    <BarChart3 size={40} />
                                </div>
                                <h3>Phân tích dữ liệu</h3>
                                <p>
                                    Phân tích xu hướng môi trường, dự báo rủi ro.
                                    Báo cáo chi tiết giúp ra quyết định chính xác hơn.
                                </p>
                            </div>

                            <div className="service-card">
                                <div className="service-icon">
                                    <Sprout size={40} />
                                </div>
                                <h3>Quản lý mùa vụ</h3>
                                <p>
                                    Theo dõi chu kỳ trồng trọt, lịch chăm sóc.
                                    Tối ưu hóa lịch luân canh tôm - lúa theo mùa.
                                </p>
                            </div>

                            <div className="service-card">
                                <div className="service-icon">
                                    <Shield size={40} />
                                </div>
                                <h3>Cảnh báo sớm</h3>
                                <p>
                                    Hệ thống cảnh báo đa kênh (SMS, Email, App).
                                    Phản ứng nhanh với các biến động bất thường.
                                </p>
                            </div>

                            <div className="service-card">
                                <div className="service-icon">
                                    <Zap size={40} />
                                </div>
                                <h3>Tự động hóa</h3>
                                <p>
                                    Kết nối với thiết bị điều khiển tự động.
                                    Tiết kiệm thời gian và công sức cho nông dân.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" style={{ padding: '6rem 2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>
                            Tại sao chọn Mekong Sight AI?
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-green)' }}>
                                    🌾 Chuyên biệt cho ĐBSCL
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                    Được thiết kế riêng cho điều kiện xâm nhập mặn và phèn tại miền Tây.
                                    Hiểu rõ đặc thù canh tác tôm - lúa luân canh.
                                </p>
                            </div>

                            <div style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-teal)' }}>
                                    🤖 AI thế hệ mới
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                    Sử dụng Gemini 2.5 Flash - mô hình AI tiên tiến nhất của Google.
                                    Chẩn đoán bệnh chính xác, tư vấn kỹ thuật như chuyên gia.
                                </p>
                            </div>

                            <div style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-lime)' }}>
                                    📱 Dễ sử dụng
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                    Giao diện thân thiện, ngôn ngữ gần gũi với nông dân.
                                    Không cần kiến thức công nghệ phức tạp.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" style={{ padding: '6rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                            Về Mekong Sight AI
                        </h2>
                        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.9', marginBottom: '2rem' }}>
                            Chúng tôi là đội ngũ kỹ sư và chuyên gia nông nghiệp, cam kết mang công nghệ AI
                            đến gần hơn với bà con nông dân Đồng bằng sông Cửu Long. Sứ mệnh của chúng tôi
                            là giúp nông dân tăng năng suất, giảm rủi ro và phát triển bền vững.
                        </p>
                        <Link to="/login">
                            <button className="primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                                Trải nghiệm ngay
                            </button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="public-footer">
                <div className="footer-content">
                    <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Mekong Sight AI © 2026
                    </p>
                    <p style={{ fontSize: '0.9rem' }}>
                        Nông nghiệp thông minh - Tương lai bền vững
                    </p>
                </div>
            </footer>
        </div>
    );
};
