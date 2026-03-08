// Database types for nConnect Registration System

export interface Stage {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  speaker_name: string;
  speaker_company?: string;
  description?: string;
  stage_id: string;
  stage?: Stage;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  registered_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  attendee_id: string;
  session_id: string;
  registered_at: string;
  attendee?: Attendee;
  session?: Session;
}

export interface SessionFeedback {
  id: string;
  attendee_id: string;
  session_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}

// Form types
export interface RegistrationFormData {
  email: string;
  name: string;
  company?: string;
  phone?: string;
}

export interface SessionWithAvailability extends Session {
  is_full: boolean;
  available_spots: number;
  is_registered?: boolean;
  has_conflict?: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Email types
export interface EmailData {
  to: string;
  subject: string;
  attendeeName: string;
  sessions?: Session[];
  actionType: 'registration' | 'session_added' | 'session_removed' | 'update';
}
