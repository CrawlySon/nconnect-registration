'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Edit2, Trash2, Users, Clock, 
  Loader2, AlertCircle, ArrowLeft, Eye
} from 'lucide-react';
import { Session, Stage } from '@/types';

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Check if authenticated
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      
      setSessions(sessions.filter(s => s.id !== sessionId));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Vymazanie zlyhalo');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  // Group sessions by time slot
  const sessionsByTime = sessions.reduce((acc, session) => {
    const key = `${session.date}-${session.start_time}`;
    if (!acc[key]) {
      acc[key] = { time: session.start_time, endTime: session.end_time, sessions: [] };
    }
    acc[key].sessions.push(session);
    return acc;
  }, {} as Record<string, { time: string; endTime: string; sessions: Session[] }>);

  const timeSlots = Object.values(sessionsByTime).sort((a, b) => 
    a.time.localeCompare(b.time)
  );

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
              Správa prednášok
            </h1>
            <p className="text-nconnect-muted mt-1">
              {sessions.length} prednášok v {stages.length} stage
            </p>
          </div>
        </div>
        
        <Link 
          href="/admin/sessions/new" 
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nová prednáška
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Stage legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {stages.map(stage => (
          <div key={stage.id} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-sm text-nconnect-muted">{stage.name}</span>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      {sessions.length === 0 ? (
        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-nconnect-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Žiadne prednášky</h3>
          <p className="text-nconnect-muted mb-6">Začni pridaním prvej prednášky</p>
          <Link href="/admin/sessions/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Pridať prednášku
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {timeSlots.map(slot => (
            <div key={slot.time}>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-nconnect-surface px-4 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-nconnect-accent" />
                  <span className="font-medium text-white">
                    {slot.time} - {slot.endTime}
                  </span>
                </div>
                <div className="flex-1 h-px bg-nconnect-secondary/30" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {slot.sessions.map(session => {
                  const stage = stages.find(s => s.id === session.stage_id);
                  const fillPercent = (session.registered_count / session.capacity) * 100;
                  
                  return (
                    <div 
                      key={session.id}
                      className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span 
                          className="stage-badge"
                          style={{ 
                            backgroundColor: `${stage?.color}20`, 
                            color: stage?.color 
                          }}
                        >
                          {stage?.name}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/sessions/${session.id}`}
                            className="p-2 hover:bg-nconnect-primary rounded-lg transition-colors"
                            title="Zobraziť účastníkov"
                          >
                            <Eye className="w-4 h-4 text-nconnect-muted" />
                          </Link>
                          <Link
                            href={`/admin/sessions/${session.id}/edit`}
                            className="p-2 hover:bg-nconnect-primary rounded-lg transition-colors"
                            title="Upraviť"
                          >
                            <Edit2 className="w-4 h-4 text-nconnect-muted" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(session.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Vymazať"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-1">
                        {session.title}
                      </h3>
                      <p className="text-nconnect-muted text-sm mb-4">
                        {session.speaker_name}
                        {session.speaker_company && ` • ${session.speaker_company}`}
                      </p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-nconnect-muted" />
                          <span className={`${fillPercent >= 100 ? 'text-red-400' : fillPercent >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                            {session.registered_count}/{session.capacity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="capacity-bar">
                            <div 
                              className={`capacity-fill ${fillPercent >= 100 ? 'full' : fillPercent >= 80 ? 'warning' : ''}`}
                              style={{ width: `${Math.min(100, fillPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Delete confirmation */}
                      {deleteConfirm === session.id && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-sm mb-3">
                            Naozaj chceš vymazať túto prednášku? Všetky registrácie budú zrušené.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              Vymazať
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 bg-nconnect-secondary text-white rounded text-sm hover:bg-nconnect-secondary/80"
                            >
                              Zrušiť
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}
