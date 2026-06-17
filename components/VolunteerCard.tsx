'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { MatchResult } from '@/lib/match';
import { SKILL_LABELS } from '@/lib/types';
import { EASE_OUT } from '@/lib/motion-ease';
import { Avatar } from './Avatar';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

export function VolunteerCard({ result }: { result: MatchResult }) {
  const { volunteer, matchPercent, reasons } = result;
  const topSkills = (Object.keys(volunteer.skills) as Array<keyof typeof volunteer.skills>)
    .filter(k => volunteer.skills[k])
    .slice(0, 3);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
    >
      <Link
        href={`/volunteers/${volunteer.id}`}
        className="card hover:shadow-lift hover:border-brand-200 transition-all duration-200 flex flex-col gap-5 h-full"
      >
        <div className="flex items-start gap-4">
          <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.3 }}>
            <Avatar name={volunteer.name} src={volunteer.photo} size="lg" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl font-semibold text-ink-900 truncate">
                {volunteer.name}
              </h3>
              <motion.span
                className="chip-warm whitespace-nowrap"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                {matchPercent}% match
              </motion.span>
            </div>
            <p className="text-ink-600 text-sm mt-1.5">
              {volunteer.nationality} · {volunteer.gender} · {volunteer.yearsExperience} years of experience
            </p>
            <p className="text-ink-600 text-sm">
              Speaks {volunteer.languages.join(', ')}
            </p>
          </div>
        </div>

        <p className="text-ink-700 leading-relaxed line-clamp-2">{volunteer.bio}</p>

        <div className="flex flex-wrap gap-2">
          {topSkills.map(s => (
            <span key={s} className="chip">{SKILL_LABELS[s]}</span>
          ))}
        </div>

        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-brand-100/60 pt-4">
            {reasons.slice(0, 4).map(r => (
              <span key={r} className="text-sm text-brand-700 font-medium">✦ {r}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-brand-100/60 pt-4 mt-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-warm-500 text-lg">★</span>
            <span className="font-semibold text-ink-900">{volunteer.rating.toFixed(1)}</span>
            <span className="text-ink-500 text-sm">· {volunteer.reviewCount} families</span>
          </div>
          <span className="chip-muted">{volunteer.availability}</span>
        </div>
      </Link>
    </motion.div>
  );
}
