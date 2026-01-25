'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Session } from '@/types';
import { TIME_SLOTS } from '@/lib/constants';
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

      router.push('/admin/sessions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieco sa pokazilo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-4">Prednaska neexistuje</h1>
          <Link href="/admin/sessions" className="btn-primary inline-block">
            Spat
          </Link>
        </div>
      </div>
    );
  }

  const slot = TIME_SLOTS[session.slot_index];

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <header className="bg-surface-light border-b border-gray-800 py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/admin/sessions" className="text-gray-400 hover:text-white transition-colors">
            &larr; Spat
          </Link>
          <h1 className="text-xl font-bold">Upravit prednasku</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="card">
          {/* Session Info */}
          <div className="mb-6 pb-6 border-b border-gray-800">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: session.stage?.color + '20',
                  color: session.stage?.color,
                }}
              >
                {session.stage?.name}
              </span>
              <span>{slot.start} - {slot.end}</span>
              <span>ID: {session.id}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Registrovanych: {session.registered_count}/{session.capacity}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nazov prednasky *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Meno recnika *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.speaker_name}
                onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Firma recnika</label>
              <input
                type="text"
                className="input"
                value={formData.speaker_company}
                onChange={(e) => setFormData({ ...formData, speaker_company: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Popis</label>
              <textarea
                className="input min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Kapacita</label>
              <input
                type="number"
                min="1"
                className="input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 60 })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Ukladam...' : 'Ulozit'}
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
