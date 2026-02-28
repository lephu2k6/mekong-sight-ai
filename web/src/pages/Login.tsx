import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../services/auth.service';
import { Phone, Lock, ArrowRight, ChevronLeft, Waves } from 'lucide-react';

export const Login: React.FC = () => {
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
        } catch (err) {
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
        } catch (err) {
            alert('Mã OTP không chính xác hoặc đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decor */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '40%', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40%', height: '40%', background: 'rgba(20, 184, 166, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

            <div className="card glass-card" style={{ width: '100%', maxWidth: '440px', padding: '3rem', textAlign: 'center', background: 'white', border: '1px solid var(--border-light)' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '2rem' }}>
                    <Waves size={40} color="var(--primary-green)" style={{ marginRight: '10px' }} />
                    Mekong AI
                </div>

                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
                    {step === 'phone' ? 'Chào mừng trở lại' : 'Xác thực OTP'}
                </h2>
                <p className="text-secondary" style={{ marginBottom: '2.5rem' }}>
                    {step === 'phone' ? 'Nhập số điện thoại để tiếp tục' : `Mã xác thực đã được gửi tới ${phone}`}
                </p>

                {step === 'phone' ? (
                    <form onSubmit={handleSendOtp}>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--text-dim)' }} />
                            <input
                                type="tel"
                                placeholder="Số điện thoại (0xxxxxxxxx)"
                                style={{ paddingLeft: '3rem' }}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'đang xử lý...' : 'Tiếp tục'} <ArrowRight size={18} />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify}>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--text-dim)' }} />
                            <input
                                type="text"
                                placeholder="Nhập 6 số OTP"
                                style={{ paddingLeft: '3rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                required
                            />
                        </div>
                        <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                        </button>
                        <button type="button" className="secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setStep('phone')}>
                            <ChevronLeft size={18} /> Thay đổi số điện thoại
                        </button>
                    </form>
                )}

                <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Bằng cách đăng nhập, bạn đồng ý với Điều khoản & Chính sách của Mekong Sight AI
                </p>
            </div>
        </div>
    );
};
