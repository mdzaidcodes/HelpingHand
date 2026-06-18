'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
import { ScheduleVisual, deriveSchedule } from '@/components/ScheduleVisual';
import { PatientDetailsCard } from '@/components/PatientDetailsCard';
import {
  NotificationCarousel,
  PATIENT_UPDATES,
  VOLUNTEER_UPDATES,
} from '@/components/NotificationCarousel';

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
  const [requests, setRequests] = useState<CareRequest[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/requests?patientId=${session.userId}`, { cache: 'no-store' });
        const j: { requests?: CareRequest[] } = await res.json();
        if (alive) setRequests(j.requests ?? []);
      } catch { /* ignore */ }
    }
    load();
    const id = setInterval(load, 6000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session.userId]);

  const accepted = requests.filter(r => r.status === 'accepted');
  const declined = requests.filter(r => r.status === 'declined');
  const pending = requests.filter(r => r.status === 'pending');

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

  const hasAnyRequest = pending.length + accepted.length > 0;
  const requestsBody = accepted.length > 0
    ? `${accepted.length} volunteer${accepted.length === 1 ? '' : 's'} accepted${pending.length > 0 ? `, ${pending.length} still pending` : ''}.`
    : pending.length > 0
      ? `${pending.length} awaiting response.`
      : 'When you reach out to a volunteer, you can follow the response here.';
  const badgeText = accepted.length > 0
    ? `${accepted.length} accepted`
    : pending.length > 0
      ? `${pending.length} pending`
      : undefined;
  const badgeTone: 'brand' | 'warm' = accepted.length > 0 ? 'brand' : 'warm';

  return (
    <section>
      <Reveal>
        <div className="mb-10">
          <span className="chip-warm mb-4 inline-flex">Your space</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Hello, {session.name.split(' ')[0]}.
          </h1>
          <p className="text-lg text-ink-700 mt-3">Everything we keep for you, gently in one place.</p>
        </div>
      </Reveal>

      <AcceptedBanner accepted={accepted} />
      <DeclinedBanner declined={declined} />

      {/* Carousel — important updates */}
      <Reveal delay={0.05}>
        <NotificationCarousel updates={PATIENT_UPDATES} className="mb-10" />
      </Reveal>

      {/* Quick actions */}
      <Reveal delay={0.1}>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Where would you like to start?</h2>
          <p className="text-ink-600 mt-1">The most common things you might want to do.</p>
        </div>
      </Reveal>
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StaggerItem>
          <ActionTile
            href="/volunteers"
            icon={<RequestVolunteerIcon />}
            eyebrow="Volunteers"
            title="Request a volunteer"
            body="Browse matched volunteers and send a request when you find the right person."
            tone="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <ActionTile
            href="/preferences"
            icon={<PreferencesIcon />}
            eyebrow={prefsSet ? 'Preferences' : 'Not set yet'}
            title={prefsSet ? 'Update preferences' : 'Tell us your preferences'}
            body={prefsSet ? 'Refine your language, gender, nationality, and care needs.' : 'A few thoughtful questions to refine your matches.'}
            tone="warm"
          />
        </StaggerItem>
        <StaggerItem>
          <ActionTile
            href="/me/requests"
            icon={<TrackRequestsIcon />}
            eyebrow="Requests"
            title="Track your requests"
            body={hasAnyRequest ? requestsBody : 'See pending, accepted, and past responses in one place.'}
            tone="brand"
            badge={badgeText}
            badgeTone={badgeTone}
          />
        </StaggerItem>
        <StaggerItem>
          <ActionTile
            href="/me/health"
            icon={<MedicalIcon />}
            eyebrow={healthSet ? 'Health profile' : 'Not set yet'}
            title="Update medical records"
            body="Allergies, conditions, medications, emergency contacts, and your medical team."
            tone="warm"
          />
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

interface IncomingToast {
  id: string;
  patientName: string;
  patientNeighborhood: string;
}

function VolunteerFullProfile({ volunteer }: { volunteer: Volunteer }) {
  const [tab, setTab] = useState<'history' | 'notifications'>('notifications');
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [toasts, setToasts] = useState<IncomingToast[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  function jumpToTab(target: 'notifications' | 'history') {
    setTab(target);
    requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

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
    const id = setInterval(load, 5000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [volunteer.id]);

  // Detect newly-arrived pending requests and fire a live toast for each.
  useEffect(() => {
    if (!firstLoadRef.current) {
      // First load — record everything we already have without flashing toasts.
      seenIdsRef.current = new Set(requests.map(r => r.id));
      firstLoadRef.current = true;
      return;
    }
    const newPending = requests.filter(
      r => !seenIdsRef.current.has(r.id) && r.status === 'pending'
    );
    if (newPending.length > 0) {
      setToasts(prev => [
        ...prev,
        ...newPending.map(r => ({
          id: r.id,
          patientName: r.patientName,
          patientNeighborhood: r.patientNeighborhood,
        })),
      ]);
      // Auto-dismiss each after 7s.
      for (const r of newPending) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== r.id));
        }, 7000);
      }
    }
    for (const r of requests) seenIdsRef.current.add(r.id);
  }, [requests]);

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

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <section className="space-y-10">
      <RequestToaster toasts={toasts} onDismiss={dismissToast} />

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
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ink-900">{volunteer.name}</h1>
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

      {/* Carousel — important updates for volunteers */}
      <Reveal delay={0.05}>
        <NotificationCarousel updates={VOLUNTEER_UPDATES} />
      </Reveal>

      {/* Quick actions */}
      <Reveal delay={0.08}>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Your day at a glance</h2>
          <p className="text-ink-600 mt-1">The most common things you might want to do.</p>
        </div>
      </Reveal>
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StaggerItem>
          <ActionTile
            onClick={() => jumpToTab('notifications')}
            icon={<RequestVolunteerIcon />}
            eyebrow="Notifications"
            title="See new requests"
            body={pending.length > 0
              ? `${pending.length} ${pending.length === 1 ? 'family is' : 'families are'} waiting for your reply.`
              : 'You\'re all caught up. New requests will appear here.'}
            tone="brand"
            badge={unreadCount > 0 ? `${unreadCount} new` : undefined}
            badgeTone="warm"
            cta="Open inbox →"
          />
        </StaggerItem>
        <StaggerItem>
          <ActionTile
            onClick={() => jumpToTab('history')}
            icon={<PatientHistoryIcon />}
            eyebrow="Your families"
            title="Patient history"
            body={history.length > 0
              ? `${history.length} ${history.length === 1 ? 'family' : 'families'} you've cared for, ${totalHours.toFixed(0)} hours given.`
              : 'No history yet — your story begins now.'}
            tone="brand"
            cta="View history →"
          />
        </StaggerItem>
        <StaggerItem>
          <ActionTile
            href="/training"
            icon={<TrainingLibraryIcon />}
            eyebrow="Training"
            title="Refresh your training"
            body="Short refreshers on dementia care, mobility, post-surgery, and more."
            tone="warm"
            cta="Open library →"
          />
        </StaggerItem>
        <StaggerItem>
          <ActionTile
            href="/volunteers"
            icon={<CommunityIcon />}
            eyebrow="Community"
            title="Meet other volunteers"
            body="See other HelpingHand volunteers in your neighborhood and beyond."
            tone="warm"
            cta="Browse community →"
          />
        </StaggerItem>
      </Stagger>

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
        <div ref={tabsRef} className="card-elevated scroll-mt-24">
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
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const isPending = request.status === 'pending';
  const chip = statusChip(request.status);

  // Once accepted, fetch the patient's full shared profile so we can display it.
  useEffect(() => {
    if (request.status !== 'accepted') return;
    if (patient) return;
    let alive = true;
    setLoadingPatient(true);
    fetch(`/api/patients/${request.patientId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then((j: { patient?: Patient }) => {
        if (alive) setPatient(j.patient ?? null);
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (alive) setLoadingPatient(false); });
    return () => { alive = false; };
  }, [request.status, request.patientId, patient]);

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

              {(() => {
                const sched = deriveSchedule(request);
                return sched ? (
                  <div className="sm:col-span-2">
                    <ScheduleVisual
                      schedule={sched}
                      title={request.status === 'accepted' ? 'Your weekly schedule' : 'Schedule they’re asking for'}
                      subtitle={request.status === 'accepted'
                        ? `You'll be helping ${request.patientName.split(' ')[0]} on these days each week.`
                        : `${request.patientName.split(' ')[0]} is hoping for help on these days.`}
                    />
                  </div>
                ) : null;
              })()}

              {/* Once accepted, show the patient's full shared profile. */}
              {request.status === 'accepted' && (
                <div className="sm:col-span-2">
                  {patient
                    ? <PatientDetailsCard patient={patient} />
                    : loadingPatient
                      ? <div className="text-ink-500 italic text-center py-4">Loading {request.patientName.split(' ')[0]}&apos;s shared details…</div>
                      : null}
                </div>
              )}

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

