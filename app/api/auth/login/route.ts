import { NextResponse } from 'next/server';
import { findPatientByEmail, findVolunteerByEmail } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  const patient = await findPatientByEmail(email);
  if (patient) {
    return NextResponse.json({
      session: { userId: patient.id, role: 'patient', name: patient.name },
      patient,
    });
  }

  const volunteer = await findVolunteerByEmail(email);
  if (volunteer) {
    return NextResponse.json({
      session: { userId: volunteer.id, role: 'volunteer', name: volunteer.name },
      volunteer,
    });
  }

  return NextResponse.json({ error: 'No account found for that email. Please sign up first.' }, { status: 404 });
}
