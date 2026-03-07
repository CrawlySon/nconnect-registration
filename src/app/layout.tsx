import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'nConnect26 | Registrácia',
  description: 'Registračný systém pre IT konferenciu nConnect26 v Nitre',
  keywords: ['nConnect', 'IT konferencia', 'Nitra', 'UKF', 'registrácia'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'nConnect26 | Registrácia',
    description: 'Zaregistruj sa na IT konferenciu nConnect26 - 26. marca 2026 v Nitre',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk">
      <body className="min-h-screen bg-nconnect-primary">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-nconnect-secondary/30 bg-nconnect-primary/80 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-3">
                  <img
                    src="/nconnect26 logo medium vertical white.png"
                    alt="nConnect26"
                    className="h-12 w-auto"
                  />
                </a>
                
                <nav className="hidden sm:flex items-center gap-6">
                  <a href="https://nconnect.sk" target="_blank" rel="noopener noreferrer" className="text-nconnect-muted hover:text-white transition-colors text-sm">
                    O konferencii
                  </a>
                  <a href="https://nconnect.sk/speakri" target="_blank" rel="noopener noreferrer" className="text-nconnect-muted hover:text-white transition-colors text-sm">
                    Speakri
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-nconnect-secondary/30 bg-nconnect-surface/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-nconnect-muted text-sm">
                  <span>© 2026 nConnect</span>
                  <span>•</span>
                  <span>Fakulta prírodných vied a informatiky UKF</span>
                </div>
                <div className="flex items-center gap-4">
                  <a href="mailto:info@nconnect.sk" className="text-nconnect-muted hover:text-nconnect-accent transition-colors text-sm">
                    info@nconnect.sk
                  </a>
                  <a href="/admin" className="text-nconnect-muted/30 hover:text-nconnect-muted transition-colors text-xs">
                    admin
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
