import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../services/ai.service';
import { farmService } from '../services/farm.service';
import { iotService } from '../services/iot.service';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  History,
  Loader2,
  MessageCircle,
  Send,
  Shield,
  Sparkles,
  Waves,
} from 'lucide-react';

type ForecastPoint = { day_ahead: number; date: string; salinity_pred: number };
type ForecastResponse = {
  province: string;
  as_of: string;
  model_version: string;
  model_set_used?: string;
  forecast: ForecastPoint[];
};
type RiskResponse = {
  farm_id: string;
  risk_label: string;
  risk_score?: number | null;
  model_version: string;
  diagnostics?: Record<string, any>;
};
type DecisionResponse = { decision: string; urgency: string; reason: string; actions: string[] };
type Ai1MetricRow = { horizon: number; model: string; mae: number; rmse: number };
type Ai1ThresholdRow = {
  model: string;
  horizon: number;
  tolerance_ppt: number;
  accuracy_pct: number;
  target_accuracy_pct: number;
  accuracy_status: string;
};
type Ai1AcceptanceRow = {
  horizon: number;
  selected_model: string;
  vs_baseline_status: string;
  within_tolerance_accuracy_pct: number;
  overall_status: string;
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

const AI_LIBRARY_TASKS = [
  'Xem nhanh độ mặn hiện tại và mức ảnh hưởng đến ao nuôi hoặc ruộng lúa.',
  'Nhờ AI2 đánh giá rủi ro và chỉ ra việc nào cần ưu tiên xử lý trước.',
  'Hỏi AI3 cách vận hành cống, lấy nước và theo dõi lịch thời vụ.',
  'Tra cứu bệnh tôm, dấu hiệu bất thường và gợi ý hành động an toàn.',
];

const ANALYSIS_OPTIONS = [
  { id: 'crop_health', label: 'Sức khỏe cây trồng', icon: Brain, tone: 'brain' },
  { id: 'salinity_forecast', label: 'Dự báo độ mặn', icon: Waves, tone: 'water' },
];

const normalize = (value?: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const inferProvinceFromFarm = (farm: any): string | null => {
  const address = String(farm?.address || '').trim();
  if (address) {
    const parts = address
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean)
      .reverse();
    for (const part of parts) {
      const normalized = normalize(part);
      if (normalized in PROVINCE_MAP) return PROVINCE_MAP[normalized];
      for (const key of Object.keys(PROVINCE_MAP)) {
        if (normalized.includes(key)) return PROVINCE_MAP[key];
      }
    }
  }
  const prefix = String(farm?.farm_code || '')
    .toUpperCase()
    .split('_')[0];
  return prefix in FARM_CODE_MAP ? FARM_CODE_MAP[prefix] : null;
};

const getApiErrorDetail = (error: any): string =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  'Không thể tải dữ liệu AI.';

const shouldUseIotFallback = (error: any) => {
  const status = Number(error?.response?.status || 0);
  return status === 0 || status >= 500;
};

const buildHeuristicForecast = (readings: any[]): ForecastPoint[] => {
  const sorted = [...readings]
    .filter((item) => item?.salinity !== undefined && item?.timestamp)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (sorted.length === 0) return [];

  const values = sorted.map((item) => Number(item.salinity)).filter(Number.isFinite);
  if (values.length === 0) return [];

  const latest = values[values.length - 1];
  const window = values.slice(-7);
  const baseline = window.reduce((sum, value) => sum + value, 0) / window.length;
  const trend =
    window.length > 1 ? (window[window.length - 1] - window[0]) / (window.length - 1) : 0;
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    const projected = baseline + trend * day * 0.6 + (latest - baseline) * 0.4;
    return {
      day_ahead: day,
      date: new Date(today.getTime() + day * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      salinity_pred: Number(Math.max(0, projected).toFixed(4)),
    };
  });
};

const buildHeuristicRisk = (farmId: string, readings: any[]): RiskResponse | null => {
  const sorted = [...readings]
    .filter((item) => item?.salinity !== undefined && item?.temperature !== undefined && item?.timestamp)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (sorted.length === 0) return null;

  const latest = sorted[sorted.length - 1];
  const salinity = Number(latest.salinity);
  const temperature = Number(latest.temperature);
  const ph = Number(latest.ph);
  const s = Math.max(0, Math.min(1, salinity / 10));
  const t = Math.max(0, Math.min(1, (temperature - 15) / 20));
  const phPenalty = Number.isFinite(ph) ? Math.max(0, Math.min(1, Math.abs(ph - 7.4) / 2.0)) : 0.2;
  const risk01 = Math.max(0, Math.min(1, 0.65 * s + 0.25 * t + 0.1 * phPenalty));
  const riskLabel = risk01 <= 0.35 ? 'Low' : risk01 <= 0.65 ? 'Medium' : 'High';

  return {
    farm_id: farmId,
    risk_label: riskLabel,
    risk_score: risk01,
    model_version: 'heuristic-fallback',
    diagnostics: {
      latest_salinity: salinity,
      latest_temperature: temperature,
      history_points: sorted.length,
    },
  };
};

