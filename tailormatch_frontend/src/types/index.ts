export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  phone: string;
  location_lat: number | null;
  location_lng: number | null;
  profile_photo: string | null;
  is_tailor: boolean;
  created_at: string;
}

export interface TailorProfile {
  id: number;
  user: User;
  shop_name: string;
  skills: string[];
  portfolio_photos: string[];
  store_picture: string | null;
  availability: Record<string, string>;
  pricing: Record<string, string>;
  bio: string;
  address: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  distance?: number;
}

export interface TailoringRequest {
  id: number;
  user: User;
  tailor: number; // This is the tailor ID (write-only field)
  tailor_details: TailorProfile; // This contains the full tailor information (read-only field)
  measurements: Record<string, any>;
  decrypted_measurements: Record<string, any>;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'ready_for_fitting' | 'completed' | 'cancelled';
  estimated_completion: string | null;
  cancellation_reason?: string;
  review?: Review;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Notification {
  id: number;
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'request_cancelled' | 'status_update' | 'message';
  title: string;
  message: string;
  is_read: boolean;
  related_request: number | null;
  created_at: string;
}

export interface Message {
  id: number;
  sender: User;
  message: string;
  created_at: string;
  is_read: boolean;
  read_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterData {
  username: string;
  email: string;
  name: string;
  phone: string;
  password: string;
  password_confirm: string;
  is_tailor: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LocationData {
  lat: number;
  lng: number;
}

export interface Measurements {
  height?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder_width?: number;
  arm_length?: number;
  inseam?: number;
  [key: string]: any;
}

export interface WebSocketMessage {
  type: 'notification' | 'message' | 'status_update';
  notification?: {
    title: string;
    message: string;
  };
  data?: any;
}