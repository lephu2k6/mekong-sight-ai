import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, Lock, Phone } from 'lucide-react';
import { sendOtp, verifyOtp } from '../services/auth.service';
import { BrandMark } from '../components/BrandMark';

export const Login = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch {
      alert('Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyOtp(phone, otp);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard');
    } catch {
      alert('Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ph-page login-page">
      <header className="ph-header">
        <div className="ph-shell ph-header-inner">
          <Link to="/" className="ph-brand">
            <BrandMark className="ph-brand-mark" />
            <span>Mekong Sight AI</span>
          </Link>

          <nav className="ph-nav">
            <Link to="/services" className="ph-nav-link">
              Dịch vụ
            </Link>
            <a href="/#giai-phap" className="ph-nav-link">
              Giải pháp
            </a>
            <a href="/#tinh-nang" className="ph-nav-link">
              Tính năng
            </a>
            <a href="/#cong-dong" className="ph-nav-link">
              Cộng đồng
            </a>
          </nav>

          <div className="ph-header-actions">
            <Link to="/login" className="ph-btn ph-btn-soft">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main className="login-page-main">
        <section className="login-stage ph-shell">
          <div className="login-copy">
            <p className="ph-chip">ĐĂNG NHẬP AN TOÀN</p>
            <h1>Tiếp tục cùng Mekong AI</h1>
            <p>
              Giao diện đăng nhập được giữ cùng phong cách với trang chủ để bà con không bị đổi ngữ cảnh
              khi chuyển trang.
            </p>
            <div className="login-copy-points">
              <span>Chữ lớn, dễ thao tác</span>
              <span>Đăng nhập nhanh bằng OTP</span>
              <span>Màu sắc đồng bộ với toàn hệ thống</span>
            </div>
          </div>

          <div className="card glass-card login-card login-stage-card">
            <Link to="/" className="login-home-link">
              <div className="logo login-brand">
                <BrandMark className="login-brand-mark" />
                Mekong Sight AI
              </div>
            </Link>

            <h2>{step === 'phone' ? 'Chào mừng trở lại' : 'Xác thực OTP'}</h2>
            <p className="text-secondary login-stage-subtitle">
              {step === 'phone'
                ? 'Nhập số điện thoại để tiếp tục'
                : `Mã xác thực đã được gửi tới ${phone}`}
            </p>

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp}>
                <div className="login-input-wrap">
                  <Phone size={18} className="login-input-icon" />
                  <input
                    type="tel"
                    placeholder="Số điện thoại (0xxxxxxxxx)"
                    className="login-input-pad"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Tiếp tục'} <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <div className="login-input-wrap">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    type="text"
                    placeholder="Nhập 6 số OTP"
                    className="login-input-pad login-otp-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={() => setStep('phone')}
                >
                  <ChevronLeft size={18} /> Thay đổi số điện thoại
                </button>
              </form>
            )}

            <p className="login-stage-note">
              Bằng cách đăng nhập, bạn đồng ý với Điều khoản và Chính sách của Mekong AI.
            </p>
          </div>
        </section>
      </main>

      <footer className="ph-footer">
        <div className="ph-shell ph-footer-inner">
          <div>
            <h3>Mekong AI</h3>
            <p>Nâng tầm nông nghiệp Việt Nam bằng AI và dữ liệu thực địa.</p>
          </div>
          <div className="ph-footer-links">
            <Link to="/services">Dịch vụ</Link>
            <a href="/#tinh-nang">Tính năng</a>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
