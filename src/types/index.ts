// Database types for nConnect Registration System

export interface Stage {
  id: string;
  name: string;
  description?: string;
  color: string;
}

// Fixed session (14 total, IDs 1-14)
export interface Session {
  id: number;
  slot_index: number;  // 0-6
  stage_id: string;
  stage?: Stage;
  title: string;
  speaker_name: string;
  speaker_company?: string;
  description?: string;
  capacity: number;
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

// Attendee's registration status for a session
export interface AttendeeSession {
  attendee_id: string;
  session_id: number;
  is_registered: boolean;
  registered_at?: string;
}

// Session with registration info for display
export interface SessionWithStatus extends Session {
  is_registered: boolean;
  registered_count: number;  // Computed from attendee_sessions
  is_full: boolean;
  has_conflict: boolean;  // Same slot_index already registered
}

// Form types
export interface RegistrationFormData {
  email: string;
  name: string;
  company?: string;
  phone?: string;
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

// Time slot type
export interface TimeSlot {
  index: number;
  start: string;
  end: string;
}
