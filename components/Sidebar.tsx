'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './auth/SessionProvider';
import { Avatar } from './Avatar';
import { EASE_OUT } from '@/lib/motion-ease';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const PATIENT_LINKS: NavLink[] = [
  { href: '/me',           label: 'My space',        icon: <HomeIcon /> },
  { href: '/volunteers',   label: 'Meet volunteers', icon: <PeopleIcon /> },
  { href: '/me/requests',  label: 'My requests',     icon: <ChatIcon /> },
  { href: '/preferences',  label: 'Preferences',     icon: <SlidersIcon /> },
  { href: '/me/health',    label: 'Health profile',  icon: <HeartIcon /> },
  { href: '/forum',        label: 'Forum',           icon: <ForumIcon /> },
];

const VOLUNTEER_LINKS: NavLink[] = [
  { href: '/me',          label: 'My profile',      icon: <HomeIcon /> },
  { href: '/volunteers',  label: 'Community',       icon: <PeopleIcon /> },
  { href: '/training',    label: 'Training',        icon: <BookIcon /> },
  { href: '/interview',   label: 'Interview',       icon: <CalendarIcon /> },
  { href: '/forum',       label: 'Forum',           icon: <ForumIcon /> },
];

const GUEST_LINKS: NavLink[] = [
  { href: '/',            label: 'Home',                icon: <HomeIcon /> },
  { href: '/volunteers',  label: 'Browse volunteers',   icon: <PeopleIcon /> },
];

export function Sidebar() {
  const { session, ready, signOut } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = !session
    ? GUEST_LINKS
    : session.role === 'patient'
      ? PATIENT_LINKS
      : VOLUNTEER_LINKS;

  function handleSignOut() {
    signOut();
    setMobileOpen(false);
    router.push('/');
  }

  function close() { setMobileOpen(false); }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  const navContent = (
    <>
      {/* Brand */}
      <Link
        href="/"
        onClick={close}
        className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-brand-100/60"
      >
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-lg shadow-soft">
          ♥
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg font-semibold text-ink-900">HelpingHand</span>
          <span className="text-xs text-ink-500 -mt-0.5">Care, with heart</span>
        </div>
      </Link>

      {/* Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(link => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                active
                  ? 'bg-brand-50 text-brand-800 font-semibold shadow-soft'
                  : 'text-ink-700 hover:bg-brand-50/60'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-accent"
                  className="absolute left-1.5 top-2.5 bottom-2.5 w-1 bg-brand-700 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`w-5 h-5 flex items-center justify-center ${active ? 'text-brand-700' : 'text-ink-500'}`}>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Account */}
      <div className="border-t border-brand-100/60 p-4">
        {!ready ? (
          <div className="h-12" />
        ) : session ? (
          <div className="space-y-2">
            <Link
              href="/me"
              onClick={close}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-brand-50/60 transition"
            >
              <Avatar name={session.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-900 truncate">{session.name}</p>
                <p className="text-xs text-ink-500 capitalize">{session.role}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-3 py-2 text-sm font-medium text-ink-500 hover:text-ink-900 hover:bg-brand-50/60 rounded-xl transition text-left flex items-center gap-2"
            >
              <SignOutIcon /> Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={close}
              className="btn-ghost w-full justify-center text-sm py-2.5 px-4"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={close}
              className="btn-primary w-full justify-center text-sm py-2.5 px-4"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-100/60 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold shadow-soft">♥</span>
          <span className="font-display text-lg font-semibold text-ink-900">HelpingHand</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 rounded-xl hover:bg-brand-50 flex items-center justify-center text-ink-700"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: EASE_OUT }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 bg-white border-r border-brand-100/60 z-50 flex flex-col shadow-lift"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-brand-100/60 flex-col z-20">
        {navContent}
      </aside>
    </>
  );
}

/* ---------- inline SVG icons ---------- */

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
