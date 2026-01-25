'use client';

import { useState, useEffect, useCallback } from 'react';
import { Attendee } from '@/types';
import { ATTENDEE_TYPES } from '@/lib/constants';
import Link from 'next/link';

interface AttendeeWithCount extends Attendee {
  sessions_count: number;
}

export default function AdminAttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/attendees');
      const data = await res.json();
      if (res.ok) {
        setAttendees(data.attendees);
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Naozaj chces vymazat ucastnika "${name}"? Tato akcia je nevratna a vymaze aj vsetky jeho registracie.`)) {
      return;
    }

    setDeleting(id);

    try {
      const res = await fetch(`/api/admin/attendees?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAttendees((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert('Vymazanie zlyhalo');
      }
    } catch (err) {
      console.error('Failed to delete attendee:', err);
      alert('Vymazanie zlyhalo');
    } finally {
      setDeleting(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const found = ATTENDEE_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  const filteredAttendees = attendees.filter((a) => {
    const searchLower = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(searchLower) ||
      a.email.toLowerCase().includes(searchLower) ||
      a.school_or_company?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 py-4 px-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">
              Ucastnici <span className="text-slate-400 font-normal">({attendees.length})</span>
            </h1>
          </div>
          <a
            href="/api/admin/export?type=attendees"
            className="btn-secondary text-sm"
            download
          >
            Export CSV
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            className="input max-w-md"
            placeholder="Hladat podla mena, emailu alebo firmy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Meno</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Email</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Typ</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Skola/Firma</th>
                  <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Prednasky</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Registracia</th>
                  <th className="text-right py-4 px-4 text-slate-400 font-medium text-sm">Akcie</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      {search ? 'Ziadne vysledky' : 'Ziadni ucastnici'}
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <tr key={attendee.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{attendee.name}</td>
                      <td className="py-3 px-4 text-slate-400">{attendee.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium">
                          {getTypeLabel(attendee.attendee_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{attendee.school_or_company || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-white">{attendee.sessions_count}</span>
                        <span className="text-slate-500">/7</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-sm">
                        {new Date(attendee.created_at).toLocaleDateString('sk-SK')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(attendee.id, attendee.name)}
                          disabled={deleting === attendee.id}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 text-sm"
                        >
                          {deleting === attendee.id ? '...' : 'Vymazat'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
