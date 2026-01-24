import { Session, SessionWithAvailability } from '@/types';

/**
 * Checks if two sessions have a time conflict
 */
export function hasTimeConflict(session1: Session, session2: Session): boolean {
  // Sessions on different dates don't conflict
  if (session1.date !== session2.date) return false;
  
  // Convert times to minutes for easier comparison
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const start1 = toMinutes(session1.start_time);
  const end1 = toMinutes(session1.end_time);
  const start2 = toMinutes(session2.start_time);
  const end2 = toMinutes(session2.end_time);
  
  // Check for overlap: session1 starts before session2 ends AND session1 ends after session2 starts
  return start1 < end2 && end1 > start2;
}

/**
 * Finds all sessions that conflict with a given session
 */
export function findConflictingSessions(
  targetSession: Session,
  allSessions: Session[]
): Session[] {
  return allSessions.filter(
    session => session.id !== targetSession.id && hasTimeConflict(targetSession, session)
  );
}

/**
 * Checks if a session conflicts with any of the registered sessions
 */
export function conflictsWithRegistered(
  session: Session,
  registeredSessions: Session[]
): boolean {
  return registeredSessions.some(registered => hasTimeConflict(session, registered));
}

/**
 * Enriches sessions with availability info
 */
export function enrichSessionsWithAvailability(
  sessions: Session[],
  registeredSessionIds: string[]
): SessionWithAvailability[] {
  const registeredSessions = sessions.filter(s => registeredSessionIds.includes(s.id));
  
  return sessions.map(session => {
    const isFull = session.registered_count >= session.capacity;
    const isRegistered = registeredSessionIds.includes(session.id);
    const hasConflict = !isRegistered && conflictsWithRegistered(session, registeredSessions);
    
    return {
      ...session,
      is_full: isFull,
      available_spots: Math.max(0, session.capacity - session.registered_count),
      is_registered: isRegistered,
      has_conflict: hasConflict,
    };
  });
}

/**
 * Groups sessions by stage
 */
export function groupSessionsByStage(sessions: Session[]): Record<string, Session[]> {
  return sessions.reduce((acc, session) => {
    const stageId = session.stage_id;
    if (!acc[stageId]) {
      acc[stageId] = [];
    }
    acc[stageId].push(session);
    return acc;
  }, {} as Record<string, Session[]>);
}

/**
 * Sorts sessions by start time
 */
export function sortSessionsByTime(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => {
    // First sort by date
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    // Then by start time
    return a.start_time.localeCompare(b.start_time);
  });
}

/**
 * Formats time range for display
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}
