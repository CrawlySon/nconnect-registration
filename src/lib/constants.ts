export const CONFERENCE_DATE = '2026-03-26';
export const CONFERENCE_NAME = 'nConnect26';

export const CONFERENCE = {
  NAME: 'nConnect26',
  DATE: '2026-03-26',
  DATE_DISPLAY: '26. marca 2026',
  VENUE: 'Studentske centrum UKF Nitra',
  PARTNERS: ['GymBeam', 'Hra bez hranic', 'PowerPlay Studio'],
} as const;

export const TIME_SLOTS = [
  { index: 0, start: '09:00', end: '09:45' },
  { index: 1, start: '09:45', end: '10:30' },
  { index: 2, start: '10:30', end: '11:15' },
  { index: 3, start: '11:15', end: '12:00' },
  { index: 4, start: '13:00', end: '13:45' },
  { index: 5, start: '13:45', end: '14:30' },
  { index: 6, start: '14:30', end: '15:15' },
] as const;

export const STAGES = {
  AI_DATA: {
    id: 'ai-data',
    name: 'AI&Data Stage',
    color: '#FF6B35',
  },
  SOFTDEV_CYBER: {
    id: 'softdev-cyber',
    name: 'SoftDev&CyberSecurity Stage',
    color: '#EF4444',
  },
} as const;

export const ATTENDEE_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'employee', label: 'Zamestnanec' },
  { value: 'entrepreneur', label: 'Podnikatel' },
] as const;

export const PARTNERS = [
  { name: 'GymBeam', logo: '/partners/gymbeam.png' },
  { name: 'Hra bez hranic', logo: '/partners/hrabezhrinic.png' },
  { name: 'PowerPlay Studio', logo: '/partners/powerplay.png' },
] as const;

export const TOTAL_SESSIONS = 14;
export const TOTAL_SLOTS = 7;
