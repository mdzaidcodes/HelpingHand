import type { Volunteer, Preferences, CareSkill } from './types';

export interface MatchResult {
  volunteer: Volunteer;
  score: number;
  matchPercent: number;
  reasons: string[];
}

const WEIGHTS = {
  language: 25,
  gender: 15,
  nationality: 10,
  availability: 10,
  perSkill: 8,
  ratingBoost: 5,
};

export function scoreVolunteer(volunteer: Volunteer, prefs: Preferences): MatchResult {
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];

  if (prefs.language) {
    maxScore += WEIGHTS.language;
    if (volunteer.languages.includes(prefs.language)) {
      score += WEIGHTS.language;
      reasons.push(`Speaks ${prefs.language}`);
    }
  }

  if (prefs.gender && prefs.gender !== 'Any') {
    maxScore += WEIGHTS.gender;
    if (volunteer.gender === prefs.gender) {
      score += WEIGHTS.gender;
      reasons.push(`${prefs.gender} volunteer`);
    }
  }

  if (prefs.nationality) {
    maxScore += WEIGHTS.nationality;
    if (volunteer.nationality === prefs.nationality) {
      score += WEIGHTS.nationality;
      reasons.push(`From ${prefs.nationality}`);
    }
  }

  if (prefs.availability && prefs.availability !== 'Any') {
    maxScore += WEIGHTS.availability;
    if (volunteer.availability === prefs.availability || volunteer.availability === 'Both') {
      score += WEIGHTS.availability;
      reasons.push(`Available ${prefs.availability}`);
    }
  }

  const requestedSkills = (Object.keys(prefs.needs) as CareSkill[]).filter(k => prefs.needs[k]);
  for (const skill of requestedSkills) {
    maxScore += WEIGHTS.perSkill;
    if (volunteer.skills[skill]) {
      score += WEIGHTS.perSkill;
    }
  }

  maxScore += WEIGHTS.ratingBoost;
  score += (volunteer.rating / 5) * WEIGHTS.ratingBoost;

  const matchPercent = maxScore > 0
    ? Math.round((score / maxScore) * 100)
    : Math.round((volunteer.rating / 5) * 100);

  return { volunteer, score, matchPercent, reasons };
}

export function rankVolunteers(volunteers: Volunteer[], prefs: Preferences): MatchResult[] {
  return volunteers
    .map(v => scoreVolunteer(v, prefs))
    .sort((a, b) => b.matchPercent - a.matchPercent || b.volunteer.rating - a.volunteer.rating);
}

export function preferencesToQuery(prefs: Preferences): string {
  const params = new URLSearchParams();
  if (prefs.language) params.set('language', prefs.language);
  if (prefs.gender && prefs.gender !== 'Any') params.set('gender', prefs.gender);
  if (prefs.nationality) params.set('nationality', prefs.nationality);
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
  const prefs: Preferences = { needs: {}, gender: 'Any', availability: 'Any' };
  const language = get('language'); if (language) prefs.language = language;
  const gender = get('gender'); if (gender === 'Male' || gender === 'Female') prefs.gender = gender;
  const nationality = get('nationality'); if (nationality) prefs.nationality = nationality;
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
