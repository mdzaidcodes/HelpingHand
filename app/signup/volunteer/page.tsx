'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';
import { useSession } from '@/components/auth/SessionProvider';
import { SKILL_LABELS, type CareSkill, type Gender, type Availability } from '@/lib/types';

const NEIGHBORHOODS = [
  'Khalidiyah', 'Al Bateen', 'Al Markaziyah', 'Corniche', 'Al Mushrif',
  'Al Karamah', 'Reem Island', 'Saadiyat Island', 'Yas Island',
  'Khalifa City', 'Mussafah', 'MBZ City',
];

const COMMON_LANGUAGES = ['Arabic', 'English', 'Hindi', 'Urdu', 'Tagalog', 'Russian', 'French', 'Swahili', 'Gujarati', 'Bengali'];
const COMMON_NATIONALITIES = ['Emirati', 'Filipino', 'Indian', 'Pakistani', 'Egyptian', 'Jordanian', 'Lebanese', 'Russian', 'Kenyan', 'Nigerian', 'British'];
const ALL_SKILLS = Object.keys(SKILL_LABELS) as CareSkill[];

const noSkills: Record<CareSkill, boolean> = {
  mobilitySupport: false,
  medicationManagement: false,
  mealPreparation: false,
  companionship: false,
  personalCare: false,
  dementiaCare: false,
  postSurgeryCare: false,
};

interface Form {
  name: string;
  email: string;
  age?: number;
  gender: Gender;
  nationality: string;
  languages: string[];
  yearsExperience: number;
  bio: string;
  skills: Record<CareSkill, boolean>;
  availability: Availability;
  certifications: string[];
  neighborhood: string;
}

const stepVariants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.25, ease: EASE_OUT } },
};

export default function VolunteerSignupPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<Form>({
    name: '', email: '', gender: 'Female', nationality: 'Emirati',
    languages: ['English'], yearsExperience: 0, bio: '',
    skills: { ...noSkills }, availability: 'Hourly', certifications: [], neighborhood: 'Khalidiyah',
  });
  const [certInput, setCertInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleLanguage(l: string) {
    setForm(f => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter(x => x !== l) : [...f.languages, l] }));
  }
  function toggleSkill(s: CareSkill) {
    setForm(f => ({ ...f, skills: { ...f.skills, [s]: !f.skills[s] } }));
  }
  function addCert() {
    const c = certInput.trim();
    if (!c) return;
    setForm(f => ({ ...f, certifications: [...f.certifications, c] }));
    setCertInput('');
  }
  function removeCert(c: string) {
    setForm(f => ({ ...f, certifications: f.certifications.filter(x => x !== c) }));
  }

  function next() {
    setError(null);
    if (!form.name.trim()) { setError('Please tell us your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email.'); return; }
    if (form.languages.length === 0) { setError('Please choose at least one language you speak.'); return; }
    setStep(2);
  }

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      signIn({ userId: json.volunteer.id, role: 'volunteer', name: json.volunteer.name });
      router.push('/me');
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <span className="chip-warm mb-4 inline-flex">Step {step} of 2 · Volunteer</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          {step === 1 ? 'Tell us about you.' : 'Share how you can help.'}
        </h1>
        <p className="text-lg text-ink-700 mt-3">
          {step === 1 ? 'The basics, so families can find you.' : 'Your skills, your availability, your story.'}
        </p>
      </motion.div>

      <div className="flex-1 h-1.5 rounded-full bg-brand-100 overflow-hidden mb-8">
        <motion.div className="h-full bg-brand-600 rounded-full" initial={false} animate={{ width: step === 1 ? '50%' : '100%' }} transition={{ duration: 0.4, ease: EASE_OUT }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" variants={stepVariants} initial="hidden" animate="show" exit="exit" className="card space-y-6">
            <Field label="Your full name">
              <input className="input" placeholder="e.g. Maria Santos" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Your email">
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Your age (optional)">
                <input className="input" type="number" min={18} value={form.age ?? ''} onChange={e => setForm(f => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))} />
              </Field>
              <Field label="Your neighborhood">
                <select className="select" value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}>
                  {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <Field label="You are">
              <div className="flex gap-3">
                {(['Female', 'Male'] as const).map(g => (
                  <PillButton key={g} label={g === 'Female' ? 'A woman' : 'A man'} active={form.gender === g} onClick={() => setForm(f => ({ ...f, gender: g }))} />
                ))}
              </div>
            </Field>
            <Field label="Your nationality">
              <select className="select" value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}>
                {COMMON_NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Languages you speak">
              <div className="flex flex-wrap gap-2">
                {COMMON_LANGUAGES.map(l => (
                  <ChipToggle key={l} label={l} active={form.languages.includes(l)} onClick={() => toggleLanguage(l)} />
                ))}
              </div>
            </Field>

            {error && <ErrorBanner message={error} />}

            <div className="flex justify-end pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={next} className="btn-primary text-lg">
                Continue →
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="s2" variants={stepVariants} initial="hidden" animate="show" exit="exit" className="space-y-6">
            <div className="card space-y-6">
              <Field label="Years of experience">
                <input className="input" type="number" min={0} max={60} value={form.yearsExperience} onChange={e => setForm(f => ({ ...f, yearsExperience: Number(e.target.value || 0) }))} />
              </Field>
              <Field label="Availability">
                <div className="flex flex-wrap gap-3">
                  {(['Hourly', 'Live-in', 'Both'] as const).map(a => (
                    <PillButton key={a} label={a === 'Hourly' ? 'A few hours a day' : a === 'Live-in' ? 'Living with the family' : 'Open to both'} active={form.availability === a} onClick={() => setForm(f => ({ ...f, availability: a }))} />
                  ))}
                </div>
              </Field>
              <Field label="A short note about you">
                <textarea className="input min-h-[110px]" placeholder="What kind of presence do you bring? What do families love about working with you?" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </Field>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-2xl font-semibold text-ink-900">What you can help with</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_SKILLS.map(s => (
                  <motion.label
                    key={s}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      form.skills[s] ? 'border-brand-400 bg-brand-50 shadow-soft' : 'border-brand-100 bg-white hover:border-brand-200'
                    }`}
                  >
                    <input type="checkbox" className="w-5 h-5 accent-brand-700" checked={form.skills[s]} onChange={() => toggleSkill(s)} />
                    <span className="font-medium text-ink-900">{SKILL_LABELS[s]}</span>
                  </motion.label>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Certifications</h2>
              <p className="text-ink-600">Add any training or licenses you hold.</p>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="e.g. First Aid, CPR, Registered Nurse"
                  value={certInput}
                  onChange={e => setCertInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                />
                <button type="button" onClick={addCert} className="btn-ghost">Add</button>
              </div>
              <AnimatePresence>
                <div className="flex flex-wrap gap-2">
                  {form.certifications.map(c => (
                    <motion.span
                      key={c}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="chip-warm"
                    >
                      {c}
                      <button type="button" onClick={() => removeCert(c)} className="ml-1 text-ink-500 hover:text-ink-900">×</button>
                    </motion.span>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            {error && <ErrorBanner message={error} />}

            <div className="flex justify-between gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submit} disabled={submitting} className="btn-primary text-lg disabled:opacity-60">
                {submitting ? 'Saving…' : 'Create my volunteer profile'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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

function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 rounded-full border font-medium text-sm transition-all ${
        active ? 'border-brand-500 bg-brand-600 text-white' : 'border-brand-100 bg-white text-ink-700 hover:border-brand-200'
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
