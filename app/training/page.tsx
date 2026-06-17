'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';
import { EASE_OUT } from '@/lib/motion-ease';
import {
  TRAINING_LEVELS,
  ALL_LESSON_IDS,
  isLevelComplete,
  isAllTrainingComplete,
  trainingPercent,
  type Lesson,
  type TrainingLevel,
} from '@/lib/training';
import type { Volunteer } from '@/lib/types';

export default function TrainingPage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== 'volunteer') { router.push('/login'); return; }
    fetch(`/api/volunteers/${session.userId}`)
      .then(r => r.json())
      .then((j: { volunteer?: Volunteer }) => {
        setCompleted(j.volunteer?.trainingProgress?.completedLessonIds ?? []);
        setLoading(false);
      });
  }, [session, ready, router]);

  async function toggleLesson(lessonId: string) {
    if (!session) return;
    const next = completed.includes(lessonId)
      ? completed.filter(id => id !== lessonId)
      : [...completed, lessonId];
    setCompleted(next);
    setSaving(lessonId);
    await fetch(`/api/volunteers/${session.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainingProgress: { completedLessonIds: next } }),
    });
    setSaving(null);
  }

  if (!ready || loading) {
    return <div className="text-ink-500 text-center py-16">Loading your training…</div>;
  }

  const percent = trainingPercent(completed);
  const allDone = isAllTrainingComplete(completed);

  return (
    <section className="space-y-12 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link href="/me" className="text-brand-700 hover:underline text-sm font-medium">← Back to your space</Link>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-4">
          <div>
            <span className="chip-warm mb-4 inline-flex">Your training</span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
              Learn the craft of care.
            </h1>
            <p className="text-lg text-ink-700 mt-3 max-w-2xl">
              Three short journeys — beginner to advanced. Take them at your pace.
              When you&apos;ve finished all three, you&apos;ll schedule a gentle interview with our team.
            </p>
          </div>
          <ProgressRing percent={percent} />
        </div>
      </motion.div>

      {TRAINING_LEVELS.map((level, levelIdx) => (
        <LevelSection
          key={level.id}
          level={level}
          levelIdx={levelIdx}
          completed={completed}
          saving={saving}
          onToggle={toggleLesson}
        />
      ))}

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden rounded-3xl border p-10 text-center transition-all ${
          allDone
            ? 'bg-gradient-to-br from-brand-100 to-brand-50 border-brand-200 shadow-lift'
            : 'bg-stone-50 border-brand-100 shadow-soft'
        }`}
      >
        <AnimatePresence mode="wait">
          {allDone ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-700 text-white text-3xl shadow-lift mb-4">✓</div>
              <h2 className="font-display text-3xl font-semibold text-ink-900 mb-2">All training complete.</h2>
              <p className="text-ink-700 mb-6 max-w-xl mx-auto">
                Beautifully done. The last step is a short interview with our team — pick a time that works for you.
              </p>
              <Link href="/interview" className="btn-primary text-lg">
                Schedule your interview →
              </Link>
            </motion.div>
          ) : (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-ink-600 mb-2 font-medium">
                {percent}% complete · {ALL_LESSON_IDS.length - completed.filter(id => ALL_LESSON_IDS.includes(id)).length} lesson
                {ALL_LESSON_IDS.length - completed.filter(id => ALL_LESSON_IDS.includes(id)).length === 1 ? '' : 's'} to go
              </p>
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                Finish your training to unlock your interview.
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

/* ----- Level section ----- */

function LevelSection({
  level, levelIdx, completed, saving, onToggle,
}: {
  level: TrainingLevel;
  levelIdx: number;
  completed: string[];
  saving: string | null;
  onToggle: (id: string) => void;
}) {
  const done = level.lessons.filter(l => completed.includes(l.id)).length;
  const total = level.lessons.length;
  const levelDone = isLevelComplete(level, completed);
  const accent = levelIdx === 0 ? 'brand' : levelIdx === 1 ? 'warm' : 'brand';

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <div className="text-sm font-medium text-brand-700">Level {levelIdx + 1}</div>
          <h2 className="font-display text-3xl font-semibold text-ink-900 leading-tight">{level.title}</h2>
          <p className="text-ink-700 mt-1">{level.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40 h-2 rounded-full bg-brand-100 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${accent === 'warm' ? 'bg-warm-500' : 'bg-brand-600'}`}
              initial={false}
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            />
          </div>
          <span className={`text-sm font-semibold ${levelDone ? 'text-brand-700' : 'text-ink-600'}`}>
            {done}/{total}
          </span>
        </div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {level.lessons.map((lesson, idx) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={idx}
            completed={completed.includes(lesson.id)}
            saving={saving === lesson.id}
            onToggle={() => onToggle(lesson.id)}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ----- Lesson card ----- */

function LessonCard({
  lesson, index, completed, saving, onToggle,
}: {
  lesson: Lesson;
  index: number;
  completed: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: EASE_OUT }}
      whileHover={{ y: -3 }}
      className={`rounded-3xl border bg-white shadow-soft overflow-hidden flex flex-col transition ${
        completed ? 'border-brand-200 ring-1 ring-brand-200' : 'border-brand-100'
      }`}
    >
      {/* Video frame placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-ink-800 to-brand-900 flex items-center justify-center text-white/70">
        {lesson.videoUrl ? (
          <iframe
            src={lesson.videoUrl}
            title={lesson.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-center px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm text-2xl mb-2">
              ▶
            </div>
            <p className="text-sm font-medium text-white/80">Video coming soon</p>
            <p className="text-xs text-white/50 mt-0.5">Placeholder for YouTube embed</p>
          </div>
        )}
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lift"
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Title + meta + action */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-900 leading-snug">{lesson.title}</h3>
          <p className="text-ink-600 text-sm mt-1.5 leading-relaxed">{lesson.summary}</p>
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-brand-100/60">
          <span className="text-sm text-ink-500">{lesson.durationMin} min</span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            disabled={saving}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-60 ${
              completed
                ? 'bg-brand-700 text-white hover:bg-brand-800'
                : 'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50'
            }`}
          >
            {saving ? '…' : completed ? 'Completed ✓' : 'Mark complete'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ----- Progress ring ----- */

function ProgressRing({ percent }: { percent: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg width={96} height={96} viewBox="0 0 96 96" className="-rotate-90">
        <circle cx={48} cy={48} r={r} stroke="rgb(218,244,233)" strokeWidth={8} fill="none" />
        <motion.circle
          cx={48} cy={48} r={r}
          stroke="rgb(31,131,102)" strokeWidth={8} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * percent) / 100 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-ink-900">{percent}%</span>
        <span className="text-xs text-ink-500">complete</span>
      </div>
    </div>
  );
}
