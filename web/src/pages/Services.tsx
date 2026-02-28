import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Brain, BarChart3, Sprout, Shield, Zap, Leaf, ArrowRight, CheckCircle } from 'lucide-react';

export const Services: React.FC = () => {
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
                        <Link to="/">Trang chủ</Link>
                        <Link to="/services">Dịch vụ</Link>
                        <Link to="/login">
                            <button className="primary">Đăng nhập</button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="public-main">
                {/* Hero */}
                <section className="hero" style={{ padding: '4rem 2rem' }}>
                    <div className="hero-content">
                        <h1 style={{ fontSize: '3rem' }}>Dịch vụ của chúng tôi</h1>
                        <p style={{ fontSize: '1.15rem' }}>
                            Giải pháp toàn diện cho nông nghiệp thông minh tại Đồng bằng sông Cửu Long
                        </p>
                    </div>
                </section>

                {/* Service 1: Giám sát độ mặn */}
                <section style={{ padding: '4rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <Droplets size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Giám sát độ mặn thời gian thực</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                Hệ thống cảm biến IoT giúp theo dõi độ mặn 24/7. Cảnh báo tự động khi vượt ngưỡng an toàn,
                                giúp bà con kịp thời xử lý để bảo vệ mùa màng.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {['Cảm biến chính xác cao', 'Cảnh báo đa kênh (SMS, Email, App)', 'Lịch sử dữ liệu chi tiết', 'Tích hợp với hệ thống tưới'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                                        <CheckCircle size={20} color="var(--primary-green)" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
                            borderRadius: '20px',
                            padding: '3rem',
                            textAlign: 'center'
                        }}>
                            <Droplets size={120} color="var(--primary-green)" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Minh họa hệ thống giám sát</p>
                        </div>
                    </div>
                </section>

                {/* Service 2: Trợ lý AI */}
                <section style={{ padding: '4rem 2rem', background: 'var(--bg-light)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '3rem',
                            textAlign: 'center',
                            border: '2px solid var(--border-light)'
                        }}>
                            <Brain size={120} color="var(--accent-teal)" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>AI Gemini 2.5 Flash</p>
                        </div>
                        <div>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--primary-green) 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <Brain size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Trợ lý AI chuyên gia</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                Chatbot thông minh sử dụng công nghệ Gemini 2.5 Flash của Google. Chẩn đoán bệnh tôm, lúa
                                qua hình ảnh và tư vấn kỹ thuật canh tác như chuyên gia thực thụ.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {['Chẩn đoán bệnh qua ảnh', 'Tư vấn kỹ thuật 24/7', 'Ngôn ngữ gần gũi, dễ hiểu', 'Cập nhật kiến thức liên tục'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                                        <CheckCircle size={20} color="var(--accent-teal)" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Service 3: Phân tích dữ liệu */}
                <section style={{ padding: '4rem 2rem', background: 'white' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-lime) 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <BarChart3 size={40} color="white" />
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Phân tích & Dự báo</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                                Phân tích xu hướng môi trường, dự báo rủi ro và đưa ra khuyến nghị dựa trên dữ liệu thực tế.
                                Giúp bà con ra quyết định chính xác hơn.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {['Báo cáo chi tiết theo mùa vụ', 'Dự báo xu hướng độ mặn', 'So sánh với các vùng lân cận', 'Khuyến nghị tối ưu hóa'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                                        <CheckCircle size={20} color="var(--accent-lime)" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(132, 204, 22, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                            borderRadius: '20px',
                            padding: '3rem',
                            textAlign: 'center'
                        }}>
                            <BarChart3 size={120} color="var(--accent-lime)" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Dashboard phân tích</p>
                        </div>
                    </div>
                </section>

                {/* Other Services Grid */}
                <section style={{ padding: '4rem 2rem', background: 'var(--bg-light)' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>
                            Các dịch vụ khác
                        </h2>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    <Sprout size={35} color="white" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quản lý mùa vụ</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                    Theo dõi chu kỳ trồng trọt, lịch chăm sóc. Tối ưu hóa lịch luân canh tôm - lúa theo mùa.
                                </p>
                            </div>

                            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--primary-green) 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    <Shield size={35} color="white" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Cảnh báo sớm</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                    Hệ thống cảnh báo đa kênh (SMS, Email, App). Phản ứng nhanh với các biến động bất thường.
                                </p>
                            </div>

                            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    background: 'linear-gradient(135deg, var(--accent-lime) 0%, var(--primary-green) 100%)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    <Zap size={35} color="white" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Tự động hóa</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                    Kết nối với thiết bị điều khiển tự động. Tiết kiệm thời gian và công sức cho nông dân.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)', textAlign: 'center' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '1.5rem' }}>
                            Sẵn sàng bắt đầu?
                        </h2>
                        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', lineHeight: '1.8' }}>
                            Đăng ký ngay hôm nay để trải nghiệm nông nghiệp thông minh cùng Mekong Sight AI
                        </p>
                        <Link to="/login">
                            <button style={{
                                background: 'white',
                                color: 'var(--primary-green)',
                                fontSize: '1.1rem',
                                padding: '1rem 2.5rem',
                                fontWeight: 700,
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                Bắt đầu ngay <ArrowRight size={20} />
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
