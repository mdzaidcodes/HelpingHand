'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Avatar } from '@/components/Avatar';
import { EASE_OUT } from '@/lib/motion-ease';
import {
  TRAINING_LEVELS,
  isAllTrainingComplete,
  trainingPercent,
} from '@/lib/training';
import { SKILL_LABELS } from '@/lib/types';
import type { Patient, Volunteer, CareSkill, CareRequest, RequestStatus } from '@/lib/types';

export default function DashboardPage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!session) { router.push('/login'); return; }
    if (session.role === 'patient') {
      fetch(`/api/patients/${session.userId}`).then(r => r.json()).then(j => {
        setPatient(j.patient ?? null);
        setLoading(false);
      });
    } else {
      fetch(`/api/volunteers/${session.userId}`).then(r => r.json()).then(j => {
        setVolunteer(j.volunteer ?? null);
        setLoading(false);
      });
    }
  }, [session, ready, router]);

  if (!ready || loading) {
    return <div className="text-ink-500 text-center py-16">Loading your space…</div>;
  }
  if (!session) return null;

  if (session.role === 'volunteer' && volunteer) {
    return <VolunteerView volunteer={volunteer} />;
  }
  if (session.role === 'patient' && patient) {
    return <PatientView session={session} patient={patient} />;
  }
  return null;
}

/* =====================================================
   PATIENT view (unchanged feature-wise from before)
   ===================================================== */

