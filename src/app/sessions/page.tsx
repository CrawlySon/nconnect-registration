'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SessionWithStatus } from '@/types';
import { TIME_SLOTS, STAGES, CONFERENCE } from '@/lib/constants';

function SessionsContent() {
  const searchParams = useSearchParams();
  const attendeeId = searchParams.get('attendee');

  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!attendeeId) return;

    try {
      // Add timestamp to bypass any caching
      const res = await fetch(`/api/sessions?attendee=${attendeeId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Nepodarilo sa nacitat prednasky');
      }

      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieco sa pokazilo');
    } finally {
      setLoading(false);
    }
  }, [attendeeId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleToggleRegistration = async (sessionId: number, currentlyRegistered: boolean) => {
    setActionLoading(sessionId);

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId,
          sessionId,
          register: !currentlyRegistered,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Akcia zlyhala');
      }

      await fetchSessions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Nieco sa pokazilo');
    } finally {
      setActionLoading(null);
    }
  };

  if (!attendeeId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-white">Chyba</h1>
          <p className="text-slate-400 mb-6">Chyba identifikacie ucastnika.</p>
          <a href="/" className="btn-primary inline-block">
            Spat na registraciu
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Nacitavam prednasky...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Chyba</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Skusit znova
          </button>
        </div>
      </div>
    );
  }

  const aiDataSessions = sessions.filter((s) => s.stage_id === STAGES.AI_DATA.id);
  const softdevSessions = sessions.filter((s) => s.stage_id === STAGES.SOFTDEV_CYBER.id);

  const registeredCount = sessions.filter((s) => s.is_registered).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 py-6 px-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-white">n</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">Connect</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">26</span>
                <span className="text-slate-400 text-lg ml-3 font-normal">Vyber prednasok</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">{CONFERENCE.DATE_DISPLAY} · {CONFERENCE.VENUE}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="card px-4 py-2">
                <span className="text-slate-400 text-sm">Vybranych: </span>
                <span className="text-white font-bold">{registeredCount}</span>
                <span className="text-slate-500"> / 7</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Schedule Grid */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Stage Headers */}
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4 mb-6">
          <div></div>
          <div className="text-center">
            <span className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {STAGES.AI_DATA.name}
            </span>
          </div>
          <div className="text-center">
            <span className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-500/20 text-red-400 border border-red-500/30">
              {STAGES.SOFTDEV_CYBER.name}
            </span>
          </div>
        </div>

        {/* Time Slots */}
        {TIME_SLOTS.map((slot) => {
          const aiSession = aiDataSessions.find((s) => s.slot_index === slot.index);
          const softdevSession = softdevSessions.find((s) => s.slot_index === slot.index);

          return (
            <div key={slot.index} className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4 mb-4">
              {/* Time */}
              <div className="flex items-center justify-center md:justify-end pr-4">
                <div className="text-center md:text-right">
                  <div className="text-white font-semibold">{slot.start}</div>
                  <div className="text-slate-500 text-sm">{slot.end}</div>
                </div>
              </div>

              {/* AI & Data Session */}
              {aiSession && (
                <SessionCard
                  session={aiSession}
                  onToggle={() => handleToggleRegistration(aiSession.id, aiSession.is_registered)}
                  isLoading={actionLoading === aiSession.id}
                  stageColor="orange"
                />
              )}

              {/* SoftDev Session */}
              {softdevSession && (
                <SessionCard
                  session={softdevSession}
                  onToggle={() => handleToggleRegistration(softdevSession.id, softdevSession.is_registered)}
                  isLoading={actionLoading === softdevSession.id}
                  stageColor="red"
                />
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/50"></div>
            <span className="text-slate-400">Prihlaseny</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-500/20 border border-amber-500/50"></div>
            <span className="text-slate-400">Casovy konflikt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-red-500/20 border border-red-500/50"></div>
            <span className="text-slate-400">Plna kapacita</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function SessionCard({
  session,
  onToggle,
  isLoading,
  stageColor,
}: {
  session: SessionWithStatus;
  onToggle: () => void;
  isLoading: boolean;
  stageColor: 'orange' | 'red';
}) {
  let cardClass = 'card card-hover';
  let borderClass = '';

  if (session.is_registered) {
    cardClass = 'card';
    borderClass = 'border-emerald-500/50 bg-emerald-500/10';
  } else if (session.has_conflict) {
    cardClass = 'card opacity-60';
    borderClass = 'border-amber-500/30';
  } else if (session.is_full) {
    cardClass = 'card opacity-60';
    borderClass = 'border-red-500/30';
  }

  const isDisabled = isLoading || (!session.is_registered && (session.is_full || session.has_conflict));

  const accentColor = stageColor === 'orange' ? 'from-orange-500 to-orange-600' : 'from-red-500 to-red-600';

  return (
    <div className={`${cardClass} ${borderClass} relative overflow-hidden`}>
      {/* Stage accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accentColor}`}></div>

      <div className="pl-3">
        <h3 className="font-semibold text-white mb-1">{session.title}</h3>
        <p className="text-sm text-slate-400 mb-3">
          {session.speaker_name}
          {session.speaker_company && (
            <span className="text-slate-500"> · {session.speaker_company}</span>
          )}
        </p>

        {session.description && (
          <p className="text-xs text-slate-500 mb-4 line-clamp-2">{session.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto">
          {/* Capacity bar */}
          <div className="flex-1 mr-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Kapacita</span>
              <span>{session.registered_count}/{session.capacity}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  session.registered_count >= session.capacity
                    ? 'bg-red-500'
                    : session.registered_count > session.capacity * 0.8
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (session.registered_count / session.capacity) * 100)}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={onToggle}
            disabled={isDisabled}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              session.is_registered
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : session.is_full
                ? 'bg-red-500/10 text-red-400/60 cursor-not-allowed'
                : session.has_conflict
                ? 'bg-amber-500/10 text-amber-400/60 cursor-not-allowed'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
            ) : session.is_registered ? (
              'Odhlasit'
            ) : session.is_full ? (
              'Plne'
            ) : session.has_conflict ? (
              'Konflikt'
            ) : (
              'Prihlasit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Nacitavam...</p>
        </div>
      </div>
    }>
      <SessionsContent />
    </Suspense>
  );
}
