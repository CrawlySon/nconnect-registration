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
    <div className="min-h-screen bg-surface-dark">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-ai-stage/10" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="text-primary">nConnect</span>
            <span className="text-ai-stage">26</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">
            {CONFERENCE.DATE_DISPLAY}
          </p>
          <p className="text-lg text-gray-400 mb-8">
            {CONFERENCE.VENUE}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="px-4 py-2 bg-surface-light rounded-full">7 casovych slotov</span>
            <span className="px-4 py-2 bg-surface-light rounded-full">2 stages</span>
            <span className="px-4 py-2 bg-surface-light rounded-full">14 prednasok</span>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-center mb-6">Registracia</h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Meno a priezvisko *</label>
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
                <label className="block text-sm text-gray-400 mb-2">Email *</label>
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
                <label className="block text-sm text-gray-400 mb-2">Som *</label>
                <div className="space-y-2">
                  {ATTENDEE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.attendee_type === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 hover:border-gray-600'
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
                      <span className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                        formData.attendee_type === type.value
                          ? 'border-primary'
                          : 'border-gray-600'
                      }`}>
                        {formData.attendee_type === type.value && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </span>
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {formData.attendee_type === 'student' ? 'Skola' : 'Firma'} (volitelne)
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
                className="btn-primary w-full"
              >
                {loading ? 'Registrujem...' : 'Registrovat sa'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-lg text-gray-400 mb-8">Partneri</h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {CONFERENCE.PARTNERS.map((partner) => (
              <span key={partner} className="text-xl font-semibold text-gray-500">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
