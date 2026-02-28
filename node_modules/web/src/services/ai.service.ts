import api from './api';

export const aiService = {
    getReportCharts: async () => {
        const response = await api.get('/ai/reports/charts');
        return response.data;
    },

    getReportMetrics: async () => {
        const response = await api.get('/ai/reports/metrics');
        return response.data;
    },

    getForecast7dByFarm: async (farmId: string, asOf?: string) => {
        const params = new URLSearchParams();
        if (asOf) {
            params.append('as_of', asOf);
        }
        const query = params.toString();
        const suffix = query ? `?${query}` : '';
        const response = await api.get(`/ai/forecast7d/farm/${farmId}${suffix}`);
        return response.data;
    },

    getForecast7d: async (province: string, asOf?: string) => {
        const params = new URLSearchParams({ province });
        if (asOf) {
            params.append('as_of', asOf);
        }
        const response = await api.get(`/ai/forecast7d?${params.toString()}`);
        return response.data;
    },

    chat: async (message: string, image?: File) => {
        const formData = new FormData();
        formData.append('message', message || "Hãy phân tích hình ảnh này");
        if (image) {
            formData.append('image', image);
        }

        const response = await api.post('/ai/chat', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    analyze: async (farmId: string, analysisType: string) => {
        const response = await api.post('/ai/analyze', {
            farm_id: farmId,
            analysis_type: analysisType,
        });
        return response.data;
    },

    getAnalysisHistory: async (farmId: string) => {
        const response = await api.get(`/ai/analysis-requests/${farmId}`);
        return response.data;
    },

    getRecommendations: async (farmId: string) => {
        const response = await api.get(`/ai/recommendations/${farmId}`);
        return response.data;
    }
};
