import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { AuthHeader } from '@/components/auth/AuthHeader';

export const metadata: Metadata = {
  title: 'HelpingHand — Care that feels like family',
  description: 'Thoughtful, personal eldercare. Meet volunteers chosen with you in mind.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SessionProvider>
          <header className="bg-white/70 backdrop-blur-md border-b border-brand-100/60 sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-lg shadow-soft">
                  ♥
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-xl font-semibold text-ink-900">HelpingHand</span>
                  <span className="text-xs text-ink-500 -mt-0.5">Care, with heart</span>
                </div>
              </Link>
              <nav className="flex items-center gap-2">
                <AuthHeader />
              </nav>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-6 py-12">{children}</main>
          <footer className="max-w-6xl mx-auto px-6 py-10 text-ink-500 text-sm border-t border-brand-100/60 mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>© HelpingHand — A gentle way to find care.</span>
              <span className="text-ink-500">Made with care · Rough draft</span>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
