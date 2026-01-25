'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Building, Phone, Calendar,
  ArrowLeft, Loader2, AlertCircle, Trash2,
  Clock, Plus, X, CheckCircle2
} from 'lucide-react';

interface Attendee {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  created_at: string;
}

interface Registration {
  id: string;
  registered_at: string;
  session: {
    id: string;
    title: string;
    speaker_name: string;
    speaker_company?: string;
    date: string;
    start_time: string;
    end_time: string;
    stage: {
      name: string;
      color: string;
    };
  };
}

interface AvailableSession {
  id: string;
  title: string;
  speaker_name: string;
  start_time: string;
  end_time: string;
  capacity: number;
  registered_count: number;
  stage: {
    name: string;
    color: string;
  };
}

export default function AttendeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const attendeeId = params.id as string;

  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
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
  }, [router, attendeeId]);

  const loadData = async () => {
    try {
      // Load attendee details and registrations
      const [attendeeRes, sessionsRes] = await Promise.all([
        fetch(`/api/admin/attendees/${attendeeId}`),
        fetch('/api/admin/sessions'),
      ]);

      const attendeeData = await attendeeRes.json();
      const sessionsData = await sessionsRes.json();

      if (!attendeeRes.ok) throw new Error(attendeeData.error);

      setAttendee(attendeeData.attendee);
      setRegistrations(attendeeData.registrations);

      // Filter out sessions already registered
      const registeredIds = new Set(attendeeData.registrations.map((r: Registration) => r.session.id));
      const available = sessionsData.sessions?.filter((s: AvailableSession) =>
        !registeredIds.has(s.id) && s.registered_count < s.capacity
      ) || [];
      setAvailableSessions(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRegistration = async (registrationId: string, sessionTitle: string) => {
    if (!confirm(`Naozaj chceš odstrániť registráciu na "${sessionTitle}"?`)) {
      return;
    }

    setRemovingId(registrationId);
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast('Registrácia bola odstránená', 'success');
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Odstránenie zlyhalo', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddRegistration = async (sessionId: string) => {
    setAddingId(sessionId);
    try {
      const response = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, sessionId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      showToast('Účastník bol pridaný na prednášku', 'success');
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Pridanie zlyhalo', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleDeleteAttendee = async () => {
    if (!attendee) return;

    if (!confirm(`Naozaj chceš vymazať účastníka "${attendee.name}"? Táto akcia je nevratná a vymaže aj všetky jeho registrácie.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/attendees/${attendeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      router.push('/admin/attendees');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Vymazanie zlyhalo', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  if (error || !attendee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white mb-4">{error || 'Účastník nebol nájdený'}</p>
          <Link href="/admin/attendees" className="text-nconnect-accent hover:underline">
            Späť na zoznam
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <p className="text-white">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/attendees"
          className="inline-flex items-center gap-2 text-nconnect-muted hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Späť na zoznam
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-white">
            Detail účastníka
          </h1>
          <button
            onClick={handleDeleteAttendee}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Vymazať účastníka
          </button>
        </div>
      </div>

      {/* Attendee info */}
      <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
              <User className="w-5 h-5 text-nconnect-accent" />
            </div>
            <div>
              <p className="text-nconnect-muted text-sm">Meno</p>
              <p className="text-white font-medium">{attendee.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-nconnect-accent" />
            </div>
            <div>
              <p className="text-nconnect-muted text-sm">Email</p>
              <p className="text-white font-medium">{attendee.email}</p>
            </div>
          </div>

          {attendee.company && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-nconnect-accent" />
              </div>
              <div>
                <p className="text-nconnect-muted text-sm">Firma</p>
                <p className="text-white font-medium">{attendee.company}</p>
              </div>
            </div>
          )}

          {attendee.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-nconnect-accent" />
              </div>
              <div>
                <p className="text-nconnect-muted text-sm">Telefón</p>
                <p className="text-white font-medium">{attendee.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-nconnect-accent" />
            </div>
            <div>
              <p className="text-nconnect-muted text-sm">Registrovaný</p>
              <p className="text-white font-medium">
                {new Date(attendee.created_at).toLocaleDateString('sk-SK', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations */}
      <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-nconnect-secondary/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Registrácie ({registrations.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-nconnect-accent/10 text-nconnect-accent border border-nconnect-accent/30 rounded-lg hover:bg-nconnect-accent/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Pridať prednášku
            </button>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-nconnect-muted mx-auto mb-4" />
            <p className="text-nconnect-muted">Účastník nemá žiadne registrácie</p>
          </div>
        ) : (
          <div className="divide-y divide-nconnect-secondary/30">
            {registrations.map(reg => (
              <div key={reg.id} className="p-4 hover:bg-nconnect-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${reg.session.stage.color}20`,
                          color: reg.session.stage.color,
                        }}
                      >
                        {reg.session.stage.name}
                      </span>
                      <span className="flex items-center gap-1 text-nconnect-muted text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {reg.session.start_time} - {reg.session.end_time}
                      </span>
                    </div>
                    <h3 className="text-white font-medium">{reg.session.title}</h3>
                    <p className="text-nconnect-muted text-sm">
                      {reg.session.speaker_name}
                      {reg.session.speaker_company && ` • ${reg.session.speaker_company}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveRegistration(reg.id, reg.session.title)}
                    disabled={removingId === reg.id}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Odstrániť registráciu"
                  >
                    {removingId === reg.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add session modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-nconnect-secondary/30 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Pridať prednášku</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-nconnect-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableSessions.length === 0 ? (
                <p className="text-nconnect-muted text-center py-8">
                  Žiadne dostupné prednášky na pridanie
                </p>
              ) : (
                <div className="space-y-3">
                  {availableSessions.map(session => (
                    <div
                      key={session.id}
                      className="p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-2 py-0.5 text-xs rounded"
                              style={{
                                backgroundColor: `${session.stage.color}20`,
                                color: session.stage.color,
                              }}
                            >
                              {session.stage.name}
                            </span>
                            <span className="text-nconnect-muted text-sm">
                              {session.start_time} - {session.end_time}
                            </span>
                            <span className="text-nconnect-muted text-sm">
                              ({session.registered_count}/{session.capacity})
                            </span>
                          </div>
                          <h4 className="text-white font-medium">{session.title}</h4>
                          <p className="text-nconnect-muted text-sm">{session.speaker_name}</p>
                        </div>
                        <button
                          onClick={() => handleAddRegistration(session.id)}
                          disabled={addingId === session.id}
                          className="px-4 py-2 bg-nconnect-accent/10 text-nconnect-accent border border-nconnect-accent/30 rounded-lg hover:bg-nconnect-accent/20 transition-colors disabled:opacity-50"
                        >
                          {addingId === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Pridať'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
