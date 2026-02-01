import axios from 'axios';

const getBaseURL = () => {
    // If we're in a browser, use the current host
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        return `http://${host}:5000/api`;
    }
    // Fallback for mobile/other environments
    return 'http://192.168.100.173:5000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


export default api;
