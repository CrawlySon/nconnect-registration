'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Users, Trash2,
  Save, Clock, AlertCircle,
  CheckCircle2, XCircle
} from 'lucide-react';
import { Stage, Attendee, TimeSlot } from '@/types';

interface SessionWithDetails {
  id: number;
  slot_index: number;
  stage_id: string;
  title: string;
  speaker_name: string;
  speaker_company?: string;
  description?: string;
  capacity: number;
  registered_count: number;
  time_slot: TimeSlot;
  stage?: Stage;
}

interface Registration {
  attendee_id: string;
  session_id: number;
  is_registered: boolean;
  registered_at: string;
  attendee: Attendee;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [editForm, setEditForm] = useState({
    title: '',
    speaker_name: '',
    speaker_company: '',
    description: '',
    capacity: '',
  });

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
    loadData();
  }, [router, sessionId]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setSession(data.session);
      setRegistrations(data.registrations);

      setEditForm({
        title: data.session.title,
        speaker_name: data.session.speaker_name,
        speaker_company: data.session.speaker_company || '',
        description: data.session.description || '',
        capacity: String(data.session.capacity),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa nacitat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.speaker_name) {
      showToast('Nazov a meno recnika su povinne', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSession(prev => prev ? { ...prev, ...data.session } : null);
      showToast('Prednaska bola aktualizovana', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ulozenie zlyhalo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAttendee = async (attendeeId: string, attendeeName: string) => {
    if (!confirm(`Naozaj chces odhlasit ucastnika ${attendeeName} z tejto prednasky?`)) return;

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId,
          sessionId: parseInt(sessionId),
          register: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRegistrations(prev => prev.filter(r => r.attendee_id !== attendeeId));
      if (session) {
        setSession({ ...session, registered_count: session.registered_count - 1 });
      }
      showToast(`${attendeeName} bol odhlaseny`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Odhlasenie zlyhalo', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">{error || 'Prednaska nebola najdena'}</p>
          <Link href="/admin/sessions" className="btn-primary mt-4 inline-block">
            Spat na zoznam
          </Link>
        </div>
      </div>
    );
  }

  const fillPercent = (session.registered_count / session.capacity) * 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            className="p-2 hover:bg-nconnect-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-nconnect-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              Uprava prednasky #{session.id}
            </h1>
            <p className="text-nconnect-muted">
              {session.stage?.name} - {session.time_slot?.start} - {session.time_slot?.end}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Obsah prednasky</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nazov *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input-field"
                  placeholder="Nazov prednasky"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Recnik *</label>
                  <input
                    type="text"
                    value={editForm.speaker_name}
                    onChange={(e) => setEditForm({ ...editForm, speaker_name: e.target.value })}
                    className="input-field"
                    placeholder="Meno recnika"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Firma</label>
                  <input
                    type="text"
                    value={editForm.speaker_company}
                    onChange={(e) => setEditForm({ ...editForm, speaker_company: e.target.value })}
                    className="input-field"
                    placeholder="Nazov firmy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Popis</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Popis prednasky..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Kapacita</label>
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="input-field w-32"
                  min="1"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ulozit zmeny
              </button>
            </div>
          </div>

          {/* Fixed info */}
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              <strong>Fixne udaje:</strong> Slot #{session.slot_index + 1},
              Stage: {session.stage?.name},
              Cas: {session.time_slot?.start} - {session.time_slot?.end}.
              Tieto udaje nie je mozne menit.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div>
          <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{session.registered_count}</p>
                <p className="text-nconnect-muted text-sm">prihlasenych z {session.capacity}</p>
              </div>
            </div>

            <div className="capacity-bar mt-2">
              <div
                className={`capacity-fill ${fillPercent >= 100 ? 'full' : fillPercent >= 80 ? 'warning' : ''}`}
                style={{ width: `${Math.min(100, fillPercent)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
            <div className="flex items-center gap-2 text-nconnect-muted text-sm">
              <Clock className="w-4 h-4" />
              <span>Casovy slot</span>
            </div>
            <p className="text-white font-medium mt-1">
              {session.time_slot?.start} - {session.time_slot?.end}
            </p>
          </div>
        </div>
      </div>

      {/* Attendees list */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-4">Prihlaseni ucastnici ({registrations.length})</h3>

        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl overflow-hidden">
          {registrations.length === 0 ? (
            <div className="p-8 text-center text-nconnect-muted">
              Zatial nie su prihlaseni ziadni ucastnici
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-nconnect-primary/50">
                <tr>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Meno</th>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Firma</th>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Registracia</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.attendee_id} className="border-t border-nconnect-secondary/30">
                    <td className="px-4 py-3 text-white">{reg.attendee.name}</td>
                    <td className="px-4 py-3 text-nconnect-muted">{reg.attendee.email}</td>
                    <td className="px-4 py-3 text-nconnect-muted">{reg.attendee.company || '-'}</td>
                    <td className="px-4 py-3 text-nconnect-muted text-sm">
                      {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString('sk-SK') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveAttendee(reg.attendee_id, reg.attendee.name)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                        title="Odhlasit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
