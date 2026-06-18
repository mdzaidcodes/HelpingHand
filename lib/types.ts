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
    'A steady arm and a careful pace for getting up from a chair, walking to the bathroom, or climbing into the car.',
  medicationManagement:
    'Gentle, on-time reminders so the right pills are taken and refills never run low.',
  mealPreparation:
    'Wholesome meals shopped for and cooked the way you like them, with company at the table if you’d like.',
  companionship:
    'A regular, friendly visit for conversation over tea, a walk, or an afternoon of shared stories.',
  personalCare:
    'Discreet, respectful help with bathing, dressing, and grooming at your own pace.',
  dementiaCare:
    'Calm, patient support through memory loss from volunteers trained to ease confusion gently.',
  postSurgeryCare:
    'Steady help through recovery with careful mobility, wound-care reminders, and fetching what you need.',
  housekeeping:
    'Quiet help keeping the home in order with laundry, dishes, and light tidying.',
  transportation:
    'A reliable lift to appointments, the pharmacy, or the grocer, with help carrying the bags back up.',
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

/* ----------- Forum ----------- */

export type ForumAudience = 'patient' | 'volunteer';

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  createdAt: string;
  likedBy: string[];
  replies: ForumReply[];
}

export interface ForumPost {
  id: string;
  audience: ForumAudience;
  authorId: string;
  authorName: string;
  authorRole: Role;
  title?: string;
  body: string;
  createdAt: string;
  likedBy: string[];
  replies: ForumReply[];
}

export interface Session {
  userId: string;
  role: Role;
  name: string;
}
