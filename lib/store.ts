import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Patient, Volunteer, CareRequest } from './types';

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

async function readJson<T>(file: string): Promise<T[]> {
  await ensureFile(file);
  const raw = await fs.readFile(file, 'utf8');
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await ensureFile(file);
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

/* Patients */

export const readPatients = () => readJson<Patient>(PATIENTS_FILE);
export const writePatients = (rows: Patient[]) => writeJson(PATIENTS_FILE, rows);

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

export const readVolunteers = () => readJson<Volunteer>(VOLUNTEERS_FILE);
export const writeVolunteers = (rows: Volunteer[]) => writeJson(VOLUNTEERS_FILE, rows);

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

export const readRequests = () => readJson<CareRequest>(REQUESTS_FILE);
export const writeRequests = (rows: CareRequest[]) => writeJson(REQUESTS_FILE, rows);

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
