import React, { useState, useEffect } from 'react';
import { farmService } from '../services/farm.service';
import { Plus, MapPin, Ruler, Droplets, X, Loader2, Settings, Trash2 } from 'lucide-react';

export const Farms: React.FC = () => {
    const [farms, setFarms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedFarm, setSelectedFarm] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [currentSeason, setCurrentSeason] = useState<any>(null);
    const [showSeasonForm, setShowSeasonForm] = useState(false);
    const [seasonData, setSeasonData] = useState({
        season_type: 'rice',
        variety: '',
        start_date: new Date().toISOString().split('T')[0]
    });

    // Form state
    const [newFarm, setNewFarm] = useState({
        farm_name: '',
        area_hectares: '',
        farm_type: 'shrimp_rice'
    });

    const fetchFarms = async () => {
        try {
            const data = await farmService.getMyFarms();
            setFarms(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarms();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await farmService.createFarm(newFarm);
            setShowModal(false);
            setNewFarm({ farm_name: '', area_hectares: '', farm_type: 'shrimp_rice' });
            fetchFarms();
        } catch (err) {
            alert('Không thể tạo trang trại. Vui lòng kiểm tra lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewDetail = async (id: string) => {
        setLoadingDetail(true);
        try {
            const data = await farmService.getFarmById(id);
            setSelectedFarm(data.data);

            // Lấy thông tin mùa vụ hiện tại
            const seasonData = await farmService.getCurrentSeason(id);
            setCurrentSeason(seasonData.data);
            setShowSeasonForm(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleStartSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await farmService.startSeason({
                ...seasonData,
                farm_id: selectedFarm.id
            });
            alert('Đã thiết lập mùa vụ mới thành công!');
            handleViewDetail(selectedFarm.id);
        } catch (err) {
            alert('Lỗi khi thiết lập mùa vụ.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa trang trại này không? Dữ liệu không thể khôi phục.')) return;
        try {
            await farmService.deleteFarm(id);
            fetchFarms();
        } catch (err) {
            console.error(err);
            alert('Lỗi khi xóa trang trại.');
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Quản lý trang trại</h1>
                    <p className="text-secondary">Danh sách các khu vực nuôi trồng và thông tin chi tiết.</p>
                </div>
                <button className="primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Thêm trang trại mới
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--primary-glow)" />
                </div>
            ) : (
                <div className="grid">
                    {farms.length === 0 ? (
                        <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', borderStyle: 'dashed' }}>
                            <p className="text-secondary">Bạn chưa có trang trại nào. Hãy thêm trang trại đầu tiên!</p>
                        </div>
                    ) : (
                        farms.map(farm => (
                            <div key={farm.id} className="card">
                                <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem' }}>
                                    <h3>{farm.farm_name}</h3>
                                    <span className={`status-tag status-${farm.status === 'active' ? 'active' : 'warning'}`}>
                                        {farm.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="flex items-center gap-2 text-secondary">
                                        <Ruler size={16} />
                                        <span>Diện tích: <strong>{farm.area_hectares} ha</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-secondary">
                                        <Droplets size={16} />
                                        <span>Loại hình: <strong>{
                                            farm.farm_type === 'shrimp_rice' ? 'Tôm - Lúa luân canh' :
                                                farm.farm_type === 'shrimp_only' ? 'Chỉ nuôi Tôm' : 'Chỉ trồng Lúa'
                                        }</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-secondary">
                                        <MapPin size={16} />
                                        <span>Trạng thái: <strong>{farm.status === 'active' ? 'Bình thường' : 'Cần kiểm tra'}</strong></span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', gap: '0.8rem' }}>
                                    <button
                                        className="primary"
                                        style={{ flex: 1, fontSize: '0.8rem' }}
                                        onClick={() => handleViewDetail(farm.id)}
                                    >
                                        {loadingDetail ? <Loader2 className="animate-spin" size={16} /> : 'Xem chi tiết'}
                                    </button>
                                    <button
                                        className="secondary"
                                        style={{ flex: 0, padding: '10px', color: '#ff4444' }}
                                        onClick={() => handleDelete(farm.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button className="secondary" style={{ flex: 0, padding: '10px' }}><Settings size={18} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
                    <div className="card glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                            <h2>Thêm trang trại</h2>
                            <button className="secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-secondary" style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>Tên trang trại / Lô đất</label>
                                <input
                                    placeholder="Ví dụ: Khu vực A1 - Cánh đồng Tây"
                                    value={newFarm.farm_name}
                                    onChange={e => setNewFarm({ ...newFarm, farm_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-secondary" style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>Diện tích (Hécta)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="1.5"
                                    value={newFarm.area_hectares}
                                    onChange={e => setNewFarm({ ...newFarm, area_hectares: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <label className="text-secondary" style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>Loại hình canh tác</label>
                                <select
                                    value={newFarm.farm_type}
                                    onChange={e => setNewFarm({ ...newFarm, farm_type: e.target.value })}
                                >
                                    <option value="shrimp_rice">Tôm - Lúa luân canh</option>
                                    <option value="shrimp_only">Chuyên nuôi Tôm</option>
                                    <option value="rice_only">Chuyên trồng Lúa</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Hủy bỏ</button>
                                <button type="submit" className="primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Chi tiết Trang trại */}
            {selectedFarm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
                    <div className="card glass-card" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ marginBottom: '0.4rem' }}>{selectedFarm.farm_name}</h2>
                                <span className={`status-tag status-${selectedFarm.status === 'active' ? 'active' : 'warning'}`}>
                                    {selectedFarm.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                </span>
                            </div>
                            <button className="secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setSelectedFarm(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="glass-card p-4">
                                <label className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>THÔNG TIN CHUNG</label>
                                <div style={{ fontSize: '0.9rem' }}>
                                    <p>Hệ thống: {selectedFarm.farm_type === 'shrimp_rice' ? 'Tôm - Lúa' : 'Chuyên canh'}</p>
                                    <p>Diện tích: {selectedFarm.area_hectares} Ha</p>
                                    <p>Vị trí: {selectedFarm.address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className="glass-card p-4">
                                <label className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>THIẾT BỊ IOT</label>
                                {selectedFarm.iot_devices?.length > 0 ? (
                                    selectedFarm.iot_devices.map((d: any) => (
                                        <div key={d.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{d.device_name}</span>
                                            <span style={{ color: '#10b981' }}>● Online</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Chưa cấu hình thiết bị</p>
                                )}
                            </div>
                        </div>

                        <div className="card p-4" style={{ background: 'rgba(255,255,255,0.02)', marginBottom: '2rem' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0 }}>Mùa vụ hiện tại</h4>
                                {!showSeasonForm && (
                                    <button
                                        className="secondary"
                                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                        onClick={() => setShowSeasonForm(true)}
                                    >
                                        {currentSeason ? 'Đổi mùa vụ' : 'Thiết lập mùa'}
                                    </button>
                                )}
                            </div>

                            {showSeasonForm ? (
                                <form onSubmit={handleStartSeason}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Loại hình</label>
                                            <select
                                                style={{ padding: '6px', fontSize: '0.8rem' }}
                                                value={seasonData.season_type}
                                                onChange={e => setSeasonData({ ...seasonData, season_type: e.target.value })}
                                            >
                                                <option value="rice">Trồng Lúa</option>
                                                <option value="shrimp">Nuôi Tôm</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Giống</label>
                                            <input
                                                style={{ padding: '6px', fontSize: '0.8rem' }}
                                                placeholder="VD: ST25, Thẻ chân trắng"
                                                value={seasonData.variety}
                                                onChange={e => setSeasonData({ ...seasonData, variety: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="primary" style={{ flex: 1, fontSize: '0.75rem' }} disabled={submitting}>Xác nhận</button>
                                        <button type="button" className="secondary" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setShowSeasonForm(false)}>Hủy</button>
                                    </div>
                                </form>
                            ) : currentSeason ? (
                                <div style={{ fontSize: '0.85rem' }}>
                                    <p>Loại: <strong>{currentSeason.season_type === 'rice' ? '🌾 Lúa' : '🦐 Tôm'}</strong></p>
                                    <p>Giống: <strong>{currentSeason.variety}</strong></p>
                                    <p>Ngày bắt đầu: <strong>{new Date(currentSeason.start_date).toLocaleDateString('vi-VN')}</strong></p>
                                </div>
                            ) : (
                                <p className="text-secondary" style={{ fontSize: '0.85rem', textAlign: 'center' }}>Chưa thiết lập mùa vụ. Hãy thiết lập để nhận cảnh báo chính xác!</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="primary" style={{ flex: 1 }}>Cấu hình ngưỡng cảnh báo</button>
                            <button className="secondary" onClick={() => setSelectedFarm(null)} style={{ flex: 0.5 }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