interface ActionTileProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
  onClick?: () => void;
  tone?: 'brand' | 'warm';
  badge?: string;
  badgeTone?: 'brand' | 'warm';
  cta?: string;
}

function ActionTile({
  href, onClick, icon, eyebrow, title, body, tone = 'brand', badge, badgeTone = 'warm', cta = 'Open →',
}: ActionTileProps) {
  const accent = tone === 'warm'
    ? 'from-warm-100 to-warm-50 border-warm-200'
    : 'from-brand-50 to-white border-brand-100';
  const iconWrap = tone === 'warm'
    ? 'bg-gradient-to-br from-warm-200 to-warm-300 text-brand-900'
    : 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800';
  const badgeBg = badgeTone === 'brand' ? 'bg-brand-700' : 'bg-warm-500';

  const cardClasses = `relative block h-full w-full text-left bg-gradient-to-br ${accent} border rounded-3xl p-6 shadow-soft hover:shadow-lift transition`;

  const inner = (
    <>
      {badge && (
        <span className={`absolute top-4 right-4 inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full ${badgeBg} text-white text-xs font-semibold shadow-soft`}>
          {badge}
        </span>
      )}
      <div className={`w-12 h-12 rounded-2xl ${iconWrap} flex items-center justify-center mb-4 shadow-soft`}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
      <h3 className="font-display text-lg font-semibold text-ink-900 mt-1 mb-2 leading-tight">{title}</h3>
      <p className="text-sm text-ink-700 leading-relaxed">{body}</p>
      <span className="inline-flex items-center gap-1.5 text-brand-800 font-semibold mt-4 text-sm">{cta}</span>
    </>
  );

  return (
    <motion.div whileHover={{ y: -6 }} className="h-full">
      {href ? (
        <Link href={href} className={cardClasses}>{inner}</Link>
      ) : (
        <button type="button" onClick={onClick} className={cardClasses}>{inner}</button>
      )}
    </motion.div>
  );
}

function RequestVolunteerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}
function PreferencesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function TrackRequestsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function MedicalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="9.5" y1="11.5" x2="14.5" y2="11.5" />
    </svg>
  );
}

function PatientHistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function TrainingLibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="9" y1="7" x2="16" y2="7" />
      <line x1="9" y1="11" x2="16" y2="11" />
    </svg>
  );
}
function CommunityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <circle cx="17" cy="11" r="3" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M17 17a3 3 0 013 3v1" />
    </svg>
  );
}

function DashCard({
  href, eyebrow, title, body, cta, variant = 'brand', badge, badgeTone = 'warm',
}: { href: string; eyebrow: string; title: string; body: string; cta: string; variant?: 'brand' | 'warm'; badge?: string; badgeTone?: 'brand' | 'warm' }) {
  const accent = variant === 'warm' ? 'from-warm-100 to-warm-50 border-warm-200' : 'from-brand-50 to-white border-brand-100';
  const badgeBg = badgeTone === 'brand' ? 'bg-brand-700' : 'bg-warm-500';
  return (
    <motion.div whileHover={{ y: -6 }} className="h-full">
      <Link href={href} className={`block h-full bg-gradient-to-br ${accent} border rounded-3xl p-7 shadow-soft hover:shadow-lift transition relative`}>
        {badge && (
          <span className={`absolute top-4 right-4 inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full ${badgeBg} text-white text-xs font-semibold shadow-soft`}>
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

function RequestToaster({
  toasts, onDismiss,
}: {
  toasts: IncomingToast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-24 right-4 sm:right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="pointer-events-auto w-[320px] bg-white border border-brand-200 shadow-lift rounded-2xl p-4 flex items-start gap-3"
          >
            <span className="relative">
              <Avatar name={t.patientName} size="sm" />
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-warm-500 border-2 border-white"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">New request</p>
              <p className="font-semibold text-ink-900 truncate">{t.patientName}</p>
              <p className="text-sm text-ink-600 truncate">{t.patientNeighborhood}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="text-ink-500 hover:text-ink-900 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AcceptedBanner({ accepted }: { accepted: CareRequest[] }) {
  if (accepted.length === 0) return null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mb-8 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-soft overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-100 bg-brand-100/40">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand-700 text-white text-base shadow-soft">✓</span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold text-brand-900 leading-tight">
            {accepted.length === 1
              ? 'A volunteer has accepted your request.'
              : `${accepted.length} volunteers have accepted your requests.`}
          </h2>
          <p className="text-brand-800 text-sm">They&apos;ll reach out to you soon.</p>
        </div>
      </div>
      <ul className="divide-y divide-brand-100">
        <AnimatePresence initial={false}>
          {accepted.map((r, i) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.3, ease: EASE_OUT }}
            >
              <Link
                href="/me/requests"
                className="flex items-center gap-4 px-6 py-4 hover:bg-brand-50 transition"
              >
                <Avatar name={r.volunteerName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-900">
                    {r.volunteerName}
                    <span className="text-ink-600 font-normal"> accepted your request</span>
                  </p>
                  <p className="text-ink-500 text-sm">
                    {r.volunteerNeighborhood}
                    {r.respondedAt && ` · ${new Date(r.respondedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`}
                  </p>
                </div>
                <span className="text-brand-700 font-medium whitespace-nowrap text-sm">View →</span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}

function DeclinedBanner({ declined }: { declined: CareRequest[] }) {
  // Only surface declined responses gently — small section under the celebratory banner.
  if (declined.length === 0) return null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="mb-8 rounded-2xl border border-stone-200 bg-stone-50/60 px-5 py-3 flex items-center gap-3 text-sm text-ink-700"
    >
      <span className="text-ink-500">·</span>
      {declined.length === 1
        ? `${declined[0].volunteerName} is unable to take on new families right now.`
        : `${declined.length} volunteers are unavailable right now.`}
      <Link href="/me/requests" className="text-brand-700 hover:underline font-medium ml-auto">View →</Link>
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
