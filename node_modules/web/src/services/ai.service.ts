import api from './api';

export const aiService = {
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
