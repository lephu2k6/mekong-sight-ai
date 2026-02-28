import React, { useState, useEffect } from 'react';
import { iotService } from '../services/iot.service';
import { farmService } from '../services/farm.service';
import { Cpu, Plus, Search, MoreVertical, RefreshCw, Radio, Zap, Activity, Loader2, Play, StopCircle } from 'lucide-react';

export const AdminIoT: React.FC = () => {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationIntervalRef = React.useRef<any>(null);
    const deviceStatesRef = React.useRef<any>({});
    const devicesRef = React.useRef(devices);
    devicesRef.current = devices; // Sync latest devices

    // Registration State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [farms, setFarms] = useState<any[]>([]);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [newDevice, setNewDevice] = useState({
        device_name: '',
        device_eui: '',
        device_type: 'lorawan_sensor',
        farm_id: '',
        hardware_version: '1.0.0',
        firmware_version: '1.0.0'
    });

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const data = await iotService.getDevices();
            setDevices(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFarms = async () => {
        try {
            const data = await farmService.getAllFarms();
            setFarms(data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterLoading(true);
        try {
            await iotService.registerDevice(newDevice);
            setIsModalOpen(false);
            setNewDevice({
                device_name: '',
                device_eui: '',
                device_type: 'lorawan_sensor',
                farm_id: '',
                hardware_version: '1.0.0',
                firmware_version: '1.0.0'
            });
            fetchDevices();
        } catch (err) {
            console.error(err);
            alert('Lỗi khi đăng ký thiết bị. Vui lòng kiểm tra lại EUI (phải là duy nhất).');
        } finally {
            setRegisterLoading(false);
        }
    };

    const openModal = () => {
        fetchFarms();
        setIsModalOpen(true);
    };

    const handleSimulate = async (device: any) => {
        if (!confirm(`Gửi dữ liệu giả lập cho ${device.device_name} (${device.device_eui})?`)) return;
        try {
            await iotService.simulateReading(device.device_eui);
            alert('Dữ liệu đã được gửi thành công!');
        } catch (err) {
            console.error(err);
            alert('Lỗi khi gửi dữ liệu');
        }
    };

    const toggleSimulation = () => {
        if (isSimulating) {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            setIsSimulating(false);
            return;
        }

        if (devices.length === 0) {
            alert('Không có thiết bị nào để giả lập!');
            return;
        }

        if (!confirm('Bắt đầu chế độ giả lập dữ liệu thời gian thực cho TẤT CẢ thiết bị?')) return;

        setIsSimulating(true);

        const runStep = async () => {
            console.log("Simulating realistic batch...");
            const currentDevices = devicesRef.current;

            for (const device of currentDevices) {
                // Init state if needed (with Realistic Starting Points for Mekong Delta)
                if (!deviceStatesRef.current[device.device_eui]) {
                    deviceStatesRef.current[device.device_eui] = {
                        // Shrimp/Rice Model: Salinity 10-25, Temp 26-32, pH 7.5-8.5
                        salinity: 15 + Math.random() * 5, // Start 15-20 ppt
                        temperature: 28 + Math.random() * 2, // Start 28-30°C
                        ph: 7.8 + (Math.random() - 0.5) * 0.4, // Start 7.6-8.0

                        // Trends (Very slow natural drift)
                        trend_sal: (Math.random() - 0.5) * 0.02,
                        trend_temp: (Math.random() - 0.5) * 0.01,
                        trend_ph: (Math.random() - 0.5) * 0.005
                    };
                }

                let state = deviceStatesRef.current[device.device_eui];

                // Apply slow trend (Drift)
                state.salinity += state.trend_sal;
                state.temperature += state.trend_temp;
                state.ph += state.trend_ph;

                // Add small noise (Sensor jitter)
                const noise_sal = (Math.random() - 0.5) * 0.02;
                const noise_temp = (Math.random() - 0.5) * 0.01;
                const noise_ph = (Math.random() - 0.5) * 0.01;

                // Bounds check & Reverse Trend (Natural limits)
                // Salinity: Natural drift towards center if too extreme
                if (state.salinity < 5) { state.trend_sal = Math.abs(state.trend_sal) + 0.005; }
                if (state.salinity > 30) { state.trend_sal = -Math.abs(state.trend_sal) - 0.005; }

                // Temp: 25 - 35
                if (state.temperature < 26) { state.trend_temp = Math.abs(state.trend_temp) + 0.002; }
                if (state.temperature > 34) { state.trend_temp = -Math.abs(state.trend_temp) - 0.002; }

                // pH: 7 - 9
                if (state.ph < 7.2) { state.trend_ph = Math.abs(state.trend_ph) + 0.001; }
                if (state.ph > 8.8) { state.trend_ph = -Math.abs(state.trend_ph) - 0.001; }

                // Occasional Trend Change (Weather event / Tide change)
                if (Math.random() > 0.99) {
                    state.trend_sal = (Math.random() - 0.5) * 0.03;
                    state.trend_temp = (Math.random() - 0.5) * 0.02;
                }

                // Calculate display values (State + Noise)
                const displaySal = Math.max(0, state.salinity + noise_sal);
                const displayTemp = Math.max(0, state.temperature + noise_temp);
                const displayPh = Math.max(0, state.ph + noise_ph);

                // Send
                try {
                    await iotService.simulateReading(device.device_eui, {
                        salinity: displaySal.toFixed(2),
                        temperature: displayTemp.toFixed(2),
                        ph: displayPh.toFixed(2)
                    });
                } catch (e) { console.error(e); }
            }
        };

        runStep();
        simulationIntervalRef.current = setInterval(runStep, 2000); // 2s loop for realtime feel
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        fetchDevices();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Quản lý thiết bị IoT</h1>
                    <p className="text-secondary">Cấu hình EUI, quản lý trạng thái kết nối và giám sát phần cứng.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="secondary" onClick={fetchDevices}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className={`secondary ${isSimulating ? 'status-danger' : ''}`}
                        onClick={toggleSimulation}
                        style={{ marginRight: '1rem', borderColor: isSimulating ? 'var(--danger)' : 'var(--primary-green)', color: isSimulating ? 'var(--danger)' : 'var(--primary-green)' }}
                    >
                        {isSimulating ? <StopCircle size={18} /> : <Play size={18} />}
                        {isSimulating ? 'Dừng Giả Lập' : 'Chạy Giả Lập'}
                    </button>
                    <button className="primary" onClick={openModal}>
                        <Plus size={18} /> Đăng ký thiết bị
                    </button>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '2rem' }}>
                <div className="card glass-card flex items-center gap-4">
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--primary-green)' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Thiết bị trực tuyến</p>
                        <h3 style={{ margin: 0 }}>{devices.filter(d => d.status === 'active').length} / {devices.length}</h3>
                    </div>
                </div>
                <div className="card glass-card flex items-center gap-4">
                    <div style={{ padding: '12px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', color: 'var(--accent-teal)' }}>
                        <Radio size={24} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Tổng số trạm kết nối</p>
                        <h3 style={{ margin: 0 }}>{new Set(devices.map(d => d.farm_id).filter(Boolean)).size} Trạm</h3>
                    </div>
                </div>
                <div className="card glass-card flex items-center gap-4">
                    <div style={{ padding: '12px', background: 'rgba(132, 204, 22, 0.1)', borderRadius: '12px', color: 'var(--accent-lime)' }}>
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Dữ liệu nhận (24h)</p>
                        <h3 style={{ margin: 0 }}>1,284 Gói</h3>
                    </div>
                </div>
            </div>

            <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '0.85rem', color: 'var(--text-muted)' }} />
                        <input
                            placeholder="Tìm kiếm DevEUI, tên thiết bị..."
                            style={{ marginBottom: 0, paddingLeft: '3rem' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border-light)' }}>
                                <th style={{ padding: '1.2rem' }}>Thiết bị</th>
                                <th style={{ padding: '1.2rem' }}>ID Hệ thống</th>
                                <th style={{ padding: '1.2rem' }}>Loại phần cứng</th>
                                <th style={{ padding: '1.2rem' }}>Trạng thái</th>
                                <th style={{ padding: '1.2rem' }}>Pin / Tín hiệu</th>
                                <th style={{ padding: '1.2rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Chưa có thiết bị nào được đăng ký.
                                    </td>
                                </tr>
                            ) : (
                                devices.map((device) => (
                                    <tr key={device.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                                        <td style={{ padding: '1.2rem' }}>
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-teal) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <Cpu size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{device.device_name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trạm: {device.farms?.farm_name || 'Chưa gán'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem', fontSize: '0.85rem' }}>{device.device_eui}</td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'var(--bg-green-subtle)', color: 'var(--primary-dark)', borderRadius: '6px' }}>
                                                {device.device_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div className="flex items-center gap-2">
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: device.status === 'active' ? 'var(--success)' : 'var(--danger)' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>{device.status === 'active' ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <p>🔋 {device.battery_level}%</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FW: {device.firmware_version}</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem', display: 'flex', gap: '8px' }}>
                                            <button
                                                className="secondary"
                                                style={{ padding: '8px', borderRadius: '50%' }}
                                                onClick={() => handleSimulate(device)}
                                                title="Gửi dữ liệu giả lập"
                                            >
                                                <Play size={16} color="var(--primary-green)" />
                                            </button>
                                            <button className="secondary" style={{ padding: '8px', borderRadius: '50%' }}>
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Đăng Ký Thiết Bị */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                }} onClick={() => setIsModalOpen(false)}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '500px',
                        borderRadius: '24px', padding: '2rem', boxShadow: 'var(--shadow-xl)',
                        animation: 'fadeIn 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ padding: '10px', background: 'var(--bg-green-subtle)', borderRadius: '12px', color: 'var(--primary-green)' }}>
                                <Plus size={24} />
                            </div>
                            <h2 style={{ margin: 0 }}>Đăng Ký Thiết Bị Mới</h2>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tên thiết bị</label>
                                <input
                                    required
                                    value={newDevice.device_name}
                                    onChange={e => setNewDevice({ ...newDevice, device_name: e.target.value })}
                                    placeholder="Ví dụ: Cảm biến độ mặn Farm A"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>DevEUI (16 ký tự)</label>
                                <input
                                    required
                                    value={newDevice.device_eui}
                                    onChange={e => setNewDevice({ ...newDevice, device_eui: e.target.value })}
                                    placeholder="Ví dụ: A84041000181C921"
                                    maxLength={16}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', fontFamily: 'monospace' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Gán vào Trạm / Farm</label>
                                <select
                                    value={newDevice.farm_id}
                                    onChange={e => setNewDevice({ ...newDevice, farm_id: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                >
                                    <option value="">-- Chưa gán --</option>
                                    {farms.map(f => (
                                        <option key={f.id} value={f.id}>{f.farm_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hard. Ver</label>
                                    <input
                                        value={newDevice.hardware_version}
                                        onChange={e => setNewDevice({ ...newDevice, hardware_version: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Firm. Ver</label>
                                    <input
                                        value={newDevice.firmware_version}
                                        onChange={e => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3" style={{ marginTop: '2rem' }}>
                                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                                <button type="submit" className="primary" disabled={registerLoading}>
                                    {registerLoading ? <Loader2 className="animate-spin" size={18} /> : 'Đăng ký ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
