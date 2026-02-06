import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL
// const API_BASE_URL = 'https://attendence-app-uzvt.onrender.com/api';

// Local Development URL (Your PC's IP)
// Local Development URL (Your PC's IP)
// Updated for Physical Device testing (Expo on Phone)
const API_BASE_URL = 'http://172.17.40.34:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    async (config) => {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.baseURL);
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error.message, error.response?.data);
        return Promise.reject(error);
    }
);

export default api;
