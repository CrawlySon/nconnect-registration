'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Clock, Users, CheckCircle2, AlertCircle, 
  XCircle, Loader2, User, Building
} from 'lucide-react';
import { SessionWithAvailability, Stage, Attendee } from '@/types';

function SessionsContent() {
  const searchParams = useSearchParams();
  const attendeeId = searchParams.get('attendee');
  
  const [sessions, setSessions] = useState<SessionWithAvailability[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
      setAttendee(data.attendee);
      setRegisteredIds(data.registeredIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  }, [attendeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRegistration = async (sessionId: string, isCurrentlyRegistered: boolean) => {
    setActionLoading(sessionId);
    
    try {
      const response = await fetch('/api/registrations', {
        method: isCurrentlyRegistered ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, sessionId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      await loadData();
      
      const session = sessions.find(s => s.id === sessionId);
      showToast(
        isCurrentlyRegistered 
          ? `Odhlásený z "${session?.title}"` 
          : `Prihlásený na "${session?.title}"`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Akcia zlyhala', 'error');
    } finally {
      setActionLoading(null);
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
          Vyber si prednášky, ktoré chceš navštíviť.
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
                  <span className="font-medium text-white">
                    {slot.start_time} - {slot.end_time}
                  </span>
                </div>
                <div className="flex-1 h-px bg-nconnect-secondary/30" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {slot.sessions.map(session => {
                  const stage = stages.find(s => s.id === session.stage_id);
                  const isRegistered = registeredIds.includes(session.id);
                  const isActionLoading = actionLoading === session.id;
                  
                  let cardClass = 'session-card card-hover';
                  if (isRegistered) cardClass += ' registered';
                  else if (session.is_full) cardClass += ' full';
                  else if (session.has_conflict) cardClass += ' conflict';

                  const canRegister = !session.is_full && !session.has_conflict;

                  return (
                    <div key={session.id} className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <span 
                          className="stage-badge"
                          style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}
                        >
                          {stage?.name}
                        </span>
                        
                        {isRegistered && (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Prihlásený
                          </span>
                        )}
                        
                        {!isRegistered && session.is_full && (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <XCircle className="w-4 h-4" />
                            Plná kapacita
                          </span>
                        )}
                        
                        {!isRegistered && !session.is_full && session.has_conflict && (
                          <span className="flex items-center gap-1 text-yellow-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Časový konflikt
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                        {session.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-nconnect-muted text-sm mb-3">
                        <User className="w-4 h-4" />
                        <span>{session.speaker_name}</span>
                        {session.speaker_company && (
                          <>
                            <span>•</span>
                            <span>{session.speaker_company}</span>
                          </>
                        )}
                      </div>

                      {session.description && (
                        <p className="text-nconnect-muted text-sm mb-4 line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-nconnect-muted">Kapacita</span>
                          <span className="text-white">{session.registered_count}/{session.capacity}</span>
                        </div>
                        <div className="capacity-bar">
                          <div 
                            className={`capacity-fill ${
                              session.registered_count >= session.capacity ? 'full' 
                              : session.registered_count >= session.capacity * 0.8 ? 'warning' : ''
                            }`}
                            style={{ width: `${Math.min(100, (session.registered_count / session.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRegistration(session.id, isRegistered)}
                        disabled={isActionLoading || (!isRegistered && !canRegister)}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          isRegistered
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                            : canRegister
                              ? 'bg-nconnect-accent/10 text-nconnect-accent border border-nconnect-accent/30 hover:bg-nconnect-accent/20'
                              : 'bg-nconnect-secondary/20 text-nconnect-muted cursor-not-allowed'
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRegistered ? (
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
                    <User className="w-4 h-4" />
                    <span>{attendee.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-nconnect-muted">
                    <span className="w-4 h-4 flex items-center justify-center">@</span>
                    <span>{attendee.email}</span>
                  </div>
                  {attendee.company && (
                    <div className="flex items-center gap-2 text-nconnect-muted">
                      <Building className="w-4 h-4" />
                      <span>{attendee.company}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">
                Tvoje prednášky ({registeredSessions.length})
              </h3>
              
              {registeredSessions.length === 0 ? (
                <p className="text-nconnect-muted text-sm">
                  Zatiaľ nemáš vybrané žiadne prednášky.
                </p>
              ) : (
                <div className="space-y-3">
                  {registeredSessions
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map(session => {
                      const stage = stages.find(s => s.id === session.stage_id);
                      return (
                        <div key={session.id} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
                            <Clock className="w-3 h-3" />
                            <span>{session.start_time}</span>
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
                Po každej zmene ti príde potvrdenie na email.
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
