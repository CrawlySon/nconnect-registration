'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Users, Trash2, Plus, 
  Save, Clock, Edit2, UserPlus, AlertCircle,
  CheckCircle2, XCircle
} from 'lucide-react';
import { Session, Stage, Attendee } from '@/types';
import { formatTime } from '@/lib/utils';

interface Registration {
  id: string;
  attendee_id: string;
  session_id: string;
  registered_at: string;
  attendee: Attendee;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [editForm, setEditForm] = useState({
    title: '',
    speaker_name: '',
    speaker_company: '',
    description: '',
    stage_id: '',
    date: '',
    start_time: '',
    end_time: '',
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
      setStages(data.stages);
      setRegistrations(data.registrations);
      setAllAttendees(data.allAttendees);
      
      // Initialize edit form
      setEditForm({
        title: data.session.title,
        speaker_name: data.session.speaker_name,
        speaker_company: data.session.speaker_company || '',
        description: data.session.description || '',
        stage_id: data.session.stage_id,
        date: data.session.date,
        start_time: data.session.start_time,
        end_time: data.session.end_time,
        capacity: String(data.session.capacity),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSession(data.session);
      setIsEditing(false);
      showToast('Prednáška bola aktualizovaná', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Uloženie zlyhalo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAttendee = async (registrationId: string, attendeeName: string) => {
    if (!confirm(`Naozaj chceš odobrať účastníka ${attendeeName} z tejto prednášky?`)) return;
    
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRegistrations(prev => prev.filter(r => r.id !== registrationId));
      if (session) {
        setSession({ ...session, registered_count: session.registered_count - 1 });
      }
      showToast(`${attendeeName} bol odobraný`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Odobratie zlyhalo', 'error');
    }
  };

  const handleAddAttendee = async (attendeeId: string) => {
    try {
      const response = await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId, sessionId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await loadData();
      setShowAddModal(false);
      setSearchEmail('');
      showToast('Účastník bol pridaný', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Pridanie zlyhalo', 'error');
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
          <p className="text-white">{error || 'Prednáška nebola nájdená'}</p>
          <Link href="/admin/sessions" className="btn-primary mt-4 inline-block">
            Späť na zoznam
          </Link>
        </div>
      </div>
    );
  }

  const stage = stages.find(s => s.id === session.stage_id);
  const registeredAttendeeIds = registrations.map(r => r.attendee_id);
  const availableAttendees = allAttendees.filter(a => 
    !registeredAttendeeIds.includes(a.id) &&
    (searchEmail === '' || a.email.toLowerCase().includes(searchEmail.toLowerCase()) || a.name.toLowerCase().includes(searchEmail.toLowerCase()))
  );

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
              Detail prednášky
            </h1>
          </div>
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? 'Zrušiť úpravu' : 'Upraviť'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Session info / Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Názov</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Speaker</label>
                    <input
                      type="text"
                      value={editForm.speaker_name}
                      onChange={(e) => setEditForm({ ...editForm, speaker_name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Firma</label>
                    <input
                      type="text"
                      value={editForm.speaker_company}
                      onChange={(e) => setEditForm({ ...editForm, speaker_company: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Popis</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input-field resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Stage</label>
                  <select
                    value={editForm.stage_id}
                    onChange={(e) => setEditForm({ ...editForm, stage_id: e.target.value })}
                    className="input-field"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Dátum</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Od</label>
                    <input
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Do</label>
                    <input
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Kapacita</label>
                    <input
                      type="number"
                      value={editForm.capacity}
                      onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                      className="input-field"
                      min="1"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Uložiť zmeny
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <span 
                    className="stage-badge"
                    style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}
                  >
                    {stage?.name}
                  </span>
                  <div className="flex items-center gap-2 text-nconnect-muted text-sm">
                    <Clock className="w-4 h-4" />
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-white">{session.title}</h2>
                <p className="text-nconnect-accent">{session.speaker_name} {session.speaker_company && `• ${session.speaker_company}`}</p>
                {session.description && <p className="text-nconnect-muted">{session.description}</p>}
                
                <div className="pt-4 border-t border-nconnect-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-nconnect-muted">Kapacita:</span>
                    <span className="text-white font-medium">{session.registered_count} / {session.capacity}</span>
                  </div>
                  <div className="capacity-bar mt-2">
                    <div 
                      className={`capacity-fill ${session.registered_count >= session.capacity ? 'full' : ''}`}
                      style={{ width: `${(session.registered_count / session.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
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
                <p className="text-2xl font-bold text-white">{registrations.length}</p>
                <p className="text-nconnect-muted text-sm">prihlásených</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendees list */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Prihlásení účastníci</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Pridať účastníka
          </button>
        </div>

        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl overflow-hidden">
          {registrations.length === 0 ? (
            <div className="p-8 text-center text-nconnect-muted">
              Zatiaľ nie sú prihlásení žiadni účastníci
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-nconnect-primary/50">
                <tr>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Meno</th>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Firma</th>
                  <th className="text-left px-4 py-3 text-nconnect-muted text-sm font-medium">Registrácia</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id} className="border-t border-nconnect-secondary/30">
                    <td className="px-4 py-3 text-white">{reg.attendee.name}</td>
                    <td className="px-4 py-3 text-nconnect-muted">{reg.attendee.email}</td>
                    <td className="px-4 py-3 text-nconnect-muted">{reg.attendee.company || '-'}</td>
                    <td className="px-4 py-3 text-nconnect-muted text-sm">
                      {new Date(reg.registered_at).toLocaleDateString('sk-SK')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveAttendee(reg.id, reg.attendee.name)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                        title="Odobrať"
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

      {/* Add attendee modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Pridať účastníka</h3>
            
            <input
              type="text"
              placeholder="Hľadať podľa mena alebo emailu..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="input-field mb-4"
              autoFocus
            />

            <div className="space-y-2 max-h-60 overflow-auto">
              {availableAttendees.length === 0 ? (
                <p className="text-nconnect-muted text-center py-4">
                  {searchEmail ? 'Žiadni účastníci nenájdení' : 'Všetci účastníci sú už prihlásení'}
                </p>
              ) : (
                availableAttendees.slice(0, 20).map(attendee => (
                  <div 
                    key={attendee.id}
                    className="flex items-center justify-between p-3 bg-nconnect-primary/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{attendee.name}</p>
                      <p className="text-nconnect-muted text-sm">{attendee.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddAttendee(attendee.id)}
                      className="p-2 bg-nconnect-accent/10 hover:bg-nconnect-accent/20 rounded-lg text-nconnect-accent"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => { setShowAddModal(false); setSearchEmail(''); }}
              className="btn-secondary w-full mt-4"
            >
              Zavrieť
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
