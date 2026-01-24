'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrácia zlyhala');
      }

      // Redirect to session selection with attendee ID
      router.push(`/sessions?attendee=${data.attendeeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Niečo sa pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-nconnect-primary via-nconnect-secondary/20 to-nconnect-primary" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Info */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-nconnect-accent/10 border border-nconnect-accent/30 rounded-full px-4 py-2 text-nconnect-accent text-sm font-medium">
                  <span className="w-2 h-2 bg-nconnect-accent rounded-full animate-pulse" />
                  Registrácia otvorená
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight">
                  IT konferencia
                  <span className="block gradient-text">nConnect26</span>
                </h1>
                
                <p className="text-lg text-nconnect-muted max-w-lg">
                  Pripoj sa k nám na druhom ročníku technologickej konferencie, 
                  ktorá spája študentov s odborníkmi z praxe.
                </p>
              </div>

              {/* Event details */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-nconnect-accent" />
                  </div>
                  <div>
                    <p className="text-white font-medium">26. marca 2026</p>
                    <p className="text-nconnect-muted text-sm">Štvrtok</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-nconnect-accent" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Študentské centrum UKF</p>
                    <p className="text-nconnect-muted text-sm">Nitra</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nconnect-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-nconnect-accent" />
                  </div>
                  <div>
                    <p className="text-white font-medium">14 prednášok</p>
                    <p className="text-nconnect-muted text-sm">2 paralelné stage</p>
                  </div>
                </div>
              </div>

              {/* Partners mention */}
              <div className="pt-4">
                <p className="text-nconnect-muted text-sm mb-3">Hlavní partneri</p>
                <div className="flex items-center gap-6 opacity-70">
                  <span className="text-white font-semibold">GymBeam</span>
                  <span className="text-white font-semibold">Hra bez hraníc</span>
                  <span className="text-white font-semibold">PowerPlay Studio</span>
                </div>
              </div>
            </div>

            {/* Right column - Registration form */}
            <div className="lg:pl-8">
              <div className="bg-nconnect-surface/80 backdrop-blur border border-nconnect-secondary/30 rounded-2xl p-8 shadow-2xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    Zaregistruj sa
                  </h2>
                  <p className="text-nconnect-muted">
                    Vyplň údaje a vyber si prednášky, ktoré chceš navštíviť.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tvoj@email.sk"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                      Meno a priezvisko *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Ján Novák"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
                      Firma / Škola
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Voliteľné"
                      className="input-field"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registrujem...
                      </>
                    ) : (
                      <>
                        Pokračovať na výber prednášok
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-nconnect-muted text-sm">
                  Už si registrovaný?{' '}
                  <a href="/login" className="text-nconnect-accent hover:underline">
                    Prihlásiť sa
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
