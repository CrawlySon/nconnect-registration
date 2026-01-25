'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { TIME_SLOTS, STAGES } from '@/lib/constants';
import Link from 'next/link';

interface ChartDataPoint {
  date: string;
  count: number;
}

interface Stats {
  totalAttendees: number;
  totalRegistrations: number;
}

interface SessionWithCount extends Session {
  registered_count: number;
}

export default function AdminDashboardPage() {
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<Stats>({ totalAttendees: 0, totalRegistrations: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [filterSession, setFilterSession] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth !== 'true') {
      window.location.href = '/admin';
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      let url = '/api/admin/analytics';
      const params = new URLSearchParams();
      if (filterSession) params.set('session', filterSession);
      else if (filterStage) params.set('stage', filterStage);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setChartData(data.chartData);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStage, filterSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    window.location.href = '/admin';
  };

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <header className="bg-surface-light border-b border-gray-800 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-primary">nConnect</span>
            <span className="text-ai-stage">26</span>
            <span className="text-gray-400 ml-2">Admin</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/sessions" className="text-gray-400 hover:text-white transition-colors">
              Prednasky
            </Link>
            <Link href="/admin/attendees" className="text-gray-400 hover:text-white transition-colors">
              Ucastnici
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
              Odhlasit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Celkom ucastnikov</div>
            <div className="text-3xl font-bold text-white">{stats.totalAttendees}</div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Celkom registracii</div>
            <div className="text-3xl font-bold text-primary">{stats.totalRegistrations}</div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Priemerne na ucastnika</div>
            <div className="text-3xl font-bold text-ai-stage">
              {stats.totalAttendees > 0
                ? (stats.totalRegistrations / stats.totalAttendees).toFixed(1)
                : '0'}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold">Registracie podla dni</h2>
            <div className="flex gap-2">
              <select
                className="input py-2"
                value={filterStage}
                onChange={(e) => {
                  setFilterStage(e.target.value);
                  setFilterSession('');
                }}
              >
                <option value="">Vsetky stages</option>
                <option value={STAGES.AI_DATA.id}>{STAGES.AI_DATA.name}</option>
                <option value={STAGES.SOFTDEV_CYBER.id}>{STAGES.SOFTDEV_CYBER.name}</option>
              </select>
              <select
                className="input py-2"
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
              >
                <option value="">Vsetky prednasky</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 flex items-end gap-2">
              {chartData.map((point) => (
                <div key={point.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary rounded-t transition-all"
                    style={{ height: `${(point.count / maxCount) * 100}%`, minHeight: point.count > 0 ? '4px' : '0' }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left whitespace-nowrap">
                    {new Date(point.date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{point.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Ziadne data
            </div>
          )}
        </div>

        {/* Sessions Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Prehlad prednasok</h2>
            <div className="flex gap-2">
              <a
                href="/api/admin/export?type=attendees"
                className="btn-secondary text-sm"
                download
              >
                Export ucastnikov
              </a>
              <a
                href="/api/admin/export?type=registrations"
                className="btn-secondary text-sm"
                download
              >
                Export registracii
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Cas</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Stage</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Prednaska</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Recnik</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Registracie</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const slot = TIME_SLOTS[session.slot_index];
                  return (
                    <tr key={session.id} className="border-b border-gray-800/50 hover:bg-surface-light/50">
                      <td className="py-3 px-4 text-gray-400">
                        {slot.start} - {slot.end}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: session.stage?.color + '20',
                            color: session.stage?.color,
                          }}
                        >
                          {session.stage?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/sessions/${session.id}`}
                          className="text-white hover:text-primary transition-colors"
                        >
                          {session.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{session.speaker_name}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={session.registered_count >= session.capacity ? 'text-red-400' : 'text-white'}>
                          {session.registered_count}
                        </span>
                        <span className="text-gray-500">/{session.capacity}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
