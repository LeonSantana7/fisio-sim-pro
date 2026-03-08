import axios from 'axios';

// Usaremos fallback para localhost se não houver VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const authApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete authApi.defaults.headers.common['Authorization'];
    }
};
