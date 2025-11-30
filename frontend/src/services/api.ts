import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import storage from '../utils/storage';

// Dynamically determine API URL based on current host
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If we have an environment URL, use it
  if (envUrl) {
    return envUrl;
  }
  
  // Otherwise, use the same host as the frontend with default port
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001/api`;
};

const API_URL = getApiUrl();

class ApiService {
  private api: AxiosInstance;
  private refreshingToken = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = storage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshingToken) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshingToken = true;

          try {
            const refreshToken = storage.getItem('refreshToken');
            const response = await this.post('/auth/refresh', { refreshToken });
            const { token } = response.data;

            storage.setItem('token', token);
            this.refreshingToken = false;

            this.refreshSubscribers.forEach((callback) => callback(token));
            this.refreshSubscribers = [];

            return this.api(originalRequest);
          } catch (refreshError) {
            this.refreshingToken = false;
            storage.removeItem('token');
            storage.removeItem('refreshToken');
            window.location.href = '/webcat/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void) {
    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }
}

export default new ApiService();