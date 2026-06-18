import type { Volunteer, Preferences, CareSkill } from './types';
import {
  readPreferredLanguages,
  readPreferredNationalities,
} from './types';
import {
  buildPatientVector,
  buildVolunteerVector,
  cosineSimilarity,
} from './cosine';

export interface MatchResult {
  volunteer: Volunteer;
  /** Raw cosine similarity, 0–1. */
  similarity: number;
  /** Cosine score blended with a small rating boost, presented as 0–100. */
  matchPercent: number;
  /** Human-readable overlap highlights for the UI. */
  reasons: string[];
}

// Cosine reflects how well the volunteer's profile matches the patient's
// preferences. We add a small weight from the volunteer's rating so that ties
// break in favour of better-reviewed volunteers.
const COSINE_WEIGHT = 0.9;
const RATING_WEIGHT = 0.1;

export function scoreVolunteer(volunteer: Volunteer, prefs: Preferences): MatchResult {
  const patientVec = buildPatientVector(prefs);
  const volunteerVec = buildVolunteerVector(volunteer);
  const similarity = cosineSimilarity(patientVec, volunteerVec);

  // Patient may have left every preference blank — in that case cosine is 0 and
  // we fall back to the volunteer's rating as the sort signal.
  const patientHasAnyPref = patientVec.some(x => x === 1);
  const ratingNormalized = (volunteer.rating ?? 0) / 5;
  const blended = patientHasAnyPref
    ? similarity * COSINE_WEIGHT + ratingNormalized * RATING_WEIGHT
    : ratingNormalized;
  const matchPercent = Math.round(Math.max(0, Math.min(1, blended)) * 100);

  // Derive the bullet-point "why we matched" reasons from the vector overlap.
  const reasons: string[] = [];
  const wantedLangs = readPreferredLanguages(prefs);
  const matchedLangs = wantedLangs.filter(l => volunteer.languages.includes(l));
  if (matchedLangs.length > 0) {
    reasons.push(`Speaks ${matchedLangs.join(', ')}`);
  }
  if (prefs.gender && prefs.gender !== 'Any' && volunteer.gender === prefs.gender) {
    reasons.push(`${prefs.gender} volunteer`);
  }
  const wantedNats = readPreferredNationalities(prefs);
  if (wantedNats.includes(volunteer.nationality)) {
    reasons.push(`From ${volunteer.nationality}`);
  }
  if (prefs.availability && prefs.availability !== 'Any'
      && (volunteer.availability === prefs.availability || volunteer.availability === 'Both')) {
    reasons.push(`Available ${prefs.availability}`);
  }

  return { volunteer, similarity, matchPercent, reasons };
}

export function rankVolunteers(volunteers: Volunteer[], prefs: Preferences): MatchResult[] {
  return volunteers
    .map(v => scoreVolunteer(v, prefs))
    .sort((a, b) =>
      b.matchPercent - a.matchPercent
      || b.similarity - a.similarity
      || b.volunteer.rating - a.volunteer.rating
    );
}

export function preferencesToQuery(prefs: Preferences): string {
  const params = new URLSearchParams();
  const langs = readPreferredLanguages(prefs);
  if (langs.length) params.set('languages', langs.join(','));
  if (prefs.gender && prefs.gender !== 'Any') params.set('gender', prefs.gender);
  const nats = readPreferredNationalities(prefs);
  if (nats.length) params.set('nationalities', nats.join(','));
  if (prefs.availability && prefs.availability !== 'Any') params.set('availability', prefs.availability);
  const needs = (Object.keys(prefs.needs) as CareSkill[]).filter(k => prefs.needs[k]);
  if (needs.length) params.set('needs', needs.join(','));
  return params.toString();
}

export function preferencesFromQuery(
  q: URLSearchParams | Record<string, string | string[] | undefined>,
): Preferences {
  const get = (k: string): string | undefined => {
    if (q instanceof URLSearchParams) return q.get(k) ?? undefined;
    const v = q[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const prefs: Preferences = { needs: {}, gender: 'Any', availability: 'Any', languages: [], nationalities: [] };
  const languages = get('languages');
  if (languages) prefs.languages = languages.split(',').filter(Boolean);
  else { const language = get('language'); if (language) prefs.languages = [language]; }
  const gender = get('gender');
  if (gender === 'Male' || gender === 'Female') prefs.gender = gender;
  const nationalities = get('nationalities');
  if (nationalities) prefs.nationalities = nationalities.split(',').filter(Boolean);
  else { const nationality = get('nationality'); if (nationality) prefs.nationalities = [nationality]; }
  const availability = get('availability');
  if (availability === 'Live-in' || availability === 'Hourly') prefs.availability = availability;
  const needs = get('needs');
  if (needs) {
    for (const n of needs.split(',')) {
      (prefs.needs as Record<string, boolean>)[n] = true;
    }
  }
  return prefs;
}
