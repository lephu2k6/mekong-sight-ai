import { getSupabaseAdminClient } from '../packages/shared/src';
import * as dotenv from 'dotenv';
import path from 'path';

// Load ENV
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = getSupabaseAdminClient();

async function seed() {
    console.log(`🌱 Khởi tạo hệ thống dữ liệu Mekong Sight AI...`);

    // 1. Lấy danh sách users (Cần ít nhất 1 farmer)
    const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('*');

    if (userError || !users || users.length === 0) {
        console.error("❌ Không tìm thấy User nào. Vui lòng đăng nhập ít nhất 1 lần.");
        return;
    }

    const mainUser = users.find(u => u.phone_number === '0981460071') || users[0];
    const userId = mainUser.id;
    console.log(`👤 Đang seed cho tài khoản: ${mainUser.full_name || mainUser.phone_number}`);

    // Update role to admin or farmer for testing
    await supabase.from('user_profiles').update({ role: 'admin' }).eq('id', userId);

    // 2. Tạo các trang trại (mô phỏng các trạm/mô hình)
    const farmsData = [
        {
            user_id: userId,
            farm_name: "Trạm Trung tâm Trần Đề",
            farm_code: "ST_TD_001",
            farm_type: "shrimp_rice",
            area_hectares: 15.5,
            address: "Trần Đề, Sóc Trăng",
            status: "active",
            geometry: "POLYGON((106.130 9.471, 106.131 9.471, 106.131 9.472, 106.130 9.472, 106.130 9.471))"
        },
        {
            user_id: userId,
            farm_name: "Mô hình Lúa-Tôm Mỹ Xuyên",
            farm_code: "ST_MX_002",
            farm_type: "shrimp_rice",
            area_hectares: 8.2,
            address: "Mỹ Xuyên, Sóc Trăng",
            status: "active",
            geometry: "POLYGON((105.925 9.555, 105.926 9.555, 105.926 9.556, 105.925 9.556, 105.925 9.555))"
        },
        {
            user_id: userId,
            farm_name: "Khu nuôi Tôm công nghệ cao Bạc Liêu",
            farm_code: "BL_HB_003",
            farm_type: "shrimp_only",
            area_hectares: 25.0,
            address: "Hòa Bình, Bạc Liêu",
            status: "active",
            geometry: "POLYGON((105.652 9.274, 105.653 9.274, 105.653 9.275, 105.652 9.275, 105.652 9.274))"
        },
        {
            user_id: userId,
            farm_name: "Trạm Quan trắc Rạch Giá",
            farm_code: "KG_RG_004",
            farm_type: "shrimp_only",
            area_hectares: 12.0,
            address: "Rạch Giá, Kiên Giang",
            status: "active",
            geometry: "POLYGON((105.080 10.012, 105.081 10.012, 105.081 10.013, 105.080 10.013, 105.080 10.012))"
        }
    ];

    const { data: insertedFarms, error: farmError } = await supabase
        .from('farms')
        .upsert(farmsData, { onConflict: 'farm_code' })
        .select();

    if (farmError) {
        console.error("❌ Lỗi tạo Farm:", farmError);
        return;
    }

    console.log(`✅ Đã tạo ${insertedFarms.length} trạm/trang trại.`);

    // 3. Tạo thiết bị IoT đa dạng
    const deviceTypes = ['Salinity Sensor', 'pH Meter', 'Water Level', 'Weather Station'];
    const now = new Date();

    for (const farm of insertedFarms) {
        const farmDevices = [];
        for (let i = 1; i <= 3; i++) {
            const type = deviceTypes[i % deviceTypes.length];
            farmDevices.push({
                farm_id: farm.id,
                device_eui: `MEKONG_${farm.id.substring(0, 4)}_${i}`.toUpperCase(),
                device_name: `${type} Node ${i}`,
                device_type: type,
                battery_level: Math.floor(Math.random() * 40) + 60,
                status: "active",
                last_seen: now.toISOString()
            });
        }

        const { data: devices, error: deviceError } = await supabase
            .from('iot_devices')
            .upsert(farmDevices, { onConflict: 'device_eui' })
            .select();

        if (deviceError) {
            console.error(`❌ Lỗi tạo thiết bị cho ${farm.farm_name}:`, deviceError);
            continue;
        }

        // 4. Tạo dữ liệu sensor lịch sử (7 ngày gần nhất)
        console.log(`📊 Đang tạo 168 bản ghi dữ liệu cho các cảm biến tại ${farm.farm_name}...`);

        for (const device of devices) {
            const readings = [];
            for (let h = 0; h < 168; h++) {
                const timestamp = new Date(now.getTime() - h * 60 * 60 * 1000);

                // Giả lập xu hướng độ mặn tăng dần (xâm nhập mặn)
                const baseSalinity = 1.5 + (h < 24 ? 2.5 : 0);
                const noise = Math.random() * 0.5;

                readings.push({
                    device_id: device.id,
                    salinity: Number((baseSalinity + noise).toFixed(2)),
                    temperature: Number((26 + Math.random() * 6).toFixed(1)),
                    ph: Number((7.0 + Math.random() * 1.5).toFixed(1)),
                    water_level: Number((0.8 + Math.random() * 0.5).toFixed(2)),
                    battery_voltage: 3.7 + Math.random() * 0.5,
                    signal_strength: -110 + Math.floor(Math.random() * 40),
                    timestamp: timestamp.toISOString()
                });
            }

            const { error: readError } = await supabase.from('sensor_readings').insert(readings);
            if (readError) console.error("Error inserting readings:", readError.message);
        }
    }

    // 5. Tạo một số cảnh báo mẫu
    const alerts = [
        {
            user_id: userId,
            farm_id: insertedFarms[0].id,
            alert_type: 'salinity_high',
            severity: 'critical',
            title: '🔴 ĐỘ MẶN VƯỢT NGƯỠNG NGUY HIỂM',
            message: 'Phát hiện độ mặn 4.2‰ tại Trạm Trần Đề. Nguy cơ ảnh hưởng lúa giai đoạn làm đòng.',
            status: 'active'
        },
        {
            user_id: userId,
            farm_id: insertedFarms[1].id,
            alert_type: 'ph_low',
            severity: 'warning',
            title: '⚠️ CẢNH BÁO PH THẤP',
            message: 'pH nước giảm xuống 6.2 tại Mô hình Mỹ Xuyên. Cần kiểm tra bón vôi.',
            status: 'active'
        }
    ];

    await supabase.from('alerts').upsert(alerts, { onConflict: 'title,user_id' });

    console.log("🚀 HỆ THỐNG DỮ LIỆU ĐÃ SẴN SÀNG! Dữ liệu 7 ngày qua đã được đồng bộ.");
}

seed();
