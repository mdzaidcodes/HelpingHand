import { LANGUAGES, NATIONALITIES } from './options';
import {
  readPreferredLanguages,
  readPreferredNationalities,
  type Volunteer,
  type Preferences,
  type CareSkill,
  type Gender,
  type Availability,
} from './types';

/**
 * Cosine-similarity matching.
 *
 * Both the patient's preferences and a volunteer's attributes are projected
 * into the same binary feature space. The angle between the two vectors
 * (computed via cos θ = (A · B) / (||A|| × ||B||)) is the match score.
 *
 *   1.0  → vectors point the same way — the volunteer's profile is shaped
 *          exactly like the patient's request.
 *   0.0  → no overlapping features at all.
 *
 * Feature space layout (binary, in this order):
 *   [ 7 ]  care skills        — does the patient need this / does the volunteer offer it?
 *   [ L ]  languages          — preferred language / languages spoken (multi-hot for volunteer)
 *   [ N ]  nationalities      — preferred nationality / their nationality (one-hot)
 *   [ 2 ]  gender             — preferred / actual
 *   [ 2 ]  availability       — preferred / actual ("Both" is multi-hot)
 *
 * Total dimensions: 7 + |LANGUAGES| + |NATIONALITIES| + 2 + 2
 */

const SKILL_KEYS: CareSkill[] = [
  'mobilitySupport',
  'medicationManagement',
  'mealPreparation',
  'companionship',
  'personalCare',
  'dementiaCare',
  'postSurgeryCare',
  'housekeeping',
  'transportation',
];

const GENDERS: Gender[] = ['Female', 'Male'];
const AVAILABILITY_DIMS: Exclude<Availability, 'Both'>[] = ['Hourly', 'Live-in'];

export const FEATURE_DIMENSION =
  SKILL_KEYS.length +
  LANGUAGES.length +
  NATIONALITIES.length +
  GENDERS.length +
  AVAILABILITY_DIMS.length;

export interface VectorSlices {
  skills: [number, number];
  languages: [number, number];
  nationalities: [number, number];
  gender: [number, number];
  availability: [number, number];
}

/** Index ranges for each feature group within the vector. */
export const SLICES: VectorSlices = (() => {
  let i = 0;
  const skills: [number, number] = [i, (i += SKILL_KEYS.length)];
  const languages: [number, number] = [i, (i += LANGUAGES.length)];
  const nationalities: [number, number] = [i, (i += NATIONALITIES.length)];
  const gender: [number, number] = [i, (i += GENDERS.length)];
  const availability: [number, number] = [i, (i += AVAILABILITY_DIMS.length)];
  return { skills, languages, nationalities, gender, availability };
})();

export function buildPatientVector(prefs: Preferences): number[] {
  const v: number[] = new Array(FEATURE_DIMENSION).fill(0);
  let i = 0;

  const wantedLangs = new Set(readPreferredLanguages(prefs));
  const wantedNats = new Set(readPreferredNationalities(prefs));

  // Skills (patient needs)
  for (const skill of SKILL_KEYS) {
    v[i++] = prefs.needs?.[skill] ? 1 : 0;
  }
  // Languages — multi-hot when the patient picked several acceptable languages.
  for (const lang of LANGUAGES) {
    v[i++] = wantedLangs.has(lang) ? 1 : 0;
  }
  // Nationalities — multi-hot.
  for (const nat of NATIONALITIES) {
    v[i++] = wantedNats.has(nat) ? 1 : 0;
  }
  // Gender — only mark when the patient has a specific preference
  for (const g of GENDERS) {
    v[i++] = prefs.gender === g ? 1 : 0;
  }
  // Availability — only mark when the patient has a specific preference
  for (const a of AVAILABILITY_DIMS) {
    v[i++] = prefs.availability === a ? 1 : 0;
  }

  return v;
}

export function buildVolunteerVector(volunteer: Volunteer): number[] {
  const v: number[] = new Array(FEATURE_DIMENSION).fill(0);
  let i = 0;

  // Skills offered
  for (const skill of SKILL_KEYS) {
    v[i++] = volunteer.skills[skill] ? 1 : 0;
  }
  // Languages spoken (multi-hot — volunteers can speak multiple)
  for (const lang of LANGUAGES) {
    v[i++] = volunteer.languages.includes(lang) ? 1 : 0;
  }
  // Nationality (one-hot)
  for (const nat of NATIONALITIES) {
    v[i++] = volunteer.nationality === nat ? 1 : 0;
  }
  // Gender (one-hot)
  for (const g of GENDERS) {
    v[i++] = volunteer.gender === g ? 1 : 0;
  }
  // Availability — "Both" lights up both dimensions
  v[i++] = volunteer.availability === 'Hourly' || volunteer.availability === 'Both' ? 1 : 0;
  v[i++] = volunteer.availability === 'Live-in' || volunteer.availability === 'Both' ? 1 : 0;

  return v;
}

/** Pure cosine similarity. Returns 0 when either vector has no length. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Cosine: vector lengths differ (${a.length} vs ${b.length})`);
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Convenience: similarity between a patient's prefs and a volunteer. */
export function preferenceSimilarity(prefs: Preferences, volunteer: Volunteer): number {
  return cosineSimilarity(buildPatientVector(prefs), buildVolunteerVector(volunteer));
}
