'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';
import { Avatar } from '@/components/Avatar';
import { Reveal } from '@/components/motion/Reveal';
import { EASE_OUT } from '@/lib/motion-ease';
import { SKILL_LABELS, type CareRequest, type RequestStatus } from '@/lib/types';

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function statusMeta(status: RequestStatus): { label: string; chip: string; tone: string; description: string } {
  switch (status) {
    case 'accepted':
      return {
        label: 'Accepted',
        chip: 'bg-brand-100 text-brand-800 border border-brand-200',
        tone: 'text-brand-800',
        description: 'has accepted your request. They will be in touch shortly.',
      };
    case 'declined':
      return {
        label: 'Declined',
        chip: 'bg-stone-100 text-ink-600 border border-stone-200',
        tone: 'text-ink-600',
        description: 'is unable to take on new families at the moment.',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        chip: 'bg-stone-100 text-ink-500 border border-stone-200',
        tone: 'text-ink-500',
        description: 'You cancelled this request.',
      };
    default:
      return {
        label: 'Awaiting response',
        chip: 'bg-warm-100 text-brand-900 border border-warm-200',
        tone: 'text-brand-900',
        description: 'is reviewing your request. We&apos;ll let you know as soon as they respond.',
      };
  }
}

export default function PatientRequestsPage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== 'patient') { router.push('/login'); return; }

    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/requests?patientId=${session!.userId}`, { cache: 'no-store' });
        const j: { requests?: CareRequest[] } = await res.json();
        if (alive) {
          setRequests(j.requests ?? []);
          setLoaded(true);
        }
      } catch {
        if (alive) setLoaded(true);
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
  }, [session, ready, router]);

  async function cancel(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as const, respondedAt: new Date().toISOString() } : r));
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
  }

  if (!ready || !loaded) {
    return <div className="text-ink-500 text-center py-16">Loading your requests…</div>;
  }

  const pending = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const past = requests.filter(r => r.status === 'declined' || r.status === 'cancelled');

  return (
    <section className="space-y-8 pb-16">
      <Reveal>
        <Link href="/me" className="text-brand-700 hover:underline text-sm font-medium">← Back to your space</Link>
        <span className="chip-warm mt-3 mb-4 inline-flex">Your requests</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          The volunteers you&apos;ve reached out to.
        </h1>
        <p className="text-lg text-ink-700 mt-3 max-w-2xl">
          We&apos;ll quietly update this page as each volunteer responds.
        </p>
      </Reveal>

      {requests.length === 0 && (
        <Reveal delay={0.05}>
          <div className="card-elevated text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warm-100 text-2xl mb-3">📨</div>
            <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">No requests yet.</h2>
            <p className="text-ink-700 mb-5">When you find a volunteer who feels right, reach out — your requests will live here.</p>
            <Link href="/volunteers" className="btn-primary">Browse volunteers</Link>
          </div>
        </Reveal>
      )}

      <RequestSection title="Awaiting response" requests={pending} onCancel={cancel} />
      <RequestSection title="Accepted" requests={accepted} onCancel={cancel} />
      <RequestSection title="Past requests" requests={past} onCancel={cancel} muted />
    </section>
  );
}

function RequestSection({
  title, requests, onCancel, muted = false,
}: {
  title: string;
  requests: CareRequest[];
  onCancel: (id: string) => void;
  muted?: boolean;
}) {
  if (requests.length === 0) return null;
  return (
    <Reveal delay={0.05}>
      <h2 className={`font-display text-2xl font-semibold mb-4 ${muted ? 'text-ink-500' : 'text-ink-900'}`}>
        {title}
        <span className="ml-2 text-base font-medium text-ink-500">({requests.length})</span>
      </h2>
      <div className="space-y-3">
        <AnimatePresence>
          {requests.map((r, i) => (
            <RequestCard key={r.id} request={r} index={i} onCancel={onCancel} />
          ))}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

function RequestCard({
  request, index, onCancel,
}: {
  request: CareRequest;
  index: number;
  onCancel: (id: string) => void;
}) {
  const meta = statusMeta(request.status);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.35, ease: EASE_OUT }}
      className="card flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <Avatar name={request.volunteerName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/volunteers/${request.volunteerId}`} className="font-display text-xl font-semibold text-ink-900 hover:text-brand-700">
              {request.volunteerName}
            </Link>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${meta.chip}`}>{meta.label}</span>
            <span className="text-ink-500 text-sm ml-auto">Sent {timeAgo(request.createdAt)}</span>
          </div>
          <p className={`mt-1 ${meta.tone}`} dangerouslySetInnerHTML={{
            __html: `<span class="text-ink-600">${request.volunteerName.split(' ')[0]} </span>${meta.description}`
          }} />
        </div>
      </div>

      {request.message && (
        <div>
          <div className="text-xs uppercase tracking-wide font-semibold text-ink-500 mb-1.5">Your message</div>
          <p className="text-ink-800 italic leading-relaxed bg-brand-50/60 border border-brand-100 rounded-2xl p-3.5">
            “{request.message}”
          </p>
        </div>
      )}

      {request.requestedNeeds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {request.requestedNeeds.map(n => (
            <span key={n} className="chip text-sm">{SKILL_LABELS[n]}</span>
          ))}
        </div>
      )}

      {request.responseMessage && (
        <div className="border-t border-brand-100 pt-4">
          <div className="text-xs uppercase tracking-wide font-semibold text-ink-500 mb-1.5">
            From {request.volunteerName.split(' ')[0]}
          </div>
          <p className="text-ink-800 italic leading-relaxed">“{request.responseMessage}”</p>
        </div>
      )}

      {request.status === 'pending' && (
        <div className="flex justify-end pt-2 border-t border-brand-100">
          <button
            type="button"
            onClick={() => onCancel(request.id)}
            className="text-sm text-ink-500 hover:text-ink-900 font-medium"
          >
            Cancel request
          </button>
        </div>
      )}
    </motion.article>
  );
}
