'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/auth/SessionProvider';
import { EASE_OUT } from '@/lib/motion-ease';
import {
  EMPTY_HEALTH,
  type HealthProfile,
  type EmergencyContact,
  type MedicalContact,
  type OtherContact,
  type Patient,
} from '@/lib/types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export default function HealthProfilePage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [health, setHealth] = useState<HealthProfile>(EMPTY_HEALTH);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== 'patient') { router.push('/login'); return; }
    fetch(`/api/patients/${session.userId}`).then(r => r.json()).then((j: { patient?: Patient }) => {
      if (j.patient) {
        setHealth({ ...EMPTY_HEALTH, ...j.patient.health });
        setName(j.patient.name);
      }
      setLoading(false);
    });
  }, [session, ready, router]);

  function update<K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) {
    setHealth(h => ({ ...h, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (!session) return;
    setSaving(true);
    await fetch(`/api/patients/${session.userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ health }),
    });
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!ready || loading) {
    return <div className="text-ink-500 text-center py-16">Loading your health profile…</div>;
  }

  return (
    <section className="space-y-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link href="/me" className="text-brand-700 hover:underline text-sm font-medium">← Back to your space</Link>
        <span className="chip-warm mt-3 mb-4 inline-flex">Private to you</span>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-tight">
          {name ? `${name.split(' ')[0]}’s` : 'Your'} health profile
        </h1>
        <p className="text-lg text-ink-700 mt-3 max-w-2xl">
          Everything someone might need to look after you well — in one calm place.
          Only the volunteers you welcome will see it.
        </p>
      </motion.div>

      <Section
        index={1}
        eyebrow="Allergies"
        title="Anything that should be avoided"
        helper="Foods, medicines, materials — anything that doesn’t agree with you."
        icon="⚠️"
        accent="warm"
      >
        <TagList
          items={health.allergies}
          placeholder="e.g. penicillin, peanuts, latex…"
          onChange={items => update('allergies', items)}
        />
      </Section>

      <Section
        index={2}
        eyebrow="Conditions"
        title="What you’re managing"
        helper="Diabetes, blood pressure, arthritis — anything ongoing."
        icon="🩺"
      >
        <TagList
          items={health.conditions}
          placeholder="e.g. Type 2 diabetes, hypertension…"
          onChange={items => update('conditions', items)}
        />
      </Section>

      <Section
        index={3}
        eyebrow="Medications"
        title="What you take regularly"
        helper="Include the dose if you remember it."
        icon="💊"
      >
        <TagList
          items={health.medications}
          placeholder="e.g. Metformin 500mg, morning…"
          onChange={items => update('medications', items)}
        />
      </Section>

      <Section
        index={4}
        eyebrow="Vitals"
        title="A couple of useful basics"
        icon="❤️"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Blood type">
            <select
              className="select"
              value={health.bloodType ?? ''}
              onChange={e => update('bloodType', e.target.value || undefined)}
            >
              <option value="">Prefer not to say</option>
              {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Anything else worth knowing">
            <input
              className="input"
              placeholder="A short note (optional)"
              value={health.notes ?? ''}
              onChange={e => update('notes', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        index={5}
        eyebrow="Emergency contacts"
        title="Who to call first if something happens"
        helper="The people who should always be reached, no matter the hour."
        icon="🚨"
        accent="warm"
      >
        <EmergencyContacts
          items={health.emergencyContacts}
          onChange={items => update('emergencyContacts', items)}
        />
      </Section>

      <Section
        index={6}
        eyebrow="Medical team"
        title="Doctors and nurses who care for you"
        helper="Your primary doctor, specialists, clinic numbers — anyone in your medical life."
        icon="🩹"
      >
        <MedicalContacts
          items={health.medicalContacts}
          onChange={items => update('medicalContacts', items)}
        />
      </Section>

      <Section
        index={7}
        eyebrow="Other important people"
        title="Anyone else in your circle of care"
        helper="A neighbor with a spare key, your pharmacist, your lawyer, your imam — anyone who matters."
        icon="🤝"
      >
        <OtherContacts
          items={health.otherContacts}
          onChange={items => update('otherContacts', items)}
        />
      </Section>

      {/* Sticky save bar */}
      <motion.div
        initial={false}
        animate={{ y: dirty || saved ? 0 : 100 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:w-auto z-40"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-end">
          <div className="bg-white border border-brand-100 shadow-lift rounded-2xl px-5 py-3 flex items-center gap-4">
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-brand-700 font-medium flex items-center gap-1.5"
                >
                  ✓ Saved
                </motion.span>
              ) : (
                <motion.span
                  key="dirty"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-ink-700"
                >
                  You have unsaved changes
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={save}
              disabled={saving || !dirty}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ----------------- Section wrapper ----------------- */

function Section({
  index, eyebrow, title, helper, icon, children, accent = 'brand',
}: {
  index: number;
  eyebrow: string;
  title: string;
  helper?: string;
  icon: string;
  children: React.ReactNode;
  accent?: 'brand' | 'warm';
}) {
  const iconBg = accent === 'warm'
    ? 'bg-gradient-to-br from-warm-200 to-warm-300 text-brand-900'
    : 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800';
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: EASE_OUT }}
      className="card-elevated"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-soft ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-brand-700">{eyebrow}</div>
          <h2 className="font-display text-2xl font-semibold text-ink-900 leading-tight">{title}</h2>
          {helper && <p className="text-ink-600 mt-1.5">{helper}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

/* ----------------- Tag list ----------------- */

function TagList({ items, placeholder, onChange }: {
  items: string[]; placeholder: string; onChange: (items: string[]) => void;
}) {
  const [value, setValue] = useState('');

  function add() {
    const v = value.trim();
    if (!v) return;
    if (items.includes(v)) { setValue(''); return; }
    onChange([...items, v]);
    setValue('');
  }
  function remove(t: string) { onChange(items.filter(x => x !== t)); }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="btn-ghost whitespace-nowrap">+ Add</button>
      </div>
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div layout className="flex flex-wrap gap-2">
            {items.map(t => (
              <motion.span
                key={t}
                layout
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="chip"
              >
                {t}
                <button type="button" onClick={() => remove(t)} className="ml-1 text-ink-500 hover:text-ink-900 text-base leading-none">×</button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------- Contact cards ----------------- */

interface ContactProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
}

function EmergencyContacts({ items, onChange }: ContactProps<EmergencyContact>) {
  function add() {
    onChange([...items, { id: newId(), name: '', relation: '', phone: '' }]);
  }
  function update(id: string, patch: Partial<EmergencyContact>) {
    onChange(items.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function remove(id: string) { onChange(items.filter(c => c.id !== id)); }

  return (
    <ContactList itemsLength={items.length} onAdd={add} addLabel="+ Add emergency contact" accent="warm">
      {items.map(c => (
        <ContactCard key={c.id} onRemove={() => remove(c.id)} accent="warm">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Their name">
              <input className="input" value={c.name} placeholder="e.g. Ahmed Hassan" onChange={e => update(c.id, { name: e.target.value })} />
            </Field>
            <Field label="How you know them">
              <input className="input" value={c.relation} placeholder="e.g. Son, daughter, neighbor" onChange={e => update(c.id, { relation: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={c.phone} placeholder="+971 50 ..." onChange={e => update(c.id, { phone: e.target.value })} />
            </Field>
            <Field label="Email (optional)">
              <input className="input" value={c.email ?? ''} onChange={e => update(c.id, { email: e.target.value || undefined })} />
            </Field>
          </div>
        </ContactCard>
      ))}
    </ContactList>
  );
}

function MedicalContacts({ items, onChange }: ContactProps<MedicalContact>) {
  function add() {
    onChange([...items, { id: newId(), name: '', specialty: '', phone: '' }]);
  }
  function update(id: string, patch: Partial<MedicalContact>) {
    onChange(items.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function remove(id: string) { onChange(items.filter(c => c.id !== id)); }

  return (
    <ContactList itemsLength={items.length} onAdd={add} addLabel="+ Add doctor or clinic">
      {items.map(c => (
        <ContactCard key={c.id} onRemove={() => remove(c.id)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Their name">
              <input className="input" value={c.name} placeholder="e.g. Dr. Layla Mansour" onChange={e => update(c.id, { name: e.target.value })} />
            </Field>
            <Field label="Specialty">
              <input className="input" value={c.specialty} placeholder="e.g. Cardiologist" onChange={e => update(c.id, { specialty: e.target.value })} />
            </Field>
            <Field label="Clinic or hospital">
              <input className="input" value={c.clinic ?? ''} placeholder="e.g. Cleveland Clinic Abu Dhabi" onChange={e => update(c.id, { clinic: e.target.value || undefined })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={c.phone} placeholder="+971 2 ..." onChange={e => update(c.id, { phone: e.target.value })} />
            </Field>
            <Field label="Email (optional)">
              <input className="input" value={c.email ?? ''} onChange={e => update(c.id, { email: e.target.value || undefined })} />
            </Field>
          </div>
        </ContactCard>
      ))}
    </ContactList>
  );
}

function OtherContacts({ items, onChange }: ContactProps<OtherContact>) {
  function add() {
    onChange([...items, { id: newId(), name: '', role: '', phone: '' }]);
  }
  function update(id: string, patch: Partial<OtherContact>) {
    onChange(items.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function remove(id: string) { onChange(items.filter(c => c.id !== id)); }

  return (
    <ContactList itemsLength={items.length} onAdd={add} addLabel="+ Add another contact">
      {items.map(c => (
        <ContactCard key={c.id} onRemove={() => remove(c.id)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Their name">
              <input className="input" value={c.name} placeholder="e.g. Mrs. Khalifa" onChange={e => update(c.id, { name: e.target.value })} />
            </Field>
            <Field label="Their role in your life">
              <input className="input" value={c.role} placeholder="e.g. Pharmacist, neighbor, imam" onChange={e => update(c.id, { role: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="input" value={c.phone} placeholder="+971 ..." onChange={e => update(c.id, { phone: e.target.value })} />
            </Field>
            <Field label="Email (optional)">
              <input className="input" value={c.email ?? ''} onChange={e => update(c.id, { email: e.target.value || undefined })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="A note (optional)">
                <input className="input" value={c.notes ?? ''} placeholder="e.g. Has a spare key" onChange={e => update(c.id, { notes: e.target.value || undefined })} />
              </Field>
            </div>
          </div>
        </ContactCard>
      ))}
    </ContactList>
  );
}

function ContactList({
  itemsLength, onAdd, addLabel, accent = 'brand', children,
}: {
  itemsLength: number; onAdd: () => void; addLabel: string;
  accent?: 'brand' | 'warm';
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <AnimatePresence>{children}</AnimatePresence>
      {itemsLength === 0 && (
        <p className="text-ink-500 italic text-center py-3">No one added yet.</p>
      )}
      <motion.button
        type="button"
        onClick={onAdd}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        className={`w-full py-4 rounded-2xl border-2 border-dashed font-medium transition-all ${
          accent === 'warm'
            ? 'border-warm-300 text-brand-800 hover:bg-warm-50'
            : 'border-brand-200 text-brand-800 hover:bg-brand-50'
        }`}
      >
        {addLabel}
      </motion.button>
    </div>
  );
}

function ContactCard({
  children, onRemove, accent = 'brand',
}: {
  children: React.ReactNode; onRemove: () => void; accent?: 'brand' | 'warm';
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={`relative p-5 rounded-2xl border ${
        accent === 'warm' ? 'border-warm-200 bg-warm-50/40' : 'border-brand-100 bg-brand-50/40'
      }`}
    >
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove contact"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-brand-100 text-ink-500 hover:text-ink-900 hover:border-brand-200 flex items-center justify-center"
      >
        ×
      </button>
      <div className="pr-8">{children}</div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-medium text-ink-900 mb-1.5 text-sm">{label}</label>
      {children}
    </div>
  );
}
