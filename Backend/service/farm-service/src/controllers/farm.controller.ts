import { Request, Response } from 'express';
import { getSupabaseAdminClient } from '@mekong/shared';
import { logger } from '@mekong/shared';

export class FarmController {
    private supabase = getSupabaseAdminClient();

    /**
     * Lấy danh sách trang trại của người dùng
     */
    async getMyFarms(req: Request, res: Response) {
        try {
            const userId = (req as any).user.sub;
            const { data, error } = await this.supabase
                .from('farms')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            return res.json({ success: true, data });
        } catch (error: any) {
            logger.error(`Get farms error: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Lấy toàn bộ trang trại trong hệ thống (Dành cho Admin)
     */
    async getAllFarms(req: Request, res: Response) {
        try {
            const { data, error } = await this.supabase
                .from('farms')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Tạo trang trại mới
     */
    async createFarm(req: Request, res: Response) {
        try {
            const userId = (req as any).user.sub;
            const { farm_name, farm_type, area_hectares, farm_code, address, latitude, longitude } = req.body;

            let geometry = null;
            if (latitude && longitude) {
                // Create a small polygon box around the point (approx 10-20m) for simplified view
                const d = 0.0001;
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                geometry = `POLYGON((${lng - d} ${lat - d}, ${lng + d} ${lat - d}, ${lng + d} ${lat + d}, ${lng - d} ${lat + d}, ${lng - d} ${lat - d}))`;
            }

            const { data, error } = await this.supabase
                .from('farms')
                .insert({
                    user_id: userId,
                    farm_name,
                    farm_type,
                    area_hectares,
                    farm_code,
                    address,
                    status: 'active',
                    geometry: geometry // Add geometry
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json({ success: true, data });
        } catch (error: any) {
            logger.error(`Create farm error: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Lấy chi tiết trang trại
     */
    async getFarmDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { data, error } = await this.supabase
                .from('farms')
                .select('*, iot_devices(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(404).json({ success: false, message: 'Farm not found' });
        }
    }

    /**
     * Lấy danh sách cảnh báo của người dùng
     */
    async getAlerts(req: Request, res: Response) {
        try {
            const userId = (req as any).user.sub;
            const { data, error } = await this.supabase
                .from('alerts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Xác nhận cảnh báo
     */
    async acknowledgeAlert(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await this.supabase
                .from('alerts')
                .update({
                    status: 'acknowledged',
                    acknowledged_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Xóa trang trại
     */
    async deleteFarm(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { error } = await this.supabase
                .from('farms')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Thiết lập mùa vụ mới
     */
    async startSeason(req: Request, res: Response) {
        try {
            const { farm_id, season_type, start_date, variety, expected_end_date } = req.body;

            // 1. Kết thúc các mùa vụ cũ của farm này (nếu có)
            await this.supabase
                .from('seasons')
                .update({ status: 'completed' })
                .eq('farm_id', farm_id)
                .eq('status', 'active');

            // 2. Tạo mùa vụ mới
            const { data, error } = await this.supabase
                .from('seasons')
                .insert({
                    farm_id,
                    season_type,
                    start_date,
                    variety,
                    expected_end_date,
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json({ success: true, data });
        } catch (error: any) {
            logger.error(`Start season error: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Lấy mùa vụ hiện tại của trang trại
     */
    async getCurrentSeason(req: Request, res: Response) {
        try {
            const { farm_id } = req.params;
            const { data, error } = await this.supabase
                .from('seasons')
                .select('*')
                .eq('farm_id', farm_id)
                .eq('status', 'active')
                .single();

            if (error) return res.json({ success: true, data: null });
            return res.json({ success: true, data });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
