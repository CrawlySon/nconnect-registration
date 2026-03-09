'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Calendar, BarChart3, Settings,
  Loader2, AlertCircle, ChevronRight,
  Download, Plus, LogOut, Play, FileSpreadsheet, Mail, Star
} from 'lucide-react';

interface Stats {
  totalAttendees: number;
  totalSessions: number;
  totalRegistrations: number;
  averageSessionFill: number;
}

interface RecentAttendee {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAttendees, setRecentAttendees] = useState<RecentAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.status === 401) { router.push('/admin'); return; }
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setStats(data.stats);
      setRecentAttendees(data.recentAttendees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Admin Dashboard
          </h1>
          <p className="text-nconnect-muted mt-1">
            Správa konferencie nConnect26
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-nconnect-surface rounded-lg transition-colors text-nconnect-muted hover:text-white"
            title="Odhlásiť sa"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalAttendees || 0}</p>
          <p className="text-nconnect-muted text-sm">Registrovaných účastníkov</p>
        </div>

        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalSessions || 0}</p>
          <p className="text-nconnect-muted text-sm">Aktívnych prednášok</p>
        </div>

        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalRegistrations || 0}</p>
          <p className="text-nconnect-muted text-sm">Registrácií na prednášky</p>
        </div>

        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.averageSessionFill ? `${Math.round(stats.averageSessionFill)}%` : '0%'}
          </p>
          <p className="text-nconnect-muted text-sm">Priemerná obsadenosť</p>
        </div>
      </div>

      {/* Quick actions and recent activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick links */}
        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Rýchle akcie</h2>
          
          <div className="space-y-2">
            <Link 
              href="/admin/sessions"
              className="flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Správa prednášok</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </Link>

            <Link 
              href="/admin/attendees"
              className="flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Zoznam účastníkov</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </Link>

            <Link
              href="/admin/analytics"
              className="flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Analytika</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </Link>

            <Link
              href="/admin/live-demo"
              className="flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Live demo režim</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </Link>

            <Link
              href="/admin/email-test"
              className="flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Test emailov</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </Link>

            <button
              onClick={() => window.location.href = '/api/admin/export/attendees'}
              className="w-full flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Export účastníkov (CSV)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </button>

            <button
              onClick={() => window.location.href = '/api/admin/export'}
              className="w-full flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-nconnect-accent" />
                <span className="text-white">Export registrácií (CSV)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </button>

            <button
              onClick={() => window.location.href = '/api/admin/export?type=feedback'}
              className="w-full flex items-center justify-between p-4 bg-nconnect-primary/50 rounded-lg hover:bg-nconnect-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Export hodnotení (CSV)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-nconnect-muted" />
            </button>
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Najnovšie registrácie</h2>
          
          {recentAttendees.length === 0 ? (
            <p className="text-nconnect-muted">Zatiaľ žiadne registrácie</p>
          ) : (
            <div className="space-y-3">
              {recentAttendees.map(attendee => (
                <div 
                  key={attendee.id}
                  className="flex items-center justify-between p-3 bg-nconnect-primary/50 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{attendee.name}</p>
                    <p className="text-nconnect-muted text-sm">{attendee.email}</p>
                  </div>
                  <p className="text-nconnect-muted text-xs">
                    {new Date(attendee.created_at).toLocaleDateString('sk-SK')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
