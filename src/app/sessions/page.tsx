'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Clock, Users, CheckCircle2, AlertCircle, 
  XCircle, Loader2, User, Building, Send
} from 'lucide-react';
import { SessionWithAvailability, Stage, Attendee } from '@/types';
import { formatTime } from '@/lib/utils';

function SessionsContent() {
  const searchParams = useSearchParams();
  const attendeeId = searchParams.get('attendee');
  
  const [sessions, setSessions] = useState<SessionWithAvailability[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [originalRegisteredIds, setOriginalRegisteredIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const hasChanges = JSON.stringify([...registeredIds].sort()) !== JSON.stringify([...originalRegisteredIds].sort());

  const loadData = useCallback(async () => {
    if (!attendeeId) return;

    try {
      console.log('[SESSIONS PAGE] Loading data for attendee:', attendeeId);
      const response = await fetch(`/api/sessions?attendee=${attendeeId}`);
      const data = await response.json();

      console.log('[SESSIONS PAGE] API response:', {
        success: data.success,
        attendee: data.attendee?.email,
        sessionsCount: data.sessions?.length,
        registeredIds: data.registeredIds,
        registeredCount: data.registeredIds?.length
      });

      if (!response.ok) throw new Error(data.error);

      setSessions(data.sessions);
      setStages(data.stages);
      setAttendee(data.attendee);
      setRegisteredIds(data.registeredIds || []);
      setOriginalRegisteredIds(data.registeredIds || []);
    } catch (err) {
      console.error('[SESSIONS PAGE] Error:', err);
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  }, [attendeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasConflict = (session: SessionWithAvailability): boolean => {
    if (registeredIds.includes(session.id)) return false;
    
    const registeredSessions = sessions.filter(s => registeredIds.includes(s.id));
    return registeredSessions.some(registered => {
      if (session.date !== registered.date) return false;
      const toMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      const start1 = toMinutes(session.start_time);
      const end1 = toMinutes(session.end_time);
      const start2 = toMinutes(registered.start_time);
      const end2 = toMinutes(registered.end_time);
      return start1 < end2 && end1 > start2;
    });
  };

  const getDisplayedCount = (session: SessionWithAvailability): number => {
    const wasRegistered = originalRegisteredIds.includes(session.id);
    const isNowRegistered = registeredIds.includes(session.id);
    
    if (wasRegistered && !isNowRegistered) {
      return Math.max(0, session.registered_count - 1);
    }
    if (!wasRegistered && isNowRegistered) {
      return session.registered_count + 1;
    }
    return session.registered_count;
  };

  const handleToggleRegistration = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const isCurrentlyRegistered = registeredIds.includes(sessionId);
    
    if (isCurrentlyRegistered) {
      setRegisteredIds(prev => prev.filter(id => id !== sessionId));
    } else {
      const displayedCount = getDisplayedCount(session);
      if (displayedCount >= session.capacity) {
        showToast('Prednáška je už plne obsadená', 'error');
        return;
      }
      
      if (hasConflict(session)) {
        showToast('Časový konflikt s inou prednáškou', 'error');
        return;
      }
      
      setRegisteredIds(prev => [...prev, sessionId]);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          attendeeId, 
          sessionIds: registeredIds,
          previousSessionIds: originalRegisteredIds
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setOriginalRegisteredIds([...registeredIds]);
      await loadData();
      
      showToast('Zmeny boli uložené a email bol odoslaný', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Uloženie zlyhalo', 'error');
    } finally {
      setIsSaving(false);
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

  const sessionsByTime = sessions.reduce((acc, session) => {
    const key = `${session.date}-${session.start_time}`;
    if (!acc[key]) {
      acc[key] = { date: session.date, start_time: session.start_time, end_time: session.end_time, sessions: [] };
    }
    acc[key].sessions.push(session);
    return acc;
  }, {} as Record<string, { date: string; start_time: string; end_time: string; sessions: SessionWithAvailability[] }>);

  const timeSlots = Object.values(sessionsByTime).sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );

  const registeredSessions = sessions.filter(s => registeredIds.includes(s.id));

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
          Vyber si prednášky, ktoré chceš navštíviť. Po výbere klikni na "Potvrdiť zmeny".
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex flex-wrap gap-4 mb-6">
            {stages.map(stage => (
              <div key={stage.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm text-nconnect-muted">{stage.name}</span>
              </div>
            ))}
          </div>

          {timeSlots.map((slot) => (
            <div key={`${slot.date}-${slot.start_time}`} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-nconnect-surface px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-nconnect-accent" />
                  <span className="font-medium text-white">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                </div>
                <div className="flex-1 h-px bg-nconnect-secondary/30" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {slot.sessions
                  .sort((a, b) => {
                    // Sort by stage name: AI & Data Stage first (left), Soft Dev Stage second (right)
                    const stageA = stages.find(s => s.id === a.stage_id)?.name || '';
                    const stageB = stages.find(s => s.id === b.stage_id)?.name || '';
                    // AI & Data should come before Soft Dev alphabetically
                    return stageA.localeCompare(stageB);
                  })
                  .map(session => {
                  const isRegistered = registeredIds.includes(session.id);
                  const stage = stages.find(s => s.id === session.stage_id);
                  const displayedCount = getDisplayedCount(session);
                  const isFull = displayedCount >= session.capacity;
                  const sessionHasConflict = hasConflict(session);
                  
                  let cardClass = 'session-card card-hover';
                  if (isRegistered) cardClass += ' registered';
                  else if (isFull) cardClass += ' full';
                  else if (sessionHasConflict) cardClass += ' conflict';

                  const canRegister = !isFull && !sessionHasConflict;

                  return (
                    <div key={session.id} className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="stage-badge" style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}>
                          {stage?.name}
                        </span>
                        
                        {isRegistered && (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />Prihlásený
                          </span>
                        )}
                        {!isRegistered && isFull && (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <XCircle className="w-4 h-4" />Plná kapacita
                          </span>
                        )}
                        {!isRegistered && !isFull && sessionHasConflict && (
                          <span className="flex items-center gap-1 text-yellow-400 text-sm">
                            <AlertCircle className="w-4 h-4" />Časový konflikt
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{session.title}</h3>
                      
                      <div className="flex items-center gap-2 text-nconnect-muted text-sm mb-3">
                        <User className="w-4 h-4" />
                        <span>{session.speaker_name}</span>
                        {session.speaker_company && (<><span>•</span><span>{session.speaker_company}</span></>)}
                      </div>

                      {session.description && (
                        <p className="text-nconnect-muted text-sm mb-4 line-clamp-2">{session.description}</p>
                      )}

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-nconnect-muted">Kapacita</span>
                          <span className="text-white">{displayedCount}/{session.capacity}</span>
                        </div>
                        <div className="capacity-bar">
                          <div 
                            className={`capacity-fill ${displayedCount >= session.capacity ? 'full' : displayedCount >= session.capacity * 0.8 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(100, (displayedCount / session.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRegistration(session.id)}
                        disabled={!isRegistered && !canRegister}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          isRegistered
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                            : canRegister
                              ? 'bg-nconnect-accent/10 text-nconnect-accent border border-nconnect-accent/30 hover:bg-nconnect-accent/20'
                              : 'bg-nconnect-secondary/20 text-nconnect-muted cursor-not-allowed'
                        }`}
                      >
                        {isRegistered ? 'Odhlásiť sa' : canRegister ? 'Prihlásiť sa' : isFull ? 'Plná kapacita' : 'Časový konflikt'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

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
              <h3 className="font-semibold text-white mb-3">Tvoje prednášky ({registeredSessions.length})</h3>
              
              {registeredSessions.length === 0 ? (
                <p className="text-nconnect-muted text-sm">Zatiaľ nemáš vybrané žiadne prednášky.</p>
              ) : (
                <div className="space-y-3">
                  {registeredSessions.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(session => {
                    const stage = stages.find(s => s.id === session.stage_id);
                    return (
                      <div key={session.id} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(session.start_time)}</span>
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

              {hasChanges && (
                <button onClick={handleSaveChanges} disabled={isSaving} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                  {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" />Ukladám...</>) : (<><Send className="w-4 h-4" />Potvrdiť zmeny</>)}
                </button>
              )}
            </div>

            <div className="bg-nconnect-accent/5 border border-nconnect-accent/20 rounded-xl p-5">
              <h4 className="font-medium text-nconnect-accent mb-2">💡 Tip</h4>
              <p className="text-nconnect-muted text-sm">Po výbere prednášok klikni na "Potvrdiť zmeny". Až potom ti príde súhrnný email.</p>
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
