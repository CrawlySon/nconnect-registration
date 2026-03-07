'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Users, Calendar,
  BarChart3, TrendingUp, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Stage } from '@/types';

interface DailyRegistration {
  date: string;
  count: number;
}

interface TopSession {
  id: string;
  title: string;
  registered: number;
  capacity: number;
  fillRate: number;
}

interface Analytics {
  dailyRegistrations: DailyRegistration[];
  topSessions: TopSession[];
  stages: Stage[];
  sessions: { id: string; title: string }[];
  stats: {
    totalAttendees: number;
    totalRegistrations: number;
    filteredRegistrations: number;
    avgSessionsPerAttendee: number;
  };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
  }, [router]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStage) params.append('stage', selectedStage);
      if (selectedSession) params.append('session', selectedSession);

      const response = await fetch(`/api/admin/analytics?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStage, selectedSession]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel text-sm">
          <p className="text-white font-medium">{formatDate(label)}</p>
          <p className="text-nconnect-accent">{payload[0].value} registrácií</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-nconnect-muted" />
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">
                Analytika
              </h1>
              <p className="text-nconnect-muted mt-1">
                Prehľadová štatistika registrácií
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-wrapper">
                <Users className="w-6 h-6 text-nconnect-accent" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{analytics?.stats.totalAttendees || 0}</p>
            <p className="text-nconnect-muted text-sm">Celkom účastníkov</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-wrapper purple">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{analytics?.stats.totalRegistrations || 0}</p>
            <p className="text-nconnect-muted text-sm">Celkom registrácií</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-wrapper green">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{analytics?.stats.avgSessionsPerAttendee || 0}</p>
            <p className="text-nconnect-muted text-sm">Priemer prednášok/účastník</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-wrapper orange">
                <Filter className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{analytics?.stats.filteredRegistrations || 0}</p>
            <p className="text-nconnect-muted text-sm">Filtrované registrácie</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtre
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-nconnect-muted mb-2">Stage</label>
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setSelectedSession('');
                }}
                className="glass-input"
              >
                <option value="">Všetky stage</option>
                {analytics?.stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-nconnect-muted mb-2">Prednáška</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="glass-input"
              >
                <option value="">Všetky prednášky</option>
                {analytics?.sessions.map(session => (
                  <option key={session.id} value={session.id}>{session.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Registrácie po dňoch
            </h3>

            {analytics?.dailyRegistrations && analytics.dailyRegistrations.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#64748B"
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#64748B"
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {analytics.dailyRegistrations.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`rgba(0, 212, 255, ${0.5 + (entry.count / Math.max(...analytics.dailyRegistrations.map(d => d.count))) * 0.5})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-nconnect-muted">
                Žiadne dáta pre zvolené filtre
              </div>
            )}
          </div>

          {/* Top Sessions */}
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 10 najpopulárnejších prednášok
            </h3>

            {analytics?.topSessions && analytics.topSessions.length > 0 ? (
              <div className="space-y-3">
                {analytics.topSessions.map((session, index) => (
                  <div key={session.id} className="glass-panel">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-nconnect-accent/20 text-nconnect-accent' : 'bg-nconnect-secondary/30 text-nconnect-muted'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{session.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-nconnect-secondary/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                session.fillRate >= 100 ? 'bg-red-400' :
                                session.fillRate >= 80 ? 'bg-yellow-400' : 'bg-nconnect-accent'
                              }`}
                              style={{ width: `${Math.min(100, session.fillRate)}%` }}
                            />
                          </div>
                          <span className="text-nconnect-muted text-xs whitespace-nowrap">
                            {session.registered}/{session.capacity} ({session.fillRate}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-nconnect-muted">
                Žiadne dáta
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
