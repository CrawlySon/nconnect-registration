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
      <body className="min-h-screen">
        {children}
        <footer className="border-t border-secondary/30 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-muted text-sm">
            <p>
              © nConnect26 • Fakulta prirodnych vied a informatiky UKF •{' '}
              <a href="mailto:info@nconnect.sk" className="text-accent hover:underline">
                info@nconnect.sk
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
