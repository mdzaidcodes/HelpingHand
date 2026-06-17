'use client';

import dynamic from 'next/dynamic';
import type { MatchResult } from '@/lib/match';
import type { UserLocation } from '@/lib/geo';
import { VolunteerCard } from './VolunteerCard';
import { Stagger } from './motion/Stagger';
import { Reveal } from './motion/Reveal';

const VolunteerMap = dynamic(
  () => import('./VolunteerMap').then(m => m.VolunteerMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl h-[560px] bg-brand-50/60 border border-brand-100/60 flex items-center justify-center text-ink-500">
        Loading map…
      </div>
    ),
  },
);

interface VolunteersViewProps {
  results: MatchResult[];
  user: UserLocation;
}

export function VolunteersView({ results, user }: VolunteersViewProps) {
  return (
    <div className="space-y-10">
      <Reveal>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink-900">
              Volunteers near you
            </h2>
            <p className="text-ink-600 text-sm">
              Centered on <span className="font-medium text-ink-900">{user.neighborhood}, {user.city}</span>
            </p>
          </div>
          <VolunteerMap results={results} user={user} />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="space-y-5">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink-900">
            All matches, in detail
          </h2>
          <Stagger className="grid md:grid-cols-2 gap-6">
            {results.map(r => (
              <VolunteerCard key={r.volunteer.id} result={r} />
            ))}
          </Stagger>
        </div>
      </Reveal>
    </div>
  );
}
