// User Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  profile_picture?: string;
  is_tailor: boolean;
  created_at: string;
  updated_at: string;
}

// Tailor Types
export interface TailorProfile {
  id: string;
  user: User;
  bio?: string;
  specialties: string[];
  experience_years: number;
  store_name?: string;
  store_address?: string;
  store_picture?: string;
  portfolio_photos: string[];
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Request Types
export interface TailoringRequest {
  id: string;
  customer: User;
  tailor?: TailorProfile;
  service_type: string;
  description: string;
  measurements: Measurement[];
  photos: string[];
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  estimated_completion_date?: string;
  actual_completion_date?: string;
  price?: number;
  created_at: string;
  updated_at: string;
}

// Measurement Types
export interface Measurement {
  id: string;
  name: string;
  value: number;
  unit: 'cm' | 'inches';
  body_part: string;
}

// Review Types
export interface Review {
  id: string;
  customer: User;
  tailor: TailorProfile;
  request: TailoringRequest;
  rating: number;
  comment: string;
  created_at: string;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  TailorDashboard: undefined;
  UserDashboard: undefined;
  CreateRequest: undefined;
  TailorRequests: undefined;
  Profile: undefined;
  Settings: undefined;
  Chat: { requestId: string };
  MapView: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}