const getRiskPalette = (label?: string) =>
  label === 'High'
    ? { color: '#dc2626', bg: 'rgba(254, 226, 226, 0.85)', border: 'rgba(220, 38, 38, 0.24)' }
    : label === 'Medium'
      ? { color: '#d97706', bg: 'rgba(254, 243, 199, 0.92)', border: 'rgba(217, 119, 6, 0.24)' }
      : { color: '#059669', bg: 'rgba(220, 252, 231, 0.92)', border: 'rgba(5, 150, 105, 0.22)' };

const getSalinityPalette = (value: number) =>
  value >= 6
    ? { color: '#dc2626', bg: 'rgba(254, 226, 226, 0.92)' }
    : value >= 4
      ? { color: '#d97706', bg: 'rgba(254, 243, 199, 0.92)' }
      : { color: '#059669', bg: 'rgba(220, 252, 231, 0.92)' };

const getUrgencyPalette = (urgency?: string) =>
  urgency === 'critical'
    ? { color: '#dc2626', bg: 'rgba(254, 226, 226, 0.92)' }
    : urgency === 'warning'
      ? { color: '#d97706', bg: 'rgba(254, 243, 199, 0.92)' }
      : { color: '#059669', bg: 'rgba(220, 252, 231, 0.92)' };

const formatRiskLabel = (label?: string) =>
  label === 'High' ? 'Cao' : label === 'Medium' ? 'Trung bình' : label === 'Low' ? 'Thấp' : 'Chưa có';

const formatUrgency = (urgency?: string) =>
  urgency === 'critical'
    ? 'Khẩn cấp'
    : urgency === 'warning'
      ? 'Cần lưu ý'
      : urgency === 'normal'
        ? 'Ổn định'
        : urgency || 'Chưa có';

const formatAnalysisType = (value?: string) =>
  value === 'crop_health'
    ? 'Sức khỏe cây trồng'
    : value === 'salinity_forecast'
      ? 'Dự báo độ mặn'
      : value || 'Phân tích AI';

