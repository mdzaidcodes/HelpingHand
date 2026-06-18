import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  findPatientById,
  findVolunteerById,
  findRequestsForPatient,
  findRequestsForVolunteer,
  upsertRequest,
} from '@/lib/store';
import {
  DAYS,
  DEFAULT_SCHEDULE,
  scheduleTotal,
  type CareRequest,
  type CareSkill,
  type DayKey,
  type WeekSchedule,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get('patientId');
  const volunteerId = url.searchParams.get('volunteerId');
  if (patientId) {
    const rows = await findRequestsForPatient(patientId);
    return NextResponse.json({ requests: rows });
  }
  if (volunteerId) {
    const rows = await findRequestsForVolunteer(volunteerId);
    return NextResponse.json({ requests: rows });
  }
  return NextResponse.json({ error: 'patientId or volunteerId is required' }, { status: 400 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.patientId !== 'string' || typeof body.volunteerId !== 'string') {
    return NextResponse.json({ error: 'patientId and volunteerId are required' }, { status: 400 });
  }

  const [patient, volunteer] = await Promise.all([
    findPatientById(body.patientId),
    findVolunteerById(body.volunteerId),
  ]);
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });

  const requestedNeeds = Array.isArray(body.requestedNeeds)
    ? (body.requestedNeeds.filter((s: string) => typeof s === 'string') as CareSkill[])
    : (Object.keys(patient.preferences.needs ?? {}).filter(k => patient.preferences.needs[k as CareSkill]) as CareSkill[]);
  const requestedAvailability = body.requestedAvailability === 'Live-in' || body.requestedAvailability === 'Both'
    ? body.requestedAvailability
    : (patient.preferences.availability && patient.preferences.availability !== 'Any' ? patient.preferences.availability : 'Hourly');
  // Normalise schedule. For Live-in requests we don't carry one. Otherwise we
  // take the patient's provided schedule (clamped to sensible bounds) or fall
  // back to DEFAULT_SCHEDULE so an empty-submit still produces something usable.
  let schedule: WeekSchedule | undefined;
  if (requestedAvailability !== 'Live-in') {
    const incoming = body.schedule;
    if (incoming && typeof incoming === 'object') {
      const normalised: WeekSchedule = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      for (const day of DAYS) {
        const raw = Number(incoming[day]);
        normalised[day] = Number.isFinite(raw) ? Math.max(0, Math.min(12, raw)) : 0;
      }
      schedule = scheduleTotal(normalised) > 0 ? normalised : { ...DEFAULT_SCHEDULE };
    } else {
      schedule = { ...DEFAULT_SCHEDULE };
    }
  }

  const requestedHoursPerWeek = requestedAvailability === 'Live-in'
    ? undefined
    : schedule
      ? scheduleTotal(schedule)
      : (typeof body.requestedHoursPerWeek === 'number' && body.requestedHoursPerWeek > 0
          ? Math.min(60, Math.round(body.requestedHoursPerWeek))
          : 8);

  const record: CareRequest = {
    id: randomUUID(),
    patientId: patient.id,
    volunteerId: volunteer.id,
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    patientNationality: patient.nationality,
    patientNeighborhood: patient.neighborhood ?? 'Abu Dhabi',
    patientLat: patient.lat,
    patientLng: patient.lng,
    volunteerName: volunteer.name,
    volunteerNeighborhood: volunteer.neighborhood,
    message: typeof body.message === 'string' ? body.message.trim() : '',
    requestedNeeds,
    requestedAvailability,
    requestedHoursPerWeek,
    schedule,
    preferredLanguage: (patient.preferences.languages && patient.preferences.languages.length > 0)
      ? patient.preferences.languages.join(', ')
      : patient.preferences.language,
    status: 'pending',
    createdAt: new Date().toISOString(),
    unread: true,
  };

  await upsertRequest(record);
  return NextResponse.json({ request: record }, { status: 201 });
}
