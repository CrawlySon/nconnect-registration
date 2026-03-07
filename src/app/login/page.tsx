'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prihlásenie zlyhalo');
      }

      router.push(`/sessions?attendee=${data.attendeeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Niečo sa pokazilo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-nconnect-surface/80 backdrop-blur border border-nconnect-secondary/30 rounded-2xl p-8 shadow-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-nconnect-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Späť na registráciu
          </Link>

          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-nconnect-accent/10 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-nconnect-accent" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              Prihlásenie
            </h1>
            <p className="text-nconnect-muted">
              Zadaj email a heslo, ktoré si použil/a pri registrácii.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tvoj@email.sk"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Heslo
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tvoje heslo"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nconnect-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  Overujem...
                </>
              ) : (
                <>
                  Prihlásiť sa
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-nconnect-muted text-sm">
            Ešte nemáš registráciu?{' '}
            <Link href="/" className="text-nconnect-accent hover:underline">
              Zaregistrovať sa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
