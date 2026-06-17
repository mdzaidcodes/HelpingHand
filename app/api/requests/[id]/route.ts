import { NextResponse } from 'next/server';
import { findRequestById, upsertRequest } from '@/lib/store';
import type { RequestStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface RouteContext { params: { id: string } }

const ALLOWED_STATUSES: RequestStatus[] = ['pending', 'accepted', 'declined', 'cancelled'];

export async function GET(_req: Request, { params }: RouteContext) {
  const r = await findRequestById(params.id);
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ request: r });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const r = await findRequestById(params.id);
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const patch = await req.json().catch(() => ({}));

  const updated = { ...r };
  if (typeof patch.status === 'string' && ALLOWED_STATUSES.includes(patch.status as RequestStatus)) {
    updated.status = patch.status as RequestStatus;
    if (patch.status !== 'pending' && !updated.respondedAt) {
      updated.respondedAt = new Date().toISOString();
    }
  }
  if (typeof patch.responseMessage === 'string') {
    updated.responseMessage = patch.responseMessage.trim() || undefined;
  }
  if (typeof patch.unread === 'boolean') {
    updated.unread = patch.unread;
  }

  await upsertRequest(updated);
  return NextResponse.json({ request: updated });
}
