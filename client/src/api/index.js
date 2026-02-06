import axios from 'axios';

const getBaseURL = () => {
    // In production (Render), the frontend is served by the same server.
    // We should use a relative path or detect if we are on a production domain.
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;

        // Check if we are running on Render (typically has 'onrender.com' in hostname)
        if (host.includes('onrender.com')) {
            return `https://${host}/api`;
        }

        // Local development: use the current host with port 5000
        return `http://${host}:5000/api`;
    }
    // Fallback for mobile environments
    return 'https://attendence-app-uzvt.onrender.com/api';
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
