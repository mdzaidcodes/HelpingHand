import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { findVolunteerByEmail, upsertVolunteer } from '@/lib/store';
import { NEIGHBORHOOD_COORDS } from '@/lib/options';
import { EMPTY_TRAINING, type Volunteer, type CareSkill } from '@/lib/types';

export const dynamic = 'force-dynamic';

const noSkills: Record<CareSkill, boolean> = {
  mobilitySupport: false,
  medicationManagement: false,
  mealPreparation: false,
  companionship: false,
  personalCare: false,
  dementiaCare: false,
  postSurgeryCare: false,
  housekeeping: false,
  transportation: false,
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== 'string' || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }
  const existing = await findVolunteerByEmail(body.email);
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists', existingId: existing.id }, { status: 409 });
  }

  const neighborhood = typeof body.neighborhood === 'string' ? body.neighborhood : 'Khalidiyah';
  const coords = NEIGHBORHOOD_COORDS[neighborhood] ?? NEIGHBORHOOD_COORDS['Khalidiyah'];

  const volunteer: Volunteer = {
    id: randomUUID(),
    email: body.email.trim().toLowerCase(),
    name: body.name.trim(),
    age: typeof body.age === 'number' ? body.age : 30,
    gender: body.gender === 'Male' ? 'Male' : 'Female',
    nationality: typeof body.nationality === 'string' ? body.nationality : 'Other',
    languages: Array.isArray(body.languages) ? body.languages : [],
    yearsExperience: typeof body.yearsExperience === 'number' ? body.yearsExperience : 0,
    bio: typeof body.bio === 'string' ? body.bio : '',
    skills: { ...noSkills, ...(body.skills ?? {}) },
    rating: 0,
    reviewCount: 0,
    reviews: [],
    availability: body.availability === 'Live-in' ? 'Live-in' : body.availability === 'Both' ? 'Both' : 'Hourly',
    certifications: Array.isArray(body.certifications) ? body.certifications : [],
    city: typeof body.city === 'string' ? body.city : 'Abu Dhabi',
    neighborhood,
    lat: coords.lat,
    lng: coords.lng,
    trainingProgress: EMPTY_TRAINING,
    patientHistory: [],
    notifications: [],
    createdAt: new Date().toISOString(),
  };

  await upsertVolunteer(volunteer);
  return NextResponse.json({ volunteer }, { status: 201 });
}

export async function GET() {
  const { readVolunteers } = await import('@/lib/store');
  const volunteers = await readVolunteers();
  return NextResponse.json({ volunteers });
}
