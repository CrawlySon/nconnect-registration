'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ATTENDEE_TYPES, CONFERENCE } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    attendee_type: '',
    school_or_company: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registracia zlyhala');
      }

      router.push(`/sessions?attendee=${data.attendeeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieco sa pokazilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="text-white">n</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">Connect</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">26</span>
            </h1>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="card px-4 py-2 text-sm text-slate-300">
              {CONFERENCE.DATE_DISPLAY}
            </span>
            <span className="card px-4 py-2 text-sm text-slate-300">
              {CONFERENCE.VENUE}
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm mb-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span>7 casovych slotov</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span>2 stages</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>14 prednasok</span>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-center mb-2 text-white">Registracia</h2>
            <p className="text-slate-400 text-center text-sm mb-6">Vytvor si ucet a vyber si prednasky</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Meno a priezvisko
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Jan Novak"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="jan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-3 font-medium">
                  Som
                </label>
                <div className="space-y-2">
                  {ATTENDEE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                        formData.attendee_type === type.value
                          ? 'bg-orange-500/20 border border-orange-500/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="attendee_type"
                        value={type.value}
                        checked={formData.attendee_type === type.value}
                        onChange={(e) => setFormData({ ...formData, attendee_type: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${
                        formData.attendee_type === type.value
                          ? 'border-orange-400 bg-orange-400'
                          : 'border-slate-500'
                      }`}>
                        {formData.attendee_type === type.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-slate-200">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 font-medium">
                  {formData.attendee_type === 'student' ? 'Skola' : 'Firma'}
                  <span className="text-slate-500 font-normal"> (volitelne)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={formData.attendee_type === 'student' ? 'Nazov skoly' : 'Nazov firmy'}
                  value={formData.school_or_company}
                  onChange={(e) => setFormData({ ...formData, school_or_company: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !formData.attendee_type}
                className="btn-primary w-full mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registrujem...
                  </span>
                ) : 'Pokracovat na vyber prednasok'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-6 uppercase tracking-wider">Partneri</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {CONFERENCE.PARTNERS.map((partner) => (
              <span key={partner} className="text-slate-400 text-lg font-medium hover:text-white transition-colors">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
