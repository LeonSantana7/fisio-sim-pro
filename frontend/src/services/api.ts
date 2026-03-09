import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/';
if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
if (baseURL.endsWith('/api')) baseURL += '/';
else if (!baseURL.endsWith('/api/')) baseURL += '/api/';

const api = axios.create({
    baseURL,
    timeout: 120000, // 2 minutos de espera pro Render acordar da inatividade
    headers: {
        'Content-Type': 'application/json',
    },
});

import { authApi } from './authApi';

export const historyService = {
    async list(deviceKey: string, limit = 5000) {
        const { data } = await authApi.get(`history?deviceKey=${deviceKey}&limit=${limit}`);
        return data;
    },
    async add(record: {
        deviceKey: string;
        toolId: string;
        toolType: 'calculator' | 'scale';
        inputValues: any;
        resultValue: string;
        resultUnit?: string;
        resultLevel?: string;
        interpretation?: string;
    }) {
        const { data } = await authApi.post('history', record);
        return data;
    },
    async clear(deviceKey: string) {
        const { data } = await authApi.delete(`history?deviceKey=${deviceKey}`);
        return data;
    },
    async deleteById(id: string) {
        const { data } = await authApi.delete(`history/${id}`);
        return data;
    },
};

export const favoriteService = {
    async list(deviceKey: string) {
        const { data } = await authApi.get(`favorites?deviceKey=${deviceKey}`);
        return data;
    },
    async toggle(deviceKey: string, toolId: string, toolType: 'calculator' | 'scale') {
        const { data } = await authApi.post('favorites/toggle', { deviceKey, toolId, toolType });
        return data;
    },
};

export default api;
