import Link from 'next/link';
import { readVolunteers } from '@/lib/store';
import { preferencesFromQuery, rankVolunteers } from '@/lib/match';
import { Reveal } from '@/components/motion/Reveal';
import { VolunteersView } from '@/components/VolunteersView';
import {
  SKILL_LABELS,
  readPreferredLanguages,
  readPreferredNationalities,
  type CareSkill,
} from '@/lib/types';
import { USER_LOCATION } from '@/lib/geo';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function VolunteersPage({ searchParams }: PageProps) {
  const prefs = preferencesFromQuery(searchParams);
  const volunteers = await readVolunteers();
  // Only show volunteers who have completed onboarding.
  const ready = volunteers.filter(v => v.interview?.status === 'completed' && v.rating > 0);
  const ranked = rankVolunteers(ready, prefs);

  const wantedLangs = readPreferredLanguages(prefs);
  const wantedNats = readPreferredNationalities(prefs);

  const hasPrefs =
    wantedLangs.length > 0 ||
    (prefs.gender && prefs.gender !== 'Any') ||
    wantedNats.length > 0 ||
    (prefs.availability && prefs.availability !== 'Any') ||
    Object.values(prefs.needs).some(Boolean);

  const activePrefs: string[] = [];
  for (const l of wantedLangs) activePrefs.push(l);
  if (prefs.gender && prefs.gender !== 'Any') {
    activePrefs.push(prefs.gender === 'Female' ? 'A woman' : 'A man');
  }
  for (const n of wantedNats) activePrefs.push(n);
  if (prefs.availability && prefs.availability !== 'Any') {
    activePrefs.push(prefs.availability === 'Hourly' ? 'A few hours a day' : 'Living with us');
  }
  for (const k of Object.keys(prefs.needs) as CareSkill[]) {
    if (prefs.needs[k]) activePrefs.push(SKILL_LABELS[k]);
  }

  return (
    <section className="space-y-10">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <span className="chip-warm mb-4 inline-flex">
              {hasPrefs ? 'Personally chosen for you' : 'Our community of volunteers'}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
              {hasPrefs ? 'These volunteers feel like a good fit.' : 'Meet our volunteers.'}
            </h1>
            <p className="text-ink-600 mt-3 text-lg">
              {ranked.length} {hasPrefs ? 'thoughtfully ranked' : 'gentle, experienced'} volunteer
              {ranked.length === 1 ? '' : 's'}
              {hasPrefs ? ', closest match first.' : ' ready to meet you.'}
            </p>
          </div>
          <Link href="/preferences" className="btn-ghost whitespace-nowrap">
            {hasPrefs ? 'Refine my preferences' : 'Share my preferences'}
          </Link>
        </div>
      </Reveal>

      {hasPrefs && activePrefs.length > 0 && (
        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-500 text-sm font-medium mr-1">You said:</span>
            {activePrefs.map(p => (
              <span key={p} className="chip">{p}</span>
            ))}
          </div>
        </Reveal>
      )}

      <VolunteersView results={ranked} user={USER_LOCATION} />
    </section>
  );
}
