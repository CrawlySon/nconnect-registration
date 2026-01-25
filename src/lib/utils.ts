import { Session, SessionWithStatus } from '@/types';

/**
 * Checks if two sessions have a time conflict (same slot_index)
 */
export function hasTimeConflict(session1: Session, session2: Session): boolean {
  return session1.slot_index === session2.slot_index;
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
 * Sorts sessions by slot_index
 */
export function sortSessionsByTime(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => a.slot_index - b.slot_index);
}

/**
 * Formats time to HH:MM format (removes seconds if present)
 */
export function formatTime(time: string): string {
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
}

/**
 * Formats time range for display
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
