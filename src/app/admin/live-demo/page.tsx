'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Play, Clock, User,
  Calendar, Eye, Settings
} from 'lucide-react';
import { Attendee, Session } from '@/types';

export default function AdminLiveDemoPage() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<string>('');
  const [demoDate, setDemoDate] = useState<string>('2026-03-26');
  const [demoTime, setDemoTime] = useState<string>('09:30');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Load attendees
      const attendeesRes = await fetch('/api/admin/attendees?limit=100');
      const attendeesData = await attendeesRes.json();

      // Load sessions to get time slots
      const sessionsRes = await fetch('/api/admin/sessions');
      const sessionsData = await sessionsRes.json();

      setAttendees(attendeesData.attendees || []);
      setSessions(sessionsData.sessions || []);

      // Get first session date for default
      if (sessionsData.sessions?.length > 0) {
        setDemoDate(sessionsData.sessions[0].date);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDemo = () => {
    if (!selectedAttendee) {
      alert('Vyber účastníka');
      return;
    }

    const demoDateTime = `${demoDate}T${demoTime}:00`;
    const url = `/live?attendee=${selectedAttendee}&time=${encodeURIComponent(demoDateTime)}`;
    window.open(url, '_blank');
  };

  const filteredAttendees = attendees.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique time slots from sessions
  const timeSlots = Array.from(new Set(sessions.map(s => s.start_time))).sort();

  // Quick time presets based on session times
  const timePresets = [
    { label: 'Pred konferenciou', time: '08:00' },
    ...timeSlots.slice(0, 5).map((t, i) => ({
      label: `Slot ${i + 1} (${t.substring(0, 5)})`,
      time: t.substring(0, 5)
    })),
    { label: 'Po konferencii', time: '18:00' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/dashboard"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-nconnect-muted" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Live Demo Režim
            </h1>
            <p className="text-nconnect-muted mt-1">
              Otestuj live timeline z pohľadu ľubovoľného účastníka
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Settings panel */}
          <div className="glass-card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Nastavenia demo režimu
            </h2>

            {/* Date selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-nconnect-muted mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Dátum konferencie
              </label>
              <input
                type="date"
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                className="glass-input"
              />
            </div>

            {/* Time selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-nconnect-muted mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Simulovaný čas
              </label>
              <input
                type="time"
                value={demoTime}
                onChange={(e) => setDemoTime(e.target.value)}
                className="glass-input mb-3"
              />

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {timePresets.map(preset => (
                  <button
                    key={preset.time}
                    onClick={() => setDemoTime(preset.time)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      demoTime === preset.time
                        ? 'bg-nconnect-accent text-white'
                        : 'bg-nconnect-secondary/30 text-nconnect-muted hover:bg-nconnect-secondary/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected time preview */}
            <div className="bg-nconnect-primary/50 rounded-lg p-4 mb-6">
              <p className="text-nconnect-muted text-sm mb-1">Simulovaný dátum a čas:</p>
              <p className="text-white font-bold text-lg">
                {new Date(`${demoDate}T${demoTime}`).toLocaleString('sk-SK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Launch button */}
            <button
              onClick={handleLaunchDemo}
              disabled={!selectedAttendee}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Spustiť demo
            </button>
          </div>

          {/* Attendee selection */}
          <div className="glass-card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Vyber účastníka
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Hľadať podľa mena alebo emailu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input mb-4"
            />

            {/* Attendee list */}
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {filteredAttendees.length === 0 ? (
                <p className="text-nconnect-muted text-center py-4">
                  Žiadni účastníci nenájdení
                </p>
              ) : (
                filteredAttendees.map(attendee => (
                  <button
                    key={attendee.id}
                    onClick={() => setSelectedAttendee(attendee.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedAttendee === attendee.id
                        ? 'bg-nconnect-accent/20 border border-nconnect-accent'
                        : 'bg-nconnect-primary/50 hover:bg-nconnect-primary border border-transparent'
                    }`}
                  >
                    <p className="text-white font-medium">{attendee.name}</p>
                    <p className="text-nconnect-muted text-sm">{attendee.email}</p>
                  </button>
                ))
              )}
            </div>

            {selectedAttendee && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <a
                  href={`/sessions?attendee=${selectedAttendee}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-button w-full flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Zobraziť registrácie účastníka
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-panel mt-8">
          <h3 className="text-white font-medium mb-2">Ako používať demo režim:</h3>
          <ol className="text-nconnect-muted text-sm space-y-1 list-decimal list-inside">
            <li>Vyber dátum a čas, ktorý chceš simulovať</li>
            <li>Vyber účastníka, z ktorého pohľadu chceš vidieť timeline</li>
            <li>Klikni na "Spustiť demo" - otvorí sa nové okno s live timeline</li>
            <li>Timeline sa bude zobrazovať podľa nastaveného času</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
