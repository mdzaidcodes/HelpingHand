export type Gender = 'Female' | 'Male';

export type CareSkill =
  | 'mobilitySupport'
  | 'medicationManagement'
  | 'mealPreparation'
  | 'companionship'
  | 'personalCare'
  | 'dementiaCare'
  | 'postSurgeryCare'
  | 'housekeeping'
  | 'transportation';

export const SKILL_LABELS: Record<CareSkill, string> = {
  mobilitySupport: 'Mobility support',
  medicationManagement: 'Medication reminders',
  mealPreparation: 'Meal preparation',
  companionship: 'Companionship',
  personalCare: 'Personal care (bathing, dressing)',
  dementiaCare: 'Dementia care',
  postSurgeryCare: 'Post-surgery support',
  housekeeping: 'Light housekeeping',
  transportation: 'Transportation & errands',
};

/**
 * Patient-facing descriptions — each one explains the service and gently
 * invites the patient to choose it if it fits. Two to three sentences, warm
 * but specific.
 */
export const SKILL_DESCRIPTIONS: Record<CareSkill, string> = {
  mobilitySupport:
    'Help with the small movements that have started to feel big — getting up from a chair, walking safely to the bathroom, climbing into the car. A steady arm and a careful pace, every time. Choose this if independence at home matters more than ever.',
  medicationManagement:
    'Gentle, on-time reminders so nothing important is missed — morning insulin, evening blood-pressure pills, anything in between. Your volunteer keeps a quiet record and notices when refills are running low. Best for households juggling more than one prescription.',
  mealPreparation:
    'Wholesome meals made the way you like them — favourite family recipes, dietary needs, the smells of home. Your volunteer shops, cooks, and shares the table if you’d like company. Choose this if eating well has become harder than it should be.',
  companionship:
    'A regular, friendly visit — conversation over tea, a walk along the corniche, a quiet afternoon of stories shared. The kind of presence that turns long days into something to look forward to. Choose this when the home has started to feel a little too quiet.',
  personalCare:
    'Discreet, respectful help with the routines we usually keep to ourselves — bathing, dressing, grooming. Your volunteer protects your privacy and your pace at every step. Choose this when these tasks have started to feel unsafe or exhausting alone.',
  dementiaCare:
    'Calm, patient support through the unpredictability of memory loss — gentle redirection, familiar routines, and reassurance when confusion sets in. Volunteers trained in dementia know how to ease distress, not amplify it. Choose this when the day-to-day has become difficult for the whole household.',
  postSurgeryCare:
    'Steady help through the early weeks of recovery — careful mobility, wound-care reminders, fetching what you need without you having to ask. Pacing matters; your volunteer matches yours. Choose this if a procedure is on the horizon or has just happened.',
  housekeeping:
    'Quiet help with the home itself — laundry folded, dishes washed, beds made, surfaces wiped down. Nothing strenuous for you, nothing showy from your volunteer. Choose this if keeping the house in order has slowly become more than you’d like.',
  transportation:
    'A reliable lift to doctor’s appointments, the pharmacy, the grocer, or anywhere you’d rather not navigate alone. Your volunteer drives, parks, and waits — and carries the bags back up if needed. Choose this when getting out and about has become the hardest part of the week.',
};

export type Availability = 'Live-in' | 'Hourly' | 'Both';

/* ----------- Reviews ----------- */

export interface Review {
  author: string;
  relation: string;
  date: string;
  rating: number;
  text: string;
}

/* ----------- Patient health profile ----------- */

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
}

export interface MedicalContact {
  id: string;
  name: string;
  specialty: string;
  clinic?: string;
  phone: string;
  email?: string;
}

export interface OtherContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface HealthProfile {
  allergies: string[];
  conditions: string[];
  medications: string[];
  bloodType?: string;
  notes?: string;
  emergencyContacts: EmergencyContact[];
  medicalContacts: MedicalContact[];
  otherContacts: OtherContact[];
}

export const EMPTY_HEALTH: HealthProfile = {
  allergies: [],
  conditions: [],
  medications: [],
  emergencyContacts: [],
  medicalContacts: [],
  otherContacts: [],
};

/* ----------- Preferences ----------- */

export interface Preferences {
  /** @deprecated — read via `languages`. Kept on the read side for legacy records. */
  language?: string;
  /** Patient may pick multiple acceptable languages. */
  languages?: string[];
  gender?: Gender | 'Any';
  /** @deprecated — read via `nationalities`. */
  nationality?: string;
  /** Patient may pick multiple acceptable nationalities / backgrounds. */
  nationalities?: string[];
  availability?: Availability | 'Any';
  needs: Partial<Record<CareSkill, boolean>>;
}

export const EMPTY_PREFERENCES: Preferences = {
  gender: 'Any',
  availability: 'Any',
  languages: [],
  nationalities: [],
  needs: {},
};

