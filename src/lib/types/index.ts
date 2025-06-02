// User Profile Types
export interface UserProfile {
  username: string;
  public_key: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  lightning_address: string | null;
  relays: string[] | null;
  social_links: SocialLink[];
  created_at: string;
  updated_at: string;
  last_login: string;
  login_history: LoginHistory[];
  notification_settings: NotificationSettings;
  two_factor_enabled: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface LoginHistory {
  timestamp: string;
  ip_address: string;
  device: string;
  location: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  profile_updates: boolean;
  new_registrations: boolean;
  session_expiry: boolean;
  payment_received: boolean;
}

// Relay Types
export interface RelayInfo {
  url: string;
  status: 'online' | 'offline';
  response_time: number;
  last_checked: string;
  users_count: number;
}

// Lightning Types
export interface LightningPayment {
  id: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  sender: string;
  message: string;
}

// Statistics Types
export interface SystemStats {
  total_users: number;
  active_users: number;
  total_relays: number;
  active_relays: number;
  growth_rate: number;
  user_registration_timeline: {
    date: string;
    count: number;
  }[];
}

// Support Types
export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

// FAQ Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
} 