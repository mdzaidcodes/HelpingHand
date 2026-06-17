'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignupChooserPage() {
  return (
    <section className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <span className="chip-warm mb-5 inline-flex">Welcome</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          Join HelpingHand
        </h1>
        <p className="text-lg text-ink-700 mt-4 max-w-xl mx-auto">
          Are you looking for care, or do you wish to give it? Either path begins here.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChoiceCard
          href="/signup/patient"
          delay={0.1}
          eyebrow="I&apos;m looking for care"
          title="I&apos;m a patient"
          body="Tell us about yourself and what you&apos;re looking for. We&apos;ll keep your preferences and health details safe, ready whenever you return."
          highlights={['Personalised matches', 'Your preferences saved', 'A private health profile']}
          cta="Begin as a patient"
        />
        <ChoiceCard
          href="/signup/volunteer"
          delay={0.2}
          eyebrow="I&apos;m here to help"
          title="I&apos;m a volunteer"
          body="Share your story and the kind of support you&apos;d like to offer. Families nearby will find you when your skills match their needs."
          highlights={['Your profile in our community', 'Matched with families nearby', 'Help on your own schedule']}
          cta="Begin as a volunteer"
          variant="warm"
        />
      </div>

      <p className="text-center text-ink-600 mt-10">
        Already with us? <Link href="/login" className="text-brand-700 font-medium hover:underline">Sign in instead</Link>
      </p>
    </section>
  );
}

function ChoiceCard({
  href,
  delay,
  eyebrow,
  title,
  body,
  highlights,
  cta,
  variant = 'brand',
}: {
  href: string;
  delay: number;
  eyebrow: string;
  title: string;
  body: string;
  highlights: string[];
  cta: string;
  variant?: 'brand' | 'warm';
}) {
  const accent = variant === 'warm' ? 'from-warm-100 to-warm-50 border-warm-200' : 'from-brand-50 to-white border-brand-100';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay }}
      whileHover={{ y: -6 }}
    >
      <Link
        href={href}
        className={`block bg-gradient-to-br ${accent} border rounded-3xl p-8 shadow-soft hover:shadow-lift transition`}
      >
        <span className="text-sm font-medium text-brand-700">{eyebrow}</span>
        <h2 className="font-display text-3xl font-semibold text-ink-900 mt-2 mb-4">{title}</h2>
        <p className="text-ink-700 leading-relaxed">{body}</p>
        <ul className="mt-5 space-y-1.5">
          {highlights.map(h => (
            <li key={h} className="flex items-center gap-2 text-ink-800">
              <span className="text-brand-600">✦</span> {h}
            </li>
          ))}
        </ul>
        <div className="mt-7 inline-flex items-center gap-2 text-brand-800 font-semibold">
          {cta} <span>→</span>
        </div>
      </Link>
    </motion.div>
  );
}
