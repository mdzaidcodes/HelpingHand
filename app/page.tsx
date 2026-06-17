import Link from 'next/link';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { HoverLift } from '@/components/motion/HoverLift';

const steps = [
  {
    n: '01',
    title: 'Share a little about you',
    body: 'A few thoughtful questions about language, comfort, and the kind of company you enjoy.',
  },
  {
    n: '02',
    title: 'Meet volunteers chosen for you',
    body: 'We gently rank volunteers whose warmth, skills, and background fit yours.',
  },
  {
    n: '03',
    title: 'Welcome someone you trust',
    body: 'Read their story, their languages, and what families have said before you decide.',
  },
];

const values = [
  { icon: '🌿', title: 'Gentle pace', body: 'No rushing. No noise. Just the people who feel right.' },
  { icon: '🤝', title: 'Cultural comfort', body: 'Volunteers who share your language and your traditions.' },
  { icon: '🪶', title: 'Quiet dignity', body: 'Built around your routine, not the other way around.' },
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-grain border border-brand-100/60 px-8 py-20 md:px-16 md:py-28">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        <div className="relative max-w-3xl">
          <Reveal>
            <span className="chip-warm mb-6 inline-flex">A new chapter of care</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-4xl md:text-6xl font-semibold text-ink-900 leading-[1.05]">
              Care that feels <span className="heading-accent text-brand-700">like family.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-ink-700 mt-7 max-w-2xl leading-relaxed">
              HelpingHand introduces you to volunteers who speak your language,
              understand your customs, and bring the kind of warmth that turns
              a house back into a home.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link href="/preferences" className="btn-primary text-lg">
                Begin your search
              </Link>
              <Link href="/volunteers" className="btn-ghost text-lg">
                Meet our volunteers
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section>
        <Reveal>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 text-center mb-4">
            A simple, unhurried path
          </h2>
          <p className="text-ink-600 text-center max-w-xl mx-auto mb-12">
            Three small steps, taken at your own pace.
          </p>
        </Reveal>
        <Stagger className="grid md:grid-cols-3 gap-6">
          {steps.map(s => (
            <StaggerItem key={s.n}>
              <HoverLift className="card h-full">
                <div className="font-display text-brand-600 text-2xl mb-3">{s.n}</div>
                <h3 className="font-display text-xl font-semibold text-ink-900 mb-2">{s.title}</h3>
                <p className="text-ink-600 leading-relaxed">{s.body}</p>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Values */}
      <section className="bg-brand-50/60 rounded-3xl px-8 py-16 md:px-14 border border-brand-100/60">
        <Reveal>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 text-center mb-12">
            What you can expect
          </h2>
        </Reveal>
        <Stagger className="grid md:grid-cols-3 gap-8">
          {values.map(v => (
            <StaggerItem key={v.title} className="text-center">
              <div className="text-4xl mb-3">{v.icon}</div>
              <h3 className="font-display text-xl font-semibold text-ink-900 mb-2">{v.title}</h3>
              <p className="text-ink-700">{v.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Closing call */}
      <section>
        <Reveal>
          <div className="card-elevated text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-900 mb-3">
              Ready when you are.
            </h2>
            <p className="text-ink-600 text-lg mb-8">
              Tell us what matters most, and we&apos;ll do the rest — gently.
            </p>
            <Link href="/preferences" className="btn-primary text-lg">
              Find my volunteer
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
