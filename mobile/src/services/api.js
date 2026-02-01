import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL
const API_BASE_URL = 'https://attendence-app-uzvt.onrender.com/api';
const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
