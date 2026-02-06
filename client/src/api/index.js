import axios from 'axios';

const getBaseURL = () => {
    // We can now use a relative path because of the Vite proxy in development
    // and because the server serves the client in production.
    return '/api';
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
