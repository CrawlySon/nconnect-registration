'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Session } from '@/types';
import { TIME_SLOTS, STAGES } from '@/lib/constants';
import Link from 'next/link';

interface SessionWithCount extends Session {
  registered_count: number;
}

export default function AdminSessionEditPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    speaker_name: '',
    speaker_company: '',
    description: '',
    capacity: 60,
  });

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`);
      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        setFormData({
          title: data.session.title,
          speaker_name: data.session.speaker_name,
          speaker_company: data.session.speaker_company || '',
          description: data.session.description || '',
          capacity: data.session.capacity,
        });
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ulozenie zlyhalo');
      }

      setSuccess('Zmeny boli ulozene');
      // Update local session data
      setSession((prev) => prev ? { ...prev, ...formData } : null);

      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/sessions');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieco sa pokazilo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-white">Prednaska neexistuje</h1>
          <Link href="/admin/sessions" className="btn-primary inline-block">
            Spat
          </Link>
        </div>
      </div>
    );
  }

  const slot = TIME_SLOTS[session.slot_index];
  const isOrange = session.stage_id === STAGES.AI_DATA.id;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 py-4 px-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/admin/sessions" className="text-slate-400 hover:text-white transition-colors">
            &larr; Spat
          </Link>
          <h1 className="text-xl font-bold text-white">Upravit prednasku</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="card">
          {/* Session Info */}
          <div className="mb-6 pb-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`px-3 py-1.5 rounded-lg font-medium ${
                isOrange
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {session.stage?.name}
              </span>
              <span className="text-slate-400">{slot.start} - {slot.end}</span>
              <span className="text-slate-500">ID: {session.id}</span>
            </div>
            <div className="mt-3 text-sm text-slate-400">
              Registrovanych: <span className="text-white font-medium">{session.registered_count}</span>/{session.capacity}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">Nazov prednasky</label>
              <input
                type="text"
                required
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">Meno recnika</label>
              <input
                type="text"
                required
                className="input"
                value={formData.speaker_name}
                onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">
                Firma recnika
                <span className="text-slate-500 font-normal"> (volitelne)</span>
              </label>
              <input
                type="text"
                className="input"
                value={formData.speaker_company}
                onChange={(e) => setFormData({ ...formData, speaker_company: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">
                Popis
                <span className="text-slate-500 font-normal"> (volitelne)</span>
              </label>
              <textarea
                className="input min-h-[120px] resize-y"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2 font-medium">Kapacita</label>
              <input
                type="number"
                min="1"
                className="input w-32"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 60 })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ukladam...
                  </span>
                ) : 'Ulozit zmeny'}
              </button>
              <Link href="/admin/sessions" className="btn-secondary flex-1 text-center">
                Zrusit
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
