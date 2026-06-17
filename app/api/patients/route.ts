import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { findPatientByEmail, upsertPatient } from '@/lib/store';
import { EMPTY_HEALTH, EMPTY_PREFERENCES, type Patient } from '@/lib/types';
import { USER_LOCATION } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== 'string' || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }

  const existing = await findPatientByEmail(body.email);
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists', existingId: existing.id }, { status: 409 });
  }

  const patient: Patient = {
    id: randomUUID(),
    email: body.email.trim().toLowerCase(),
    name: body.name.trim(),
    age: typeof body.age === 'number' ? body.age : undefined,
    neighborhood: typeof body.neighborhood === 'string' ? body.neighborhood : USER_LOCATION.neighborhood,
    city: typeof body.city === 'string' ? body.city : USER_LOCATION.city,
    lat: typeof body.lat === 'number' ? body.lat : USER_LOCATION.lat,
    lng: typeof body.lng === 'number' ? body.lng : USER_LOCATION.lng,
    preferences: body.preferences ?? EMPTY_PREFERENCES,
    health: body.health ?? EMPTY_HEALTH,
    volunteerHistory: [],
    createdAt: new Date().toISOString(),
  };

  await upsertPatient(patient);
  return NextResponse.json({ patient }, { status: 201 });
}