const formatShortDate = (value?: string) => {
  if (!value) return 'Chưa xác định';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const parseNumeric = (value: unknown): number => Number(value || 0);

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
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState('');
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [aiSupportedProvinces, setAiSupportedProvinces] = useState<string[]>([]);
  const [manualProvince, setManualProvince] = useState('');
  const [ai1Metrics, setAi1Metrics] = useState<Ai1MetricRow[]>([]);
  const [ai1Thresholds, setAi1Thresholds] = useState<Ai1ThresholdRow[]>([]);
  const [ai1Acceptance, setAi1Acceptance] = useState<Ai1AcceptanceRow[]>([]);
  const [ai1PerformanceLoading, setAi1PerformanceLoading] = useState(false);
  const [ai1PerformanceError, setAi1PerformanceError] = useState('');

  const userRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw).role || 'farmer' : 'farmer';
    } catch {
      return 'farmer';
    }
  }, []);
  const isAdmin = userRole === 'admin';

  const selectedFarmInfo = useMemo(
    () => farms.find((farm) => farm.id === selectedFarm),
    [farms, selectedFarm]
  );

  const forecastOverview = useMemo(() => {
    if (!forecast?.forecast?.length) return null;

    const series = forecast.forecast.map((item) => ({
      ...item,
      salinityValue: Number(item.salinity_pred),
    }));
    const peak = series.reduce((current, item) =>
      item.salinityValue > current.salinityValue ? item : current
    );
    const warningDays = series.filter((item) => item.salinityValue >= 4).length;
    const severeDays = series.filter((item) => item.salinityValue >= 6).length;
    const saferDay = series.find((item) => item.salinityValue < 4) || null;

    let guidance = 'Điều kiện tương đối ổn định, vẫn nên đo lại theo lịch thường ngày.';
    if (peak.salinityValue >= 6) {
      guidance = 'Độ mặn đang cao, nên hạn chế lấy nước mới và kiểm tra cống kỹ trước khi vận hành.';
    } else if (peak.salinityValue >= 4) {
      guidance = 'Có ngày cần lưu ý, nên đo lại độ mặn trong ngày trước khi cấp nước vào ao hoặc ruộng.';
    }

    return {
      peak,
      warningDays,
      severeDays,
      safeDays: series.length - warningDays,
      saferDay,
      guidance,
    };
  }, [forecast]);

  const ai1PerformanceSummary = useMemo(() => {
    if (!isAdmin || ai1Metrics.length === 0) return null;

    const baselineRows = ai1Metrics
      .filter((row) => row.model === 'baseline_linear')
      .sort((a, b) => a.horizon - b.horizon);
    const xgbRows = ai1Metrics
      .filter((row) => row.model === 'xgboost')
      .sort((a, b) => a.horizon - b.horizon);
    if (baselineRows.length === 0 || xgbRows.length === 0) return null;

    const byHorizon = baselineRows.map((baselineRow) => {
      const xgbRow = xgbRows.find((item) => item.horizon === baselineRow.horizon);
      const thresholdRow = ai1Thresholds.find(
        (item) => item.model === 'xgboost' && item.horizon === baselineRow.horizon
      );
      const acceptanceRow = ai1Acceptance.find((item) => item.horizon === baselineRow.horizon);
      const xgbRmse = xgbRow?.rmse ?? 0;
      const baselineRmse = baselineRow.rmse;
      const rmseImprovementPct =
        baselineRmse > 0 ? ((baselineRmse - xgbRmse) / baselineRmse) * 100 : 0;

      return {
        horizon: baselineRow.horizon,
        baselineMae: baselineRow.mae,
        baselineRmse,
        xgbMae: xgbRow?.mae ?? 0,
        xgbRmse,
        accuracyPct: thresholdRow?.accuracy_pct ?? 0,
        targetAccuracyPct: thresholdRow?.target_accuracy_pct ?? 0,
        tolerancePpt: thresholdRow?.tolerance_ppt ?? 0,
        overallStatus: acceptanceRow?.overall_status || 'unknown',
        winner: xgbRmse < baselineRmse ? 'xgboost' : 'baseline_linear',
        rmseImprovementPct,
      };
    });

    const wins = byHorizon.filter((row) => row.winner === 'xgboost').length;
    const avgBaselineRmse =
      byHorizon.reduce((sum, row) => sum + row.baselineRmse, 0) / byHorizon.length;
    const avgXgbRmse = byHorizon.reduce((sum, row) => sum + row.xgbRmse, 0) / byHorizon.length;
    const avgAccuracy =
      byHorizon.reduce((sum, row) => sum + row.accuracyPct, 0) / byHorizon.length;

    return {
      rows: byHorizon,
      wins,
      total: byHorizon.length,
      avgAccuracy,
      avgRmseImprovementPct: avgBaselineRmse > 0 ? ((avgBaselineRmse - avgXgbRmse) / avgBaselineRmse) * 100 : 0,
      overallPass: byHorizon.every((row) => row.overallStatus === 'pass'),
    };
  }, [ai1Acceptance, ai1Metrics, ai1Thresholds, isAdmin]);

  const fetchHistory = async (farmId: string) => {
    if (!farmId) return setRequests([]);
    try {
      const historyData = await aiService.getAnalysisHistory(farmId);
      setRequests(historyData.data || []);
    } catch (error) {
      console.error(error);
      setRequests([]);
    }
  };

  const fetchAiMetadata = async () => {
    try {
      const metadataResp = await aiService.getModelMetadata();
      const provinces = (metadataResp?.data?.provinces || []).filter(Boolean);
      setAiSupportedProvinces(provinces);
      if (provinces.length > 0) setManualProvince((prev) => prev || provinces[0]);
    } catch {
      setAiSupportedProvinces([]);
    }
  };

  const fetchAi1Performance = async () => {
    if (!isAdmin) return;
    setAi1PerformanceLoading(true);
    setAi1PerformanceError('');
    try {
      const [metricsResp, thresholdResp, acceptanceResp] = await Promise.all([
        aiService.getAi1Metrics(),
        aiService.getAi1ThresholdAccuracy(),
        aiService.getAi1AcceptanceSummary(),
      ]);

      setAi1Metrics(
        (metricsResp?.data || []).map((row: any) => ({
          horizon: parseNumeric(row.horizon),
          model: String(row.model || ''),
          mae: parseNumeric(row.mae),
          rmse: parseNumeric(row.rmse),
        }))
      );
      setAi1Thresholds(
        (thresholdResp?.data || []).map((row: any) => ({
          model: String(row.model || ''),
          horizon: parseNumeric(row.horizon),
          tolerance_ppt: parseNumeric(row.tolerance_ppt),
          accuracy_pct: parseNumeric(row.accuracy_pct),
          target_accuracy_pct: parseNumeric(row.target_accuracy_pct),
          accuracy_status: String(row.accuracy_status || ''),
        }))
      );
      setAi1Acceptance(
        (acceptanceResp?.data || []).map((row: any) => ({
          horizon: parseNumeric(row.horizon),
          selected_model: String(row.selected_model || ''),
          vs_baseline_status: String(row.vs_baseline_status || ''),
          within_tolerance_accuracy_pct: parseNumeric(row.within_tolerance_accuracy_pct),
          overall_status: String(row.overall_status || ''),
        }))
      );
    } catch (error: any) {
      console.error(error);
      setAi1PerformanceError(getApiErrorDetail(error));
      setAi1Metrics([]);
      setAi1Thresholds([]);
      setAi1Acceptance([]);
    } finally {
      setAi1PerformanceLoading(false);
    }
  };

  const fetchForecastByProvince = async (province: string) => {
    if (!province) return;
    setForecastLoading(true);
    setForecastError('');
    setForecastNotice('');
    try {
      const data = await aiService.getForecast7d(province, undefined, 'champion');
      setForecast(data);
      setSelectedProvince(data.province || province);
    } catch (error: any) {
      setForecast(null);
      setSelectedProvince(province);
      setForecastError(getApiErrorDetail(error));
    } finally {
      setForecastLoading(false);
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
      const farm = sourceFarms.find((item) => item.id === farmId);
      const province = inferProvinceFromFarm(farm);
      if (province) setManualProvince(province);
      let rootError: any = null;

      if (province && (aiSupportedProvinces.length === 0 || aiSupportedProvinces.includes(province))) {
        try {
          const data = await aiService.getForecast7d(province, undefined, 'champion');
          setForecast(data);
          setSelectedProvince(data.province || province);
          return;
        } catch (provinceError: any) {
          rootError = provinceError;
        }
      }

      try {
        const farmData = await aiService.getForecast7dByFarm(farmId, undefined, 'champion');
        setForecast(farmData);
        setSelectedProvince(farmData.province || province || '');
        return;
      } catch (farmError: any) {
        rootError = rootError || farmError;
      }

      if (!shouldUseIotFallback(rootError)) {
        setForecast(null);
        setSelectedProvince(province || '');
        setForecastError(getApiErrorDetail(rootError));
        return;
      }

      const readingsResp = await iotService.getReadings();
      const farmReadings = (readingsResp?.data || []).filter(
        (item: any) => item?.iot_devices?.farm_id === farmId
      );
      const heuristic = buildHeuristicForecast(farmReadings);
      if (heuristic.length > 0) {
        setForecast({
          province: province || 'N/A',
          as_of: new Date().toISOString().slice(0, 10),
          model_version: 'heuristic-fallback',
          model_set_used: 'heuristic',
          forecast: heuristic,
        });
        setSelectedProvince(province || '');
        setForecastNotice(
          `Không gọi được mô hình AI (${getApiErrorDetail(rootError)}). Hệ thống đang hiển thị dữ liệu dự phòng từ IoT.`
        );
      } else {
        setForecast(null);
        setSelectedProvince(province || '');
        setForecastError(
          `Không đủ dữ liệu IoT để tạo dự báo dự phòng. Lỗi AI: ${getApiErrorDetail(rootError)}`
        );
      }
    } catch (error: any) {
      setForecast(null);
      setForecastError(getApiErrorDetail(error));
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchRiskForFarm = async (farmId: string) => {
    if (!farmId) return setRisk(null);
    setRiskLoading(true);
    setRiskError('');
    try {
      const response = await aiService.getRiskByFarm(farmId);
      setRisk(response?.data || null);
    } catch (error: any) {
      const allowFallback =
        Number(error?.response?.status || 0) === 404 || shouldUseIotFallback(error);
      if (allowFallback) {
        try {
          const readingsResp = await iotService.getReadings();
          const farmReadings = (readingsResp?.data || []).filter(
            (item: any) => item?.iot_devices?.farm_id === farmId
          );
          const fallbackRisk = buildHeuristicRisk(farmId, farmReadings);
          if (fallbackRisk) {
            setRisk(fallbackRisk);
            return;
          }
        } catch (fallbackError) {
          console.error(fallbackError);
        }
      }
      setRisk(null);
      setRiskError(getApiErrorDetail(error));
    } finally {
      setRiskLoading(false);
    }
  };

  const fetchDecisionForFarm = async (farmId: string) => {
    if (!farmId) return setDecision(null);
    setDecisionLoading(true);
    setDecisionError('');
    try {
      const response = await aiService.getDecisionByFarm(farmId);
      setDecision(response?.data || null);
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      if (status === 404) {
        try {
          const legacy = await aiService.getRecommendations(farmId);
          const rec = legacy?.data;
          if (rec) {
            setDecision({
              decision: rec?.recommended_action || 'Tiếp tục theo dõi và vận hành ổn định',
              urgency: 'warning',
              reason: rec?.explanation || 'Khuyến nghị được tổng hợp từ dữ liệu hiện có.',
              actions: [
                'Theo dõi độ mặn mỗi 2 đến 4 giờ.',
                'Kiểm tra cống cấp và thoát nước trước khi điều chỉnh.',
                'Cập nhật mùa vụ để hệ thống tính ngưỡng phù hợp hơn.',
              ],
            });
            return;
          }
        } catch (legacyError) {
          console.error(legacyError);
        }
      }
      setDecision(null);
      setDecisionError(getApiErrorDetail(error));
    } finally {
      setDecisionLoading(false);
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
        await Promise.allSettled([
          fetchHistory(firstFarmId),
          fetchForecastForFarm(firstFarmId, nextFarms),
          fetchRiskForFarm(firstFarmId),
          fetchDecisionForFarm(firstFarmId),
        ]);
      } else {
        setRequests([]);
        setForecast(null);
        setRisk(null);
        setDecision(null);
      }
    } catch (error) {
      console.error(error);
      setForecastError('Không thể tải dữ liệu phân tích.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAiMetadata();
    fetchAi1Performance();
  }, []);

  const handleFarmChange = async (farmId: string) => {
    setSelectedFarm(farmId);
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchHistory(farmId),
        fetchForecastForFarm(farmId, farms),
        fetchRiskForFarm(farmId),
        fetchDecisionForFarm(farmId),
      ]);
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
      alert('Đã gửi yêu cầu phân tích thành công.');
    } catch (error) {
      console.error(error);
      alert('Gửi yêu cầu thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="analysis-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <section className="analysis-hero glass-card">
        <div className="analysis-hero-copy">
          <span className="ph-chip">Trung tâm phân tích AI</span>
          <h1>Phân tích dữ liệu theo từng mô hình AI</h1>
          <p>
            Trang này tách rõ AI1, AI2 và AI3 để bà con dễ theo dõi dự báo, rủi ro và gợi ý vận hành
            trong cùng một nơi, với cách trình bày rõ ràng hơn và đồng bộ với giao diện trang chủ.
          </p>
        </div>

        <div className="analysis-summary">
          <div className="analysis-summary-card analysis-summary-card-farm">
            <span className="analysis-summary-label">Trang trại đang xem</span>
            <strong>{selectedFarmInfo?.farm_name || 'Chưa chọn trang trại'}</strong>
            <p>{selectedFarmInfo?.farm_code || 'Hệ thống sẽ tự nạp dữ liệu khi bạn chọn trang trại.'}</p>
          </div>
          <div className="analysis-summary-card analysis-summary-card-forecast">
            <span className="analysis-summary-label">AI1: Dự báo 7 ngày</span>
            <strong>
              {forecastLoading
                ? 'Đang cập nhật...'
                : forecastOverview
                  ? `${forecastOverview.peak.salinityValue.toFixed(2)} ‰ cao nhất`
                  : 'Chưa có dữ liệu'}
            </strong>
            <p>
              {forecastOverview
                ? `${forecastOverview.warningDays} ngày cần lưu ý, đỉnh mặn vào ${formatShortDate(forecastOverview.peak.date)}.`
                : 'Hệ thống sẽ hiển thị ngày mặn cao nhất và số ngày cần lưu ý.'}
            </p>
          </div>
          <div className="analysis-summary-card analysis-summary-card-risk">
            <span className="analysis-summary-label">AI2: Mức rủi ro</span>
            <strong>{riskLoading ? 'Đang đánh giá...' : formatRiskLabel(risk?.risk_label)}</strong>
            <p>AI2 tập trung vào cảnh báo và ưu tiên xử lý cho từng trang trại.</p>
          </div>
          <div className="analysis-summary-card analysis-summary-card-decision">
            <span className="analysis-summary-label">AI3: Gợi ý vận hành</span>
            <strong>{decisionLoading ? 'Đang tổng hợp...' : formatUrgency(decision?.urgency)}</strong>
            <p>
              {decision?.decision ||
                'AI3 sẽ gợi ý hành động ưu tiên để bà con xử lý nhanh theo tình hình thực tế.'}
            </p>
          </div>
        </div>
      </section>

      <nav className="analysis-section-nav glass-card">
        <a href="#analysis-ai1" className="analysis-anchor">
          <Waves size={16} />
          AI1: Dự báo 7 ngày
        </a>
        <a href="#analysis-ai2" className="analysis-anchor">
          <Shield size={16} />
          AI2: Đánh giá rủi ro
        </a>
        <a href="#analysis-ai3" className="analysis-anchor">
          <Brain size={16} />
          AI3: Gợi ý vận hành
        </a>
        {isAdmin && (
          <a href="#analysis-ai1-performance" className="analysis-anchor">
            <Sparkles size={16} />
            AI1: Hiệu năng model
          </a>
        )}
      </nav>

      <div className="analysis-top-grid">
        <section className="analysis-card glass-card">
          <div className="analysis-card-header">
            <div className="analysis-card-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h2>Yêu cầu phân tích AI</h2>
              <p>Chọn trang trại và loại phân tích để hệ thống gửi yêu cầu đến mô hình phù hợp.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="analysis-form">
            <div className="analysis-field">
              <label htmlFor="analysis-farm">Chọn trang trại</label>
              <select
                id="analysis-farm"
                value={selectedFarm}
                onChange={(e) => handleFarmChange(e.target.value)}
                disabled={farms.length === 0}
              >
                {farms.length === 0 && <option value="">Chưa có trang trại</option>}
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.farm_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="analysis-field">
              <label>Loại phân tích</label>
              <div className="analysis-option-grid">
                {ANALYSIS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = analysisType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`analysis-option analysis-option-${option.tone} ${isActive ? 'is-active' : ''}`}
                      onClick={() => setAnalysisType(option.id)}
                    >
                      <Icon size={18} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="ph-btn ph-btn-primary analysis-submit" disabled={submitting || farms.length === 0}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Đang gửi yêu cầu
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi yêu cầu phân tích
                </>
              )}
            </button>
          </form>
        </section>

        <section className="analysis-card glass-card analysis-library-card">
          <div className="analysis-card-header">
            <div className="analysis-card-icon analysis-card-icon-chat">
              <MessageCircle size={20} />
            </div>
            <div>
              <h2>Thư viện Trợ lý AI</h2>
              <p>
                Thay cho khối dữ liệu cũ, khu vực này giúp bà con chuyển nhanh sang trợ lý AI để xem xét
                vấn đề đang gặp và nhận hướng dẫn dễ hiểu hơn.
              </p>
            </div>
          </div>

          <div className="analysis-library-list">
            {AI_LIBRARY_TASKS.map((item) => (
              <div key={item} className="analysis-library-item">
                <Shield size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link to="/dashboard/chat" className="ph-btn ph-btn-primary analysis-library-link">
            Mở Trợ lý AI
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <section id="analysis-ai1" className="analysis-section analysis-section-ai1 glass-card">
        <div className="analysis-section-header">
          <div>
            <span className="analysis-kicker">AI1</span>
            <h2>AI1: Dự báo độ mặn trong 7 ngày</h2>
            <p>
              Theo dõi độ mặn từng ngày và xem ngay những mốc cần lưu ý để quyết định lấy nước, đóng mở
              cống hay tăng tần suất đo trong ngày.
            </p>
          </div>
          <div className="analysis-section-meta">
            <span className="analysis-meta-pill">Tỉnh: {selectedProvince || 'Đang cập nhật'}</span>
          </div>
        </div>

        {forecastLoading ? (
          <div className="analysis-loading">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : forecastError ? (
          <div className="analysis-state analysis-state-error">{forecastError}</div>
        ) : forecast ? (
          <>
            {forecastNotice && <div className="analysis-state analysis-state-warn">{forecastNotice}</div>}

            <div className="analysis-meta-line">
              Cập nhật lúc {forecast.as_of} | Dự báo cho {selectedProvince || forecast.province}
            </div>

            {forecastOverview && (
              <div className="analysis-ai1-overview-grid">
                <div className="analysis-ai1-overview-card analysis-ai1-overview-card-peak">
                  <span className="analysis-highlight-label">Đỉnh mặn 7 ngày tới</span>
                  <strong>{forecastOverview.peak.salinityValue.toFixed(2)} ‰</strong>
                  <p>
                    Cao nhất ở D+{forecastOverview.peak.day_ahead}, ngày{' '}
                    {formatShortDate(forecastOverview.peak.date)}.
                  </p>
                </div>

                <div className="analysis-ai1-overview-card analysis-ai1-overview-card-window">
                  <span className="analysis-highlight-label">Ngày cần lưu ý</span>
                  <strong>{forecastOverview.warningDays} ngày</strong>
                  <p>
                    {forecastOverview.saferDay
                      ? `Ngày dễ lấy nước hơn là D+${forecastOverview.saferDay.day_ahead} (${formatShortDate(
                          forecastOverview.saferDay.date
                        )}).`
                      : 'Chưa thấy ngày nào dưới ngưỡng 4.0 ‰ trong 7 ngày tới.'}
                  </p>
                </div>

                <div className="analysis-ai1-overview-card analysis-ai1-overview-card-guidance">
                  <span className="analysis-highlight-label">Gợi ý nhanh từ AI1</span>
                  <strong>
                    {forecastOverview.severeDays > 0
                      ? `${forecastOverview.severeDays} ngày mặn cao`
                      : `${forecastOverview.safeDays} ngày tương đối ổn`}
                  </strong>
                  <p>{forecastOverview.guidance}</p>
                </div>
              </div>
            )}

            <div className="analysis-table-wrap">
              <table className="analysis-data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Thời điểm dự báo</th>
                    <th>Độ mặn</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecast.map((item) => {
                    const palette = getSalinityPalette(Number(item.salinity_pred));
                    return (
                      <tr key={item.day_ahead}>
                        <td>D+{item.day_ahead}</td>
                        <td>{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className="analysis-value-chip" style={{ color: palette.color, background: palette.bg }}>
                            {Number(item.salinity_pred).toFixed(2)} ‰
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="analysis-empty">Chưa có dữ liệu dự báo cho trang trại đang chọn.</div>
        )}

        {aiSupportedProvinces.length > 0 && (
          <div className="analysis-inline-form">
            <div className="analysis-field">
              <label htmlFor="analysis-province">Hoặc xem nhanh theo tỉnh</label>
              <select
                id="analysis-province"
                value={manualProvince}
                onChange={(e) => setManualProvince(e.target.value)}
              >
                {aiSupportedProvinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="ph-btn ph-btn-secondary"
              onClick={() => fetchForecastByProvince(manualProvince)}
              disabled={forecastLoading || !manualProvince}
            >
              Xem dự báo
            </button>
          </div>
        )}
      </section>

      {isAdmin && (
        <section id="analysis-ai1-performance" className="analysis-section analysis-section-admin glass-card">
          <div className="analysis-section-header">
            <div>
              <span className="analysis-kicker">ADMIN</span>
              <h2>AI1: Hiệu năng mô hình</h2>
              <p>
                Khối này dành cho quản trị để theo dõi chất lượng AI1 sau huấn luyện, so sánh
                `xgboost` với `baseline_linear` và kiểm tra trạng thái pass.
              </p>
            </div>
            <div className="analysis-section-meta">
              <span className="analysis-meta-pill">Chỉ hiển thị cho quản trị</span>
            </div>
          </div>

          {ai1PerformanceLoading ? (
            <div className="analysis-loading">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : ai1PerformanceError ? (
            <div className="analysis-state analysis-state-error">{ai1PerformanceError}</div>
          ) : ai1PerformanceSummary ? (
            <>
              <div className="analysis-admin-grid">
                <div className="analysis-admin-card">
                  <span className="analysis-highlight-label">Mô hình đang chọn</span>
                  <strong>xgboost</strong>
                  <p>Champion hiện tại của AI1 theo bảng acceptance.</p>
                </div>
                <div className="analysis-admin-card">
                  <span className="analysis-highlight-label">Số Horizon Thắng</span>
                  <strong>
                    {ai1PerformanceSummary.wins}/{ai1PerformanceSummary.total}
                  </strong>
                  <p>XGBoost đang tốt hơn linear ở toàn bộ horizon.</p>
                </div>
                <div className="analysis-admin-card">
                  <span className="analysis-highlight-label">Cải thiện RMSE TB</span>
                  <strong>{ai1PerformanceSummary.avgRmseImprovementPct.toFixed(2)}%</strong>
                  <p>Mức cải thiện trung bình so với baseline_linear.</p>
                </div>
                <div className="analysis-admin-card">
                  <span className="analysis-highlight-label">Accuracy TB</span>
                  <strong>{ai1PerformanceSummary.avgAccuracy.toFixed(2)}%</strong>
                  <p>{ai1PerformanceSummary.overallPass ? 'Pass toàn bộ 7/7 horizon.' : 'Cần kiểm tra lại một số horizon.'}</p>
                </div>
              </div>

              <div className="analysis-table-wrap">
                <table className="analysis-data-table">
                  <thead>
                    <tr>
                      <th>Horizon</th>
                      <th>Linear RMSE</th>
                      <th>XGBoost RMSE</th>
                      <th>Linear MAE</th>
                      <th>XGBoost MAE</th>
                      <th>Accuracy</th>
                      <th>Kết luận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ai1PerformanceSummary.rows.map((row) => (
                      <tr key={row.horizon}>
                        <td>D+{row.horizon}</td>
                        <td>{row.baselineRmse.toFixed(4)}</td>
                        <td>{row.xgbRmse.toFixed(4)}</td>
                        <td>{row.baselineMae.toFixed(4)}</td>
                        <td>{row.xgbMae.toFixed(4)}</td>
                        <td>
                          <span className="analysis-soft-chip">
                            {row.accuracyPct.toFixed(2)}% / {row.targetAccuracyPct.toFixed(0)}%
                          </span>
                        </td>
                        <td>
                          <span
                            className="analysis-value-chip"
                            style={{
                              color: row.overallStatus === 'pass' ? '#047857' : '#b45309',
                              background:
                                row.overallStatus === 'pass'
                                  ? 'rgba(220, 252, 231, 0.92)'
                                  : 'rgba(254, 243, 199, 0.92)',
                            }}
                          >
                            {row.winner === 'xgboost'
                              ? `XGBoost +${row.rmseImprovementPct.toFixed(1)}%`
                              : 'Linear tốt hơn'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="analysis-empty">Chưa có dữ liệu đánh giá AI1 để hiển thị.</div>
          )}
        </section>
      )}

      <section id="analysis-ai2" className="analysis-section analysis-section-ai2 glass-card">
        <div className="analysis-section-header">
          <div>
            <span className="analysis-kicker">AI2</span>
            <h2>AI2: Đánh giá rủi ro</h2>
            <p>Xác định mức rủi ro hiện tại, điểm rủi ro và các chỉ dấu cần theo dõi sát hơn.</p>
          </div>
        </div>

        {riskLoading ? (
          <div className="analysis-loading">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : riskError ? (
          <div className="analysis-state analysis-state-error">{riskError}</div>
        ) : risk ? (
          <div
            className="analysis-highlight-panel"
            style={{
              borderColor: getRiskPalette(risk.risk_label).border,
              background: getRiskPalette(risk.risk_label).bg,
            }}
          >
            <div className="analysis-highlight-top">
              <div>
                <div className="analysis-highlight-label">Mức rủi ro</div>
                <div className="analysis-highlight-value" style={{ color: getRiskPalette(risk.risk_label).color }}>
                  {formatRiskLabel(risk.risk_label)}
                </div>
              </div>
              {typeof risk.risk_score === 'number' && (
                <div
                  className="analysis-highlight-score"
                  style={{ color: getRiskPalette(risk.risk_label).color }}
                >
                  {(risk.risk_score * 100).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="analysis-meta-line">Mô hình sử dụng: {risk.model_version}</div>

            {typeof risk.risk_score === 'number' && (
              <div className="analysis-progress">
                <div
                  className="analysis-progress-bar"
                  style={{
                    width: `${Math.max(6, Math.min(100, risk.risk_score * 100))}%`,
                    background: getRiskPalette(risk.risk_label).color,
                  }}
                />
              </div>
            )}

            {risk.diagnostics && (
              <div className="analysis-chip-row">
                {typeof risk.diagnostics.latest_salinity === 'number' && (
                  <span className="analysis-soft-chip">
                    Độ mặn mới nhất: {Number(risk.diagnostics.latest_salinity).toFixed(2)} ‰
                  </span>
                )}
                {typeof risk.diagnostics.latest_temperature === 'number' && (
                  <span className="analysis-soft-chip">
                    Nhiệt độ: {Number(risk.diagnostics.latest_temperature).toFixed(1)} °C
                  </span>
                )}
                {typeof risk.diagnostics.history_points === 'number' && (
                  <span className="analysis-soft-chip">
                    Điểm dữ liệu: {risk.diagnostics.history_points}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="analysis-empty">Chưa có kết quả đánh giá rủi ro từ AI2.</div>
        )}
      </section>

      <section id="analysis-ai3" className="analysis-section analysis-section-ai3 glass-card">
        <div className="analysis-section-header">
          <div>
            <span className="analysis-kicker">AI3</span>
            <h2>AI3: Gợi ý vận hành</h2>
            <p>Hiển thị quyết định ưu tiên, mức khẩn cấp và các bước hành động để bà con dễ làm theo.</p>
          </div>
        </div>

        {decisionLoading ? (
          <div className="analysis-loading">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : decisionError ? (
          <div className="analysis-state analysis-state-error">{decisionError}</div>
        ) : decision ? (
          <div className="analysis-decision-card">
            <div className="analysis-highlight-top">
              <div>
                <div className="analysis-highlight-label">Khuyến nghị chính</div>
                <div className="analysis-decision-title">{decision.decision}</div>
              </div>
              <span
                className="analysis-value-chip"
                style={{
                  color: getUrgencyPalette(decision.urgency).color,
                  background: getUrgencyPalette(decision.urgency).bg,
                }}
              >
                {formatUrgency(decision.urgency)}
              </span>
            </div>

            <p className="analysis-decision-reason">{decision.reason}</p>

            <div className="analysis-action-list">
              {(decision.actions || []).slice(0, 4).map((action, index) => (
                <div key={`${index}-${action}`} className="analysis-action-item">
                  <span>{index + 1}</span>
                  <p>{action}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="analysis-empty">Chưa có gợi ý vận hành từ AI3.</div>
        )}
      </section>

      <section className="analysis-section glass-card">
        <div className="analysis-subsection-head">
          <History size={18} />
          <h3>Lịch sử phân tích</h3>
        </div>

        {loading ? (
          <div className="analysis-loading">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : requests.length === 0 ? (
          <div className="analysis-empty">Chưa có yêu cầu phân tích nào được ghi nhận.</div>
        ) : (
          <div className="analysis-history-list">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`analysis-history-item ${req.status === 'completed' ? 'is-complete' : 'is-running'}`}
              >
                <div>
                  <strong>{formatAnalysisType(req.analysis_type)}</strong>
                  <p>{new Date(req.created_at).toLocaleString('vi-VN')}</p>
                </div>
                {req.status === 'completed' ? (
                  <span className="analysis-history-status is-complete">
                    <CheckCircle2 size={15} />
                    Hoàn tất
                  </span>
                ) : (
                  <span className="analysis-history-status is-running">
                    <Loader2 size={15} className="animate-spin" />
                    Đang xử lý
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="analysis-footnote">
          <AlertCircle size={16} />
          Trang này đang gom AI1, AI2 và AI3 vào cùng một luồng theo dõi để bà con xem dự báo, mức rủi ro
          và gợi ý hành động ngay trên một màn hình.
        </div>
      </section>
    </div>
  );
};
