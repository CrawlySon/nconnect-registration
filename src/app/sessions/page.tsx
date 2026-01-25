'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Clock, Users, CheckCircle2, AlertCircle,
  XCircle, Loader2, User, Building
} from 'lucide-react';
import { SessionWithStatus, Stage, Attendee, TimeSlot } from '@/types';

function SessionsContent() {
  const searchParams = useSearchParams();
  const attendeeId = searchParams.get('attendee');

  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSessionId, setSavingSessionId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  }, [attendeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRegistration = async (sessionId: number, currentlyRegistered: boolean) => {
    setSavingSessionId(sessionId);

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId,
          sessionId,
          register: !currentlyRegistered,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      await loadData(); // Reload to get updated counts and conflict states
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Operácia zlyhala', 'error');
    } finally {
      setSavingSessionId(null);
    }
  };

  if (!attendeeId) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Chýba identifikácia</h1>
          <p className="text-nconnect-muted mb-4">Pre prístup k tejto stránke sa musíš najprv zaregistrovať.</p>
          <a href="/" className="btn-primary inline-flex items-center">
            Zaregistrovať sa
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
          <a href="/" className="btn-primary inline-flex items-center">
            Späť na úvod
          </a>
        </div>
      </div>
    );
  }

  // Group sessions by slot_index
  const sessionsBySlot: Record<number, SessionWithStatus[]> = {};
  sessions.forEach(session => {
    if (!sessionsBySlot[session.slot_index]) {
      sessionsBySlot[session.slot_index] = [];
    }
    sessionsBySlot[session.slot_index].push(session);
  });

  // Sort stages for consistent column order
  const sortedStages = [...stages].sort((a, b) => a.id.localeCompare(b.id));

  const registeredSessions = sessions.filter(s => s.is_registered);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <p className="text-white">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Výber prednášok
        </h1>
        <p className="text-nconnect-muted">
          Vyber si jednu prednášku z každého časového bloku. Zmeny sa ukladajú okamžite.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Stage headers */}
          <div className="grid grid-cols-[120px_1fr_1fr] gap-4 mb-2">
            <div></div>
            {sortedStages.map(stage => (
              <div key={stage.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-medium text-white">{stage.name}</span>
              </div>
            ))}
          </div>

          {/* Time slots with sessions */}
          {timeSlots.map((slot) => {
            const slotSessions = sessionsBySlot[slot.index] || [];
            // Sort by stage_id for consistent column order
            slotSessions.sort((a, b) => a.stage_id.localeCompare(b.stage_id));

            return (
              <div key={slot.index} className="grid grid-cols-[120px_1fr_1fr] gap-4">
                {/* Time label */}
                <div className="flex items-start pt-4">
                  <div className="flex items-center gap-2 bg-nconnect-surface px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4 text-nconnect-accent" />
                    <div className="text-sm">
                      <div className="font-medium text-white">{slot.start}</div>
                      <div className="text-nconnect-muted">{slot.end}</div>
                    </div>
                  </div>
                </div>

                {/* Sessions for each stage */}
                {sortedStages.map(stage => {
                  const session = slotSessions.find(s => s.stage_id === stage.id);
                  if (!session) return <div key={stage.id}></div>;

                  const isSaving = savingSessionId === session.id;
                  const canRegister = !session.is_full && !session.has_conflict;

                  let cardClass = 'session-card';
                  if (session.is_registered) cardClass += ' registered';
                  else if (session.is_full) cardClass += ' full';
                  else if (session.has_conflict) cardClass += ' conflict';

                  return (
                    <div key={session.id} className={cardClass}>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="stage-badge text-xs"
                          style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                        >
                          {stage.name}
                        </span>

                        {session.is_registered && (
                          <span className="flex items-center gap-1 text-green-400 text-xs">
                            <CheckCircle2 className="w-3 h-3" />Prihlásený
                          </span>
                        )}
                        {!session.is_registered && session.is_full && (
                          <span className="flex items-center gap-1 text-red-400 text-xs">
                            <XCircle className="w-3 h-3" />Plné
                          </span>
                        )}
                        {!session.is_registered && !session.is_full && session.has_conflict && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs">
                            <AlertCircle className="w-3 h-3" />Konflikt
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
                        {session.title}
                      </h3>

                      <div className="flex items-center gap-1 text-nconnect-muted text-sm mb-2">
                        <User className="w-3 h-3" />
                        <span>{session.speaker_name}</span>
                        {session.speaker_company && (
                          <>
                            <span>•</span>
                            <span>{session.speaker_company}</span>
                          </>
                        )}
                      </div>

                      {session.description && (
                        <p className="text-nconnect-muted text-xs mb-3 line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-nconnect-muted flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Kapacita
                          </span>
                          <span className="text-white">{session.registered_count}/{session.capacity}</span>
                        </div>
                        <div className="capacity-bar">
                          <div
                            className={`capacity-fill ${session.is_full ? 'full' : session.registered_count >= session.capacity * 0.8 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(100, (session.registered_count / session.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRegistration(session.id, session.is_registered)}
                        disabled={(!session.is_registered && !canRegister) || isSaving}
                        className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                          session.is_registered
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                            : canRegister
                              ? 'bg-nconnect-accent/10 text-nconnect-accent border border-nconnect-accent/30 hover:bg-nconnect-accent/20'
                              : 'bg-nconnect-secondary/20 text-nconnect-muted cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : session.is_registered ? (
                          'Odhlásiť sa'
                        ) : canRegister ? (
                          'Prihlásiť sa'
                        ) : session.is_full ? (
                          'Plná kapacita'
                        ) : (
                          'Časový konflikt'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {attendee && (
              <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3">Tvoj profil</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-nconnect-muted">
                    <User className="w-4 h-4" /><span>{attendee.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-nconnect-muted">
                    <span className="w-4 h-4 flex items-center justify-center">@</span>
                    <span>{attendee.email}</span>
                  </div>
                  {attendee.company && (
                    <div className="flex items-center gap-2 text-nconnect-muted">
                      <Building className="w-4 h-4" /><span>{attendee.company}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">
                Tvoje prednášky ({registeredSessions.length}/7)
              </h3>

              {registeredSessions.length === 0 ? (
                <p className="text-nconnect-muted text-sm">Zatiaľ nemáš vybrané žiadne prednášky.</p>
              ) : (
                <div className="space-y-3">
                  {registeredSessions
                    .sort((a, b) => a.slot_index - b.slot_index)
                    .map(session => {
                      const stage = stages.find(s => s.id === session.stage_id);
                      const slot = timeSlots[session.slot_index];
                      return (
                        <div key={session.id} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>{slot?.start}</span>
                            <span>•</span>
                            <span style={{ color: stage?.color }}>{stage?.name}</span>
                          </div>
                          <p className="text-white text-sm font-medium line-clamp-2">{session.title}</p>
                          <p className="text-nconnect-muted text-xs mt-1">{session.speaker_name}</p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-nconnect-accent/5 border border-nconnect-accent/20 rounded-xl p-5">
              <h4 className="font-medium text-nconnect-accent mb-2">💡 Tip</h4>
              <p className="text-nconnect-muted text-sm">
                V každom časovom bloku môžeš mať prihlásenú len jednu prednášku.
                Zmeny sa ukladajú automaticky.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    }>
      <SessionsContent />
    </Suspense>
  );
}
