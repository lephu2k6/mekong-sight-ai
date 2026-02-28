import axios from 'axios';

const SERVICES = {
    AUTH: 'http://localhost:3000/api',
    FARM: 'http://localhost:3001/api',
    IOT: 'http://localhost:3002/api',
    AI: 'http://localhost:8000/api',
};

const api = axios.create({
    baseURL: SERVICES.AUTH, // Default
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    // Logic to switch baseURL based on target service
    if (config.url?.startsWith('/farms')) {
        config.baseURL = SERVICES.FARM;
    } else if (config.url?.startsWith('/iot')) {
        config.baseURL = SERVICES.IOT;
    } else if (config.url?.startsWith('/ai')) {
        config.baseURL = SERVICES.AI;
    } else {
        config.baseURL = SERVICES.AUTH;
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
