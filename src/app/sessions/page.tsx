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
      const res = await fetch(`/api/sessions?attendee=${attendeeId}`);
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
      <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-4">Chyba</h1>
          <p className="text-gray-400 mb-6">Chyba identifikacie ucastnika.</p>
          <a href="/" className="btn-primary inline-block">
            Spat na registraciu
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Nacitavam prednasky...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Chyba</h1>
          <p className="text-gray-400 mb-6">{error}</p>
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
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <header className="bg-surface-light border-b border-gray-800 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-primary">nConnect</span>
                <span className="text-ai-stage">26</span>
                <span className="text-gray-400 text-lg ml-2">- Vyber prednasok</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">{CONFERENCE.DATE_DISPLAY} | {CONFERENCE.VENUE}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                Vybranych: <span className="text-white font-semibold">{registeredCount}</span> / 7
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Schedule Grid */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Stage Headers */}
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4 mb-4">
          <div></div>
          <div className="text-center">
            <span
              className="inline-block px-4 py-2 rounded-full font-semibold"
              style={{ backgroundColor: STAGES.AI_DATA.color + '20', color: STAGES.AI_DATA.color }}
            >
              {STAGES.AI_DATA.name}
            </span>
          </div>
          <div className="text-center">
            <span
              className="inline-block px-4 py-2 rounded-full font-semibold"
              style={{ backgroundColor: STAGES.SOFTDEV_CYBER.color + '20', color: STAGES.SOFTDEV_CYBER.color }}
            >
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
              <div className="flex items-center justify-center md:justify-end">
                <div className="text-center md:text-right">
                  <div className="text-white font-medium">{slot.start}</div>
                  <div className="text-gray-500 text-sm">{slot.end}</div>
                </div>
              </div>

              {/* AI & Data Session */}
              {aiSession && (
                <SessionCard
                  session={aiSession}
                  onToggle={() => handleToggleRegistration(aiSession.id, aiSession.is_registered)}
                  isLoading={actionLoading === aiSession.id}
                />
              )}

              {/* SoftDev Session */}
              {softdevSession && (
                <SessionCard
                  session={softdevSession}
                  onToggle={() => handleToggleRegistration(softdevSession.id, softdevSession.is_registered)}
                  isLoading={actionLoading === softdevSession.id}
                />
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500"></div>
            <span>Registrovany</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500"></div>
            <span>Konflikt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500"></div>
            <span>Plne</span>
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
}: {
  session: SessionWithStatus;
  onToggle: () => void;
  isLoading: boolean;
}) {
  const stageColor = session.stage?.color || '#666';

  let borderColor = 'border-gray-700';
  let bgColor = 'bg-surface-light';

  if (session.is_registered) {
    borderColor = 'border-green-500';
    bgColor = 'bg-green-500/10';
  } else if (session.has_conflict) {
    borderColor = 'border-yellow-500';
    bgColor = 'bg-yellow-500/5';
  } else if (session.is_full) {
    borderColor = 'border-red-500';
    bgColor = 'bg-red-500/5';
  }

  const isDisabled = isLoading || (!session.is_registered && (session.is_full || session.has_conflict));

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-xl p-4 transition-all`}
      style={{ borderLeftWidth: '4px', borderLeftColor: stageColor }}
    >
      <div className="flex flex-col h-full">
        <h3 className="font-semibold text-white mb-1">{session.title}</h3>
        <p className="text-sm text-gray-400 mb-2">
          {session.speaker_name}
          {session.speaker_company && ` - ${session.speaker_company}`}
        </p>

        {session.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{session.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {session.registered_count}/{session.capacity} miest
          </span>

          <button
            onClick={onToggle}
            disabled={isDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              session.is_registered
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : session.is_full
                ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                : session.has_conflict
                ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                : 'bg-primary/20 text-primary hover:bg-primary/30'
            }`}
          >
            {isLoading ? (
              '...'
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
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Nacitavam...</p>
        </div>
      </div>
    }>
      <SessionsContent />
    </Suspense>
  );
}
