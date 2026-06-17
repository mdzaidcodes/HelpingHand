export type Gender = 'Female' | 'Male';

export type CareSkill =
  | 'mobilitySupport'
  | 'medicationManagement'
  | 'mealPreparation'
  | 'companionship'
  | 'personalCare'
  | 'dementiaCare'
  | 'postSurgeryCare';

export const SKILL_LABELS: Record<CareSkill, string> = {
  mobilitySupport: 'Mobility support',
  medicationManagement: 'Medication reminders',
  mealPreparation: 'Meal preparation',
  companionship: 'Companionship',
  personalCare: 'Personal care (bathing, dressing)',
  dementiaCare: 'Dementia care',
  postSurgeryCare: 'Post-surgery support',
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
  language?: string;
  gender?: Gender | 'Any';
  nationality?: string;
  availability?: Availability | 'Any';
  needs: Partial<Record<CareSkill, boolean>>;
}

export const EMPTY_PREFERENCES: Preferences = {
  gender: 'Any',
  availability: 'Any',
  needs: {},
};

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
