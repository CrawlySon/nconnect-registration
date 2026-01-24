'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, CheckCircle2, XCircle,
  AlertCircle, Loader2, Send
} from 'lucide-react';

interface EmailStatus {
  configured: boolean;
  message: string;
  instructions: string[] | null;
}

export default function AdminEmailTestPage() {
  const router = useRouter();
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('Test User');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
    checkStatus();
  }, [router]);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/admin/email-status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to check email status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Zadaj email adresu' });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/email-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, name: testName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: data.skipped
            ? 'Email nie je nakonfigurovany'
            : data.error || 'Odoslanie zlyhalo',
        });
      } else {
        setResult({
          success: true,
          message: data.message,
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Chyba pri odosielani',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Test emailov
            </h1>
            <p className="text-nconnect-muted mt-1">
              Over, ze emaily sa odosielaju spravne
            </p>
          </div>
        </div>

        {/* Status card */}
        <div className="glass-card mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              status?.configured
                ? 'bg-green-500/20'
                : 'bg-red-500/20'
            }`}>
              {status?.configured ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-semibold ${
                status?.configured ? 'text-green-400' : 'text-red-400'
              }`}>
                {status?.configured ? 'Email nakonfigurovany' : 'Email nie je nakonfigurovany'}
              </h2>
              <p className="text-nconnect-muted text-sm">{status?.message}</p>
            </div>
          </div>

          {status?.instructions && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-white font-medium mb-2">Instrukcie na nastavenie:</h3>
              <ol className="text-nconnect-muted text-sm space-y-1 list-decimal list-inside">
                {status.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Test form */}
        <div className="glass-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Odoslat testovaci email
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nconnect-muted mb-2">
                Email adresa
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-nconnect-muted mb-2">
                Meno (pre personalizaciu)
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Test User"
                className="glass-input"
              />
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-red-500/20 border border-red-500/50'
              }`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSendTest}
              disabled={isSending || !status?.configured}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Odosielam...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Odoslat testovaci email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="glass-panel mt-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-nconnect-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-nconnect-muted text-sm">
                Pre odosielanie emailov pouzivame <strong className="text-white">Resend</strong>.
                Uisti sa, ze mas nastaveny <code className="bg-nconnect-primary px-1 rounded">RESEND_API_KEY</code> v
                subore <code className="bg-nconnect-primary px-1 rounded">.env.local</code>.
              </p>
              <a
                href="https://resend.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-nconnect-accent text-sm hover:underline mt-2 inline-block"
              >
                Resend dokumentacia →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
