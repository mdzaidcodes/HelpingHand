// Smoke-tests the Upstash Redis connection and seeds the database from
// data/*.json if it hasn't been seeded yet.
//
// Run:  node --env-file=.env scripts/verify-redis.mjs

import { Redis } from '@upstash/redis';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('❌ Missing env vars. Make sure .env has:');
  console.error('   UPSTASH_REDIS_REST_URL');
  console.error('   UPSTASH_REDIS_REST_TOKEN');
  process.exit(1);
}

console.log(`→ Using ${url}`);
const redis = new Redis({ url, token });

console.log('→ Pinging…');
const pong = await redis.ping();
console.log(`   ${pong}`);

const KEY_PATIENTS = 'hh:patients';
const KEY_VOLUNTEERS = 'hh:volunteers';
const KEY_REQUESTS = 'hh:requests';
const KEY_SEEDED = 'hh:seeded:v1';

const seeded = await redis.get(KEY_SEEDED);

async function readSeed(filename) {
  try {
    const raw = await readFile(path.join(process.cwd(), 'data', filename), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`   could not read data/${filename}:`, e.message);
    return [];
  }
}

if (!seeded) {
  console.log('→ Not seeded yet. Loading data/*.json into Redis…');
  const [patients, volunteers, requests] = await Promise.all([
    readSeed('patients.json'),
    readSeed('volunteers.json'),
    readSeed('requests.json'),
  ]);

  await Promise.all([
    redis.set(KEY_PATIENTS, JSON.stringify(patients)),
    redis.set(KEY_VOLUNTEERS, JSON.stringify(volunteers)),
    redis.set(KEY_REQUESTS, JSON.stringify(requests)),
    redis.set(KEY_SEEDED, '1'),
  ]);

  console.log(`   ✓ seeded ${patients.length} patients`);
  console.log(`   ✓ seeded ${volunteers.length} volunteers`);
  console.log(`   ✓ seeded ${requests.length} requests`);
} else {
  console.log('→ Already seeded. Reading back to verify…');
  const [patients, volunteers, requests] = await Promise.all([
    redis.get(KEY_PATIENTS),
    redis.get(KEY_VOLUNTEERS),
    redis.get(KEY_REQUESTS),
  ]);
  const parse = v => {
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
  };
  console.log(`   ${parse(patients).length} patients`);
  console.log(`   ${parse(volunteers).length} volunteers`);
  console.log(`   ${parse(requests).length} requests`);
}

console.log('\n✓ Done. Your app will use Redis automatically.');
