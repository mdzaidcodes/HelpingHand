'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';

export interface CarouselUpdate {
  id: string;
  eyebrow: string;
  icon: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  tone?: 'brand' | 'warm';
}

export const PATIENT_UPDATES: CarouselUpdate[] = [
  {
    id: 'p-1',
    eyebrow: 'Community',
    icon: '✦',
    title: '3 new verified volunteers in Khalidiyah',
    body: 'Reema, Karthik, and Hala finished their interviews this week and are open to new families nearby.',
    cta: { label: 'See who\'s new', href: '/volunteers' },
    tone: 'brand',
  },
  {
    id: 'p-2',
    eyebrow: 'Reminder',
    icon: '♡',
    title: 'A complete health profile helps in moments that count',
    body: 'Adding emergency contacts and your full medication list helps the right people reach you quickly.',
    cta: { label: 'Update profile', href: '/me/health' },
    tone: 'warm',
  },
  {
    id: 'p-3',
    eyebrow: 'Event',
    icon: '☕',
    title: 'Family meet-and-greet next Saturday',
    body: 'Drop in at the Cultural Foundation from 4–6 PM to meet other HelpingHand families and the team.',
    cta: { label: 'Learn more', href: '#' },
    tone: 'brand',
  },
  {
    id: 'p-4',
    eyebrow: 'New feature',
    icon: '📅',
    title: 'Weekly schedules just got smarter',
    body: 'When you reach out to a volunteer, you can now request specific days and hours that suit your week.',
    cta: { label: 'Try it', href: '/volunteers' },
    tone: 'warm',
  },
  {
    id: 'p-5',
    eyebrow: 'Wellness tip',
    icon: '🌿',
    title: 'Short morning walks lower fall risk',
    body: 'Even 10 minutes outdoors with a steady companion can keep balance sharp. Mention it to your volunteer.',
    tone: 'brand',
  },
];

export const VOLUNTEER_UPDATES: CarouselUpdate[] = [
  {
    id: 'v-1',
    eyebrow: 'Community',
    icon: '✦',
    title: 'You have new families looking for help',
    body: 'Check your notifications — fresh requests come in throughout the week.',
    cta: { label: 'Open notifications', href: '/me' },
    tone: 'brand',
  },
  {
    id: 'v-2',
    eyebrow: 'Training tip',
    icon: '📚',
    title: 'Refresher: easing distress in dementia care',
    body: 'A short 10-minute refresher on validation techniques. Available in the training library.',
    cta: { label: 'Visit training', href: '/training' },
    tone: 'warm',
  },
  {
    id: 'v-3',
    eyebrow: 'Recognition',
    icon: '🌿',
    title: 'You\'ve been with HelpingHand for a while',
    body: 'Thank you. The hours you give become whole afternoons for the families you support.',
    tone: 'brand',
  },
  {
    id: 'v-4',
    eyebrow: 'Event',
    icon: '☕',
    title: 'Volunteers\' breakfast — last Sunday of the month',
    body: 'Meet other volunteers and the HelpingHand team over breakfast in Al Bateen. All welcome.',
    cta: { label: 'Learn more', href: '#' },
    tone: 'warm',
  },
];

interface NotificationCarouselProps {
  updates?: CarouselUpdate[];
  className?: string;
}

export function NotificationCarousel({
  updates = PATIENT_UPDATES,
  className = '',
}: NotificationCarouselProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (updates.length <= 1) return;
    const id = setInterval(() => {
      setIdx(i => (i + 1) % updates.length);
    }, 6000);
    return () => clearInterval(id);
  }, [updates.length]);

  if (updates.length === 0) return null;
  const current = updates[idx];
  const iconBg =
    current.tone === 'warm'
      ? 'bg-gradient-to-br from-warm-100 to-warm-200 border-warm-300 text-warm-500'
      : 'bg-gradient-to-br from-brand-100 to-brand-200 border-brand-200 text-brand-800';

  return (
    <div className={`relative card-elevated overflow-hidden p-0 ${className}`}>
      <div className="absolute inset-0 bg-hero-grain pointer-events-none opacity-50" />

      <div className="relative px-5 py-6 sm:px-7 sm:py-8 md:px-10 md:py-10 min-h-[230px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="flex flex-col md:flex-row items-start gap-4 md:gap-5"
          >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border shadow-soft shrink-0 ${iconBg}`}>
              {current.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1.5">
                {current.eyebrow}
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 leading-tight mb-2">
                {current.title}
              </h3>
              <p className="text-ink-700 leading-relaxed max-w-prose text-sm sm:text-base">{current.body}</p>
              {current.cta && (
                <Link
                  href={current.cta.href}
                  className="inline-flex items-center gap-1.5 mt-4 text-brand-700 font-semibold hover:text-brand-800"
                >
                  {current.cta.label} <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls strip */}
      <div className="relative px-5 sm:px-7 pb-4 sm:pb-5 pt-2 flex items-center justify-between border-t border-brand-100/60">
        <div className="flex items-center gap-1.5">
          {updates.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to update ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? 'w-8 bg-brand-700' : 'w-1.5 bg-brand-200 hover:bg-brand-300'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIdx(i => (i - 1 + updates.length) % updates.length)}
            aria-label="Previous update"
            className="w-9 h-9 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-800 flex items-center justify-center text-lg transition"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIdx(i => (i + 1) % updates.length)}
            aria-label="Next update"
            className="w-9 h-9 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-800 flex items-center justify-center text-lg transition"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
