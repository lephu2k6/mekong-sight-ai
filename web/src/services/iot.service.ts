import api from './api';

export const iotService = {
    getReadings: async () => {
        const response = await api.get('/iot/readings');
        return response.data;
    },

    getDevices: async () => {
        // In a real app, this would be /iot/devices
        const response = await api.get('/iot/devices');
        return response.data;
    },

    registerDevice: async (deviceData: any) => {
        const response = await api.post('/iot/devices', deviceData);
        return response.data;
    },

    simulateReading: async (deviceEui: string, overrides?: any) => {
        // Generate random realistic data
        const data = {
            device_eui: deviceEui,
            temperature: (25 + Math.random() * 8).toFixed(1),
            salinity: (Math.random() * 20).toFixed(1), // 0-20 ppt
            ph: (6.5 + Math.random() * 2).toFixed(1),
            water_level: (0.5 + Math.random() * 1.5).toFixed(1),
            battery_voltage: (3.7 + Math.random() * 0.5).toFixed(2),
            ...overrides
        };
        // Use ingest endpoint
        const response = await api.post('/iot/ingest', data);
        return response.data;
    }
};
