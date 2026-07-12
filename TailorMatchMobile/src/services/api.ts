import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, User, TailorProfile, TailoringRequest } from '../types';

class ApiService {
  private api: any;

  constructor() {
    // Use your computer's IP address instead of localhost
    // Replace with your actual IP address
    this.api = axios.create({
      baseURL: 'http://192.168.1.132:8000/api',
      timeout: 10000,
      
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config: any) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: any) => {
        return response;
      },
      async (error: any) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and redirect to login
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/login/', { email, password });
    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    is_tailor?: boolean;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/register/', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/users/profile/');
    return response.data;
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put('/users/profile/', profileData);
    return response.data;
  }

  // Tailor endpoints
  async getTailors(): Promise<ApiResponse<TailorProfile[]>> {
    const response = await this.api.get('/tailors/');
    return response.data;
  }

  async getNearbyTailors(lat: number, lng: number, radius: number = 10): Promise<ApiResponse<TailorProfile[]>> {
    const response = await this.api.get(`/shops/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data;
  }

  async getTailorProfile(tailorId: string): Promise<ApiResponse<TailorProfile>> {
    const response = await this.api.get(`/tailors/${tailorId}/`);
    return response.data;
  }

  // Request endpoints
  async createRequest(requestData: {
    service_type: string;
    description: string;
    measurements: any[];
    photos: string[];
    tailor_id?: string;
  }): Promise<ApiResponse<TailoringRequest>> {
    const response = await this.api.post('/requests/', requestData);
    return response.data;
  }

  async getMyRequests(): Promise<ApiResponse<TailoringRequest[]>> {
    const response = await this.api.get('/requests/my/');
    return response.data;
  }

  async getTailorRequests(): Promise<ApiResponse<TailoringRequest[]>> {
    const response = await this.api.get('/tailors/requests/');
    return response.data;
  }

  async getRequest(requestId: string): Promise<ApiResponse<TailoringRequest>> {
    const response = await this.api.get(`/requests/${requestId}/`);
    return response.data;
  }

  async updateRequest(requestId: string, requestData: Partial<TailoringRequest>): Promise<ApiResponse<TailoringRequest>> {
    const response = await this.api.put(`/requests/${requestId}/`, requestData);
    return response.data;
  }

  // Chat endpoints
  async getChatMessages(requestId: string): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/requests/${requestId}/messages/`);
    return response.data;
  }

  async sendMessage(requestId: string, message: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/requests/${requestId}/messages/`, { message });
    return response.data;
  }
}

export default new ApiService();
