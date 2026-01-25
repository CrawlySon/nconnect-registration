import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'nConnect26 - IT konferencia',
  description: 'Registracia na IT konferenciu nConnect26 - 26. marca 2026, Studentske centrum UKF Nitra',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body className="min-h-screen relative overflow-x-hidden">
        {/* Background orbs */}
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p>
              © nConnect26 · Fakulta prirodnych vied a informatiky UKF ·{' '}
              <a href="mailto:info@nconnect.sk" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                info@nconnect.sk
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
