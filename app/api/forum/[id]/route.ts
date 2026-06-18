import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { readForumPosts, writeForumPosts } from '@/lib/store';
import type { ForumPost, ForumReply, Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext { params: { id: string } }

/** Recursively walks a reply tree, invoking mutator on the match. */
function mutateReplyById(
  replies: ForumReply[],
  targetId: string,
  mutator: (r: ForumReply) => void,
): boolean {
  for (const r of replies) {
    if (r.id === targetId) {
      mutator(r);
      return true;
    }
    if (mutateReplyById(r.replies, targetId, mutator)) return true;
  }
  return false;
}

function toggleLikedBy(arr: string[], userId: string): string[] {
  return arr.includes(userId) ? arr.filter(x => x !== userId) : [...arr, userId];
}

function makeReply(
  authorId: string,
  authorName: string,
  authorRole: Role,
  body: string,
): ForumReply {
  return {
    id: `reply-${randomUUID().slice(0, 8)}`,
    authorId,
    authorName,
    authorRole,
    body: body.trim(),
    createdAt: new Date().toISOString(),
    likedBy: [],
    replies: [],
  };
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const all = await readForumPosts();
  const post = all.find(p => p.id === params.id);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  switch (action) {
    case 'like-post': {
      const userId = String(body.userId ?? '');
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      post.likedBy = toggleLikedBy(post.likedBy, userId);
      break;
    }
    case 'reply-to-post': {
      const text = String(body.body ?? '').trim();
      if (!text) return NextResponse.json({ error: 'reply body required' }, { status: 400 });
      const r = makeReply(
        String(body.authorId ?? ''),
        String(body.authorName ?? 'Guest'),
        (body.authorRole as Role) ?? post.audience,
        text,
      );
      post.replies.push(r);
      break;
    }
    case 'like-reply': {
      const userId = String(body.userId ?? '');
      const replyId = String(body.replyId ?? '');
      if (!userId || !replyId) return NextResponse.json({ error: 'userId and replyId required' }, { status: 400 });
      const found = mutateReplyById(post.replies, replyId, r => {
        r.likedBy = toggleLikedBy(r.likedBy, userId);
      });
      if (!found) return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
      break;
    }
    case 'reply-to-reply': {
      const text = String(body.body ?? '').trim();
      const replyId = String(body.replyId ?? '');
      if (!text || !replyId) return NextResponse.json({ error: 'replyId and body required' }, { status: 400 });
      const r = makeReply(
        String(body.authorId ?? ''),
        String(body.authorName ?? 'Guest'),
        (body.authorRole as Role) ?? post.audience,
        text,
      );
      const found = mutateReplyById(post.replies, replyId, parent => {
        parent.replies.push(r);
      });
      if (!found) return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 });
      break;
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  await writeForumPosts(all);
  return NextResponse.json({ post });
}

export async function GET(_req: Request, { params }: RouteContext) {
  const all = await readForumPosts();
  const post = all.find((p: ForumPost) => p.id === params.id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ post });
}
