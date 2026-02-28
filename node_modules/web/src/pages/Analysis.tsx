import React, { useState, useEffect } from 'react';
import { aiService } from '../services/ai.service';
import { farmService } from '../services/farm.service';
import { Brain, FileText, Send, Image as ImageIcon, History, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const Analysis: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [farms, setFarms] = useState<any[]>([]);

    // New Request State
    const [selectedFarm, setSelectedFarm] = useState('');
    const [analysisType, setAnalysisType] = useState('crop_health');

    const fetchData = async () => {
        try {
            // Get user role
            const userStr = localStorage.getItem('user');
            const role = userStr ? JSON.parse(userStr).role : 'farmer';

            // Get Farms based on role
            let farmData;
            if (role === 'admin') {
                farmData = await farmService.getAllFarms();
            } else {
                farmData = await farmService.getMyFarms();
            }

            setFarms(farmData.data || []);
            if (farmData.data && farmData.data.length > 0) {
                const firstFarmId = farmData.data[0].id;
                setSelectedFarm(firstFarmId);

                // Get History for the first farm initially
                const historyData = await aiService.getAnalysisHistory(firstFarmId);
                setRequests(historyData.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await aiService.analyze(selectedFarm, analysisType);
            alert('Yêu cầu phân tích đã được gửi thành công!');
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Phân tích chuyên sâu (AI Deep Dive)</h1>
                    <p className="text-secondary">Sử dụng mô hình AI tiên tiến để nhận diện dịch bệnh và dự báo xu hướng dài hạn.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                {/* Form Yêu cầu mới */}
                <div className="card glass-card" style={{ padding: '2rem' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
                        <Sparkles size={24} color="var(--primary-glow)" />
                        <h2 style={{ margin: 0 }}>Yêu cầu AI phân tích</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>Chọn khu vực</label>
                            <select value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)}>
                                {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>Loại hình phân tích</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div
                                    className={`card p-4 pointer ${analysisType === 'crop_health' ? 'active-border' : ''}`}
                                    onClick={() => setAnalysisType('crop_health')}
                                    style={{ border: analysisType === 'crop_health' ? '2px solid var(--primary-glow)' : '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}
                                >
                                    <Brain size={20} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sức khỏe mùa vụ</div>
                                </div>
                                <div
                                    className={`card p-4 pointer ${analysisType === 'long_term_salinity' ? 'active-border' : ''}`}
                                    onClick={() => setAnalysisType('long_term_salinity')}
                                    style={{ border: analysisType === 'long_term_salinity' ? '2px solid var(--primary-glow)' : '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}
                                >
                                    <FileText size={20} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dự báo dài hạn</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px dashed var(--border-subtle)', borderRadius: '12px', textAlign: 'center' }}>
                            <ImageIcon size={32} color="var(--text-dim)" style={{ marginBottom: '0.5rem' }} />
                            <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Tải lên hình ảnh lá lúa / ao tôm để AI nhận diện (Tùy chọn)</p>
                            <button type="button" className="secondary" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Chọn ảnh</button>
                        </div>

                        <button className="primary" style={{ width: '100%', padding: '1rem' }} disabled={submitting || farms.length === 0}>
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Gửi yêu cầu phân tích</>}
                        </button>
                    </form>
                </div>

                {/* Nhật ký phân tích */}
                <div className="card">
                    <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
                        <History size={24} color="var(--primary-glow)" />
                        <h2 style={{ margin: 0 }}>Lịch sử phân tích</h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {requests.map(req => (
                                <div key={req.id} className="glass-card p-4 flex justify-between items-center" style={{ borderLeft: `4px solid ${req.status === 'completed' ? '#10b981' : '#3b82f6'}` }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{req.analysis_type} - {req.farm_name}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{new Date(req.created_at).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {req.status === 'completed' ? (
                                            <div className="flex items-center gap-1" style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                                                <CheckCircle2 size={14} /> {(req.confidence_score * 100).toFixed(0)}%
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1" style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}>
                                                <Loader2 size={14} className="animate-spin" /> Đang chạy
                                            </div>
                                        )}
                                        <span style={{ fontSize: '0.7rem', color: 'var(--primary-glow)', cursor: 'pointer' }}>Xem kết quả</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px' }}>
                        <div className="flex gap-2" style={{ color: '#3b82f6' }}>
                            <AlertCircle size={16} />
                            <p style={{ margin: 0, fontSize: '0.8rem' }}>AI có thể mất từ 1-5 phút để xử lý các mô hình chuyên sâu.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
