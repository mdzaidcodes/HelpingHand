'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './auth/SessionProvider';
import { Avatar } from './Avatar';
import { EASE_OUT } from '@/lib/motion-ease';
import { SKILL_LABELS, type CareSkill, type Patient } from '@/lib/types';

interface Volunteer {
  id: string;
  name: string;
  neighborhood: string;
  photo?: string;
}

export function RequestButton({ volunteer }: { volunteer: Volunteer }) {
  const { session, ready } = useSession();
  const [open, setOpen] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const router = useRouter();

  // Check whether this patient already has a pending request out to this volunteer.
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
  volunteer: Volunteer;
  patientId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then(r => r.json())
      .then((j: { patient?: Patient }) => setPatient(j.patient ?? null))
      .catch(() => {});
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [patientId]);

  const needsList = patient
    ? (Object.keys(patient.preferences.needs) as CareSkill[]).filter(k => patient.preferences.needs[k])
    : [];

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
        className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-lift border border-brand-100 p-7 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <Avatar name={volunteer.name} src={volunteer.photo} size="lg" />
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-700">You&apos;re reaching out to</p>
            <h2 className="font-display text-2xl font-semibold text-ink-900">{volunteer.name}</h2>
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

        {patient && needsList.length > 0 && (
          <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-4 mb-5">
            <p className="text-sm font-medium text-ink-900 mb-2">We&apos;ll share:</p>
            <ul className="text-sm text-ink-700 space-y-1">
              <li>· Your name ({patient.name}) and neighborhood ({patient.neighborhood})</li>
              <li>· What you&apos;re looking for: {needsList.map(s => SKILL_LABELS[s]).join(', ')}</li>
              {patient.preferences.language && <li>· Preferred language: {patient.preferences.language}</li>}
            </ul>
            <p className="text-xs text-ink-500 mt-2">Your detailed health profile stays private until you choose to share it.</p>
          </div>
        )}

        <label className="block">
          <span className="block font-medium text-ink-900 mb-2">A short message (optional)</span>
          <textarea
            className="input min-h-[110px]"
            placeholder={`Hello ${volunteer.name.split(' ')[0]}, I wanted to ask if you'd be open to…`}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </label>

        {error && (
          <div className="rounded-2xl bg-warm-50 border border-warm-200 px-4 py-3 text-ink-900 text-sm mt-4">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
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
      </motion.div>
    </motion.div>
  );
}
