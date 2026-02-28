import React, { useState, useEffect } from 'react';
import { farmService } from '../services/farm.service';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export const Alerts: React.FC = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

    const fetchAlerts = async () => {
        try {
            const data = await farmService.getAlerts();
            setAlerts(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const acknowledgeAlert = async (id: string) => {
        try {
            await farmService.acknowledgeAlert(id);
            fetchAlerts();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredAlerts = alerts.filter(a => filter === 'all' || a.severity === filter);

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle color="#f87171" size={24} />;
            case 'warning': return <AlertTriangle color="#f59e0b" size={24} />;
            case 'info': return <Info color="#3b82f6" size={24} />;
            default: return <Bell color="#94a3b8" size={24} />;
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Trung tâm cảnh báo</h1>
                    <p className="text-secondary">Theo dõi các thông báo quan trọng về môi trường và hệ thống.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }} className="glass-card p-1">
                    {(['all', 'critical', 'warning', 'info'] as const).map(f => (
                        <button
                            key={f}
                            className={filter === f ? 'primary' : 'secondary'}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'Tất cả' : f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary-glow)" />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredAlerts.length === 0 ? (
                        <div className="card text-center" style={{ padding: '4rem', opacity: 0.6 }}>
                            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                            <p>Không có cảnh báo nào hiện tại. Hệ thống ổn định.</p>
                        </div>
                    ) : (
                        filteredAlerts.map(alert => (
                            <div key={alert.id} className={`card p-5 flex gap-5 items-start ${alert.status === 'active' ? 'border-glow' : ''}`}
                                style={{
                                    background: alert.severity === 'critical' ? 'rgba(248, 113, 113, 0.05)' : 'rgba(255,255,255,0.03)',
                                    borderColor: alert.severity === 'critical' ? 'rgba(248, 113, 113, 0.1)' : 'var(--border-subtle)'
                                }}>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                                    {getIcon(alert.severity)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{alert.title}</h3>
                                        <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{new Date(alert.created_at).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.2rem', lineHeight: 1.6 }}>{alert.message}</p>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                                                Farm ID: {alert.farm_id?.slice(0, 8)}...
                                            </span>
                                        </div>
                                        {alert.status === 'active' && (
                                            <button
                                                className="secondary"
                                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                                onClick={() => acknowledgeAlert(alert.id)}
                                            >
                                                Xác nhận đã xem
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
