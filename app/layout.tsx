import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'HelpingHand — Care that feels like family',
  description: 'Thoughtful, personal eldercare. Meet volunteers chosen with you in mind.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SessionProvider>
          <Sidebar />
          <main className="md:pl-64 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">
              {children}
            </div>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
