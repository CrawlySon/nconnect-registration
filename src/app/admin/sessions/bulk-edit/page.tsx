'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Save, RotateCcw,
  CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { Session, Stage } from '@/types';
import { formatTime } from '@/lib/utils';

interface EditableSession extends Session {
  _original: {
    title: string;
    speaker_name: string;
    speaker_company: string | null;
    capacity: number;
  };
  _changed: boolean;
}

export default function BulkEditSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<EditableSession[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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

      // Add original values to each session for tracking changes
      const editableSessions: EditableSession[] = data.sessions.map((s: Session) => ({
        ...s,
        _original: {
          title: s.title,
          speaker_name: s.speaker_name,
          speaker_company: s.speaker_company || null,
          capacity: s.capacity,
        },
        _changed: false,
      }));

      setSessions(editableSessions);
      setStages(data.stages);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = useCallback((
    sessionId: string,
    field: 'title' | 'speaker_name' | 'speaker_company' | 'capacity',
    value: string | number
  ) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;

      const updated = { ...session, [field]: value };

      // Check if any field is different from original
      const hasChanged =
        updated.title !== updated._original.title ||
        updated.speaker_name !== updated._original.speaker_name ||
        (updated.speaker_company || null) !== updated._original.speaker_company ||
        updated.capacity !== updated._original.capacity;

      return { ...updated, _changed: hasChanged };
    }));
  }, []);

  const handleRevertAll = () => {
    setSessions(prev => prev.map(session => ({
      ...session,
      title: session._original.title,
      speaker_name: session._original.speaker_name,
      speaker_company: session._original.speaker_company || undefined,
      capacity: session._original.capacity,
      _changed: false,
    })));
  };

  const handleSaveAll = async () => {
    const changedSessions = sessions.filter(s => s._changed);
    if (changedSessions.length === 0) {
      showToast('Žiadne zmeny na uloženie', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/sessions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions: changedSessions.map(s => ({
            id: s.id,
            title: s.title,
            speaker_name: s.speaker_name,
            speaker_company: s.speaker_company || null,
            capacity: s.capacity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 207) {
        throw new Error(data.error);
      }

      // Update original values
      setSessions(prev => prev.map(session => {
        if (!session._changed) return session;
        return {
          ...session,
          _original: {
            title: session.title,
            speaker_name: session.speaker_name,
            speaker_company: session.speaker_company || null,
            capacity: session.capacity,
          },
          _changed: false,
        };
      }));

      showToast(`Úspešne uložených ${data.updated} prednášok`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Uloženie zlyhalo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const changedCount = sessions.filter(s => s._changed).length;

  // Group sessions by time slot
  const sessionsByTime = sessions.reduce((acc, session) => {
    const key = `${session.date}-${session.start_time}`;
    if (!acc[key]) {
      acc[key] = { time: session.start_time, endTime: session.end_time, sessions: [] };
    }
    acc[key].sessions.push(session);
    return acc;
  }, {} as Record<string, { time: string; endTime: string; sessions: EditableSession[] }>);

  const timeSlots = Object.values(sessionsByTime).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast */}
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/sessions"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-nconnect-muted" />
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">
                Hromadná editácia
              </h1>
              <p className="text-nconnect-muted mt-1">
                Uprav viacero prednášok naraz a ulož všetko jedným klikom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {changedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4" />
                {changedCount} zmien
              </div>
            )}
            <button
              onClick={handleRevertAll}
              disabled={changedCount === 0}
              className="glass-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Vrátiť zmeny
            </button>
            <button
              onClick={handleSaveAll}
              disabled={changedCount === 0 || isSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Uložiť všetko
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-panel mb-6">
          <p className="text-nconnect-muted text-sm">
            Klikni do poľa pre úpravu. Zmenené polia sú zvýraznené. Po dokončení klikni na "Uložiť všetko".
          </p>
        </div>

        {/* Sessions table */}
        <div className="space-y-8">
          {timeSlots.map(slot => (
            <div key={slot.time}>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 glass-panel">
                  <span className="font-medium text-white">
                    {formatTime(slot.time)} - {formatTime(slot.endTime)}
                  </span>
                </div>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="glass-table overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-12">Stage</th>
                      <th className="min-w-[300px]">Názov prednášky</th>
                      <th className="min-w-[150px]">Speaker</th>
                      <th className="min-w-[150px]">Firma</th>
                      <th className="w-24">Kapacita</th>
                      <th className="w-20">Obsad.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slot.sessions
                      .sort((a, b) => {
                        const stageA = stages.find(s => s.id === a.stage_id)?.name || '';
                        const stageB = stages.find(s => s.id === b.stage_id)?.name || '';
                        return stageA.localeCompare(stageB);
                      })
                      .map(session => {
                        const stage = stages.find(s => s.id === session.stage_id);
                        const isChanged = session._changed;
                        const isTitleChanged = session.title !== session._original.title;
                        const isSpeakerChanged = session.speaker_name !== session._original.speaker_name;
                        const isCompanyChanged = (session.speaker_company || null) !== session._original.speaker_company;
                        const isCapacityChanged = session.capacity !== session._original.capacity;

                        return (
                          <tr key={session.id} className={isChanged ? 'bg-yellow-500/5' : ''}>
                            <td>
                              <div
                                className="w-3 h-3 rounded-full mx-auto"
                                style={{ backgroundColor: stage?.color }}
                                title={stage?.name}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={session.title}
                                onChange={(e) => handleChange(session.id, 'title', e.target.value)}
                                className={`w-full bg-transparent border-0 focus:ring-0 text-white ${
                                  isTitleChanged ? 'bg-yellow-500/10' : ''
                                }`}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={session.speaker_name}
                                onChange={(e) => handleChange(session.id, 'speaker_name', e.target.value)}
                                className={`w-full bg-transparent border-0 focus:ring-0 text-white ${
                                  isSpeakerChanged ? 'bg-yellow-500/10' : ''
                                }`}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={session.speaker_company || ''}
                                onChange={(e) => handleChange(session.id, 'speaker_company', e.target.value)}
                                placeholder="-"
                                className={`w-full bg-transparent border-0 focus:ring-0 text-nconnect-muted placeholder:text-nconnect-muted/50 ${
                                  isCompanyChanged ? 'bg-yellow-500/10' : ''
                                }`}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={session.capacity}
                                onChange={(e) => handleChange(session.id, 'capacity', parseInt(e.target.value) || 0)}
                                min="1"
                                className={`w-full bg-transparent border-0 focus:ring-0 text-white text-center ${
                                  isCapacityChanged ? 'bg-yellow-500/10' : ''
                                }`}
                              />
                            </td>
                            <td className="text-center">
                              <span className={`${
                                session.registered_count >= session.capacity
                                  ? 'text-red-400'
                                  : session.registered_count >= session.capacity * 0.8
                                    ? 'text-yellow-400'
                                    : 'text-nconnect-muted'
                              }`}>
                                {session.registered_count}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Floating save button for mobile */}
        {changedCount > 0 && (
          <div className="fixed bottom-6 right-6 lg:hidden">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-orange-500/30"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Uložiť ({changedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
