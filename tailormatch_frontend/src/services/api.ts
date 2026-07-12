import axios from 'axios';
import { LoginData, RegisterData, LoginResponse, User, TailorProfile, TailoringRequest, Review, Notification, Message, LocationData, Measurements } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: RegisterData): Promise<LoginResponse> =>
    api.post('/auth/register/', data).then(res => res.data),
  
  login: (data: LoginData): Promise<LoginResponse> =>
    api.post('/auth/login/', data).then(res => res.data),
  
  logout: (): Promise<void> =>
    api.post('/auth/logout/').then(res => res.data),
  
  requestPasswordReset: (email: string): Promise<{ status: string; message: string }> =>
    api.post('/auth/password-reset-request/', { email }).then(res => res.data),
  
  confirmPasswordReset: (data: { email: string; token: string; new_password: string; new_password_confirm: string }): Promise<{ status: string; message: string }> =>
    api.post('/auth/password-reset-confirm/', data).then(res => res.data),
};

// User API
export const userAPI = {
  getProfile: (): Promise<User> =>
    api.get('/users/profile/').then(res => res.data),
  
  updateProfile: (data: Partial<User>): Promise<User> =>
    api.patch('/users/profile/', data).then(res => res.data),
  
  updateLocation: (data: LocationData): Promise<void> =>
    api.post('/users/location/', data).then(res => res.data),
  
  changePassword: (data: { old_password: string; new_password: string; new_password_confirm: string }): Promise<{ status: string; message: string }> =>
    api.post('/users/change-password/', data).then(res => res.data),
};

// Tailor API
export const tailorAPI = {
  getProfile: (): Promise<TailorProfile> =>
    api.get('/tailors/profile/').then(res => res.data),
  
  updateProfile: (data: Partial<TailorProfile>): Promise<TailorProfile> =>
    api.patch('/tailors/profile/', data).then(res => res.data),
  
  createProfile: (data: Partial<TailorProfile>): Promise<TailorProfile> =>
    api.post('/tailors/profile/create/', data).then(res => res.data),
  
  getRequests: (): Promise<TailoringRequest[]> =>
    api.get('/tailors/requests/').then(res => res.data.results || res.data),
  
  updateLocation: (lat: number, lng: number): Promise<{ status: string }> =>
    api.post('/users/location/', { lat, lng }).then(res => res.data),
  
  uploadPortfolioPhoto: (photo: File): Promise<{ message: string; photo_url: string; portfolio_photos: string[] }> => {
    const formData = new FormData();
    formData.append('photo', photo);
    return api.post('/tailors/portfolio/upload/', formData).then(res => res.data);
  },
  
  deletePortfolioPhoto: (photoIndex: number): Promise<{ message: string; portfolio_photos: string[] }> =>
    api.delete(`/tailors/portfolio/delete/${photoIndex}/`).then(res => res.data),
  
  uploadStorePicture: (storePicture: File): Promise<{ message: string; store_picture: string }> => {
    const formData = new FormData();
    formData.append('store_picture', storePicture);
    return api.post('/tailors/profile/store-picture/', formData).then(res => res.data);
  },
};

// Shops API
export const shopsAPI = {
  getNearby: (lat: number, lng: number, radius: number = 10): Promise<TailorProfile[]> =>
    api.get(`/shops/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`).then(res => res.data),
  
  getPortfolio: (tailorId: number): Promise<{ id: number; shop_name: string; portfolio_photos: string[] }> =>
    api.get(`/shops/${tailorId}/portfolio/`).then(res => res.data),
};

// Requests API
export const requestsAPI = {
  create: (data: { measurements: Measurements; notes: string; tailor: number }): Promise<TailoringRequest> =>
    api.post('/requests/create/', data).then(res => res.data),
  
  getMy: (): Promise<TailoringRequest[]> =>
    api.get('/requests/my/').then(res => res.data.results || res.data),
  
  getById: (id: number): Promise<TailoringRequest> =>
    api.get(`/requests/${id}/`).then(res => res.data),
  
  updateStatus: (id: number, data: { status: string; estimated_completion?: string }): Promise<TailoringRequest> =>
    api.patch(`/requests/${id}/update-status/`, data).then(res => res.data),
  
  cancel: (id: number, reason: string): Promise<TailoringRequest> =>
    api.patch(`/requests/${id}/cancel/`, { reason }).then(res => res.data),
  
  delete: (id: number, reason?: string): Promise<{ message: string; deleted_at: string; can_restore: boolean }> =>
    api.delete(`/requests/${id}/delete/`, { data: { reason } }).then(res => res.data),
  
  getMessages: (id: number): Promise<Message[]> =>
    api.get(`/requests/${id}/messages/`).then(res => res.data.results || res.data),
  
  // Deleted requests management
  getDeleted: (): Promise<{ deleted_requests: any[]; count: number }> =>
    api.get('/requests/deleted/').then(res => res.data),
  
  restore: (id: number): Promise<{ message: string; restored_at: string }> =>
    api.post(`/requests/${id}/restore/`).then(res => res.data),
  
  permanentDelete: (id: number): Promise<{ message: string }> =>
    api.delete(`/requests/${id}/permanent-delete/`).then(res => res.data),
};

// Reviews API
export const reviewsAPI = {
  create: (data: { request: number; rating: number; comment: string }): Promise<Review> =>
    api.post('/reviews/create/', data).then(res => res.data),
  getByTailor: (tailorId: number): Promise<Review[]> =>
    api.get(`/tailors/${tailorId}/reviews/`).then(res => {
      // Handle different response formats
      const data = res.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else {
        console.warn('Unexpected API response format:', data);
        return [];
      }
    }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (): Promise<Notification[]> =>
    api.get('/notifications/').then(res => res.data.results || res.data),
  
  markAsRead: (id: number): Promise<void> =>
    api.patch(`/notifications/${id}/read/`).then(res => res.data),
  
  delete: (id: number): Promise<{ message: string }> =>
    api.delete(`/notifications/${id}/delete/`).then(res => res.data),
  
  clearAll: (): Promise<{ message: string }> =>
    api.delete('/notifications/clear-all/').then(res => res.data),
};

// Messages API
export const messagesAPI = {
  getByRequest: (requestId: number): Promise<Message[]> =>
    api.get(`/requests/${requestId}/messages/`).then(res => res.data.results || res.data),
  
  send: (requestId: number, message: string): Promise<Message> =>
    api.post(`/requests/${requestId}/messages/`, { message }).then(res => res.data),
};

export default api;