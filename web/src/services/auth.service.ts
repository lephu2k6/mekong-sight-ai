import api from './api';

export const sendOtp = async (phoneNumber: string) => {
    const response = await api.post('/auth/otp/send', { phone_number: phoneNumber });
    return response.data;
};

export const verifyOtp = async (phoneNumber: string, otp: string) => {
    const response = await api.post('/auth/otp/verify', { phone_number: phoneNumber, otp });
    const data = response.data.data || response.data;
    return data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

const authService = {
    sendOtp,
    verifyOtp,
    logout
};

export default authService;
