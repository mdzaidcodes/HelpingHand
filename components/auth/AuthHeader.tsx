'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './SessionProvider';

export function AuthHeader() {
  const { session, ready, signOut } = useSession();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!ready ? (
        <motion.div key="ph" className="w-44 h-10" />
      ) : session ? (
        <motion.div
          key="in"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-2"
        >
          <Link href="/volunteers" className="hidden sm:inline text-ink-700 hover:text-brand-700 font-medium px-3">
            Meet volunteers
          </Link>
          {session.role === 'patient' && (
            <>
              <Link href="/me/requests" className="hidden md:inline text-ink-700 hover:text-brand-700 font-medium px-3">
                My requests
              </Link>
              <Link href="/me/health" className="hidden md:inline text-ink-700 hover:text-brand-700 font-medium px-3">
                My health
              </Link>
            </>
          )}
          <Link href="/me" className="btn-ghost">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-semibold text-sm mr-2">
              {session.name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{session.name.split(' ')[0]}</span>
          </Link>
          <button onClick={handleSignOut} className="text-ink-500 hover:text-ink-900 px-3 py-2 text-sm font-medium">
            Sign out
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="out"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-2"
        >
          <Link href="/volunteers" className="hidden sm:inline text-ink-700 hover:text-brand-700 font-medium px-3">
            Meet volunteers
          </Link>
          <Link href="/login" className="text-ink-700 hover:text-brand-700 font-medium px-3 py-2">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Sign up
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
