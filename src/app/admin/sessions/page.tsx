'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit2, Users, Clock,
  Loader2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { Session, Stage, TimeSlot } from '@/types';

interface SessionWithCount extends Session {
  registered_count: number;
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setSessions(data.sessions);
      setStages(data.stages);
      setTimeSlots(data.timeSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa nacitat data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  // Group sessions by slot_index
  const sessionsBySlot: Record<number, SessionWithCount[]> = {};
  sessions.forEach(session => {
    if (!sessionsBySlot[session.slot_index]) {
      sessionsBySlot[session.slot_index] = [];
    }
    sessionsBySlot[session.slot_index].push(session);
  });

  // Sort stages for consistent column order
  const sortedStages = [...stages].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 hover:bg-nconnect-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-nconnect-muted" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Spravaednasok
            </h1>
            <p className="text-nconnect-muted mt-1">
              14 fixnych prednasok (7 casovych slotov x 2 stages)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stage headers */}
      <div className="grid grid-cols-[120px_1fr_1fr] gap-4 mb-4">
        <div></div>
        {sortedStages.map(stage => (
          <div key={stage.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-sm font-medium text-white">{stage.name}</span>
          </div>
        ))}
      </div>

      {/* Sessions grid */}
      <div className="space-y-4">
        {timeSlots.map((slot) => {
          const slotSessions = sessionsBySlot[slot.index] || [];
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

                const fillPercent = (session.registered_count / session.capacity) * 100;

                return (
                  <div
                    key={session.id}
                    className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className="stage-badge text-xs"
                        style={{
                          backgroundColor: `${stage.color}20`,
                          color: stage.color
                        }}
                      >
                        ID: {session.id}
                      </span>

                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="p-2 hover:bg-nconnect-primary rounded-lg transition-colors"
                        title="Upravit"
                      >
                        <Edit2 className="w-4 h-4 text-nconnect-muted" />
                      </Link>
                    </div>

                    <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-nconnect-muted text-sm mb-3">
                      {session.speaker_name}
                      {session.speaker_company && ` - ${session.speaker_company}`}
                    </p>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-nconnect-muted" />
                      <span className={`${fillPercent >= 100 ? 'text-red-400' : fillPercent >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                        {session.registered_count}/{session.capacity}
                      </span>
                      <div className="flex-1">
                        <div className="capacity-bar">
                          <div
                            className={`capacity-fill ${fillPercent >= 100 ? 'full' : fillPercent >= 80 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(100, fillPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          <strong>Info:</strong> Prednask je 14 (7 casovych slotov x 2 stages).
          Kliknite na ikonu ceruzky pre upravu nazvu, rencika, firmy, popisu alebo kapacity.
          asy a datumy su fixne.
        </p>
      </div>
    </div>
  );
}