/** Read the patient's preferred languages, accepting either the new plural
 *  array or the legacy `language` field. Returns [] when nothing is set. */
export function readPreferredLanguages(prefs: Preferences): string[] {
  if (prefs.languages && prefs.languages.length > 0) return prefs.languages;
  if (prefs.language) return [prefs.language];
  return [];
}

/** Same idea for nationalities. */
export function readPreferredNationalities(prefs: Preferences): string[] {
  if (prefs.nationalities && prefs.nationalities.length > 0) return prefs.nationalities;
  if (prefs.nationality) return [prefs.nationality];
  return [];
}

/* ----------- Cross-references (denormalised) ----------- */

export type RelationshipStatus = 'Active' | 'Completed' | 'Paused';

export interface PatientHistoryEntry {
  patientId: string;
  patientName: string;
  patientNeighborhood: string;
  hours: number;
  sessions: number;
  startDate: string;
  lastVisit: string;
  status: RelationshipStatus;
}

export interface VolunteerHistoryEntry {
  volunteerId: string;
  volunteerName: string;
  volunteerNeighborhood: string;
  hours: number;
  sessions: number;
  startDate: string;
  lastVisit: string;
  status: RelationshipStatus;
}

/**
 * @deprecated Legacy notifications field — superseded by CareRequest.
 * Still present on Volunteer for backward compatibility with seed JSON; not used by the UI.
 */
export interface VolunteerNotification {
  id: string;
  patientId: string;
  patientName: string;
  patientNeighborhood: string;
  message: string;
  createdAt: string;
  unread: boolean;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const DAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Hours of help requested for each day of the week. 0 = not scheduled that day. */
export type WeekSchedule = Record<DayKey, number>;

/** Default schedule when the patient sends a request without touching the editor. */
export const DEFAULT_SCHEDULE: WeekSchedule = {
  Mon: 2, Tue: 2, Wed: 2, Thu: 2, Fri: 2, Sat: 0, Sun: 0,
};

export function scheduleTotal(s: WeekSchedule | undefined): number {
  if (!s) return 0;
  return DAYS.reduce((sum, d) => sum + (s[d] ?? 0), 0);
}

export function scheduleDaysCount(s: WeekSchedule | undefined): number {
  if (!s) return 0;
  return DAYS.reduce((count, d) => count + ((s[d] ?? 0) > 0 ? 1 : 0), 0);
}

export interface CareRequest {
  id: string;
  patientId: string;
  volunteerId: string;
  // Patient snapshot (frozen at request time so renames don't break history)
  patientName: string;
  patientAge?: number;
  patientGender?: Gender;
  patientNationality?: string;
  patientNeighborhood: string;
  patientLat?: number;
  patientLng?: number;
  // Volunteer snapshot
  volunteerName: string;
  volunteerNeighborhood: string;
  // The ask
  message: string;
  requestedNeeds: CareSkill[];
  requestedAvailability: Availability;
  /** Hours per week, omitted when availability is Live-in. */
  requestedHoursPerWeek?: number;
  /** Per-day hour breakdown. Omitted for Live-in requests. */
  schedule?: WeekSchedule;
  preferredLanguage?: string;
  // Lifecycle
  status: RequestStatus;
  responseMessage?: string;
  createdAt: string;
  respondedAt?: string;
  unread: boolean;
}

/* ----------- Training + Interview ----------- */

export interface TrainingProgress {
  completedLessonIds: string[];
}

export const EMPTY_TRAINING: TrainingProgress = {
  completedLessonIds: [],
};

export interface Interview {
  scheduledFor: string;
  status: 'scheduled' | 'completed';
}

/* ----------- Volunteer (unified) ----------- */

export interface Volunteer {
  id: string;
  email: string;
  name: string;
  photo?: string;
  age: number;
  gender: Gender;
  nationality: string;
  languages: string[];
  yearsExperience: number;
  bio: string;
  skills: Record<CareSkill, boolean>;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  availability: Availability;
  certifications: string[];
  city: string;
  neighborhood: string;
  lat: number;
  lng: number;
  trainingProgress: TrainingProgress;
  interview?: Interview;
  patientHistory: PatientHistoryEntry[];
  /** @deprecated — read CareRequests instead. Retained for seed compatibility. */
  notifications?: VolunteerNotification[];
  createdAt: string;
}

/* ----------- Patient ----------- */

export interface Patient {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: Gender;
  nationality?: string;
  neighborhood?: string;
  city?: string;
  lat?: number;
  lng?: number;
  preferences: Preferences;
  health: HealthProfile;
  volunteerHistory: VolunteerHistoryEntry[];
  createdAt: string;
}

/* ----------- Session ----------- */

export type Role = 'patient' | 'volunteer';

export interface Session {
  userId: string;
  role: Role;
  name: string;
}
