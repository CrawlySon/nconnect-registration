// Fixed time slots for nConnect26 conference
export const TIME_SLOTS = [
  { index: 0, start: '09:00', end: '09:45' },
  { index: 1, start: '09:45', end: '10:30' },
  { index: 2, start: '10:30', end: '11:15' },
  { index: 3, start: '11:15', end: '12:00' },
  { index: 4, start: '13:00', end: '13:45' },
  { index: 5, start: '13:45', end: '14:30' },
  { index: 6, start: '14:30', end: '15:15' },
] as const;

// Fixed stages
export const STAGES = {
  AI_DATA: {
    id: 'ai-data-stage',
    name: 'AI & Data Stage',
    color: '#00D4FF',
  },
  SOFT_DEV: {
    id: 'soft-dev-stage',
    name: 'Soft Dev Stage',
    color: '#A855F7',
  },
} as const;

// Session ID mapping:
// Sessions 1-7: AI & Data Stage (slot_index 0-6)
// Sessions 8-14: Soft Dev Stage (slot_index 0-6)
export const getSessionId = (slotIndex: number, stageIndex: number): number => {
  return slotIndex + 1 + (stageIndex * 7);
};

export const getSlotFromSessionId = (sessionId: number): { slotIndex: number; stageIndex: number } => {
  if (sessionId <= 7) {
    return { slotIndex: sessionId - 1, stageIndex: 0 };
  }
  return { slotIndex: sessionId - 8, stageIndex: 1 };
};

export const CONFERENCE_DATE = '2026-03-26';

export const TOTAL_SESSIONS = 14;
