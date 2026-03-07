'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Users, Search,
  ChevronLeft, ChevronRight, X, Clock,
  Building, Mail, Calendar, Eye
} from 'lucide-react';
import { Attendee } from '@/types';
import { formatTime } from '@/lib/utils';

interface AttendeeWithCount extends Attendee {
  registration_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RegistrationDetail {
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
      id: string;
      name: string;
      color: string;
    };
  };
}

interface AttendeeDetail extends Attendee {
  registrations: RegistrationDetail[];
}

export default function AdminAttendeesPage() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<AttendeeWithCount[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
  }, [router]);

  const loadAttendees = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/attendees?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setAttendees(data.attendees);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load attendees:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadAttendeeDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/admin/attendees/${id}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setSelectedAttendee({
        ...data.attendee,
        registrations: data.registrations,
      });
    } catch (err) {
      console.error('Failed to load attendee detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

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
                Zoznam účastníkov
              </h1>
              <p className="text-nconnect-muted mt-1">
                {pagination.total} registrovaných účastníkov
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-nconnect-muted" />
              <input
                type="text"
                placeholder="Hľadaj podľa mena, emailu alebo firmy..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="glass-input pl-10"
              />
            </div>
            <button
              onClick={handleSearch}
              className="glass-button flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Hľadať
            </button>
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 text-nconnect-muted hover:text-white transition-colors"
              >
                Zrušiť filter
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
          </div>
        ) : attendees.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Users className="w-12 h-12 text-nconnect-muted mx-auto mb-4" />
            <p className="text-white text-lg">Žiadni účastníci nenájdení</p>
            <p className="text-nconnect-muted mt-2">
              {search ? 'Skús zmeniť vyhľadávací výraz' : 'Zatial sa nikto nezaregistroval'}
            </p>
          </div>
        ) : (
          <>
            <div className="glass-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Meno</th>
                    <th>Email</th>
                    <th>Firma</th>
                    <th>Registrácia</th>
                    <th>Prednášky</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map(attendee => (
                    <tr key={attendee.id}>
                      <td className="text-white font-medium">{attendee.name}</td>
                      <td className="text-nconnect-muted">{attendee.email}</td>
                      <td className="text-nconnect-muted">{attendee.company || '-'}</td>
                      <td className="text-nconnect-muted text-sm">
                        {new Date(attendee.created_at).toLocaleDateString('sk-SK')}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          attendee.registration_count > 0
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-nconnect-secondary/30 text-nconnect-muted'
                        }`}>
                          {attendee.registration_count} prednášok
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => loadAttendeeDetail(attendee.id)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          title="Zobraziť detail"
                        >
                          <Eye className="w-4 h-4 text-nconnect-accent" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-nconnect-muted text-sm">
                  Zobrazujem {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} z {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-white px-4">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="glass-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {(selectedAttendee || isLoadingDetail) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-auto">
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
                </div>
              ) : selectedAttendee && (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedAttendee.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-nconnect-muted">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {selectedAttendee.email}
                        </span>
                        {selectedAttendee.company && (
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {selectedAttendee.company}
                          </span>
                        )}
                      </div>
                      <p className="text-nconnect-muted text-sm mt-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Registrácia: {new Date(selectedAttendee.created_at).toLocaleDateString('sk-SK')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedAttendee(null)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-nconnect-muted" />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-4">
                    Registrované prednášky ({selectedAttendee.registrations.length})
                  </h3>

                  {selectedAttendee.registrations.length === 0 ? (
                    <p className="text-nconnect-muted text-center py-6">
                      Žiadne registrované prednášky
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedAttendee.registrations.map(reg => (
                        <div
                          key={reg.id}
                          className="glass-panel"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${reg.session.stage.color}20`,
                                color: reg.session.stage.color
                              }}
                            >
                              {reg.session.stage.name}
                            </span>
                            <span className="text-nconnect-muted text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(reg.session.start_time)} - {formatTime(reg.session.end_time)}
                            </span>
                          </div>
                          <p className="text-white font-medium">{reg.session.title}</p>
                          <p className="text-nconnect-muted text-sm">
                            {reg.session.speaker_name}
                            {reg.session.speaker_company && ` - ${reg.session.speaker_company}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedAttendee(null)}
                    className="glass-button w-full mt-6"
                  >
                    Zatvoriť
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
