import { getSupabaseAdminClient, EventBus, EventType, logger } from '@mekong/shared';

export class IoTController {
    private supabase = getSupabaseAdminClient();
    private eventBus = new EventBus();

    /**
     * Nhận dữ liệu sensor (Giả lập webhook từ LoRaWAN hoặc MQTT)
     */
    async handleReading(request: any, reply: any) {
        try {
            const { device_eui, salinity, temperature, ph, water_level, battery_voltage } = request.body;

            // 1. Tìm thiết bị
            const { data: device, error: deviceError } = await this.supabase
                .from('iot_devices')
                .select('id, farm_id')
                .eq('device_eui', device_eui)
                .single();

            if (deviceError || !device) {
                return reply.status(404).send({ success: false, message: 'Device not found' });
            }

            // 2. Lưu kết quả đo (Smart Storage: Chỉ lưu khi thay đổi > ngưỡng hoặc sau 10p)
            const { data: latestReading } = await this.supabase
                .from('sensor_readings')
                .select('*')
                .eq('device_id', device.id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            let shouldInsert = false;

            if (!latestReading) {
                shouldInsert = true;
            } else {
                // Ngưỡng thay đổi (Deadband)
                const TEMP_THRESHOLD = 0.5; // độ C
                const SALINITY_THRESHOLD = 0.2; // phần nghìn
                const PH_THRESHOLD = 0.2;

                // Tính độ lệch
                const deltaTemp = Math.abs(Number(temperature) - Number(latestReading.temperature));
                const deltaSal = Math.abs(Number(salinity) - Number(latestReading.salinity));
                const deltaPh = Math.abs(Number(ph) - Number(latestReading.ph));

                // Check Time (Heartbeat: 10 phút lưu 1 lần dù không đổi)
                const timeDiff = Date.now() - new Date(latestReading.timestamp).getTime();
                const isHeartbeat = timeDiff > 10 * 60 * 1000;

                if (deltaTemp > TEMP_THRESHOLD || deltaSal > SALINITY_THRESHOLD || deltaPh > PH_THRESHOLD || isHeartbeat) {
                    shouldInsert = true;
                }
            }

            if (shouldInsert) {
                const { error: insertError } = await this.supabase
                    .from('sensor_readings')
                    .insert({
                        device_id: device.id,
                        salinity,
                        temperature,
                        ph,
                        water_level,
                        battery_voltage
                    });
                if (insertError) throw insertError;
            } else {
                // Nếu thay đổi nhỏ: Chỉ cập nhật Timestamp để báo "Device Online"
                // Giúp Dashboard vẫn hiển thị "Vừa cập nhật" mà không tốn Row DB
                const { error: updateError } = await this.supabase
                    .from('sensor_readings')
                    .update({ timestamp: new Date().toISOString() })
                    .eq('id', latestReading.id);
                if (updateError) throw updateError;
            }

            // 3. Bắn event để AI hoặc Farm service xử lý tiếp
            await this.eventBus.publish({
                type: EventType.SENSOR_DATA_RECEIVED,
                data: {
                    device_id: device.id,
                    farm_id: device.farm_id,
                    readings: { salinity, temperature, ph }
                },
                source: 'iot-service'
            });

            // 4. Kiểm tra ngưỡng để tạo cảnh báo chuyên sâu dựa trên Mùa Vụ
            const { data: currentSeason } = await this.supabase
                .from('seasons')
                .select('season_type')
                .eq('farm_id', device.farm_id)
                .eq('status', 'active')
                .single();

            const isRiceSeason = currentSeason?.season_type === 'rice';
            const salinityThreshold = isRiceSeason ? 2 : 12; // Lúa: >2‰ là nguy, Tôm: >12‰ (tùy giống) thì cảnh báo

            if (salinity > salinityThreshold) {
                // Lấy user_id từ farm để gán alert
                const { data: farm } = await this.supabase
                    .from('farms')
                    .select('user_id')
                    .eq('id', device.farm_id)
                    .single();

                if (farm) {
                    const alertTitle = isRiceSeason ? '🔴 CẢNH BÁO MẶN XÂM NHẬP (VỤ LÚA)' : '⚠️ CẢNH BÁO ĐỘ MẶN BIẾN ĐỘNG (VỤ TÔM)';
                    const alertMessage = isRiceSeason
                        ? `Phát hiện độ mặn ${salinity}‰. Vượt ngưỡng chịu mặn của lúa (2‰)!`
                        : `Độ mặn hiện tại ${salinity}‰. Cần theo dõi sức khỏe tôm.`;

                    await this.supabase.from('alerts').insert({
                        user_id: farm.user_id,
                        farm_id: device.farm_id,
                        alert_type: 'salinity_high',
                        severity: isRiceSeason ? 'critical' : 'warning',
                        title: alertTitle,
                        message: alertMessage,
                        status: 'active'
                    });
                }

                await this.eventBus.publish({
                    type: EventType.ALERT_TRIGGERED,
                    data: {
                        farm_id: device.farm_id,
                        severity: isRiceSeason ? 'critical' : 'warning',
                        title: isRiceSeason ? 'High Salinity Alert (Rice)' : 'Salinity Warning (Shrimp)',
                        message: `Salinity level detected at ${salinity}‰`
                    },
                    source: 'iot-service'
                });
            }

            return { success: true };
        } catch (error: any) {
            logger.error(`IoT Handle Error: ${error.message}`);
            return reply.status(500).send({ success: false, message: error.message });
        }
    }

    /**
     * Lấy dữ liệu sensor mới nhất cho Dashboard
     */
    async getLatestReadings(request: any, reply: any) {
        try {
            const { data, error } = await this.supabase
                .from('sensor_readings')
                .select('*, iot_devices(device_name, farm_id)')
                .order('timestamp', { ascending: false })
                .limit(20);

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message });
        }
    }

    /**
     * Lấy danh sách thiết bị
     */
    /**
     * Lấy danh sách thiết bị
     */
    async getDevices(request: any, reply: any) {
        try {
            const { data, error } = await this.supabase
                .from('iot_devices')
                .select('*, farms(farm_name)');

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message });
        }
    }

    /**
     * Đăng ký thiết bị mới
     */
    async registerDevice(request: any, reply: any) {
        try {
            const { device_eui, device_name, device_type, farm_id, hardware_version, firmware_version } = request.body;

            const { data, error } = await this.supabase
                .from('iot_devices')
                .insert({
                    device_eui,
                    device_name,
                    device_type,
                    farm_id: farm_id === "" ? null : farm_id,
                    hardware_version,
                    firmware_version,
                    status: 'active',
                    battery_level: 100
                })
                .select()
                .single();

            if (error) throw error;
            return reply.status(201).send({ success: true, data });
        } catch (error: any) {
            logger.error(`Register device error: ${error.message}`);
            return reply.status(500).send({ success: false, message: error.message });
        }
    }
}
