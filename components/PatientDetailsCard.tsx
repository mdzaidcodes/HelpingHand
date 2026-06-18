'use client';

import { motion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';
import type {
  Patient,
  EmergencyContact,
  MedicalContact,
  OtherContact,
} from '@/lib/types';

interface PatientDetailsCardProps {
  patient: Patient;
}

/**
 * Read-only display of a patient's shared profile, surfaced to a volunteer
 * after they accept a request. Privacy contract: the patient consented to
 * share this when they sent the request, and the volunteer accepted.
 */
export function PatientDetailsCard({ patient }: PatientDetailsCardProps) {
  const firstName = patient.name.split(' ')[0];
  const h = patient.health;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="card-elevated"
    >
      <header className="flex items-start gap-4 mb-5">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-700 text-white text-lg shadow-soft shrink-0">
          ✓
        </span>
        <div className="flex-1">
          <h4 className="font-display text-2xl font-semibold text-ink-900 leading-tight">
            {firstName}&apos;s shared details
          </h4>
          <p className="text-ink-600 text-sm mt-1">
            Now that you&apos;ve accepted, here&apos;s everything the family wanted you to know about caring for {firstName}.
          </p>
        </div>
      </header>

      {/* Patient summary line */}
      <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-100 mb-6">
        <SummaryItem label="Email" value={patient.email} />
        <SummaryItem label="Age" value={patient.age ? `${patient.age} years old` : '—'} />
        <SummaryItem
          label="Lives in"
          value={`${patient.neighborhood ?? '—'}, ${patient.city ?? 'Abu Dhabi'}`}
        />
      </div>

      {/* Health blocks */}
      <div className="grid md:grid-cols-2 gap-5">
        <DetailBlock title="Allergies" icon="⚠️" tone="warm" empty="No known allergies">
          {h.allergies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {h.allergies.map(a => (
                <span key={a} className="chip-warm">{a}</span>
              ))}
            </div>
          )}
        </DetailBlock>

        <DetailBlock title="Conditions being managed" icon="🩺" empty="None recorded">
          {h.conditions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {h.conditions.map(c => (
                <span key={c} className="chip">{c}</span>
              ))}
            </div>
          )}
        </DetailBlock>

        <DetailBlock title="Medications" icon="💊" empty="None recorded">
          {h.medications.length > 0 && (
            <ul className="space-y-1.5">
              {h.medications.map(m => (
                <li key={m} className="text-ink-800 flex items-start gap-2">
                  <span className="text-brand-600 mt-1 shrink-0">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}
        </DetailBlock>

        <DetailBlock title="Vitals" icon="❤️">
          <dl className="space-y-2 text-sm">
            <Vital label="Blood type" value={h.bloodType ?? 'Not shared'} />
          </dl>
        </DetailBlock>
      </div>

      {/* Note from the family */}
      {h.notes && (
        <div className="mt-5 p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1.5">
            A note from the family
          </p>
          <p className="text-ink-800 italic">&ldquo;{h.notes}&rdquo;</p>
        </div>
      )}

      {/* Contact groups */}
      {h.emergencyContacts.length > 0 && (
        <ContactGroup
          title="If something happens — call first"
          eyebrow="Emergency contacts"
          icon="🚨"
          tone="warm"
        >
          {h.emergencyContacts.map(c => (
            <EmergencyContactCard key={c.id} contact={c} />
          ))}
        </ContactGroup>
      )}

      {h.medicalContacts.length > 0 && (
        <ContactGroup
          title="The medical team caring for them"
          eyebrow="Doctors & clinics"
          icon="🩹"
        >
          {h.medicalContacts.map(c => (
            <MedicalContactCard key={c.id} contact={c} />
          ))}
        </ContactGroup>
      )}

      {h.otherContacts.length > 0 && (
        <ContactGroup
          title="Other important people in their circle"
          eyebrow="Also worth knowing"
          icon="🤝"
        >
          {h.otherContacts.map(c => (
            <OtherContactCard key={c.id} contact={c} />
          ))}
        </ContactGroup>
      )}
    </motion.div>
  );
}

/* ---------- subcomponents ---------- */

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide font-semibold text-ink-500 mb-0.5">{label}</div>
      <div className="text-ink-900 font-medium">{value}</div>
    </div>
  );
}

function DetailBlock({
  title, icon, tone = 'brand', children, empty,
}: {
  title: string;
  icon: string;
  tone?: 'brand' | 'warm';
  children?: React.ReactNode;
  empty?: string;
}) {
  const hasContent = !!children;
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h5 className={`font-display font-semibold ${tone === 'warm' ? 'text-warm-500' : 'text-ink-900'}`}>
          {title}
        </h5>
      </div>
      {hasContent ? children : <p className="text-sm text-ink-500 italic">{empty ?? '—'}</p>}
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function ContactGroup({
  title, eyebrow, icon, tone = 'brand', children,
}: {
  title: string;
  eyebrow: string;
  icon: string;
  tone?: 'brand' | 'warm';
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-start gap-3 mb-4">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl text-xl shadow-soft ${
          tone === 'warm' ? 'bg-warm-100 border border-warm-200' : 'bg-brand-100 border border-brand-200'
        }`}>
          {icon}
        </span>
        <div>
          <div className={`text-xs uppercase tracking-wide font-semibold ${tone === 'warm' ? 'text-warm-500' : 'text-brand-700'}`}>
            {eyebrow}
          </div>
          <h5 className="font-display text-lg font-semibold text-ink-900 leading-tight">{title}</h5>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function ContactCardBase({
  name, sub, phone, email, notes, tone = 'brand',
}: {
  name: string;
  sub: string;
  phone: string;
  email?: string;
  notes?: string;
  tone?: 'brand' | 'warm';
}) {
  return (
    <div className={`p-4 rounded-2xl border ${tone === 'warm' ? 'border-warm-200 bg-warm-50/40' : 'border-brand-100 bg-brand-50/30'}`}>
      <p className="font-semibold text-ink-900">{name}</p>
      <p className="text-ink-600 text-sm">{sub}</p>
      <a
        href={`tel:${phone.replace(/\s+/g, '')}`}
        className="inline-flex items-center gap-1.5 mt-2 text-brand-700 hover:text-brand-600 font-medium text-sm"
      >
        📞 {phone}
      </a>
      {email && (
        <a
          href={`mailto:${email}`}
          className="block mt-1 text-ink-500 hover:text-ink-900 text-sm break-all"
        >
          ✉ {email}
        </a>
      )}
      {notes && <p className="text-ink-600 text-sm italic mt-2">&ldquo;{notes}&rdquo;</p>}
    </div>
  );
}

function EmergencyContactCard({ contact }: { contact: EmergencyContact }) {
  return (
    <ContactCardBase
      name={contact.name}
      sub={contact.relation}
      phone={contact.phone}
      email={contact.email}
      tone="warm"
    />
  );
}

function MedicalContactCard({ contact }: { contact: MedicalContact }) {
  const sub = contact.clinic ? `${contact.specialty} · ${contact.clinic}` : contact.specialty;
  return (
    <ContactCardBase
      name={contact.name}
      sub={sub}
      phone={contact.phone}
      email={contact.email}
    />
  );
}

function OtherContactCard({ contact }: { contact: OtherContact }) {
  return (
    <ContactCardBase
      name={contact.name}
      sub={contact.role}
      phone={contact.phone}
      email={contact.email}
      notes={contact.notes}
    />
  );
}