function PatientView({ session, patient }: { session: { userId: string; name: string }; patient: Patient }) {
  const [requestCounts, setRequestCounts] = useState<{ pending: number; accepted: number }>({ pending: 0, accepted: 0 });

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/requests?patientId=${session.userId}`, { cache: 'no-store' });
        const j: { requests?: CareRequest[] } = await res.json();
        if (alive) {
          const reqs = j.requests ?? [];
          setRequestCounts({
            pending: reqs.filter(r => r.status === 'pending').length,
            accepted: reqs.filter(r => r.status === 'accepted').length,
          });
        }
      } catch { /* ignore */ }
    }
    load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, [session.userId]);

  const prefsSet = !!patient.preferences && (
    !!patient.preferences.language ||
    (patient.preferences.gender && patient.preferences.gender !== 'Any') ||
    !!patient.preferences.nationality ||
    Object.values(patient.preferences.needs ?? {}).some(Boolean)
  );
  const healthSet = patient.health.allergies.length > 0
    || patient.health.conditions.length > 0
    || patient.health.emergencyContacts.length > 0
    || patient.health.medicalContacts.length > 0;

  const hasAnyRequest = requestCounts.pending + requestCounts.accepted > 0;
  const requestsBody = requestCounts.accepted > 0
    ? `${requestCounts.accepted} volunteer${requestCounts.accepted === 1 ? '' : 's'} accepted${requestCounts.pending > 0 ? `, ${requestCounts.pending} still pending` : ''}.`
    : requestCounts.pending > 0
      ? `${requestCounts.pending} awaiting response.`
      : 'When you reach out to a volunteer, you can follow the response here.';

  return (
    <section>
      <Reveal>
        <div className="mb-10">
          <span className="chip-warm mb-4 inline-flex">Your space</span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Hello, {session.name.split(' ')[0]}.
          </h1>
          <p className="text-lg text-ink-700 mt-3">Everything we keep for you, gently in one place.</p>
        </div>
      </Reveal>

      <Stagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StaggerItem>
          <DashCard href="/volunteers" eyebrow="Care matches" title="Meet volunteers chosen for you" body="See volunteers ranked by your preferences, on a map of Abu Dhabi." cta="View matches" />
        </StaggerItem>
        <StaggerItem>
          <DashCard
            href="/me/requests"
            eyebrow="Requests"
            title={hasAnyRequest ? 'Track your requests' : 'No requests yet'}
            body={requestsBody}
            cta={hasAnyRequest ? 'View requests' : 'Browse volunteers'}
            variant="warm"
            badge={requestCounts.pending > 0 ? `${requestCounts.pending} pending` : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <DashCard
            href="/preferences"
            eyebrow="Preferences"
            title={prefsSet ? 'Review your preferences' : 'Tell us your preferences'}
            body={prefsSet ? 'Keep them up to date as your needs change.' : 'A few thoughtful questions to refine your matches.'}
            cta={prefsSet ? 'Review' : 'Begin'}
            variant={prefsSet ? 'brand' : 'warm'}
          />
        </StaggerItem>
        <StaggerItem>
          <DashCard href="/me/health" eyebrow="Health profile" title={healthSet ? 'Update your health profile' : 'Set up your health profile'} body="Allergies, medications, emergency contacts." cta={healthSet ? 'Update' : 'Begin'} variant="warm" />
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.15}>
        <div className="card mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-3">Your details</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-ink-800">
            <DlRow label="Name" value={patient.name} />
            <DlRow label="Email" value={patient.email} />
            <DlRow label="Age" value={patient.age?.toString()} />
            <DlRow label="Neighborhood" value={patient.neighborhood} />
          </dl>
        </div>
      </Reveal>
    </section>
  );
}

/* =====================================================
   VOLUNTEER view — onboarding router OR full profile
   ===================================================== */

function VolunteerView({ volunteer }: { volunteer: Volunteer }) {
  const completedLessons = volunteer.trainingProgress?.completedLessonIds ?? [];
  const trained = isAllTrainingComplete(completedLessons);
  const interviewDone = volunteer.interview?.status === 'completed';

  if (!trained) {
    return <VolunteerTrainingStage volunteer={volunteer} percent={trainingPercent(completedLessons)} />;
  }
  if (trained && !interviewDone) {
    return <VolunteerInterviewStage volunteer={volunteer} />;
  }
  return <VolunteerFullProfile volunteer={volunteer} />;
}

function VolunteerTrainingStage({ volunteer, percent }: { volunteer: Volunteer; percent: number }) {
  const completedLessons = volunteer.trainingProgress?.completedLessonIds ?? [];
  const started = percent > 0;
  return (
    <section className="max-w-3xl mx-auto">
      <Reveal>
        <span className="chip-warm mb-4 inline-flex">Welcome, {volunteer.name.split(' ')[0]}</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          Three small journeys, then we&apos;ll meet.
        </h1>
        <p className="text-lg text-ink-700 mt-3">
          Your training prepares you for the families who&apos;ll come to depend on you. Begin whenever you&apos;re ready.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="card-elevated mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Your training</h2>
            <span className="chip">{percent}% complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-brand-100 overflow-hidden mb-6">
            <motion.div
              className="h-full bg-brand-600 rounded-full"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            />
          </div>
          <div className="space-y-2">
            {TRAINING_LEVELS.map((level, i) => {
              const done = level.lessons.filter(l => completedLessons.includes(l.id)).length;
              const total = level.lessons.length;
              return (
                <div key={level.id} className="flex items-center justify-between p-3 rounded-2xl bg-brand-50/50">
                  <div>
                    <div className="text-sm text-brand-700 font-medium">Level {i + 1}</div>
                    <div className="font-medium text-ink-900">{level.title}</div>
                  </div>
                  <div className="text-sm font-semibold text-ink-700">{done}/{total}</div>
                </div>
              );
            })}
          </div>
          <Link href="/training" className="btn-primary mt-6 w-full sm:w-auto">
            {started ? 'Continue training' : 'Begin training'} →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function VolunteerInterviewStage({ volunteer }: { volunteer: Volunteer }) {
  const scheduled = volunteer.interview?.scheduledFor;
  return (
    <section className="max-w-3xl mx-auto">
      <Reveal>
        <span className="chip-warm mb-4 inline-flex">One last step</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          Training complete. Let&apos;s meet.
        </h1>
        <p className="text-lg text-ink-700 mt-3">
          A short, warm conversation with our team. After that, your profile goes live.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="card-elevated mt-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-200 to-warm-300 text-3xl shadow-soft mb-4">📅</div>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">
            {scheduled ? 'Your interview is scheduled' : 'Schedule your interview'}
          </h2>
          {scheduled ? (
            <p className="text-ink-700 mb-5">
              {new Date(scheduled).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              {' at '}
              {new Date(scheduled).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </p>
          ) : (
            <p className="text-ink-700 mb-5">Pick a day and time that suits you.</p>
          )}
          <Link href="/interview" className="btn-primary">
            {scheduled ? 'Manage interview' : 'Schedule interview'} →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* =====================================================
   Full volunteer profile (post-onboarding)
   ===================================================== */

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function lastVisitLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.round((Date.now() - then) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 28) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function VolunteerFullProfile({ volunteer }: { volunteer: Volunteer }) {
  const [tab, setTab] = useState<'history' | 'notifications'>('notifications');
  const [requests, setRequests] = useState<CareRequest[]>([]);

  // Live fetch of requests for this volunteer, with polling for near-real-time updates.
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/requests?volunteerId=${volunteer.id}`, { cache: 'no-store' });
        const j: { requests?: CareRequest[] } = await res.json();
        if (alive) setRequests(j.requests ?? []);
      } catch {
        // ignore transient errors
      }
    }
    load();
    const id = setInterval(load, 8000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [volunteer.id]);

  async function updateRequest(id: string, patch: Partial<Pick<CareRequest, 'status' | 'unread' | 'responseMessage'>>) {
    // Optimistic update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch, respondedAt: patch.status && patch.status !== 'pending' && !r.respondedAt ? new Date().toISOString() : r.respondedAt } : r));
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {
      // best-effort
    }
  }

  const pending = requests.filter(r => r.status === 'pending');
  const responded = requests.filter(r => r.status !== 'pending');
  const history = volunteer.patientHistory ?? [];
  const totalHours = history.reduce((sum, p) => sum + p.hours, 0);
  const unreadCount = pending.filter(r => r.unread).length;
  const activeSkills = (Object.keys(volunteer.skills) as CareSkill[]).filter(s => volunteer.skills[s]);
  const interviewDate = volunteer.interview?.scheduledFor ? new Date(volunteer.interview.scheduledFor) : null;

  return (
    <section className="space-y-10">
      {/* Hero */}
      <Reveal>
        <div className="card-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-grain pointer-events-none opacity-60" />
          <div className="relative flex flex-col md:flex-row gap-6 items-start">
            <div className="mx-auto md:mx-0">
              <Avatar name={volunteer.name} src={volunteer.photo} size="xl" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-900">{volunteer.name}</h1>
                <span className="chip-warm">✓ Verified volunteer</span>
              </div>
              <p className="text-ink-600 text-lg">
                {volunteer.gender} · {volunteer.nationality}
                {volunteer.neighborhood && ` · ${volunteer.neighborhood}`}
              </p>
              <p className="text-ink-700 max-w-2xl">{volunteer.bio || 'Welcome to HelpingHand.'}</p>
              {interviewDate && (
                <p className="text-sm text-brand-700 font-medium">
                  Onboarded {interviewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <Stagger className="grid sm:grid-cols-3 gap-5">
        <StaggerItem>
          <StatCard label="Hours volunteered" value={totalHours.toFixed(1)} unit="hrs" icon="⏱" accent="brand" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Families helped" value={history.length.toString()} unit="" icon="🤝" accent="warm" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Sessions completed" value={history.reduce((s, p) => s + p.sessions, 0).toString()} unit="" icon="✓" accent="brand" />
        </StaggerItem>
      </Stagger>

      {/* Tabs */}
      <Reveal delay={0.05}>
        <div className="card-elevated">
          <div className="inline-flex bg-brand-50 border border-brand-100 rounded-full p-1 mb-6">
            <TabButton active={tab === 'notifications'} onClick={() => setTab('notifications')}>
              Notifications {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warm-500 text-white text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
              Patient history
            </TabButton>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'notifications' ? (
              <motion.div key="notif" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
                {pending.length === 0 && responded.length === 0 && (
                  <EmptyState message="No requests yet — they'll appear here as families reach out." />
                )}
                {pending.map((r, i) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    index={i}
                    onAccept={() => updateRequest(r.id, { status: 'accepted', unread: false })}
                    onDecline={() => updateRequest(r.id, { status: 'declined', unread: false })}
                    onSeen={() => { if (r.unread) updateRequest(r.id, { unread: false }); }}
                  />
                ))}
                {responded.length > 0 && (
                  <>
                    <div className="text-xs uppercase tracking-wide font-semibold text-ink-500 mt-6 mb-2 px-1">Responded</div>
                    {responded.map((r, i) => (
                      <RequestRow
                        key={r.id}
                        request={r}
                        index={i + pending.length}
                        onAccept={() => {}}
                        onDecline={() => {}}
                        onSeen={() => {}}
                      />
                    ))}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="hist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
                {history.length === 0
                  ? <EmptyState message="No patient history yet — your story begins now." />
                  : history.map((p, i) => <HistoryRow key={p.patientId} p={p} index={i} />)
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>

      {/* Skills card (light context section) */}
      <Reveal delay={0.1}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card h-full">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-3">You help with</h2>
            <div className="flex flex-wrap gap-2">
              {activeSkills.length > 0
                ? activeSkills.map(s => <span key={s} className="chip">{SKILL_LABELS[s]}</span>)
                : <p className="text-ink-500 italic">No skills selected yet.</p>}
            </div>
          </div>
          <div className="card h-full">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-3">Languages you speak</h2>
            <div className="flex flex-wrap gap-2">
              {volunteer.languages.map(l => <span key={l} className="chip-warm">{l}</span>)}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function StatCard({ label, value, unit, icon, accent }: {
  label: string; value: string; unit: string; icon: string; accent: 'brand' | 'warm';
}) {
  const bg = accent === 'warm'
    ? 'bg-gradient-to-br from-warm-100 to-warm-50 border-warm-200'
    : 'bg-gradient-to-br from-brand-50 to-white border-brand-100';
  return (
    <motion.div whileHover={{ y: -3 }} className={`rounded-3xl border p-6 shadow-soft hover:shadow-lift transition ${bg}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-display text-4xl font-semibold text-ink-900">
        {value}
        {unit && <span className="text-lg text-ink-500 font-normal ml-1">{unit}</span>}
      </div>
      <div className="text-ink-600 mt-1">{label}</div>
    </motion.div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-5 py-2 rounded-full font-medium text-sm transition ${
        active ? 'text-white' : 'text-ink-700 hover:text-ink-900'
      }`}
    >
      {active && (
        <motion.span
          layoutId="dash-tab-pill"
          className="absolute inset-0 bg-brand-700 rounded-full"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center">{children}</span>
    </button>
  );
}

function statusChip(status: RequestStatus): { label: string; classes: string } {
  switch (status) {
    case 'accepted': return { label: 'Accepted', classes: 'bg-brand-100 text-brand-800 border border-brand-200' };
    case 'declined': return { label: 'Declined', classes: 'bg-stone-100 text-ink-600 border border-stone-200' };
    case 'cancelled': return { label: 'Cancelled', classes: 'bg-stone-100 text-ink-500 border border-stone-200' };
    default: return { label: 'Pending', classes: 'bg-warm-100 text-brand-900 border border-warm-200' };
  }
}

function RequestRow({
  request, index, onAccept, onDecline, onSeen,
}: {
  request: CareRequest;
  index: number;
  onAccept: () => void;
  onDecline: () => void;
  onSeen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isPending = request.status === 'pending';
  const chip = statusChip(request.status);

  function toggle() {
    setOpen(v => {
      const next = !v;
      if (next && request.unread) onSeen();
      return next;
    });
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3, ease: EASE_OUT }}
      className={`rounded-2xl border overflow-hidden transition ${
        request.unread && isPending ? 'border-warm-300 bg-warm-50/60 ring-1 ring-warm-200' : 'border-brand-100 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left p-4 flex items-start gap-4 hover:bg-brand-50/40 transition"
      >
        <Avatar name={request.patientName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-ink-900">{request.patientName}</p>
            {request.unread && isPending && <span className="w-2 h-2 rounded-full bg-warm-500" aria-label="Unread" />}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chip.classes}`}>{chip.label}</span>
            <span className="text-ink-500 text-sm ml-auto">{timeAgo(request.createdAt)}</span>
          </div>
          <p className="text-ink-700 mt-0.5 line-clamp-2">
            <span className="text-ink-500">{request.patientNeighborhood} · </span>
            {request.message || 'Would like to connect with you.'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-brand-700 font-medium">
              {open ? 'Hide details ▴' : 'View details ▾'}
            </span>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden border-t border-brand-100"
          >
            <div className="p-5 grid sm:grid-cols-2 gap-5 bg-brand-50/40">
              <DetailField label="Age">
                {request.patientAge ? `${request.patientAge} years old` : '—'}
              </DetailField>
              <DetailField label="Neighborhood">
                {request.patientNeighborhood}
              </DetailField>
              <DetailField label="Background">
                {request.patientNationality ?? '—'}
              </DetailField>
              <DetailField label="Preferred language">
                {request.preferredLanguage ?? 'No preference'}
              </DetailField>
              <DetailField label="Availability requested">
                {request.requestedAvailability === 'Hourly' ? 'A few hours a day'
                  : request.requestedAvailability === 'Live-in' ? 'Living with the family'
                  : 'Open to either'}
              </DetailField>
              <DetailField label="Needs">
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {request.requestedNeeds.length > 0
                    ? request.requestedNeeds.map(n => <span key={n} className="chip text-xs px-2.5 py-1">{SKILL_LABELS[n]}</span>)
                    : <span className="text-ink-500 italic text-sm">Not specified</span>}
                </div>
              </DetailField>

              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide font-semibold text-ink-500 mb-2">Their message</div>
                <p className="text-ink-800 italic leading-relaxed bg-white border border-brand-100 rounded-2xl p-4">
                  {request.message
                    ? `“${request.message}”`
                    : `${request.patientName.split(' ')[0]} reached out without a message.`}
                </p>
              </div>

              {request.respondedAt && (
                <div className="sm:col-span-2 text-sm text-ink-500">
                  You {request.status} this {new Date(request.respondedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}.
                </div>
              )}

              {isPending && (
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAccept}
                    className="btn-primary flex-1"
                  >
                    Accept request
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDecline}
                    className="btn-ghost flex-1"
                  >
                    Decline gently
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide font-semibold text-ink-500 mb-1">{label}</div>
      <div className="text-ink-900 font-medium">{children}</div>
    </div>
  );
}

function HistoryRow({ p, index }: {
  p: import('@/lib/types').PatientHistoryEntry;
  index: number;
}) {
  const isActive = p.status === 'Active';
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: EASE_OUT }}
      className="p-4 rounded-2xl border border-brand-100 bg-white flex items-center gap-4 hover:border-brand-200 transition"
    >
      <Avatar name={p.patientName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink-900">{p.patientName}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isActive ? 'bg-brand-100 text-brand-800' : 'bg-stone-100 text-ink-600'
          }`}>{p.status}</span>
        </div>
        <p className="text-ink-600 text-sm">{p.patientNeighborhood} · Last visit {lastVisitLabel(p.lastVisit)}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="font-display text-xl font-semibold text-ink-900">{p.hours}<span className="text-sm text-ink-500 font-normal ml-0.5">hrs</span></div>
        <div className="text-ink-500 text-sm">{p.sessions} sessions</div>
      </div>
    </motion.article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 text-ink-500 italic">{message}</div>
  );
}

/* shared helpers */

function DashCard({
  href, eyebrow, title, body, cta, variant = 'brand', badge,
}: { href: string; eyebrow: string; title: string; body: string; cta: string; variant?: 'brand' | 'warm'; badge?: string }) {
  const accent = variant === 'warm' ? 'from-warm-100 to-warm-50 border-warm-200' : 'from-brand-50 to-white border-brand-100';
  return (
    <motion.div whileHover={{ y: -6 }} className="h-full">
      <Link href={href} className={`block h-full bg-gradient-to-br ${accent} border rounded-3xl p-7 shadow-soft hover:shadow-lift transition relative`}>
        {badge && (
          <span className="absolute top-4 right-4 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-warm-500 text-white text-xs font-semibold shadow-soft">
            {badge}
          </span>
        )}
        <span className="text-sm font-medium text-brand-700">{eyebrow}</span>
        <h3 className="font-display text-xl font-semibold text-ink-900 mt-2 mb-3">{title}</h3>
        <p className="text-ink-700 leading-relaxed">{body}</p>
        <span className="inline-flex items-center gap-1.5 text-brand-800 font-semibold mt-4">{cta} →</span>
      </Link>
    </motion.div>
  );
}

function DlRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between sm:block">
      <dt className="text-ink-500 text-sm">{label}</dt>
      <dd className="font-medium">{value || <span className="text-ink-400">—</span>}</dd>
    </div>
  );
}
