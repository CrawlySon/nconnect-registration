'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { TIME_SLOTS, STAGES } from '@/lib/constants';
import Link from 'next/link';

interface SessionWithCount extends Session {
  registered_count: number;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const aiDataSessions = sessions.filter((s) => s.stage_id === STAGES.AI_DATA.id);
  const softdevSessions = sessions.filter((s) => s.stage_id === STAGES.SOFTDEV_CYBER.id);

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <header className="bg-surface-light border-b border-gray-800 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition-colors">
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold">Sprava prednasok</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Grid by Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI & Data Stage */}
          <div>
            <h2
              className="text-lg font-semibold mb-4 px-4 py-2 rounded-lg inline-block"
              style={{ backgroundColor: STAGES.AI_DATA.color + '20', color: STAGES.AI_DATA.color }}
            >
              {STAGES.AI_DATA.name}
            </h2>
            <div className="space-y-3">
              {aiDataSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </div>

          {/* SoftDev Stage */}
          <div>
            <h2
              className="text-lg font-semibold mb-4 px-4 py-2 rounded-lg inline-block"
              style={{ backgroundColor: STAGES.SOFTDEV_CYBER.color + '20', color: STAGES.SOFTDEV_CYBER.color }}
            >
              {STAGES.SOFTDEV_CYBER.name}
            </h2>
            <div className="space-y-3">
              {softdevSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SessionRow({ session }: { session: Session & { registered_count: number } }) {
  const slot = TIME_SLOTS[session.slot_index];

  return (
    <Link
      href={`/admin/sessions/${session.id}`}
      className="card block hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">
            {slot.start} - {slot.end}
          </div>
          <h3 className="font-medium text-white">{session.title}</h3>
          <p className="text-sm text-gray-400">
            {session.speaker_name}
            {session.speaker_company && ` - ${session.speaker_company}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            <span className={session.registered_count >= session.capacity ? 'text-red-400' : 'text-white'}>
              {session.registered_count}
            </span>
            <span className="text-gray-500">/{session.capacity}</span>
          </div>
          <div className="text-xs text-gray-500">registracii</div>
        </div>
      </div>
    </Link>
  );
}
