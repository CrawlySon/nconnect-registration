export interface Stage {
  id: string;
  name: string;
  color: string;
}

export interface Session {
  id: number;
  slot_index: number;
  stage_id: string;
  title: string;
  speaker_name: string;
  speaker_company?: string;
  description?: string;
  capacity: number;
  stage?: Stage;
}

export interface SessionWithStatus extends Session {
  is_registered: boolean;
  registered_count: number;
  is_full: boolean;
  has_conflict: boolean;
}

export interface Attendee {
  id: string;
  email: string;
  name: string;
  attendee_type: string;
  school_or_company?: string;
  created_at: string;
}

export interface AttendeeSession {
  attendee_id: string;
  session_id: number;
  is_registered: boolean;
  registered_at?: string;
}

export interface TimeSlot {
  index: number;
  start: string;
  end: string;
}
