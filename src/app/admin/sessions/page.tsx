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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const aiDataSessions = sessions.filter((s) => s.stage_id === STAGES.AI_DATA.id);
  const softdevSessions = sessions.filter((s) => s.stage_id === STAGES.SOFTDEV_CYBER.id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 py-4 px-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">Sprava prednasok</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Grid by Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI & Data Stage */}
          <div>
            <h2 className="text-lg font-semibold mb-4 px-4 py-2.5 rounded-xl inline-block bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {STAGES.AI_DATA.name}
            </h2>
            <div className="space-y-3">
              {aiDataSessions.map((session) => (
                <SessionRow key={session.id} session={session} stageColor="orange" />
              ))}
            </div>
          </div>

          {/* SoftDev Stage */}
          <div>
            <h2 className="text-lg font-semibold mb-4 px-4 py-2.5 rounded-xl inline-block bg-red-500/20 text-red-400 border border-red-500/30">
              {STAGES.SOFTDEV_CYBER.name}
            </h2>
            <div className="space-y-3">
              {softdevSessions.map((session) => (
                <SessionRow key={session.id} session={session} stageColor="red" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SessionRow({ session, stageColor }: { session: Session & { registered_count: number }; stageColor: 'orange' | 'red' }) {
  const slot = TIME_SLOTS[session.slot_index];
  const accentColor = stageColor === 'orange' ? 'from-orange-500 to-orange-600' : 'from-red-500 to-red-600';

  return (
    <Link
      href={`/admin/sessions/${session.id}`}
      className="card card-hover block relative overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accentColor}`}></div>
      <div className="pl-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            {slot.start} - {slot.end}
          </div>
          <h3 className="font-medium text-white">{session.title}</h3>
          <p className="text-sm text-slate-400">
            {session.speaker_name}
            {session.speaker_company && <span className="text-slate-500"> · {session.speaker_company}</span>}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            <span className={session.registered_count >= session.capacity ? 'text-red-400' : 'text-white'}>
              {session.registered_count}
            </span>
            <span className="text-slate-500">/{session.capacity}</span>
          </div>
          <div className="text-xs text-slate-500">registracii</div>
        </div>
      </div>
    </Link>
  );
}
