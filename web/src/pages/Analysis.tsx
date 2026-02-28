import React, { useEffect, useMemo, useState } from 'react';
import { aiService } from '../services/ai.service';
import { farmService } from '../services/farm.service';
import { iotService } from '../services/iot.service';
import {
    AlertCircle,
    Brain,
    CheckCircle2,
    History,
    Loader2,
    Send,
    Sparkles,
    Waves,
} from 'lucide-react';

type ForecastPoint = {
    day_ahead: number;
    date: string;
    salinity_pred: number;
};

type ForecastResponse = {
    province: string;
    as_of: string;
    model_version: string;
    forecast: ForecastPoint[];
};

type ReportChart = {
    name: string;
    url: string;
};

type ReportMetric = {
    horizon: string;
    model: string;
    mae: string;
    rmse: string;
};

const PROVINCE_MAP: Record<string, string> = {
    'soc trang': 'Soc Trang',
    'bac lieu': 'Bac Lieu',
    'kien giang': 'Kien Giang',
    'ben tre': 'Ben Tre',
    'ca mau': 'Ca Mau',
    'tra vinh': 'Tra Vinh',
    'vinh long': 'Vinh Long',
    'can tho': 'Can Tho',
};

const FARM_CODE_MAP: Record<string, string> = {
    ST: 'Soc Trang',
    BL: 'Bac Lieu',
    KG: 'Kien Giang',
    BT: 'Ben Tre',
    CM: 'Ca Mau',
};

