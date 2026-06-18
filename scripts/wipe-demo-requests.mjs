// Removes ALL care requests tied to the two demo accounts from the live
// Redis database, then writes the cleaned list back.
//
//   Demo patient   : pa-demo-001  (demo.patient@helpinghand.example)
//   Demo volunteer : v-demo-001   (demo.volunteer@helpinghand.example)
//
// A request is wiped if its patientId OR volunteerId matches either demo id.
//
// Run:  node --env-file=.env scripts/wipe-demo-requests.mjs

import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('❌ Missing env vars. Make sure .env has:');
  console.error('   UPSTASH_REDIS_REST_URL');
  console.error('   UPSTASH_REDIS_REST_TOKEN');
  process.exit(1);
}

const DEMO_PATIENT_ID = 'pa-demo-001';
const DEMO_VOLUNTEER_ID = 'v-demo-001';
const KEY_REQUESTS = 'hh:requests';

console.log(`→ Using ${url}`);
const redis = new Redis({ url, token });

console.log('→ Pinging…');
console.log(`   ${await redis.ping()}`);

const raw = await redis.get(KEY_REQUESTS);
const requests = Array.isArray(raw)
  ? raw
  : (() => { try { return JSON.parse(raw) ?? []; } catch { return []; } })();

console.log(`→ ${requests.length} requests currently in prod.`);

const isDemo = r =>
  r.patientId === DEMO_PATIENT_ID || r.volunteerId === DEMO_VOLUNTEER_ID;

const toRemove = requests.filter(isDemo);
const kept = requests.filter(r => !isDemo(r));

if (toRemove.length === 0) {
  console.log('→ No demo-account requests found. Nothing to do.');
  process.exit(0);
}

console.log(`→ Removing ${toRemove.length} demo request(s):`);
for (const r of toRemove) {
  const reason =
    r.patientId === DEMO_PATIENT_ID && r.volunteerId === DEMO_VOLUNTEER_ID
      ? 'patient+volunteer'
      : r.patientId === DEMO_PATIENT_ID
      ? 'patient'
      : 'volunteer';
  console.log(
    `   - ${r.id}  [${reason}]  ${r.patientName ?? r.patientId} → ${r.volunteerName ?? r.volunteerId}  (${r.status})`,
  );
}

await redis.set(KEY_REQUESTS, JSON.stringify(kept));

console.log(`\n✓ Done. ${kept.length} requests remain (was ${requests.length}).`);
