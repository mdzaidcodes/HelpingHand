// One-way sync: push the current data/*.json contents into Upstash Redis,
// overwriting whatever's there. Use this whenever you've edited the seed
// JSON files locally and want the production database to match.
//
// Run:  node --env-file=.env scripts/sync-redis.mjs

import { Redis } from '@upstash/redis';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) {
  console.error('❌ Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in .env');
  process.exit(1);
}

const redis = new Redis({ url, token });

const KEY_PATIENTS = 'hh:patients';
const KEY_VOLUNTEERS = 'hh:volunteers';
const KEY_REQUESTS = 'hh:requests';
const KEY_SEEDED = 'hh:seeded:v1';

async function load(filename) {
  const raw = await readFile(path.join(process.cwd(), 'data', filename), 'utf8');
  return JSON.parse(raw);
}

console.log('→ Reading local seed files…');
const [patients, volunteers, requests] = await Promise.all([
  load('patients.json'),
  load('volunteers.json'),
  load('requests.json'),
]);
console.log(`   ${patients.length} patients, ${volunteers.length} volunteers, ${requests.length} requests`);

console.log('→ Pushing to Redis (overwriting existing keys)…');
await Promise.all([
  redis.set(KEY_PATIENTS, JSON.stringify(patients)),
  redis.set(KEY_VOLUNTEERS, JSON.stringify(volunteers)),
  redis.set(KEY_REQUESTS, JSON.stringify(requests)),
  redis.set(KEY_SEEDED, '1'),
]);

console.log('→ Verifying…');
const [pCheck, vCheck, rCheck] = await Promise.all([
  redis.get(KEY_PATIENTS),
  redis.get(KEY_VOLUNTEERS),
  redis.get(KEY_REQUESTS),
]);
const arr = v => (Array.isArray(v) ? v : JSON.parse(v));
console.log(`   ✓ ${arr(pCheck).length} patients in Redis`);
console.log(`   ✓ ${arr(vCheck).length} volunteers in Redis`);
console.log(`   ✓ ${arr(rCheck).length} requests in Redis`);

console.log('\n✓ Sync complete.');
