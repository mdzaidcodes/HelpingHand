'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';
import { Calendar } from '@/components/Calendar';
import { EASE_OUT } from '@/lib/motion-ease';
import { isAllTrainingComplete } from '@/lib/training';
import type { Volunteer } from '@/lib/types';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30',
];

function formatTimeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function InterviewPage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== 'volunteer') { router.push('/login'); return; }
    fetch(`/api/volunteers/${session.userId}`).then(r => r.json()).then((j: { volunteer?: Volunteer }) => {
      setVolunteer(j.volunteer ?? null);
      setLoading(false);
      if (j.volunteer?.interview) {
        setConfirmedFor(j.volunteer.interview.scheduledFor);
      }
    });
  }, [session, ready, router]);

  async function confirm() {
    if (!session || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    const [h, m] = selectedTime.split(':').map(Number);
    const when = new Date(selectedDate);
    when.setHours(h, m, 0, 0);
    const iso = when.toISOString();

    await fetch(`/api/volunteers/${session.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interview: { scheduledFor: iso, status: 'completed' },
      }),
    });
    setSubmitting(false);
    setConfirmedFor(iso);
  }

  if (!ready || loading) {
    return <div className="text-ink-500 text-center py-16">Loading…</div>;
  }
  if (!volunteer) return null;

  const completed = volunteer.trainingProgress?.completedLessonIds ?? [];
  const allTrained = isAllTrainingComplete(completed);

  if (!allTrained) {
    return (
      <section className="max-w-xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="card-elevated">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warm-100 text-2xl mb-4">📚</div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 mb-3">Finish your training first.</h1>
          <p className="text-ink-700 mb-6">
            You&apos;ll be able to book an interview once all three levels are complete.
          </p>
          <Link href="/training" className="btn-primary">Continue training</Link>
        </motion.div>
      </section>
    );
  }

  if (confirmedFor) {
    const when = new Date(confirmedFor);
    return (
      <section className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="card-elevated text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 20 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-700 text-white text-3xl shadow-lift mb-4"
          >
            ✓
          </motion.div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 mb-2">Interview confirmed.</h1>
          <p className="text-ink-700 mb-5">
            You&apos;re scheduled for
            {' '}
            <span className="font-semibold text-ink-900">
              {when.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            {' '}at{' '}
            <span className="font-semibold text-ink-900">
              {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </span>.
          </p>
          <p className="text-ink-600 text-sm mb-7">
            Your profile is now fully active. Welcome to the HelpingHand community.
          </p>
          <Link href="/me" className="btn-primary">Go to your profile →</Link>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link href="/me" className="text-brand-700 hover:underline text-sm font-medium">← Back to your space</Link>
        <span className="chip-warm mt-3 mb-4 inline-flex">Final step</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          Schedule your interview.
        </h1>
        <p className="text-lg text-ink-700 mt-3 max-w-2xl">
          A short, warm conversation with our team — about thirty minutes. Pick the day and time that feels right.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-[1fr,360px] gap-6 items-start">
        <Calendar value={selectedDate} onChange={d => { setSelectedDate(d); setSelectedTime(null); }} />

        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card sticky top-24 self-start"
        >
          <h2 className="font-display text-xl font-semibold text-ink-900 mb-1">Pick a time</h2>
          {selectedDate ? (
            <p className="text-ink-600 text-sm mb-4">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          ) : (
            <p className="text-ink-500 text-sm italic mb-4">Choose a date first.</p>
          )}

          <AnimatePresence mode="wait">
            {selectedDate && (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="grid grid-cols-3 gap-2"
              >
                {TIME_SLOTS.map(slot => (
                  <motion.button
                    key={slot}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                      selectedTime === slot
                        ? 'bg-brand-700 text-white border-brand-700 shadow-soft'
                        : 'bg-white text-ink-800 border-brand-100 hover:border-brand-300'
                    }`}
                  >
                    {formatTimeLabel(slot)}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={confirm}
            disabled={!selectedDate || !selectedTime || submitting}
            className="btn-primary w-full mt-5 disabled:opacity-50"
          >
            {submitting ? 'Confirming…' : 'Confirm interview'}
          </motion.button>
          <p className="text-xs text-ink-500 mt-3 text-center">
            You can reschedule any time before the appointment.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}
