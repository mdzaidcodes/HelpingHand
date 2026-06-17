'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      signIn(json.session);
      router.push('/me');
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="chip-warm mb-5 inline-flex">Welcome back</span>
        <h1 className="font-display text-4xl font-semibold text-ink-900 leading-tight">
          Sign back in.
        </h1>
        <p className="text-lg text-ink-700 mt-3 mb-8">
          Your preferences and health details will be right where you left them.
        </p>

        <form onSubmit={submit} className="card space-y-5">
          <div>
            <label className="block font-medium text-ink-900 mb-2">Your email</label>
            <input
              autoFocus
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-warm-50 border border-warm-200 px-4 py-3 text-ink-900 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full text-lg disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>

        <p className="text-center text-ink-600 mt-6">
          New to HelpingHand? <Link href="/signup" className="text-brand-700 font-medium hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </section>
  );
}
