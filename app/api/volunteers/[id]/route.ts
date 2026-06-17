import { NextResponse } from 'next/server';
import { findVolunteerById, upsertVolunteer } from '@/lib/store';

export const dynamic = 'force-dynamic';

interface RouteContext { params: { id: string } }

export async function GET(_req: Request, { params }: RouteContext) {
  const volunteer = await findVolunteerById(params.id);
  if (!volunteer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ volunteer });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const volunteer = await findVolunteerById(params.id);
  if (!volunteer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = await req.json().catch(() => ({}));

  const updated = {
    ...volunteer,
    trainingProgress: patch.trainingProgress ?? volunteer.trainingProgress,
    interview: patch.interview ?? volunteer.interview,
    bio: typeof patch.bio === 'string' ? patch.bio : volunteer.bio,
    notifications: patch.notifications ?? volunteer.notifications,
  };

  await upsertVolunteer(updated);
  return NextResponse.json({ volunteer: updated });
}
