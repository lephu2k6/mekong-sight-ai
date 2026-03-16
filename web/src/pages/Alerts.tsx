import React, { useEffect, useMemo, useState } from 'react';
import { farmService } from '../services/farm.service';
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHero } from '../components/PageHero';
import { QuickActionCard } from '../components/QuickActionCard';
import { SectionCard } from '../components/SectionCard';
import { StatusBadge } from '../components/StatusBadge';

const FILTER_LABELS = {
  all: 'Tất cả',
  critical: 'Nghiêm trọng',
  warning: 'Cần lưu ý',
  info: 'Thông tin',
} as const;

const getSeverityTone = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'warning' as const;
    case 'warning':
      return 'watch' as const;
    case 'info':
      return 'info' as const;
    default:
      return 'neutral' as const;
  }
};

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

  const filteredAlerts = alerts.filter((alert) => filter === 'all' || alert.severity === filter);

  const summary = useMemo(() => {
    const active = alerts.filter((item) => item.status === 'active');
    return {
      critical: active.filter((item) => item.severity === 'critical').length,
      warning: active.filter((item) => item.severity === 'warning').length,
      info: active.filter((item) => item.severity === 'info').length,
    };
  }, [alerts]);

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={22} />;
      case 'warning':
        return <AlertTriangle size={22} />;
      case 'info':
        return <Info size={22} />;
      default:
        return <Bell size={22} />;
    }
  };

  return (
    <div className="alerts-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHero
        chip="Trung tâm cảnh báo"
        title="Theo dõi cảnh báo môi trường"
        description="Tập trung các cảnh báo cần xử lý trước để bà con biết ngay hôm nay nên ưu tiên điều gì."
        aside={
          <div className="alerts-filter-shell">
            <p>Chọn mức độ cần theo dõi</p>
            <div className="alerts-filter-grid">
              {(['all', 'critical', 'warning', 'info'] as const).map((item) => (
                <button
                  key={item}
                  className={`alerts-filter-btn ${filter === item ? 'is-active' : ''}`}
                  onClick={() => setFilter(item)}
                >
                  {FILTER_LABELS[item]}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="alerts-summary-grid">
        <QuickActionCard
          icon={<AlertCircle size={18} />}
          title="Cảnh báo nghiêm trọng"
          description={`${summary.critical} cảnh báo đang cần ưu tiên xử lý ngay.`}
          action={<StatusBadge tone="warning">Ưu tiên cao</StatusBadge>}
        />
        <QuickActionCard
          icon={<AlertTriangle size={18} />}
          title="Cần lưu ý"
          description={`${summary.warning} cảnh báo nên theo dõi sát trong ngày.`}
          action={<StatusBadge tone="watch">Theo dõi sát</StatusBadge>}
        />
        <QuickActionCard
          icon={<Info size={18} />}
          title="Thông tin hệ thống"
          description={`${summary.info} thông báo hỗ trợ ra quyết định đang hiển thị.`}
          action={<StatusBadge tone="info">Thông tin</StatusBadge>}
        />
      </div>

      <SectionCard
        title="Danh sách cảnh báo"
        description="Các thẻ dưới đây được phân cấp rõ ràng theo mức độ để dễ quan sát hơn."
        icon={<Bell size={18} />}
      >
        {loading ? (
          <div className="alerts-loading">
            <Loader2 className="animate-spin" size={40} color="var(--primary-green)" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={24} />}
            title="Không có cảnh báo cần xử lý"
            description="Hiện tại hệ thống chưa ghi nhận cảnh báo nào trong nhóm bạn đang xem."
          />
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => {
              const tone = getSeverityTone(alert.severity);
              return (
                <article key={alert.id} className={`alerts-item tone-${tone}`}>
                  <div className="alerts-item-icon">{getIcon(alert.severity)}</div>
                  <div className="alerts-item-main">
                    <div className="alerts-item-head">
                      <div>
                        <h3>{alert.title}</h3>
                        <p>{alert.message}</p>
                      </div>
                      <div className="alerts-item-meta">
                        <StatusBadge tone={tone}>{FILTER_LABELS[alert.severity as 'critical' | 'warning' | 'info'] || 'Thông tin'}</StatusBadge>
                        <span>{new Date(alert.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="alerts-item-foot">
                      <span className="alerts-farm-chip">Mã trang trại: {alert.farm_id?.slice(0, 8) || '---'}</span>
                      {alert.status === 'active' ? (
                        <button className="ph-btn ph-btn-secondary" onClick={() => acknowledgeAlert(alert.id)}>
                          Xác nhận đã xem
                        </button>
                      ) : (
                        <StatusBadge tone="safe">Đã xác nhận</StatusBadge>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
