import { NextResponse } from 'next/server';
import { findPatientById, upsertPatient } from '@/lib/store';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteContext) {
  const patient = await findPatientById(params.id);
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ patient });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const patient = await findPatientById(params.id);
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch = await req.json().catch(() => ({}));

  const updated = {
    ...patient,
    name: typeof patch.name === 'string' ? patch.name : patient.name,
    age: typeof patch.age === 'number' ? patch.age : patient.age,
    neighborhood: typeof patch.neighborhood === 'string' ? patch.neighborhood : patient.neighborhood,
    city: typeof patch.city === 'string' ? patch.city : patient.city,
    lat: typeof patch.lat === 'number' ? patch.lat : patient.lat,
    lng: typeof patch.lng === 'number' ? patch.lng : patient.lng,
    preferences: patch.preferences ?? patient.preferences,
    health: patch.health ?? patient.health,
  };

  await upsertPatient(updated);
  return NextResponse.json({ patient: updated });
}
