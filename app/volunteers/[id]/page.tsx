import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findVolunteerById } from '@/lib/store';
import { preferencesFromQuery, scoreVolunteer } from '@/lib/match';
import { SKILL_LABELS, type CareSkill } from '@/lib/types';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Avatar } from '@/components/Avatar';
import { RequestButton } from '@/components/RequestModal';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function VolunteerDetailPage({ params, searchParams }: PageProps) {
  const volunteer = await findVolunteerById(params.id);
  if (!volunteer) return notFound();

  const prefs = preferencesFromQuery(searchParams);
  const result = scoreVolunteer(volunteer, prefs);
  const skills = (Object.keys(volunteer.skills) as CareSkill[]).filter(k => volunteer.skills[k]);

  const backHref = `/volunteers?${new URLSearchParams(
    Object.entries(searchParams).reduce<Record<string, string>>((acc, [k, v]) => {
      if (typeof v === 'string') acc[k] = v;
      return acc;
    }, {})
  ).toString()}`;

  const firstName = volunteer.name.split(' ')[0];

  return (
    <article className="max-w-4xl mx-auto space-y-10">
      <Reveal y={8}>
        <Link href={backHref} className="text-brand-700 hover:text-brand-800 font-medium inline-flex items-center gap-1.5">
          ← Back to volunteers
        </Link>
      </Reveal>

      <Reveal>
        <header className="card-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-grain pointer-events-none opacity-60" />
          <div className="relative flex flex-col md:flex-row gap-7 items-start">
            <div className="mx-auto md:mx-0">
              <Avatar name={volunteer.name} src={volunteer.photo} size="2xl" />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink-900">
                  {volunteer.name}
                </h1>
                {result.matchPercent > 0 && (
                  <span className="chip-warm text-base">{result.matchPercent}% match</span>
                )}
              </div>
              <p className="text-ink-600 text-lg">
                {volunteer.gender} · {volunteer.age} years old · {volunteer.nationality} · {volunteer.city}
              </p>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-warm-500 text-xl">★</span>
                <span className="text-lg font-semibold text-ink-900">{volunteer.rating.toFixed(1)}</span>
                <span className="text-ink-500">· {volunteer.reviewCount} families have welcomed {volunteer.gender === 'Female' ? 'her' : 'him'}</span>
              </div>
              <p className="font-display text-xl text-ink-900 pt-2">
                <span className="text-brand-700 font-medium">{volunteer.availability}</span>
                <span className="mx-3 text-ink-300">·</span>
                <span className="text-ink-700">{volunteer.yearsExperience} years of experience</span>
              </p>
            </div>
          </div>
        </header>
      </Reveal>

      {result.reasons.length > 0 && (
        <Reveal delay={0.1}>
          <section className="card bg-brand-50/70 border-brand-200">
            <h2 className="font-display text-xl font-semibold mb-3 text-brand-800">
              Why we thought of {volunteer.gender === 'Female' ? 'her' : 'him'} for you
            </h2>
            <ul className="space-y-1.5">
              {result.reasons.map(r => (
                <li key={r} className="text-brand-900 flex items-start gap-2">
                  <span className="text-brand-600 mt-0.5">✦</span> {r}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <section className="card">
          <h2 className="font-display text-2xl font-semibold mb-3 text-ink-900">A note from {firstName}</h2>
          <p className="text-ink-700 leading-relaxed text-lg">{volunteer.bio}</p>
        </section>
      </Reveal>

      <Stagger className="grid md:grid-cols-2 gap-6">
        <StaggerItem>
          <section className="card h-full">
            <h2 className="font-display text-xl font-semibold mb-4 text-ink-900">Languages spoken</h2>
            <div className="flex flex-wrap gap-2">
              {volunteer.languages.map(l => <span key={l} className="chip">{l}</span>)}
            </div>
          </section>
        </StaggerItem>
        <StaggerItem>
          <section className="card h-full">
            <h2 className="font-display text-xl font-semibold mb-4 text-ink-900">Training & certifications</h2>
            <div className="flex flex-wrap gap-2">
              {volunteer.certifications.map(c => <span key={c} className="chip-warm">{c}</span>)}
            </div>
          </section>
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.1}>
        <section className="card">
          <h2 className="font-display text-2xl font-semibold mb-5 text-ink-900">How {firstName} can help</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {skills.map(s => (
              <div key={s} className="flex items-center gap-3 p-3 rounded-2xl bg-brand-50/60 border border-brand-100/60">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-sm">✓</span>
                <span className="text-ink-900 font-medium">{SKILL_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Reviews */}
      <Reveal delay={0.05}>
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-3xl font-semibold text-ink-900">
              What families say
            </h2>
            <div className="flex items-center gap-1.5 text-ink-700">
              <span className="text-warm-500 text-xl">★</span>
              <span className="font-semibold text-ink-900 text-lg">{volunteer.rating.toFixed(1)}</span>
              <span className="text-ink-500">· {volunteer.reviewCount} reviews</span>
            </div>
          </div>
          <Stagger className="grid md:grid-cols-2 gap-5">
            {volunteer.reviews.map((review, i) => (
              <StaggerItem key={`${review.author}-${i}`}>
                <article className="card h-full flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg font-semibold text-ink-900">{review.author}</p>
                      <p className="text-ink-500 text-sm">{review.relation} · {review.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={idx < review.rating ? 'text-warm-500' : 'text-stone-200'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-ink-700 leading-relaxed italic">“{review.text}”</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <div className="sticky bottom-4 flex justify-center md:justify-end">
        <RequestButton volunteer={{ id: volunteer.id, name: volunteer.name, neighborhood: volunteer.neighborhood, photo: volunteer.photo }} />
      </div>
    </article>
  );
}
