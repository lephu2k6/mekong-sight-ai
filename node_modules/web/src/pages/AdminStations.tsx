import React, { useState, useEffect } from 'react';
import { farmService } from '../services/farm.service';
import { MapPin, Plus, Search, MoreVertical, Radio, Globe, Map as MapIcon, Database, Loader2, Eye, X, Cpu } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const stationIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: var(--primary-green); width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

export const AdminStations: React.FC = () => {
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStation, setSelectedStation] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await farmService.getAllFarms();
            setStations(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (station: any) => {
        setIsModalOpen(true);
        setModalLoading(true);
        try {
            const data = await farmService.getFarmById(station.id);
            setSelectedStation(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setModalLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to parse Geometry (GeoJSON or WKT)
    const parsePoint = (geom: any) => {
        if (!geom) return [9.4, 105.8]; // Default focus on Mekong

        // Handle GeoJSON object (default from Supabase)
        if (typeof geom === 'object' && geom.type) {
            if (geom.type === 'Point') {
                return [geom.coordinates[1], geom.coordinates[0]]; // [lat, lng]
            }
            if (geom.type === 'Polygon') {
                // Use the first point of the polygon as the marker position
                const firstPoint = geom.coordinates[0][0];
                return [firstPoint[1], firstPoint[0]];
            }
        }

        // Fallback for WKT strings
        if (typeof geom === 'string') {
            const pointMatch = geom.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
            if (pointMatch) return [parseFloat(pointMatch[2]), parseFloat(pointMatch[1])];

            const polyMatch = geom.match(/POLYGON\(\(([-\d.]+) ([-\d.]+)/);
            if (polyMatch) return [parseFloat(polyMatch[2]), parseFloat(polyMatch[1])];
        }

        return [9.4, 105.8];
    };

    // State for creating new station
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStation, setNewStation] = useState({
        farm_name: '',
        farm_code: '',
        area_hectares: 0,
        address: '',
        farm_type: 'shrimp_rice', // Default
        latitude: '',
        longitude: ''
    });
    const [addLoading, setAddLoading] = useState(false);

    // Location Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const searchTimeoutRef = React.useRef<any>(null);

    const handleSearchLocation = (query: string) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!query || query.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await res.json();
                setLocationSuggestions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500); // Debounce 500ms
    };

    const selectLocation = (item: any) => {
        setNewStation({
            ...newStation,
            address: item.display_name,
            latitude: item.lat,
            longitude: item.lon
        });
        setSearchQuery(item.display_name.split(',')[0]); // Short name for input
        setLocationSuggestions([]);
    };
    const handleAddStation = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        try {
            // Convert to numbers if present, else use default (Mekong Delta center approx)
            const payload = {
                ...newStation,
                latitude: newStation.latitude ? parseFloat(newStation.latitude) : 9.175,
                longitude: newStation.longitude ? parseFloat(newStation.longitude) : 105.15
            };

            await farmService.createFarm(payload);
            setIsAddModalOpen(false);
            setNewStation({
                farm_name: '',
                farm_code: '',
                area_hectares: 0,
                address: '',
                farm_type: 'shrimp_rice',
                latitude: '',
                longitude: ''
            });
            fetchData(); // Refresh list
        } catch (err) {
            console.error(err);
            alert('Lỗi khi thêm trạm mới. Vui lòng kiểm tra lại thông tin.');
        } finally {
            setAddLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Quản lý Hệ thống</h1>
                    <p className="text-secondary">Giám sát vị trí địa lý của các trạm và tình trạng mạng lưới toàn vùng.</p>
                </div>
                <button className="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={18} /> Thêm trạm mới
                </button>
            </div>

            {/* ... stats cards ... */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '2rem' }}>
                <div className="card glass-card">
                    <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: 'var(--primary-green)' }}>
                            <Globe size={24} />
                        </div>
                        <span className="status-tag status-active">Hoạt động</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Vùng phủ sóng</p>
                    <h2 style={{ margin: 0 }}>{stations.length} Trạm</h2>
                </div>
                <div className="card glass-card">
                    <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--info)' }}>
                            <Database size={24} />
                        </div>
                        <span className="status-tag status-active">Tốt</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Tổng số Nodes</p>
                    <h2 style={{ margin: 0 }}>{stations.length * 3} Nodes</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* ... table and map ... */}
                <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '0.85rem', color: 'var(--text-muted)' }} />
                            <input
                                placeholder="Tìm kiếm trạm..."
                                style={{ marginBottom: 0, paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '1.2rem' }}>Tên trạm</th>
                                    <th style={{ padding: '1.2rem' }}>Vị trí</th>
                                    <th style={{ padding: '1.2rem' }}>Nodes</th>
                                    <th style={{ padding: '1.2rem' }}>Trạng thái</th>
                                    <th style={{ padding: '1.2rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                                            <Loader2 className="animate-spin" size={32} color="var(--primary-green)" />
                                            <p className="text-secondary" style={{ marginTop: '1rem' }}>Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : stations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Chưa có trạm nào được ghi nhận.
                                        </td>
                                    </tr>
                                ) : (
                                    stations.map((s: any) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                                            <td style={{ padding: '1.2rem' }}>
                                                <div className="flex items-center gap-3">
                                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--primary-green) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                        <Radio size={20} />
                                                    </div>
                                                    <p style={{ fontWeight: 600 }}>{s.farm_name}</p>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem', fontSize: '0.85rem' }}>
                                                <div className="flex items-center gap-1 text-secondary">
                                                    <MapPin size={14} /> {s.address || 'Chưa xác định'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem', fontWeight: 600 }}>3</td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <span className={`status-tag status-${s.status === 'active' ? 'active' : 'warning'}`}>
                                                    {s.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="secondary"
                                                        style={{ padding: '8px', borderRadius: '10px' }}
                                                        onClick={() => handleViewDetails(s)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="outline" style={{ padding: '8px', borderRadius: '10px' }}>
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
                        <MapIcon size={24} color="var(--primary-green)" />
                        <h3 style={{ margin: 0 }}>Bản đồ hệ thống</h3>
                    </div>

                    <div style={{ flex: 1, minHeight: '350px', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        {!loading && stations.length > 0 ? (
                            <MapContainer
                                center={[9.4, 105.8]}
                                zoom={8}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {stations.map(s => {
                                    const pos = parsePoint(s.geometry);
                                    return (
                                        <Marker key={s.id} position={pos as any} icon={stationIcon}>
                                            <Popup>
                                                <div style={{ padding: '5px' }}>
                                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{s.farm_name}</strong>
                                                    <p style={{ fontSize: '0.8rem', margin: 0 }}>{s.address}</p>
                                                    <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--primary-green)' }}>Trạng thái: {s.status}</p>
                                                    <button
                                                        className="primary"
                                                        style={{ marginTop: '8px', fontSize: '0.75rem', padding: '4px 10px' }}
                                                        onClick={() => handleViewDetails(s)}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)' }}>
                                <p className="text-secondary">Đang tải bản đồ...</p>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h4>Hiệu suất mạng lưới</h4>
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {stations.map((s: any) => (
                                <div key={s.id}>
                                    <div className="flex justify-between" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                        <span>{s.farm_name}</span>
                                        <span>{s.status === 'active' ? '98%' : '64%'}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: s.status === 'active' ? '98%' : '64%', background: s.status === 'active' ? 'var(--primary-green)' : 'var(--warning)', borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Thêm Trạm Mới */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }} onClick={() => setIsAddModalOpen(false)}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '500px',
                        borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-xl)',
                        animation: 'fadeIn 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Thêm Trạm Mới</h2>
                        <form onSubmit={handleAddStation}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên trạm / Mô hình</label>
                                <input
                                    required
                                    value={newStation.farm_name}
                                    onChange={e => setNewStation({ ...newStation, farm_name: e.target.value })}
                                    placeholder="Ví dụ: Trạm Quan trắc Cà Mau"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mã trạm (Code)</label>
                                <input
                                    required
                                    value={newStation.farm_code}
                                    onChange={e => setNewStation({ ...newStation, farm_code: e.target.value })}
                                    placeholder="Ví dụ: CM_001"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Diện tích (ha)</label>
                                    <input
                                        type="number"
                                        required
                                        value={newStation.area_hectares}
                                        onChange={e => setNewStation({ ...newStation, area_hectares: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Loại hình</label>
                                    <select
                                        value={newStation.farm_type}
                                        onChange={e => setNewStation({ ...newStation, farm_type: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                    >
                                        <option value="shrimp_rice">Lúa - Tôm</option>
                                        <option value="shrimp_only">Chuyên Tôm</option>
                                        <option value="rice_only">Chuyên Lúa</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Vị trí / Địa chỉ</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            handleSearchLocation(e.target.value);
                                        }}
                                        placeholder="Tìm kiếm địa điểm (Ví dụ: Rạch Giá, Kiên Giang)..."
                                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                    />
                                    {isSearching && (
                                        <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
                                            <Loader2 className="animate-spin" size={18} color="var(--primary-green)" />
                                        </div>
                                    )}
                                </div>

                                {locationSuggestions.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-lg)',
                                        zIndex: 10, maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)',
                                        marginTop: '4px'
                                    }}>
                                        {locationSuggestions.map((item: any, idx) => (
                                            <div
                                                key={idx}
                                                style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.9rem' }}
                                                className="hover:bg-gray-50"
                                                onClick={() => selectLocation(item)}
                                            >
                                                <p style={{ margin: 0, fontWeight: 500 }}>{item.display_name.split(',')[0]}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.display_name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Vĩ độ (Latitude)</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={newStation.latitude}
                                        onChange={e => setNewStation({ ...newStation, latitude: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kinh độ (Longitude)</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={newStation.longitude}
                                        onChange={e => setNewStation({ ...newStation, longitude: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc' }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" className="secondary" onClick={() => setIsAddModalOpen(false)}>Hủy bỏ</button>
                                <button type="submit" className="primary" disabled={addLoading}>
                                    {addLoading ? <Loader2 className="animate-spin" size={18} /> : 'Thêm trạm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Chi tiết Trạm */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setIsModalOpen(false)}>
                    <div style={{
                        background: 'white',
                        width: '100%',
                        maxWidth: '800px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'fadeIn 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, var(--bg-green-subtle) 0%, white 100%)' }}>
                            <div className="flex items-center gap-4">
                                <div style={{ width: 50, height: 50, borderRadius: '15px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <Radio size={28} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedStation?.farm_name || 'Đang tải...'}</h2>
                                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '2px' }}>Mã trạm: {selectedStation?.farm_code}</p>
                                </div>
                            </div>
                            <button className="secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                            {modalLoading ? (
                                <div style={{ padding: '4rem', textAlign: 'center' }}>
                                    <Loader2 className="animate-spin" size={40} color="var(--primary-green)" />
                                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Đang truy xuất thông tin chi tiết...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                        <div style={{ padding: '1.2rem', background: 'var(--bg-light)', borderRadius: '16px' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Vị trí</p>
                                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedStation?.address}</p>
                                        </div>
                                        <div style={{ padding: '1.2rem', background: 'var(--bg-light)', borderRadius: '16px' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Diện tích quản lý</p>
                                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedStation?.area_hectares} Hectares</p>
                                        </div>
                                        <div style={{ padding: '1.2rem', background: 'var(--bg-light)', borderRadius: '16px' }}>
                                            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Trạng thái mạng</p>
                                            <span className="status-tag status-active">Hoạt động</span>
                                        </div>
                                    </div>

                                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Cpu size={20} color="var(--primary-green)" />
                                        Thiết bị Nodes kết nối ({selectedStation?.iot_devices?.length || 0})
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {selectedStation?.iot_devices?.length > 0 ? selectedStation.iot_devices.map((device: any) => (
                                            <div key={device.id} style={{ padding: '1.2rem', border: '1px solid var(--border-light)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div className="flex items-center gap-4">
                                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-green-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-green)' }}>
                                                        <Cpu size={20} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, margin: 0 }}>{device.device_name}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>EUI: {device.device_eui}</p>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>🔋 {device.battery_level}%</p>
                                                    <span style={{ fontSize: '0.75rem', color: device.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                                                        ● {device.status === 'active' ? 'Trực tuyến' : 'Ngoại tuyến'}
                                                    </span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-light)', borderRadius: '16px' }}>
                                                <p className="text-muted">Chưa có thiết bị nào được gán cho trạm này.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
                            <button className="primary" onClick={() => setIsModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
