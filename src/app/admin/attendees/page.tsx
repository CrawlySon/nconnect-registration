'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Search, Loader2, AlertCircle,
  ArrowLeft, Mail, Building, Calendar,
  ChevronRight, Trash2
} from 'lucide-react';

interface AttendeeWithCount {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  created_at: string;
  registration_count: number;
}

export default function AdminAttendeesPage() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<AttendeeWithCount[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<AttendeeWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
    loadAttendees();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAttendees(
        attendees.filter(a =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          (a.company && a.company.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, attendees]);

  const loadAttendees = async () => {
    try {
      const response = await fetch('/api/admin/attendees');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setAttendees(data.attendees);
      setFilteredAttendees(data.attendees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať účastníkov');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (attendeeId: string, attendeeName: string) => {
    if (!confirm(`Naozaj chceš vymazať účastníka "${attendeeName}"? Táto akcia je nevratná a vymaže aj všetky jeho registrácie.`)) {
      return;
    }

    setDeletingId(attendeeId);
    try {
      const response = await fetch(`/api/admin/attendees/${attendeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      // Remove from local state
      setAttendees(prev => prev.filter(a => a.id !== attendeeId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Vymazanie zlyhalo');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-nconnect-muted hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Späť na dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Účastníci
            </h1>
            <p className="text-nconnect-muted mt-1">
              {attendees.length} registrovaných účastníkov
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-nconnect-muted" />
          <input
            type="text"
            placeholder="Hľadať podľa mena, emailu alebo firmy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Attendees list */}
      <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl overflow-hidden">
        {filteredAttendees.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-nconnect-muted mx-auto mb-4" />
            <p className="text-nconnect-muted">
              {searchQuery ? 'Žiadni účastníci nezodpovedajú hľadaniu' : 'Zatiaľ žiadni účastníci'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-nconnect-secondary/30">
            {filteredAttendees.map(attendee => (
              <div
                key={attendee.id}
                className="p-4 hover:bg-nconnect-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-medium truncate">
                        {attendee.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-nconnect-accent/20 text-nconnect-accent text-xs rounded-full">
                        {attendee.registration_count} prednášok
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-nconnect-muted">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {attendee.email}
                      </span>
                      {attendee.company && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          {attendee.company}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(attendee.created_at).toLocaleDateString('sk-SK')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDelete(attendee.id, attendee.name)}
                      disabled={deletingId === attendee.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Vymazať účastníka"
                    >
                      {deletingId === attendee.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>

                    <Link
                      href={`/admin/attendees/${attendee.id}`}
                      className="p-2 text-nconnect-muted hover:text-white hover:bg-nconnect-secondary/30 rounded-lg transition-colors"
                      title="Detail a správa"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
