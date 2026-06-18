'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES, NATIONALITIES, NEIGHBORHOODS as NEIGHBORHOODS_LIST } from '@/lib/options';
import { EASE_OUT } from '@/lib/motion-ease';
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
} from '@/lib/types';

const NEIGHBORHOODS = NEIGHBORHOODS_LIST;
const ALL_LANGUAGES = LANGUAGES;
const ALL_NATIONALITIES = NATIONALITIES;
const ALL_SKILLS = Object.keys(SKILL_LABELS) as CareSkill[];

interface Account {
  name: string;
  email: string;
  age?: number;
  neighborhood: string;
}

const stepVariants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.25, ease: EASE_OUT } },
};

export default function PatientSignupPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [account, setAccount] = useState<Account>({ name: '', email: '', neighborhood: '' });
  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleNeed(skill: CareSkill) {
    setPrefs(p => ({ ...p, needs: { ...p.needs, [skill]: !p.needs[skill] } }));
  }

  function withDefaults(a: Account): Account {
    const stamp = Date.now().toString(36);
    const name = a.name.trim() || 'New Member';
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)
      ? a.email.trim()
      : `member-${stamp}@helpinghand.example`;
    const neighborhood = a.neighborhood || 'Al Markaziyah';
    return { ...a, name, email, neighborhood };
  }

  function next() {
    setError(null);
    setAccount(withDefaults);
    setStep(2);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const filled = withDefaults(account);
    setAccount(filled);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filled, preferences: prefs }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      signIn({ userId: json.patient.id, role: 'patient', name: json.patient.name });
      router.push('/me');
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <span className="chip-warm mb-4 inline-flex">Step {step} of 2</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          {step === 1 ? 'Let’s begin with you.' : 'What kind of care helps most?'}
        </h1>
        <p className="text-lg text-ink-700 mt-3">
          {step === 1
            ? 'Just a few details so we can remember you next time.'
            : 'Tell us what feels comfortable. We’ll match you accordingly.'}
        </p>
      </motion.div>

      <ProgressBar step={step} />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" variants={stepVariants} initial="hidden" animate="show" exit="exit" className="card space-y-6 mt-8">
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Your full name">
                <input className="input" placeholder="e.g. Maryam Hassan" value={account.name} onChange={e => setAccount(a => ({ ...a, name: e.target.value }))} />
              </Field>
              <Field label="Your email">
                <input className="input" type="email" placeholder="you@example.com" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />
              </Field>
              <Field label="Your age (optional)">
                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="e.g. 72"
                  value={account.age ?? ''}
                  onChange={e => setAccount(a => ({ ...a, age: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </Field>
              <Field label="Where do you live?">
                <select className="select" value={account.neighborhood} onChange={e => setAccount(a => ({ ...a, neighborhood: e.target.value }))}>
                  <option value="" disabled>Select your neighborhood…</option>
                  {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <p className="text-sm text-ink-500 -mt-2">We&apos;ll use your email to remember you when you return.</p>

            {error && <ErrorBanner message={error} />}

            <div className="flex justify-end gap-3 pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={next} className="btn-primary text-lg">
                Continue →
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="s2" variants={stepVariants} initial="hidden" animate="show" exit="exit" className="space-y-6 mt-8">
            <div className="card space-y-6">
              <h2 className="font-display text-2xl font-semibold text-ink-900">About your volunteer</h2>

              <Field label="Languages you'd be comfortable with">
                <p className="text-sm text-ink-500 mb-2">Type to search, click to add. We'll match volunteers who speak any of these.</p>
                <MultiSelectChips
                  options={ALL_LANGUAGES}
                  selected={prefs.languages ?? []}
                  onChange={langs => setPrefs(p => ({ ...p, languages: langs }))}
                  placeholder="Search languages…"
                />
              </Field>

              <Field label="Backgrounds or nationalities you'd prefer">
                <p className="text-sm text-ink-500 mb-2">Type to search, click to add. Leave blank if it doesn't matter.</p>
                <MultiSelectChips
                  options={ALL_NATIONALITIES}
                  selected={prefs.nationalities ?? []}
                  onChange={nats => setPrefs(p => ({ ...p, nationalities: nats }))}
                  placeholder="Search nationalities…"
                />
              </Field>

              <div className="grid md:grid-cols-2 gap-6">
                <Field label="Would you prefer a man or a woman?">
                  <div className="flex flex-wrap gap-3">
                    {(['Any', 'Female', 'Male'] as const).map(g => (
                      <PillButton key={g} label={g === 'Any' ? 'Either is fine' : g === 'Female' ? 'A woman' : 'A man'}
                        active={(prefs.gender ?? 'Any') === g}
                        onClick={() => setPrefs(p => ({ ...p, gender: g as Gender | 'Any' }))}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="How often would you like company?">
                  <div className="flex flex-wrap gap-3">
                    {(['Any', 'Hourly', 'Live-in'] as const).map(a => (
                      <PillButton key={a} label={a === 'Any' ? 'Open to both' : a === 'Hourly' ? 'A few hours a day' : 'Living with us'}
                        active={(prefs.availability ?? 'Any') === a}
                        onClick={() => setPrefs(p => ({ ...p, availability: a as Availability | 'Any' }))}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-2xl font-semibold text-ink-900">What support would help most?</h2>
              <p className="text-ink-600">Select anything that applies.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_SKILLS.map(s => (
                  <motion.label
                    key={s}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex items-start gap-3 p-5 rounded-2xl border cursor-pointer transition-all ${
                      prefs.needs[s] ? 'border-brand-400 bg-brand-50 shadow-soft' : 'border-brand-100 bg-white hover:border-brand-200'
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
            </div>

            {error && <ErrorBanner message={error} />}

            <div className="flex justify-between gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submit} disabled={submitting} className="btn-primary text-lg disabled:opacity-60">
                {submitting ? 'Saving…' : 'Create my account'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ProgressBar({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-brand-100 overflow-hidden">
        <motion.div
          className="h-full bg-brand-600 rounded-full"
          initial={false}
          animate={{ width: step === 1 ? '50%' : '100%' }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-medium text-ink-900 mb-2">{label}</label>
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
      className={`px-6 py-3.5 rounded-2xl border font-medium transition-all ${
        active ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-soft' : 'border-brand-100 bg-white text-ink-700 hover:border-brand-200'
      }`}
    >
      {label}
    </motion.button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-warm-50 border border-warm-200 px-4 py-3 text-ink-900 text-sm"
    >
      {message}
    </motion.div>
  );
}
