'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';
import { LANGUAGES, NATIONALITIES } from '@/lib/options';
import { preferencesToQuery } from '@/lib/match';
import { useSession } from '@/components/auth/SessionProvider';
import { MultiSelectChips } from '@/components/MultiSelectChips';
import {
  EMPTY_PREFERENCES,
  SKILL_LABELS,
  SKILL_DESCRIPTIONS,
  type Preferences,
  type CareSkill,
  type Gender,
  type Availability,
  type Patient,
} from '@/lib/types';

const ALL_LANGUAGES = LANGUAGES;
const ALL_NATIONALITIES = NATIONALITIES;
const ALL_SKILLS = Object.keys(SKILL_LABELS) as CareSkill[];

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function PreferencesPage() {
  const router = useRouter();
  const { session, ready } = useSession();
  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFERENCES);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (session && session.role === 'patient') {
      fetch(`/api/patients/${session.userId}`)
        .then(r => r.json())
        .then((j: { patient?: Patient }) => {
          if (j.patient?.preferences) {
            setPrefs({ ...EMPTY_PREFERENCES, ...j.patient.preferences });
          }
        })
        .catch(() => { /* ignore */ });
    }
  }, [session, ready]);

  function toggleNeed(skill: CareSkill) {
    setPrefs(p => ({ ...p, needs: { ...p.needs, [skill]: !p.needs[skill] } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (session && session.role === 'patient') {
      await fetch(`/api/patients/${session.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      }).catch(() => { /* ignore */ });
    }
    const qs = preferencesToQuery(prefs);
    router.push(`/volunteers${qs ? `?${qs}` : ''}`);
  }

  return (
    <motion.section
      className="max-w-6xl mx-auto"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div variants={sectionVariants} className="mb-10">
        <span className="chip-warm mb-5 inline-flex">Step 1 of 1</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 mb-3 leading-tight">
          Help us understand the <span className="heading-accent text-brand-700">care you need.</span>
        </h1>
        <p className="text-lg text-ink-700">
          Answer only what feels comfortable. Every detail helps us find someone who truly fits.
        </p>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-8">
        <motion.div variants={sectionVariants} className="card space-y-7">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900">About your volunteer</h2>
            <p className="text-ink-600 mt-1">The qualities that make you feel most at ease.</p>
          </div>

          <div className="space-y-7">
            <Field
              label="Languages you'd be comfortable with"
              helper="Type to search, click to add. We'll match volunteers who speak any of these."
            >
              <MultiSelectChips
                options={ALL_LANGUAGES}
                selected={prefs.languages ?? []}
                onChange={langs => setPrefs(p => ({ ...p, languages: langs }))}
                placeholder="Search languages…"
              />
            </Field>

            <Field
              label="Backgrounds or nationalities you'd prefer"
              helper="Type to search, click to add. Leave blank if it doesn't matter."
            >
              <MultiSelectChips
                options={ALL_NATIONALITIES}
                selected={prefs.nationalities ?? []}
                onChange={nats => setPrefs(p => ({ ...p, nationalities: nats }))}
                placeholder="Search nationalities…"
              />
            </Field>

            <div className="grid md:grid-cols-2 gap-7">
              <Field label="Would you prefer a man or a woman?">
                <div className="flex flex-wrap gap-3">
                  {(['Any', 'Female', 'Male'] as const).map(g => (
                    <PillButton
                      key={g}
                      label={g === 'Any' ? 'Either is fine' : g === 'Female' ? 'A woman' : 'A man'}
                      active={(prefs.gender ?? 'Any') === g}
                      onClick={() => setPrefs(p => ({ ...p, gender: g as Gender | 'Any' }))}
                    />
                  ))}
                </div>
              </Field>

              <Field label="How often would you like company?">
                <div className="flex flex-wrap gap-3">
                  {(['Any', 'Hourly', 'Live-in'] as const).map(a => (
                    <PillButton
                      key={a}
                      label={a === 'Any' ? 'Open to both' : a === 'Hourly' ? 'A few hours a day' : 'Living with us'}
                      active={(prefs.availability ?? 'Any') === a}
                      onClick={() => setPrefs(p => ({ ...p, availability: a as Availability | 'Any' }))}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className="card space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900">What support would help most?</h2>
            <p className="text-ink-600 mt-1">Choose anything that applies — no need to choose them all.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_SKILLS.map(s => (
              <motion.label
                key={s}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className={`flex items-start gap-3 p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  prefs.needs[s]
                    ? 'border-brand-400 bg-brand-50 shadow-soft'
                    : 'border-brand-100 bg-white hover:border-brand-200'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-brand-700 mt-0.5 shrink-0"
                  checked={!!prefs.needs[s]}
                  onChange={() => toggleNeed(s)}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-display font-semibold text-ink-900 text-lg block leading-tight">
                    {SKILL_LABELS[s]}
                  </span>
                  <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
                    {SKILL_DESCRIPTIONS[s]}
                  </p>
                </div>
              </motion.label>
            ))}
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setPrefs(EMPTY_PREFERENCES)}
          >
            Start over
          </button>
          <motion.button
            type="submit"
            disabled={submitting}
            className="btn-primary text-lg disabled:opacity-60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? 'Saving…' : 'Show me my matches →'}
          </motion.button>
        </motion.div>
      </form>
    </motion.section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-medium text-ink-900 mb-1.5">{label}</label>
      {helper && <p className="text-sm text-ink-500 mb-2.5">{helper}</p>}
      {children}
    </div>
  );
}


function PillButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`px-6 py-3.5 rounded-2xl border font-medium transition-all duration-200 ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-soft'
          : 'border-brand-100 bg-white text-ink-700 hover:border-brand-200'
      }`}
    >
      <span className="flex items-center gap-2">
        <AnimatePresence>
          {active && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="inline-block w-2 h-2 rounded-full bg-brand-600"
            />
          )}
        </AnimatePresence>
        {label}
      </span>
    </motion.button>
  );
}
