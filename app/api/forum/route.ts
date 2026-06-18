import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { readForumPosts, writeForumPosts } from '@/lib/store';
import type { ForumPost, ForumAudience, Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isAudience(v: unknown): v is ForumAudience {
  return v === 'patient' || v === 'volunteer';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const audience = url.searchParams.get('audience');
  if (!isAudience(audience)) {
    return NextResponse.json({ error: 'audience must be "patient" or "volunteer"' }, { status: 400 });
  }
  const all = await readForumPosts();
  const posts = all
    .filter(p => p.audience === audience)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const audience = url.searchParams.get('audience');
  if (!isAudience(audience)) {
    return NextResponse.json({ error: 'audience required' }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.authorId !== 'string' || typeof body.authorName !== 'string' || typeof body.body !== 'string') {
    return NextResponse.json({ error: 'authorId, authorName and body are required' }, { status: 400 });
  }
  const text = body.body.trim();
  if (!text) {
    return NextResponse.json({ error: 'body cannot be empty' }, { status: 400 });
  }

  const post: ForumPost = {
    id: `post-${randomUUID().slice(0, 8)}`,
    audience,
    authorId: body.authorId,
    authorName: body.authorName,
    authorRole: (body.authorRole as Role) ?? audience,
    title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : undefined,
    body: text,
    createdAt: new Date().toISOString(),
    likedBy: [],
    replies: [],
  };

  const all = await readForumPosts();
  all.push(post);
  await writeForumPosts(all);
  return NextResponse.json({ post }, { status: 201 });
}
