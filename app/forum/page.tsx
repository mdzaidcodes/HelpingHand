'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';
import { Avatar } from '@/components/Avatar';
import { Reveal } from '@/components/motion/Reveal';
import { EASE_OUT } from '@/lib/motion-ease';
import type { ForumPost, ForumReply } from '@/lib/types';

/* ============================================================
   Page
   ============================================================ */

export default function ForumPage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  const audience = session?.role; // 'patient' | 'volunteer'

  useEffect(() => {
    if (!ready) return;
    if (!session) { router.push('/login'); return; }
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/forum?audience=${audience}`, { cache: 'no-store' });
        const j: { posts?: ForumPost[] } = await res.json();
        if (alive) {
          setPosts(j.posts ?? []);
          setLoaded(true);
        }
      } catch { if (alive) setLoaded(true); }
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
  }, [ready, session, audience, router]);

  async function refresh() {
    if (!audience) return;
    const res = await fetch(`/api/forum?audience=${audience}`, { cache: 'no-store' });
    const j: { posts?: ForumPost[] } = await res.json();
    setPosts(j.posts ?? []);
  }

  async function createPost(title: string, body: string) {
    if (!session) return;
    const res = await fetch(`/api/forum?audience=${session.role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: session.userId,
        authorName: session.name,
        authorRole: session.role,
        title: title || undefined,
        body,
      }),
    });
    const j = await res.json();
    if (j.post) {
      // optimistic: prepend immediately so the demo feels instant
      setPosts(prev => [j.post, ...prev]);
    } else {
      await refresh();
    }
  }

  async function mutatePost(postId: string, payload: Record<string, unknown>) {
    if (!session) return;
    const res = await fetch(`/api/forum/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (j.post) {
      setPosts(prev => prev.map(p => p.id === postId ? j.post : p));
    }
  }

  if (!ready || !loaded || !session) {
    return <div className="text-ink-500 text-center py-16">Loading the community…</div>;
  }

  const audienceLabel = audience === 'patient' ? 'Patient community' : 'Volunteer community';
  const audienceBlurb = audience === 'patient'
    ? 'Where families share their experiences with the volunteers caring for them. Be kind, be honest, be helpful.'
    : 'Where volunteers swap stories, tips, and small wins from working with the families in our community.';

  return (
    <section className="space-y-6 pb-24 max-w-4xl">
      <Reveal>
        <div>
          <span className="chip-warm mb-3 inline-flex">{audienceLabel}</span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
            The community floor.
          </h1>
          <p className="text-lg text-ink-700 mt-3 max-w-2xl">{audienceBlurb}</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Composer
          authorName={session.name}
          onSubmit={createPost}
          placeholder={audience === 'patient'
            ? 'Share an experience with a volunteer — a kind moment, a thank-you, a tip…'
            : 'Share a moment from caring for a family — a small win, a tip, a question…'}
        />
      </Reveal>

      <div className="space-y-5 pt-2">
        <AnimatePresence initial={false}>
          {posts.length === 0 ? (
            <p className="text-ink-500 italic text-center py-10">No posts yet — be the first to share something.</p>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session.userId}
                onMutate={mutatePost}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ============================================================
   Composer
   ============================================================ */

function Composer({
  authorName, onSubmit, placeholder,
}: {
  authorName: string;
  onSubmit: (title: string, body: string) => Promise<void> | void;
  placeholder: string;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    await onSubmit(title.trim(), text);
    setTitle('');
    setBody('');
    setOpen(false);
    setSubmitting(false);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3">
        <Avatar name={authorName} size="md" />
        <div className="flex-1 min-w-0">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full text-left p-4 rounded-2xl border border-brand-100 bg-brand-50/40 text-ink-500 hover:bg-brand-50 transition"
            >
              {placeholder}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <input
                className="input"
                placeholder="A short title (optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea
                className="input min-h-[130px]"
                placeholder={placeholder}
                value={body}
                onChange={e => setBody(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setTitle(''); setBody(''); }}
                  className="btn-ghost text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={submit}
                  disabled={submitting || !body.trim()}
                  className="btn-primary text-sm py-2 px-5 disabled:opacity-60"
                >
                  {submitting ? 'Posting…' : 'Post'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PostCard
   ============================================================ */

function PostCard({
  post, currentUserId, onMutate,
}: {
  post: ForumPost;
  currentUserId: string;
  onMutate: (postId: string, payload: Record<string, unknown>) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const liked = post.likedBy.includes(currentUserId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="card"
    >
      <header className="flex items-start gap-3 mb-3">
        <Avatar name={post.authorName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900">{post.authorName}</p>
          <p className="text-xs text-ink-500">
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </header>

      {post.title && (
        <h3 className="font-display text-xl font-semibold text-ink-900 mb-2 leading-snug">
          {post.title}
        </h3>
      )}
      <p className="text-ink-800 leading-relaxed whitespace-pre-wrap">{post.body}</p>

      <div className="flex items-center gap-3 mt-4">
        <LikeButton
          liked={liked}
          count={post.likedBy.length}
          onClick={() => onMutate(post.id, { action: 'like-post', userId: currentUserId })}
        />
        <button
          type="button"
          onClick={() => setShowReply(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-ink-700 hover:bg-brand-50 transition"
        >
          <ReplyIcon /> Reply
        </button>
      </div>

      {showReply && (
        <ReplyComposer
          onSubmit={async (body) => {
            await onMutate(post.id, { action: 'reply-to-post', body, authorId: currentUserId, authorName: 'You' });
            setShowReply(false);
          }}
          onCancel={() => setShowReply(false)}
        />
      )}

      {post.replies.length > 0 && (
        <div className="mt-4 space-y-3 pl-3 md:pl-5 border-l-2 border-brand-100">
          {post.replies.map(r => (
            <ReplyNode
              key={r.id}
              reply={r}
              postId={post.id}
              currentUserId={currentUserId}
              onMutate={onMutate}
              depth={0}
            />
          ))}
        </div>
      )}
    </motion.article>
  );
}

/* ============================================================
   Reply node (recursive)
   ============================================================ */

function ReplyNode({
  reply, postId, currentUserId, onMutate, depth,
}: {
  reply: ForumReply;
  postId: string;
  currentUserId: string;
  onMutate: (postId: string, payload: Record<string, unknown>) => void;
  depth: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const liked = reply.likedBy.includes(currentUserId);
  const maxDepth = 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-brand-50/40 rounded-2xl p-3.5 border border-brand-100"
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={reply.authorName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-semibold text-ink-900 text-sm">{reply.authorName}</p>
            <span className="text-xs text-ink-500">{timeAgo(reply.createdAt)}</span>
          </div>
          <p className="text-ink-800 text-sm mt-1 leading-relaxed whitespace-pre-wrap">{reply.body}</p>

          <div className="flex items-center gap-2 mt-2.5">
            <LikeButton
              size="sm"
              liked={liked}
              count={reply.likedBy.length}
              onClick={() => onMutate(postId, { action: 'like-reply', replyId: reply.id, userId: currentUserId })}
            />
            {depth < maxDepth && (
              <button
                type="button"
                onClick={() => setShowReply(o => !o)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-ink-600 hover:bg-brand-100/60 transition"
              >
                <ReplyIcon small /> Reply
              </button>
            )}
          </div>

          {showReply && (
            <ReplyComposer
              compact
              onSubmit={async (body) => {
                await onMutate(postId, {
                  action: 'reply-to-reply',
                  replyId: reply.id,
                  body,
                  authorId: currentUserId,
                  authorName: 'You',
                });
                setShowReply(false);
              }}
              onCancel={() => setShowReply(false)}
            />
          )}
        </div>
      </div>

      {reply.replies.length > 0 && (
        <div className="mt-3 pl-3 md:pl-5 border-l-2 border-brand-100 space-y-3">
          {reply.replies.map(r => (
            <ReplyNode
              key={r.id}
              reply={r}
              postId={postId}
              currentUserId={currentUserId}
              onMutate={onMutate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ============================================================
   Composers + helpers
   ============================================================ */

function ReplyComposer({
  onSubmit, onCancel, compact = false,
}: {
  onSubmit: (body: string) => Promise<void> | void;
  onCancel: () => void;
  compact?: boolean;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  async function submit() {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    await onSubmit(text);
    setBody('');
    setSubmitting(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      <textarea
        ref={ref}
        className={`input ${compact ? 'min-h-[70px] py-2.5 text-sm' : 'min-h-[90px]'}`}
        placeholder="Write a kind reply…"
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-ink-500 hover:text-ink-900 px-3 py-1.5">
          Cancel
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={submitting || !body.trim()}
          className="btn-primary text-sm py-2 px-4 disabled:opacity-60"
        >
          {submitting ? '…' : 'Reply'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function LikeButton({
  liked, count, onClick, size = 'md',
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  const px = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={`flex items-center gap-1.5 ${px} rounded-full font-medium transition ${
        liked
          ? 'bg-warm-100 text-warm-500 border border-warm-300'
          : 'text-ink-700 hover:bg-brand-50 border border-transparent'
      }`}
    >
      <HeartIcon filled={liked} small={size === 'sm'} />
      <span>{count > 0 ? count : ''}</span>
      {count === 0 && <span>Like</span>}
    </motion.button>
  );
}

function HeartIcon({ filled, small }: { filled: boolean; small?: boolean }) {
  const s = small ? 14 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function ReplyIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 00-4-4H4" />
    </svg>
  );
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
