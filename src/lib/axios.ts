import axios from 'axios';
import Cookies from 'cookies-ts';

const cookies = new Cookies(); // 创建 cookies 实例

export const axiosInstance = axios.create({
  baseURL: 'http://43.156.89.66:3000/api',
  timeout: 1500,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request interceptor to include token
axiosInstance.interceptors.request.use((config) => {
  // Get token from the correct storage
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  console.log('Token:', token);
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No token found');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Redirect to login or handle reauth
      console.error('Authentication failed. Please login again.');
    }
    return Promise.reject(error);
  }
);