const normalize = (value?: string): string => {
    if (!value) return '';
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const inferProvinceFromFarm = (farm: any): string | null => {
    const address = String(farm?.address || '').trim();
    if (address) {
        const parts = address.split(',').map((item: string) => item.trim()).filter(Boolean).reverse();
        for (const part of parts) {
            const normalized = normalize(part);
            if (normalized in PROVINCE_MAP) {
                return PROVINCE_MAP[normalized];
            }
            for (const key of Object.keys(PROVINCE_MAP)) {
                if (normalized.includes(key)) {
                    return PROVINCE_MAP[key];
                }
            }
        }
    }

    const farmCode = String(farm?.farm_code || '').toUpperCase();
    const prefix = farmCode.split('_')[0];
    if (prefix in FARM_CODE_MAP) {
        return FARM_CODE_MAP[prefix];
    }

    return null;
};

const buildHeuristicForecast = (readings: any[]): ForecastPoint[] => {
    const sorted = [...readings]
        .filter((item) => item?.salinity !== undefined && item?.timestamp)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sorted.length === 0) {
        return [];
    }

    const salinitySeries = sorted.map((item) => Number(item.salinity)).filter((value) => Number.isFinite(value));
    if (salinitySeries.length === 0) {
        return [];
    }

    const latest = salinitySeries[salinitySeries.length - 1];
    const window = salinitySeries.slice(-7);
    const baseline = window.reduce((sum, value) => sum + value, 0) / window.length;
    const trend = window.length > 1 ? (window[window.length - 1] - window[0]) / (window.length - 1) : 0;

    const today = new Date();
    const forecast: ForecastPoint[] = [];
    for (let day = 1; day <= 7; day += 1) {
        const projected = baseline + trend * day * 0.6 + (latest - baseline) * 0.4;
        const date = new Date(today.getTime() + day * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        forecast.push({
            day_ahead: day,
            date,
            salinity_pred: Number(Math.max(0, projected).toFixed(4)),
        });
    }
    return forecast;
};

export const Analysis: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarm, setSelectedFarm] = useState('');
    const [analysisType, setAnalysisType] = useState('salinity_forecast');

    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [forecastError, setForecastError] = useState('');
    const [forecastNotice, setForecastNotice] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [reportCharts, setReportCharts] = useState<ReportChart[]>([]);
    const [reportMetrics, setReportMetrics] = useState<ReportMetric[]>([]);
    const [reportsLoading, setReportsLoading] = useState(true);

    const farmOptions = useMemo(() => farms || [], [farms]);

    const fetchHistory = async (farmId: string) => {
        if (!farmId) {
            setRequests([]);
            return;
        }
        try {
            const historyData = await aiService.getAnalysisHistory(farmId);
            setRequests(historyData.data || []);
        } catch (error) {
            console.error(error);
            setRequests([]);
        }
    };

    const fetchReportAssets = async () => {
        setReportsLoading(true);
        try {
            const [chartsResp, metricsResp] = await Promise.all([
                aiService.getReportCharts(),
                aiService.getReportMetrics(),
            ]);
            setReportCharts(chartsResp?.data || []);
            setReportMetrics(metricsResp?.data || []);
        } catch (error) {
            console.error(error);
            setReportCharts([]);
            setReportMetrics([]);
        } finally {
            setReportsLoading(false);
        }
    };

    const fetchForecastForFarm = async (farmId: string, sourceFarms: any[]) => {
        if (!farmId) {
            setForecast(null);
            setSelectedProvince('');
            return;
        }

        setForecastLoading(true);
        setForecastError('');
        setForecastNotice('');
        try {
            const data = await aiService.getForecast7dByFarm(farmId);
            setForecast(data);
            setSelectedProvince(data.province || '');
        } catch (error: any) {
            const farm = sourceFarms.find((item) => item.id === farmId);
            const province = inferProvinceFromFarm(farm);
            if (!province) {
                setForecast(null);
                setSelectedProvince('');
                setForecastError('Khong suy ra duoc tinh tu thong tin farm (address/farm_code).');
                setForecastLoading(false);
                return;
            }
            try {
                const data = await aiService.getForecast7d(province);
                setForecast(data);
                setSelectedProvince(data.province || province);
            } catch (fallbackError: any) {
                try {
                    const readingsResp = await iotService.getReadings();
                    const farmReadings = (readingsResp?.data || []).filter(
                        (item: any) => item?.iot_devices?.farm_id === farmId,
                    );
                    const heuristic = buildHeuristicForecast(farmReadings);
                    if (heuristic.length > 0) {
                        setForecast({
                            province,
                            as_of: new Date().toISOString().slice(0, 10),
                            model_version: 'heuristic-fallback',
                            forecast: heuristic,
                        });
                        setSelectedProvince(province);
                        setForecastNotice('AI service dang offline. Dang hien thi du bao fallback tu du lieu IoT.');
                        setForecastError('');
                    } else {
                        setForecast(null);
                        setSelectedProvince(province);
                        setForecastError('Khong du du lieu IoT de tao du bao fallback.');
                    }
                } catch {
                    setForecast(null);
                    setSelectedProvince(province);
                    const detail =
                        fallbackError?.response?.data?.detail ||
                        error?.response?.data?.detail ||
                        'Khong ket noi duoc AI service (localhost:8000).';
                    setForecastError(detail);
                }
            }
        } finally {
            setForecastLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const role = userStr ? JSON.parse(userStr).role : 'farmer';
            const farmData = role === 'admin' ? await farmService.getAllFarms() : await farmService.getMyFarms();
            const nextFarms = farmData.data || [];
            setFarms(nextFarms);

            if (nextFarms.length > 0) {
                const firstFarmId = nextFarms[0].id;
                setSelectedFarm(firstFarmId);
                await Promise.allSettled([fetchHistory(firstFarmId), fetchForecastForFarm(firstFarmId, nextFarms)]);
            } else {
                setRequests([]);
                setForecast(null);
            }
        } catch (error) {
            console.error(error);
            setForecastError('Khong the tai du lieu phan tich.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchReportAssets();
    }, []);

    const handleFarmChange = async (farmId: string) => {
        setSelectedFarm(farmId);
        setLoading(true);
        try {
            await Promise.allSettled([fetchHistory(farmId), fetchForecastForFarm(farmId, farms)]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFarm) return;
        setSubmitting(true);
        try {
            await aiService.analyze(selectedFarm, analysisType);
            await fetchHistory(selectedFarm);
            alert('Da gui yeu cau phan tich thanh cong.');
        } catch (error) {
            console.error(error);
            alert('Gui yeu cau that bai.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>AI Analysis & Forecast</h1>
                    <p className="text-secondary">Gui task AI va xem du bao do man 7 ngay theo tinh.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                <div className="card glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '1.2rem' }}>
                        <Sparkles size={20} color="var(--primary-glow)" />
                        <h2 style={{ margin: 0 }}>Yeu cau AI</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.4rem' }}>
                                Farm
                            </label>
                            <select
                                value={selectedFarm}
                                onChange={(e) => handleFarmChange(e.target.value)}
                                disabled={farmOptions.length === 0}
                            >
                                {farmOptions.map((farm) => (
                                    <option key={farm.id} value={farm.id}>
                                        {farm.farm_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="text-secondary" style={{ display: 'block', marginBottom: '0.4rem' }}>
                                Analysis Type
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => setAnalysisType('crop_health')}
                                    style={{ border: analysisType === 'crop_health' ? '2px solid var(--primary-glow)' : undefined }}
                                >
                                    <Brain size={16} /> Crop Health
                                </button>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => setAnalysisType('salinity_forecast')}
                                    style={{
                                        border: analysisType === 'salinity_forecast' ? '2px solid var(--primary-glow)' : undefined,
                                    }}
                                >
                                    <Waves size={16} /> Salinity Forecast
                                </button>
                            </div>
                        </div>

                        <button className="primary" style={{ width: '100%' }} disabled={submitting || farmOptions.length === 0}>
                            {submitting ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Send size={16} /> Gui yeu cau
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="card glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                        <Waves size={20} color="#3b82f6" />
                        <h2 style={{ margin: 0 }}>Forecast 7 ngay</h2>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                        Province: <strong>{selectedProvince || 'N/A'}</strong>
                    </p>

                    {forecastLoading ? (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                            <Loader2 className="animate-spin" size={20} />
                        </div>
                    ) : forecastError ? (
                        <div style={{ marginTop: '0.8rem', color: '#ef4444', fontSize: '0.85rem' }}>{forecastError}</div>
                    ) : forecast ? (
                        <div style={{ marginTop: '0.8rem' }}>
                            {forecastNotice && (
                                <div
                                    style={{
                                        marginBottom: '0.6rem',
                                        color: '#d97706',
                                        background: 'rgba(245, 158, 11, 0.12)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {forecastNotice}
                                </div>
                            )}
                            <div className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                                as_of: {forecast.as_of} | model: {forecast.model_version}
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Day</th>
                                        <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Date</th>
                                        <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Salinity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecast.forecast.map((item) => (
                                        <tr key={item.day_ahead} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>D+{item.day_ahead}</td>
                                            <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>{item.date}</td>
                                            <td style={{ padding: '8px 4px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                {Number(item.salinity_pred).toFixed(2)} ‰
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-secondary" style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                            Chua co du lieu du bao.
                        </div>
                    )}
                </div>
            </div>

            <div className="card glass-card" style={{ marginTop: '1.5rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                    <History size={18} color="var(--primary-glow)" />
                    <h3 style={{ margin: 0 }}>Lich su phan tich</h3>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <Loader2 className="animate-spin" size={18} />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                        Chua co request nao.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="glass-card"
                                style={{
                                    padding: '0.8rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: `4px solid ${req.status === 'completed' ? '#10b981' : '#3b82f6'}`,
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.analysis_type}</div>
                                    <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                        {new Date(req.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {req.status === 'completed' ? (
                                    <div className="flex items-center gap-1" style={{ color: '#10b981', fontSize: '0.8rem' }}>
                                        <CheckCircle2 size={14} /> Done
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1" style={{ color: '#3b82f6', fontSize: '0.8rem' }}>
                                        <Loader2 size={14} className="animate-spin" /> Running
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '1rem', padding: '0.7rem', background: 'rgba(59,130,246,0.08)', borderRadius: '8px' }}>
                    <div className="flex items-center gap-2" style={{ color: '#3b82f6', fontSize: '0.8rem' }}>
                        <AlertCircle size={14} /> Forecast from AI1 models; refresh if you just retrained.
                    </div>
                </div>
            </div>

            <div className="card glass-card" style={{ marginTop: '1.5rem' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                    <Sparkles size={18} color="var(--primary-glow)" />
                    <h3 style={{ margin: 0 }}>AI1 Report Charts</h3>
                </div>

                {reportsLoading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <Loader2 className="animate-spin" size={18} />
                    </div>
                ) : (
                    <>
                        {reportMetrics.length > 0 && (
                            <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Horizon</th>
                                            <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>Model</th>
                                            <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>MAE</th>
                                            <th style={{ padding: '8px 4px', fontSize: '0.75rem' }}>RMSE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportMetrics.map((item, index) => (
                                            <tr key={`${item.model}-${item.horizon}-${index}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>D+{item.horizon}</td>
                                                <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>{item.model}</td>
                                                <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>{Number(item.mae).toFixed(4)}</td>
                                                <td style={{ padding: '8px 4px', fontSize: '0.85rem' }}>{Number(item.rmse).toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {reportCharts.length === 0 ? (
                            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                Chua co chart report. Train AI1 de tao chart.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '0.8rem',
                                }}
                            >
                                {reportCharts.map((chart) => (
                                    <div key={chart.name} className="glass-card" style={{ padding: '0.5rem' }}>
                                        <div className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                                            {chart.name}
                                        </div>
                                        <img
                                            src={chart.url}
                                            alt={chart.name}
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
