'use client';

import { useState, useEffect } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth === 'true') {
      window.location.href = '/admin/dashboard';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Prihlasenie zlyhalo');
      }

      localStorage.setItem('adminAuth', 'true');
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieco sa pokazilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-white">n</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">Connect</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">26</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Admin Panel</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
          {/* Hidden username field for password managers */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="admin"
            readOnly
            className="sr-only"
            tabIndex={-1}
          />
          <div>
            <label htmlFor="password" className="block text-sm text-slate-300 mb-2 font-medium">Heslo</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Prihlasujem...
              </span>
            ) : 'Prihlasit sa'}
          </button>
        </form>
      </div>
    </div>
  );
}
