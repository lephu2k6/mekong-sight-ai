import api from './api';

export const getProfile = async () => {
    const response = await api.get('/auth/profile');
    return response.data.data;
};

export const updateProfile = async (updates: any) => {
    const response = await api.put('/auth/profile', updates);
    return response.data.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/auth/profiles');
    // Map database fields to UI fields if necessary
    const profiles = response.data.data || [];
    return profiles.map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Chưa đặt tên',
        phone_number: p.phone_number,
        role: p.role || 'Thành viên',
        status: 'active', // In a real app, this might come from a real-time status service
        last_login: p.updated_at ? new Date(p.updated_at).toLocaleDateString('vi-VN') : 'N/A'
    }));
};

export const getCurrentUserLocal = () => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
};

const userService = {
    getProfile,
    updateProfile,
    getAllUsers,
    getCurrentUserLocal
};

export default userService;
