import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmService } from '../services/farm.service';
import { aiService } from '../services/ai.service';
import { iotService } from '../services/iot.service';
import {
  Brain,
  CircleAlert,
  CloudRain,
  Database,
  Droplets,
  History,
  Leaf,
  Loader2,
  PencilLine,
  RefreshCcw,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { Gauge } from '../components/Gauge';
import { PageHero } from '../components/PageHero';
import { RealtimeClock } from '../components/RealtimeClock';
import { QuickActionCard } from '../components/QuickActionCard';
import { SectionCard } from '../components/SectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

const CROP_OPTIONS = ['Tôm', 'Lúa', 'Tôm - Lúa'];

const VARIETY_OPTIONS: Record<string, string[]> = {
  'Tôm': ['Tôm Sú (Quảng canh)', 'Tôm thẻ chân trắng', 'Tôm quảng canh cải tiến'],
  'Lúa': ['ST24', 'ST25', 'OM18'],
  'Tôm - Lúa': ['Mô hình luân canh chuẩn', 'Tôm Sú + ST25', 'Tôm Sú + ST24'],
};

const toNumber = (value: any, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const getFarmCropLabel = (farmType?: string) => {
  const normalized = String(farmType || '').toLowerCase();
  if (normalized.includes('shrimp') && normalized.includes('rice')) return 'Tôm - Lúa';
  if (normalized.includes('rice')) return 'Lúa';
  if (normalized.includes('shrimp')) return 'Tôm';
  return 'Tôm';
};

const getSeasonLength = (cropType: string) => {
  if (cropType === 'Lúa') return 120;
  if (cropType === 'Tôm - Lúa') return 140;
  return 100;
};

const getSeasonStage = (cropType: string, days: number) => {
  if (cropType === 'Lúa') {
    if (days <= 25) return 'Mạ non (1-25 ngày)';
    if (days <= 60) return 'Đẻ nhánh (26-60 ngày)';
    if (days <= 95) return 'Làm đòng - trổ (61-95 ngày)';
    return 'Chín và chuẩn bị thu hoạch';
  }

  if (cropType === 'Tôm - Lúa') {
    if (days <= 30) return 'Chuẩn bị nền vụ';
    if (days <= 75) return 'Giai đoạn phát triển ổn định';
    if (days <= 110) return 'Theo dõi chuyển vụ';
    return 'Sẵn sàng thu hoạch hoặc luân canh';
  }

  if (days <= 30) return 'Tôm giống (1-30 ngày)';
  if (days <= 60) return 'Tôm con (31-60 ngày)';
  if (days <= 85) return 'Tôm phát triển mạnh';
  return 'Chuẩn bị thu hoạch';
};

const getWeatherLabel = (code?: number) => {
  if (typeof code !== 'number') return 'Chưa có dữ liệu thời tiết';
  if (code <= 3) return 'Trời quang hoặc ít mây';
  if (code <= 61) return 'Có mưa nhẹ hoặc âm u';
  return 'Mưa nhiều, cần theo dõi thêm';
};

const getEnvironmentStatus = (reading?: any) => {
  if (!reading) {
    return {
      label: 'Chưa có dữ liệu',
      tone: 'neutral' as const,
      summary: 'Hệ thống đang chờ dữ liệu cảm biến để đánh giá môi trường.',
      tips: ['Kiểm tra thiết bị cảm biến.', 'Làm mới dữ liệu sau vài giây.'],
    };
  }

  const salinity = toNumber(reading.salinity);
  const ph = toNumber(reading.ph, 7);
  const temperature = toNumber(reading.temperature, 28);

  if (salinity >= 25 || ph < 6.5 || ph > 8.5 || temperature >= 34) {
    return {
      label: 'Cảnh báo',
      tone: 'warning' as const,
      summary: 'Môi trường có chỉ số vượt ngưỡng an toàn, cần ưu tiên kiểm tra nước và cống cấp thoát.',
      tips: [
        'Hạn chế lấy thêm nước mặn vào ao trong thời điểm này.',
        'Đo lại độ mặn và pH sau 1 đến 2 giờ.',
        'Theo dõi phản ứng của tôm hoặc lúa trong ngày hôm nay.',
      ],
    };
  }

  if (salinity >= 10 || temperature >= 31 || ph < 6.8 || ph > 8.2) {
    return {
      label: 'Cần lưu ý',
      tone: 'watch' as const,
      summary: 'Chỉ số đang ở vùng nhạy cảm, nên theo dõi sát để tránh biến động bất ngờ.',
      tips: [
        'Giữ lịch đo cảm biến đều trong ngày.',
        'Quan sát màu nước và hoạt động của tôm.',
        'Chuẩn bị phương án điều tiết nước khi trời đổi nhanh.',
      ],
    };
  }

  return {
    label: 'Ổn định',
    tone: 'safe' as const,
    summary: 'Các chỉ số chính đang trong vùng thuận lợi cho canh tác và nuôi trồng.',
    tips: [
      'Tiếp tục theo dõi thường xuyên.',
      'Giữ nhịp vận hành như hiện tại.',
      'Cập nhật mùa vụ để AI gợi ý sát hơn.',
    ],
  };
};

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [weather, setWeather] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCrop, setSelectedCrop] = useState('Tôm');
  const [selectedVariety, setSelectedVariety] = useState(VARIETY_OPTIONS['Tôm'][0]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const farmData = await farmService.getMyFarms();
      const farmList = farmData.data || [];
      setFarms(farmList);

      let currentId = selectedFarmId;
      if (!currentId && farmList.length > 0) {
        currentId = farmList[0].id;
        setSelectedFarmId(currentId);
      }

      const currentFarm = farmList.find((farm: any) => farm.id === currentId) || farmList[0];
      if (currentFarm) {
        setSelectedCrop(getFarmCropLabel(currentFarm.farm_type));
      }

      const sensorData = await iotService.getReadings();
      const allReadings = sensorData.data || [];
      const farmReadings = allReadings
        .filter((item: any) => item?.iot_devices?.farm_id === currentId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setReadings(farmReadings);

      if (currentId) {
        try {
          const recData = await aiService.getRecommendations(currentId);
          setRecommendation(recData.data || null);
        } catch {
          setRecommendation(null);
        }
      } else {
        setRecommendation(null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runAI = async () => {
    if (!selectedFarmId) return;
    setAnalyzing(true);
    try {
      await aiService.analyze(selectedFarmId, 'salinity_forecast');
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setAnalyzing(false), 2000);
    }
  };

  const seedData = async () => {
    if (!confirm('Khởi tạo dữ liệu mẫu cho vùng lúa - tôm?')) return;
    setRefreshing(true);
    try {
      await farmService.createFarm({
        farm_name: 'Lô ST25 thực nghiệm',
        area_hectares: 2.5,
        farm_type: 'shrimp_rice',
      });
      fetchData();
    } catch (err: any) {
      console.error('Seed error:', err);
      const msg = err.response?.data?.message || err.message || 'Không xác định';
      alert(`Lỗi khi tạo dữ liệu mẫu: ${msg}`);
    } finally {
      setRefreshing(false);
    }
  };

  const selectedFarm = useMemo(
    () => farms.find((farm: any) => farm.id === selectedFarmId),
    [farms, selectedFarmId]
  );

  const latestReading = useMemo(() => readings[0], [readings]);
  const environmentStatus = useMemo(() => getEnvironmentStatus(latestReading), [latestReading]);

  const seasonStart = useMemo(() => {
    const source = selectedFarm?.created_at || selectedFarm?.updated_at;
    const parsed = source ? new Date(source) : new Date(Date.now() - 37 * 24 * 60 * 60 * 1000);
    return Number.isNaN(parsed.getTime()) ? new Date(Date.now() - 37 * 24 * 60 * 60 * 1000) : parsed;
  }, [selectedFarm]);

  const seasonDays = Math.max(
    1,
    Math.floor((currentTime.getTime() - seasonStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
  const seasonLength = getSeasonLength(selectedCrop);
  const seasonProgress = Math.min(100, Math.max(5, Math.round((seasonDays / seasonLength) * 100)));
  const harvestDate = new Date(seasonStart.getTime() + seasonLength * 24 * 60 * 60 * 1000);
  const seasonAdvice = recommendation?.recommended_action || environmentStatus.tips[0] || 'Tiếp tục theo dõi thường xuyên.';
  const currentVarieties = VARIETY_OPTIONS[selectedCrop] || VARIETY_OPTIONS['Tôm'];

  useEffect(() => {
    if (!selectedFarmId) {
      setWeather(null);
      return;
    }

    const fetchWeather = async () => {
      let lat = 9.294;
      let lon = 105.721;
      const farm = farms.find((item: any) => item.id === selectedFarmId);

      if (farm) {
        if (farm.latitude && farm.longitude) {
          lat = parseFloat(farm.latitude);
          lon = parseFloat(farm.longitude);
        } else if (farm.geometry?.coordinates) {
          if (farm.geometry.type === 'Point') {
            lat = farm.geometry.coordinates[1];
            lon = farm.geometry.coordinates[0];
          } else if (farm.geometry.type === 'Polygon') {
            const point = farm.geometry.coordinates[0][0];
            lat = point[1];
            lon = point[0];
          }
        }
      }

      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FBangkok`
        );
        const data = await res.json();
        setWeather(data.current_weather);
      } catch (error) {
        console.error('Weather fetch error', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [selectedFarmId, farms]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedFarmId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nextVariety = VARIETY_OPTIONS[selectedCrop]?.[0];
    if (nextVariety && !VARIETY_OPTIONS[selectedCrop]?.includes(selectedVariety)) {
      setSelectedVariety(nextVariety);
    }
  }, [selectedCrop, selectedVariety]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={42} color="var(--primary-glow)" />
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHero
        chip="Trung tâm giám sát mùa vụ"
        title="Dashboard Giám Sát"
        description="Theo dõi mùa vụ, chỉ số môi trường và khuyến nghị AI trong một màn hình rõ ràng, nổi bật và dễ thao tác hơn cho bà con."
        actions={<RealtimeClock />}
        aside={
          <div className="dashboard-control-panel">
            <div className="dashboard-control-field">
              <label htmlFor="dashboard-crop">Loại cây trồng</label>
              <select id="dashboard-crop" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                {CROP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-control-field">
              <label htmlFor="dashboard-variety">Giống</label>
              <select id="dashboard-variety" value={selectedVariety} onChange={(e) => setSelectedVariety(e.target.value)}>
                {currentVarieties.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-control-field dashboard-control-field-wide">
              <label htmlFor="dashboard-farm">Trang trại đang theo dõi</label>
              <select id="dashboard-farm" value={selectedFarmId} onChange={(e) => setSelectedFarmId(e.target.value)}>
                {farms.map((farm: any) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.farm_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-hero-actions">
              <button className="ph-btn ph-btn-secondary" onClick={fetchData} disabled={refreshing}>
                <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                Làm mới
              </button>
              <button className="ph-btn ph-btn-primary" onClick={seedData}>
                <Database size={16} />
                Tạo mẫu
              </button>
            </div>
          </div>
        }
      />

      <div className="dashboard-quick-grid">
        <QuickActionCard
          icon={<CircleAlert size={18} />}
          title="Hôm nay cần chú ý gì?"
          description={environmentStatus.summary}
          action={<Link to="/dashboard/alerts" className="ph-btn ph-btn-secondary">Xem cảnh báo</Link>}
        />
        <QuickActionCard
          icon={<Brain size={18} />}
          title="Hỏi Trợ lý AI"
          description="Nhận gợi ý nhanh về độ mặn, rủi ro và thao tác vận hành phù hợp với trang trại đang chọn."
          action={<Link to="/dashboard/chat" className="ph-btn ph-btn-primary">Hỏi ngay</Link>}
        />
        <QuickActionCard
          icon={<Leaf size={18} />}
          title="Quản lý trang trại"
          description="Xem vị trí, mùa vụ hiện tại và cập nhật thông tin trang trại để hệ thống gợi ý sát hơn."
          action={<Link to="/dashboard/farms" className="ph-btn ph-btn-secondary">Xem trang trại</Link>}
        />
      </div>

      <section className="dashboard-season-card glass-card">
        <div className="dashboard-card-head">
          <div className="dashboard-card-title-wrap">
            <Leaf size={22} />
            <div>
              <h2>Thông tin mùa vụ hiện tại</h2>
              <p className="dashboard-head-copy">Tập trung những thông tin quan trọng nhất về vụ đang theo dõi.</p>
            </div>
          </div>
          <button className="dashboard-edit-btn" onClick={fetchData}>
            <PencilLine size={16} />
            Cập nhật
          </button>
        </div>

        <div className="dashboard-season-body">
          <div className="dashboard-season-grid">
            <div className="dashboard-season-row">
              <span>Ngày xuống giống:</span>
              <strong>{seasonStart.toLocaleDateString('vi-VN')}</strong>
            </div>
            <div className="dashboard-season-row">
              <span>Thời gian nuôi:</span>
              <strong className="is-green">{seasonDays} ngày</strong>
            </div>
            <div className="dashboard-season-row">
              <span>Giai đoạn:</span>
              <strong className="is-orange">{getSeasonStage(selectedCrop, seasonDays)}</strong>
            </div>
            <div className="dashboard-season-row">
              <span>Dự kiến thu hoạch:</span>
              <strong>{harvestDate.toLocaleDateString('vi-VN')}</strong>
            </div>
          </div>

          <div className="dashboard-season-progress">
            <div
              className="dashboard-progress-ring"
              style={{
                background: `conic-gradient(#0f9f75 ${seasonProgress}%, rgba(226, 232, 240, 0.8) ${seasonProgress}% 100%)`,
              }}
            >
              <div className="dashboard-progress-ring-inner">{seasonProgress}%</div>
            </div>
            <p>Tiến độ vụ mùa</p>
          </div>
        </div>

        <div className="dashboard-advice-strip">
          <Sparkles size={18} />
          <strong>Khuyến nghị:</strong>
          <span>{seasonAdvice}</span>
        </div>
      </section>

      <section className="dashboard-main-grid">
        <SectionCard title="Độ mặn nước" icon={<Droplets size={18} />}>
          <div className="dashboard-gauge-wrap">
            <Gauge
              value={toNumber(latestReading?.salinity)}
              max={35}
              label="Độ mặn"
              unit="‰"
              color="#0f9f75"
              threshold={20}
            />
          </div>
          <div className="dashboard-panel-footnote">
            Cập nhật mới nhất: {latestReading?.timestamp ? new Date(latestReading.timestamp).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
          </div>
        </SectionCard>

        <SectionCard title="Trạng thái môi trường" icon={<CircleAlert size={18} />}>
          <div className={`dashboard-status-box tone-${environmentStatus.tone}`}>
            <StatusBadge tone={environmentStatus.tone}>{environmentStatus.label}</StatusBadge>
            <p>{environmentStatus.summary}</p>
            <div className="dashboard-status-standard">
              <strong>Giống đang chọn:</strong> {selectedVariety}
            </div>
          </div>

          <ul className="dashboard-tip-list">
            {environmentStatus.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section className="dashboard-metric-grid">
        <article className="dashboard-metric-card glass-card">
          <div className="dashboard-metric-icon water">
            <Wind size={18} />
          </div>
          <div>
            <span>Độ pH</span>
            <strong>{toNumber(latestReading?.ph, 7).toFixed(1)}</strong>
          </div>
        </article>

        <article className="dashboard-metric-card glass-card">
          <div className="dashboard-metric-icon sun">
            <Thermometer size={18} />
          </div>
          <div>
            <span>Nhiệt độ nước</span>
            <strong>{toNumber(latestReading?.temperature, 28).toFixed(1)} °C</strong>
          </div>
        </article>

        <article className="dashboard-metric-card glass-card">
          <div className="dashboard-metric-icon weather">
            {weather?.weathercode <= 3 ? <Sun size={18} /> : <CloudRain size={18} />}
          </div>
          <div>
            <span>Thời tiết hiện tại</span>
            <strong>{weather ? `${toNumber(weather.temperature).toFixed(1)} °C` : 'Chưa có dữ liệu'}</strong>
            <small>{getWeatherLabel(weather?.weathercode)}</small>
          </div>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <SectionCard title="Lịch sử đo lường gần đây" icon={<History size={18} />}>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Thiết bị</th>
                  <th>Chỉ số</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {readings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dashboard-empty-cell">Đang chờ dữ liệu cảm biến...</td>
                  </tr>
                ) : (
                  readings.slice(0, 8).map((reading: any, index: number) => {
                    const status = getEnvironmentStatus(reading);
                    return (
                      <tr key={`${reading.timestamp}-${index}`}>
                        <td>{new Date(reading.timestamp).toLocaleString('vi-VN')}</td>
                        <td>{reading.iot_devices?.device_name || `Cảm biến ${index + 1}`}</td>
                        <td>
                          <div className="dashboard-reading-group">
                            <span>{toNumber(reading.salinity).toFixed(1)} ‰</span>
                            <span>{toNumber(reading.ph, 7).toFixed(1)} pH</span>
                            <span>{toNumber(reading.temperature, 28).toFixed(1)} °C</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Trợ lý AI" icon={<Brain size={18} />} className="dashboard-ai-panel">
          {!recommendation ? (
            <EmptyState
              icon={<Brain size={24} />}
              title="Chưa có phân tích AI"
              description="Hãy chạy phân tích để hệ thống tạo khuyến nghị vận hành phù hợp với trang trại đang chọn."
              action={
                <button className="ph-btn ph-btn-primary" onClick={runAI} disabled={analyzing}>
                  {analyzing ? 'Đang phân tích...' : 'Phân tích ngay'}
                </button>
              }
            />
          ) : (
            <div className="dashboard-ai-content">
              <div className="dashboard-ai-highlight">
                <span>Khuyến nghị chính</span>
                <strong>{recommendation.recommended_action}</strong>
              </div>
              <div className="dashboard-ai-explain">{recommendation.explanation}</div>
              <button className="ph-btn ph-btn-secondary" onClick={runAI} disabled={analyzing}>
                {analyzing ? 'Đang cập nhật...' : 'Cập nhật phân tích'}
              </button>
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
};
