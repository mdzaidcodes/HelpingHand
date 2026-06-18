/**
 * HelpingHand data store.
 *
 * Two backends; the right one is chosen at runtime:
 *
 *   1. **Upstash Redis** — used when the env vars below are present.
 *      Works on any host: Vercel (Vercel KV vars get injected automatically),
 *      Render, Fly.io, anywhere. Sign up at https://upstash.com (free tier:
 *      10K commands/day, more than enough for a demo).
 *
 *        UPSTASH_REDIS_REST_URL    (or KV_REST_API_URL for Vercel KV)
 *        UPSTASH_REDIS_REST_TOKEN  (or KV_REST_API_TOKEN for Vercel KV)
 *
 *   2. **Local filesystem** — the fallback. Reads/writes `data/*.json` like
 *      before. This is what `npm run dev` uses out of the box.
 *
 * On first read in Redis mode, the seed data from `data/*.json` is loaded
 * into Redis (one-time, idempotent via a sentinel key). After that, all
 * mutations persist in Redis and survive redeploys.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Patient, Volunteer, CareRequest } from './types';

/* ----------------------------------------------------------------
   Backend detection
   ---------------------------------------------------------------- */

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL ??
  '';
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.KV_REST_API_TOKEN ??
  '';
const useRedis = !!(REDIS_URL && REDIS_TOKEN);

/* ----------------------------------------------------------------
   File backend
   ---------------------------------------------------------------- */

const DATA_DIR = path.join(process.cwd(), 'data');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const VOLUNTEERS_FILE = path.join(DATA_DIR, 'volunteers.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

async function ensureFile(file: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, '[]', 'utf8');
  }
}

async function readFromFile<T>(file: string): Promise<T[]> {
  await ensureFile(file);
  const raw = await fs.readFile(file, 'utf8');
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeToFile<T>(file: string, data: T[]): Promise<void> {
  await ensureFile(file);
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function readSeedJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

/* ----------------------------------------------------------------
   Redis backend
   ---------------------------------------------------------------- */

const KEY_PATIENTS = 'hh:patients';
const KEY_VOLUNTEERS = 'hh:volunteers';
const KEY_REQUESTS = 'hh:requests';
const KEY_SEEDED = 'hh:seeded:v1';

let redisClient: import('@upstash/redis').Redis | null = null;
async function getRedis() {
  if (!useRedis) return null;
  if (redisClient) return redisClient;
  const { Redis } = await import('@upstash/redis');
  redisClient = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  return redisClient;
}

let seedPromise: Promise<void> | null = null;
async function ensureSeeded(): Promise<void> {
  if (!useRedis) return;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const redis = await getRedis();
    if (!redis) return;
    const already = await redis.get(KEY_SEEDED);
    if (already) return;
    const [pats, vols, reqs] = await Promise.all([
      readSeedJson<Patient>(PATIENTS_FILE),
      readSeedJson<Volunteer>(VOLUNTEERS_FILE),
      readSeedJson<CareRequest>(REQUESTS_FILE),
    ]);
    await Promise.all([
      redis.set(KEY_PATIENTS, JSON.stringify(pats)),
      redis.set(KEY_VOLUNTEERS, JSON.stringify(vols)),
      redis.set(KEY_REQUESTS, JSON.stringify(reqs)),
      redis.set(KEY_SEEDED, '1'),
    ]);
  })();
  return seedPromise;
}

async function readFromRedis<T>(key: string): Promise<T[]> {
  const redis = await getRedis();
  if (!redis) return [];
  await ensureSeeded();
  const raw = await redis.get<string | T[] | null>(key);
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T[]; } catch { return []; }
  }
  return raw as T[];
}

async function writeToRedis<T>(key: string, data: T[]): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  await redis.set(key, JSON.stringify(data));
}

/* ----------------------------------------------------------------
   Public API — same shape, dispatches to whichever backend is live
   ---------------------------------------------------------------- */

/* Patients */

export async function readPatients(): Promise<Patient[]> {
  return useRedis
    ? readFromRedis<Patient>(KEY_PATIENTS)
    : readFromFile<Patient>(PATIENTS_FILE);
}

export async function writePatients(rows: Patient[]): Promise<void> {
  return useRedis
    ? writeToRedis(KEY_PATIENTS, rows)
    : writeToFile(PATIENTS_FILE, rows);
}

export async function findPatientById(id: string): Promise<Patient | undefined> {
  const rows = await readPatients();
  return rows.find(p => p.id === id);
}

export async function findPatientByEmail(email: string): Promise<Patient | undefined> {
  const rows = await readPatients();
  return rows.find(p => p.email.toLowerCase() === email.toLowerCase());
}

export async function upsertPatient(patient: Patient): Promise<Patient> {
  const rows = await readPatients();
  const i = rows.findIndex(p => p.id === patient.id);
  if (i === -1) rows.push(patient);
  else rows[i] = patient;
  await writePatients(rows);
  return patient;
}

/* Volunteers (unified) */

export async function readVolunteers(): Promise<Volunteer[]> {
  return useRedis
    ? readFromRedis<Volunteer>(KEY_VOLUNTEERS)
    : readFromFile<Volunteer>(VOLUNTEERS_FILE);
}

export async function writeVolunteers(rows: Volunteer[]): Promise<void> {
  return useRedis
    ? writeToRedis(KEY_VOLUNTEERS, rows)
    : writeToFile(VOLUNTEERS_FILE, rows);
}

export async function findVolunteerById(id: string): Promise<Volunteer | undefined> {
  const rows = await readVolunteers();
  return rows.find(v => v.id === id);
}

export async function findVolunteerByEmail(email: string): Promise<Volunteer | undefined> {
  const rows = await readVolunteers();
  return rows.find(v => v.email.toLowerCase() === email.toLowerCase());
}

export async function upsertVolunteer(volunteer: Volunteer): Promise<Volunteer> {
  const rows = await readVolunteers();
  const i = rows.findIndex(v => v.id === volunteer.id);
  if (i === -1) rows.push(volunteer);
  else rows[i] = volunteer;
  await writeVolunteers(rows);
  return volunteer;
}

/* Requests */

export async function readRequests(): Promise<CareRequest[]> {
  return useRedis
    ? readFromRedis<CareRequest>(KEY_REQUESTS)
    : readFromFile<CareRequest>(REQUESTS_FILE);
}

export async function writeRequests(rows: CareRequest[]): Promise<void> {
  return useRedis
    ? writeToRedis(KEY_REQUESTS, rows)
    : writeToFile(REQUESTS_FILE, rows);
}

export async function findRequestById(id: string): Promise<CareRequest | undefined> {
  const rows = await readRequests();
  return rows.find(r => r.id === id);
}

export async function findRequestsForVolunteer(volunteerId: string): Promise<CareRequest[]> {
  const rows = await readRequests();
  return rows
    .filter(r => r.volunteerId === volunteerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function findRequestsForPatient(patientId: string): Promise<CareRequest[]> {
  const rows = await readRequests();
  return rows
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function upsertRequest(req: CareRequest): Promise<CareRequest> {
  const rows = await readRequests();
  const i = rows.findIndex(r => r.id === req.id);
  if (i === -1) rows.push(req);
  else rows[i] = req;
  await writeRequests(rows);
  return req;
}

/** Which backend is currently active. Exposed for diagnostics. */
export const activeBackend: 'redis' | 'file' = useRedis ? 'redis' : 'file';
