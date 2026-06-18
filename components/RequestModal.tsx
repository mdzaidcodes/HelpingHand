'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './auth/SessionProvider';
import { Avatar } from './Avatar';
import { EASE_OUT } from '@/lib/motion-ease';
import {
  DAYS,
  DEFAULT_SCHEDULE,
  SKILL_LABELS,
  SKILL_DESCRIPTIONS,
  readPreferredLanguages,
  scheduleDaysCount,
  scheduleTotal,
  type Availability,
  type CareSkill,
  type DayKey,
  type Patient,
  type WeekSchedule,
} from '@/lib/types';

interface VolunteerLite {
  id: string;
  name: string;
  neighborhood: string;
  photo?: string;
}

const ALL_SKILLS = Object.keys(SKILL_LABELS) as CareSkill[];

export function RequestButton({ volunteer }: { volunteer: VolunteerLite }) {
  const { session, ready } = useSession();
  const [open, setOpen] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!ready || !session || session.role !== 'patient') return;
    fetch(`/api/requests?patientId=${session.userId}`)
      .then(r => r.json())
      .then((j: { requests?: { volunteerId: string; status: string }[] }) => {
        const exists = (j.requests ?? []).some(
          r => r.volunteerId === volunteer.id && (r.status === 'pending' || r.status === 'accepted')
        );
        setAlreadySent(exists);
      })
      .catch(() => {});
  }, [ready, session, volunteer.id]);

  if (!ready) {
    return <button disabled className="btn-primary text-lg shadow-lift opacity-60">Loading…</button>;
  }
  if (!session) {
    return (
      <Link href={`/login?next=/volunteers/${volunteer.id}`} className="btn-primary text-lg shadow-lift">
        Sign in to reach out to {volunteer.name.split(' ')[0]} →
      </Link>
    );
  }
  if (session.role !== 'patient') {
    return (
      <button disabled className="btn-ghost text-lg opacity-60 cursor-not-allowed">
        Only patients can send requests
      </button>
    );
  }
  if (alreadySent) {
    return (
      <Link href="/me/requests" className="btn-ghost text-lg">
        ✓ Request already sent — view status
      </Link>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="btn-primary text-lg shadow-lift"
      >
        Reach out to {volunteer.name.split(' ')[0]} →
      </motion.button>

      <AnimatePresence>
        {open && (
          <RequestDialog
            volunteer={volunteer}
            patientId={session.userId}
            onClose={() => setOpen(false)}
            onSent={() => {
              setAlreadySent(true);
              setOpen(false);
              router.push('/me/requests');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function RequestDialog({
  volunteer, patientId, onClose, onSent,
}: {
  volunteer: VolunteerLite;
  patientId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [patient, setPatient] = useState<Patient | null>(null);

  // Editable form state — initialised from patient's saved preferences once loaded.
  const [needs, setNeeds] = useState<Partial<Record<CareSkill, boolean>>>({});
  const [availability, setAvailability] = useState<Availability>('Hourly');
  const [schedule, setSchedule] = useState<WeekSchedule>({ ...DEFAULT_SCHEDULE });
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then(r => r.json())
      .then((j: { patient?: Patient }) => {
        const p = j.patient ?? null;
        setPatient(p);
        if (p) {
          setNeeds({ ...p.preferences.needs });
          const a = p.preferences.availability;
          setAvailability(a === 'Live-in' || a === 'Both' ? a : 'Hourly');
        }
      })
      .catch(() => {});
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [patientId]);

  const activeNeeds = useMemo(
    () => ALL_SKILLS.filter(s => needs[s]),
    [needs],
  );

  function toggleNeed(s: CareSkill) {
    setNeeds(n => ({ ...n, [s]: !n[s] }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        volunteerId: volunteer.id,
        message,
        requestedNeeds: activeNeeds,
        requestedAvailability: availability,
        schedule: availability === 'Live-in' ? undefined : schedule,
        requestedHoursPerWeek: availability === 'Live-in' ? undefined : scheduleTotal(schedule),
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }
    onSent();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-ink-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="w-full max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-lift border border-brand-100 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-brand-100/70 p-5 flex items-start gap-4">
          <Avatar name={volunteer.name} src={volunteer.photo} size="md" />
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-700">You&apos;re reaching out to</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900 leading-tight">{volunteer.name}</h2>
            <p className="text-ink-600 text-sm">{volunteer.neighborhood}, Abu Dhabi</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-ink-700 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* Privacy note */}
          {patient && (() => {
            const langs = readPreferredLanguages(patient.preferences);
            return (
              <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-4 text-sm text-ink-700">
                <p className="font-medium text-ink-900 mb-1">We&apos;ll share with {volunteer.name.split(' ')[0]}:</p>
                <p>Your name ({patient.name}) and neighborhood ({patient.neighborhood}), plus the details below.</p>
                {langs.length > 0 && (
                  <p className="text-xs text-ink-500 mt-1.5">Preferred language{langs.length > 1 ? 's' : ''}: {langs.join(', ')}</p>
                )}
                <p className="text-xs text-ink-500 mt-2">
                  Your full health profile stays private until you choose to share it.
                </p>
              </div>
            );
          })()}

          {/* What support */}
          <Section
            eyebrow="What you'd like help with"
            helper="We've pre-selected your preferences — adjust anything that doesn't fit this volunteer."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {ALL_SKILLS.map(s => (
                <motion.label
                  key={s}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    needs[s]
                      ? 'border-brand-400 bg-brand-50 shadow-soft'
                      : 'border-brand-100 bg-white hover:border-brand-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-brand-700 mt-0.5 shrink-0"
                    checked={!!needs[s]}
                    onChange={() => toggleNeed(s)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-display font-semibold text-ink-900 block leading-tight">
                      {SKILL_LABELS[s]}
                    </span>
                    <p className="text-sm text-ink-600 mt-1 leading-relaxed">
                      {SKILL_DESCRIPTIONS[s]}
                    </p>
                  </div>
                </motion.label>
              ))}
            </div>
          </Section>

          {/* Availability */}
          <Section eyebrow="How often you'd like them">
            <div className="flex flex-wrap gap-3">
              {(['Hourly', 'Live-in', 'Both'] as const).map(a => (
                <PillButton
                  key={a}
                  label={a === 'Hourly' ? 'A few hours a day' : a === 'Live-in' ? 'Living with the family' : 'Open to either'}
                  active={availability === a}
                  onClick={() => setAvailability(a)}
                />
              ))}
            </div>
          </Section>

          {/* Weekly schedule */}
          <AnimatePresence initial={false}>
            {availability !== 'Live-in' && (
              <motion.div
                key="schedule"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <Section
                  eyebrow="When you'd like help"
                  helper="Pick the days you'd like company. We split the hours evenly by default — adjust any day to match your week."
                >
                  <ScheduleEditor value={schedule} onChange={setSchedule} />
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Optional message */}
          <Section eyebrow="A short message (optional)">
            <textarea
              className="input min-h-[110px]"
              placeholder={`Hello ${volunteer.name.split(' ')[0]}, I wanted to ask if you'd be open to…`}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </Section>

          {error && (
            <div className="rounded-2xl bg-warm-50 border border-warm-200 px-4 py-3 text-ink-900 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-brand-100">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={submit}
              disabled={submitting}
              className="btn-primary disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send request'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Small subcomponents ---------- */

function Section({
  eyebrow, helper, children,
}: {
  eyebrow: string; helper?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-brand-700 mb-1">{eyebrow}</div>
      {helper && <p className="text-ink-600 text-sm mb-3">{helper}</p>}
      <div className={helper ? '' : 'mt-2'}>{children}</div>
    </div>
  );
}

function PillButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`px-5 py-3 rounded-2xl border font-medium transition-all ${
        active ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-soft' : 'border-brand-100 bg-white text-ink-700 hover:border-brand-200'
      }`}
    >
      {label}
    </motion.button>
  );
}

/* ---------- Schedule editor ---------- */

const HOUR_MIN = 0.5;
const HOUR_MAX = 12;
const HOUR_STEP = 0.5;

function clampHours(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const rounded = Math.round(n / HOUR_STEP) * HOUR_STEP;
  return Math.max(0, Math.min(HOUR_MAX, rounded));
}

function ScheduleEditor({
  value, onChange,
}: {
  value: WeekSchedule;
  onChange: (next: WeekSchedule) => void;
}) {
  const total = scheduleTotal(value);
  const numDays = scheduleDaysCount(value);
  const maxHours = Math.max(...DAYS.map(d => value[d] ?? 0), 4);

  function isOn(day: DayKey): boolean {
    return (value[day] ?? 0) > 0;
  }

  function toggleDay(day: DayKey) {
    if (isOn(day)) {
      onChange({ ...value, [day]: 0 });
      return;
    }
    // Reactivate at the current average — so the user keeps the same total feel.
    const avg = numDays > 0 ? total / numDays : 2;
    const seed = avg > 0 ? clampHours(avg) : 2;
    onChange({ ...value, [day]: Math.max(HOUR_MIN, seed) });
  }

  function setDayHours(day: DayKey, hours: number) {
    onChange({ ...value, [day]: clampHours(hours) });
  }

  function distributeEvenly() {
    const onDays = DAYS.filter(d => isOn(d));
    if (onDays.length === 0) {
      // Nothing selected — reset to default
      onChange({ ...DEFAULT_SCHEDULE });
      return;
    }
    const targetTotal = total > 0 ? total : onDays.length * 2;
    const per = clampHours(targetTotal / onDays.length);
    const next: WeekSchedule = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    for (const d of onDays) next[d] = Math.max(HOUR_MIN, per);
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {/* Day toggle chips */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => {
          const active = isOn(day);
          return (
            <motion.button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1 }}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                active
                  ? 'border-brand-500 bg-brand-200 text-brand-900'
                  : 'border-brand-100 bg-brand-50 text-ink-500 hover:border-brand-300 hover:text-ink-700'
              }`}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      {/* Total / distribute row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-ink-700">
          <span className="font-display text-2xl font-semibold text-ink-900">{total}</span>
          <span className="text-ink-500"> hrs / week</span>
          {numDays > 0 && (
            <span className="text-ink-500">  ·  {numDays} day{numDays === 1 ? '' : 's'}</span>
          )}
        </div>
        <motion.button
          type="button"
          onClick={distributeEvenly}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          className="text-sm font-semibold text-brand-700 hover:text-brand-600 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 hover:border-brand-300 transition"
        >
          ⇄ Distribute evenly
        </motion.button>
      </div>

      {/* Per-day editor rows */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {DAYS.filter(isOn).map(day => (
            <motion.div
              key={day}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-brand-50/60 border border-brand-100"
            >
              <span className="font-display font-semibold text-ink-900 w-9 sm:w-10 shrink-0">{day}</span>

              <button
                type="button"
                onClick={() => setDayHours(day, (value[day] ?? 0) - HOUR_STEP)}
                aria-label={`Decrease ${day} hours`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-100 hover:bg-brand-200 text-brand-700 text-lg font-semibold flex items-center justify-center transition shrink-0"
              >
                −
              </button>

              <div className="font-display text-base sm:text-lg text-ink-900 w-12 sm:w-14 text-center tabular-nums shrink-0">
                {(value[day] ?? 0).toFixed((value[day] ?? 0) % 1 === 0 ? 0 : 1)}<span className="text-xs sm:text-sm text-ink-500">h</span>
              </div>

              <button
                type="button"
                onClick={() => setDayHours(day, (value[day] ?? 0) + HOUR_STEP)}
                aria-label={`Increase ${day} hours`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-100 hover:bg-brand-200 text-brand-700 text-lg font-semibold flex items-center justify-center transition shrink-0"
              >
                +
              </button>

              <div className="hidden sm:block flex-1 h-2 bg-brand-50 border border-brand-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.min(100, ((value[day] ?? 0) / maxHours) * 100)}%` }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-300 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {numDays === 0 && (
          <p className="text-sm text-ink-500 italic text-center py-3">
            Pick at least one day above — we'll suggest hours from there.
          </p>
        )}
      </div>
    </div>
  );
}
