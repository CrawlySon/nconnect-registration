'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clock, User, Loader2, AlertCircle,
  XCircle, MapPin, Play, CheckCircle2
} from 'lucide-react';
import { SessionWithStatus, Stage, Attendee, TimeSlot } from '@/types';
import { CONFERENCE_DATE } from '@/lib/constants';

interface LiveSession extends SessionWithStatus {
  status: 'past' | 'current' | 'upcoming';
  time_slot: TimeSlot;
}

function LiveTimelineContent() {
  const searchParams = useSearchParams();
  const attendeeId = searchParams.get('attendee');
  const demoTime = searchParams.get('time');

  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(demoTime ? new Date(demoTime) : new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (demoTime) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [demoTime]);

  const loadData = useCallback(async () => {
    if (!attendeeId) return;

    try {
      const response = await fetch(`/api/sessions?attendee=${attendeeId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setSessions(data.sessions);
      setStages(data.stages);
      setTimeSlots(data.timeSlots);
      setAttendee(data.attendee);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa nacitat data');
    } finally {
      setIsLoading(false);
    }
  }, [attendeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSessionStatus = (session: SessionWithStatus, slot: TimeSlot): 'past' | 'current' | 'upcoming' => {
    const now = currentTime;
    const today = now.toISOString().split('T')[0];

    if (CONFERENCE_DATE !== today) {
      return CONFERENCE_DATE < today ? 'past' : 'upcoming';
    }

    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);

    const sessionStart = new Date(now);
    sessionStart.setHours(startHour, startMin, 0, 0);

    const sessionEnd = new Date(now);
    sessionEnd.setHours(endHour, endMin, 0, 0);

    if (now < sessionStart) return 'upcoming';
    if (now >= sessionEnd) return 'past';
    return 'current';
  };

  const getTimeProgress = (): number => {
    const now = currentTime;
    const registeredSessions = sessions.filter(s => s.is_registered);

    if (registeredSessions.length === 0 || timeSlots.length === 0) return 0;

    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];

    const [firstHour, firstMin] = firstSlot.start.split(':').map(Number);
    const [lastHour, lastMin] = lastSlot.end.split(':').map(Number);

    const dayStart = new Date(now);
    dayStart.setHours(firstHour, firstMin, 0, 0);

    const dayEnd = new Date(now);
    dayEnd.setHours(lastHour, lastMin, 0, 0);

    if (now < dayStart) return 0;
    if (now >= dayEnd) return 100;

    const totalMs = dayEnd.getTime() - dayStart.getTime();
    const elapsedMs = now.getTime() - dayStart.getTime();

    return Math.round((elapsedMs / totalMs) * 100);
  };

  if (!attendeeId) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Chyba identifikacie</h1>
          <p className="text-nconnect-muted mb-4">Pre pristup k tejto stranke sa musis najprv zaregistrovat.</p>
          <a href="/" className="btn-primary inline-flex items-center">
            Zaregistrovat sa
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Chyba</h1>
          <p className="text-nconnect-muted mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const registeredSessions: LiveSession[] = sessions
    .filter(s => s.is_registered)
    .map(s => {
      const slot = timeSlots[s.slot_index];
      return {
        ...s,
        status: getSessionStatus(s, slot),
        time_slot: slot,
      };
    })
    .sort((a, b) => a.slot_index - b.slot_index);

  const currentSession = registeredSessions.find(s => s.status === 'current');
  const upcomingSessions = registeredSessions.filter(s => s.status === 'upcoming');
  const pastSessions = registeredSessions.filter(s => s.status === 'past');

  const progress = getTimeProgress();

  return (
    <div className="glass-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {demoTime && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-center font-medium">
              Demo rezim - Simulovany cas: {currentTime.toLocaleString('sk-SK')}
            </p>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">LIVE</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            nConnect26
          </h1>
          <p className="text-nconnect-muted flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            Studentske centrum UKF Nitra
          </p>
        </div>

        {attendee && (
          <div className="glass-card mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-nconnect-accent/20 flex items-center justify-center">
                <User className="w-6 h-6 text-nconnect-accent" />
              </div>
              <div>
                <p className="text-white font-semibold">{attendee.name}</p>
                <p className="text-nconnect-muted text-sm">{attendee.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-nconnect-muted text-sm">Priebeh dna</span>
            <span className="text-white text-sm font-medium">{progress}%</span>
          </div>
          <div className="h-3 bg-nconnect-secondary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-nconnect-accent to-green-400 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-nconnect-muted text-xs mt-2 text-center">
            <Clock className="w-3 h-3 inline mr-1" />
            {currentTime.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {currentSession && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-green-400" />
              Prave teraz
            </h2>
            <div className="glass-card border-2 border-green-500/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-pulse" />
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${stages.find(s => s.id === currentSession.stage_id)?.color}20`,
                    color: stages.find(s => s.id === currentSession.stage_id)?.color
                  }}
                >
                  {stages.find(s => s.id === currentSession.stage_id)?.name}
                </span>
                <span className="text-nconnect-muted text-sm">
                  {currentSession.time_slot.start} - {currentSession.time_slot.end}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{currentSession.title}</h3>
              <p className="text-nconnect-accent">
                {currentSession.speaker_name}
                {currentSession.speaker_company && ` - ${currentSession.speaker_company}`}
              </p>
            </div>
          </div>
        )}

        {registeredSessions.length === 0 && (
          <div className="glass-card text-center py-12">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Ziadne prednasky</h3>
            <p className="text-nconnect-muted mb-4">Nemas ziadne registrovane prednasky.</p>
            <a href={`/sessions?attendee=${attendeeId}`} className="btn-primary inline-flex items-center">
              Vybrat prednasky
            </a>
          </div>
        )}

        {upcomingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-nconnect-accent" />
              Nasledujuce prednasky ({upcomingSessions.length})
            </h2>
            <div className="space-y-3">
              {upcomingSessions.map(session => {
                const stage = stages.find(s => s.id === session.stage_id);
                return (
                  <div key={session.id} className="glass-panel flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-white font-bold">{session.time_slot.start}</p>
                      <p className="text-nconnect-muted text-xs">{session.time_slot.end}</p>
                    </div>
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: stage?.color }}
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{session.title}</p>
                      <p className="text-nconnect-muted text-sm">{session.speaker_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pastSessions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-nconnect-muted mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Ukoncene prednasky ({pastSessions.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {pastSessions.map(session => {
                const stage = stages.find(s => s.id === session.stage_id);
                return (
                  <div key={session.id} className="glass-panel flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-nconnect-muted font-bold">{session.time_slot.start}</p>
                    </div>
                    <div
                      className="w-1 h-8 rounded-full opacity-50"
                      style={{ backgroundColor: stage?.color }}
                    />
                    <div className="flex-1">
                      <p className="text-nconnect-muted font-medium line-through">{session.title}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href={`/sessions?attendee=${attendeeId}`}
            className="text-nconnect-accent hover:underline text-sm"
          >
            Zmenit vyber prednasok →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    }>
      <LiveTimelineContent />
    </Suspense>
  );
}
