'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchResult } from '@/lib/match';
import { SKILL_LABELS } from '@/lib/types';
import { EASE_OUT } from '@/lib/motion-ease';
import { distanceKm, formatDistance, type UserLocation } from '@/lib/geo';
import { Avatar } from './Avatar';

function buildVolunteerIcon(matchPercent: number, selected: boolean): L.DivIcon {
  const colour = selected ? '#1a6753' : matchPercent >= 75 ? '#1f8366' : matchPercent >= 50 ? '#52bf98' : '#86d6b8';
  const size = selected ? 46 : 38;
  const html = `
    <div style="
      width:${size}px; height:${size}px; border-radius:50% 50% 50% 8px;
      background:${colour};
      transform: rotate(-45deg);
      box-shadow: 0 6px 16px -4px rgba(24,83,68,0.45);
      border: 3px solid white;
      display:flex; align-items:center; justify-content:center;
    ">
      <div style="transform: rotate(45deg); color:white; font-weight:700; font-size:${selected ? 13 : 11}px;">
        ${matchPercent}%
      </div>
    </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function buildUserIcon(): L.DivIcon {
  const html = `
    <div style="position: relative; width: 52px; height: 52px;">
      <div style="
        position: absolute; inset: 0;
        border-radius: 50%;
        background: rgba(184, 134, 47, 0.22);
        animation: hh-pulse 2.2s ease-out infinite;
      "></div>
      <div style="
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 36px; height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #d4a651, #b8862f);
        border: 3px solid white;
        box-shadow: 0 4px 14px -2px rgba(184,134,47,0.55);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: 16px;
      ">⌂</div>
    </div>
    <style>
      @keyframes hh-pulse {
        0%   { transform: scale(0.6); opacity: 0.6; }
        70%  { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    </style>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
}

function FitToMarkers({ results, user }: { results: MatchResult[]; user: UserLocation }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [
      [user.lat, user.lng],
      ...results.map(r => [r.volunteer.lat, r.volunteer.lng] as [number, number]),
    ];
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [70, 70], maxZoom: 13 });
  }, [results, user, map]);
  return null;
}

interface VolunteerMapProps {
  results: MatchResult[];
  user: UserLocation;
}

export function VolunteerMap({ results, user }: VolunteerMapProps) {
  const resultsWithDistance = useMemo(
    () => results.map(r => ({
      ...r,
      distanceKm: distanceKm(user, { lat: r.volunteer.lat, lng: r.volunteer.lng }),
    })),
    [results, user],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    resultsWithDistance[0]?.volunteer.id ?? null,
  );

  const selected = useMemo(
    () => resultsWithDistance.find(r => r.volunteer.id === selectedId) ?? null,
    [resultsWithDistance, selectedId],
  );

  return (
    <div className="relative rounded-3xl overflow-hidden border border-brand-100/60 shadow-soft bg-white">
      <div className="h-[560px] w-full">
        <MapContainer
          center={[user.lat, user.lng]}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full bg-brand-100"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToMarkers results={resultsWithDistance} user={user} />

          {/* Walking-distance ring around home */}
          <Circle
            center={[user.lat, user.lng]}
            radius={3000}
            pathOptions={{
              color: '#b8862f',
              fillColor: '#d4a651',
              fillOpacity: 0.08,
              weight: 1,
              dashArray: '6 6',
            }}
          />

          <Marker position={[user.lat, user.lng]} icon={buildUserIcon()} />

          {resultsWithDistance.map(r => (
            <Marker
              key={r.volunteer.id}
              position={[r.volunteer.lat, r.volunteer.lng]}
              icon={buildVolunteerIcon(r.matchPercent, r.volunteer.id === selectedId)}
              eventHandlers={{
                click: () => setSelectedId(r.volunteer.id),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Mini card overlay */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.volunteer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:bottom-6 md:w-[380px] z-[500] pointer-events-auto"
          >
            <MiniCard
              result={selected}
              userCity={user.neighborhood}
              onClose={() => setSelectedId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-[500] bg-white/95 backdrop-blur-sm rounded-2xl border border-brand-100/60 shadow-soft px-4 py-3 text-xs text-ink-700 max-w-[210px]">
        <div className="font-semibold text-ink-900 mb-2">Legend</div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-white shadow bg-gradient-to-br from-warm-400 to-warm-500" />
          <span><span className="font-medium text-ink-900">You</span> — {user.neighborhood}</span>
        </div>
        <div className="h-px bg-brand-100 my-2" />
        <div className="font-medium text-ink-900 mb-1">Volunteers nearby</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-brand-600" /> Strong match (75%+)
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-brand-400" /> Good match (50–74%)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-brand-300" /> Lighter match
        </div>
      </div>

      {/* Hint */}
      <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-sm rounded-full border border-brand-100/60 shadow-soft px-3.5 py-2 text-xs text-ink-700 font-medium">
        Tap a pin to see the volunteer
      </div>
    </div>
  );
}

interface MiniCardProps {
  result: MatchResult & { distanceKm: number };
  userCity: string;
  onClose: () => void;
}

function MiniCard({ result, userCity, onClose }: MiniCardProps) {
  const { volunteer, matchPercent, reasons, distanceKm: dKm } = result;
  const topSkills = (Object.keys(volunteer.skills) as Array<keyof typeof volunteer.skills>)
    .filter(k => volunteer.skills[k])
    .slice(0, 3);

  return (
    <div className="relative bg-white rounded-2xl shadow-lift border border-brand-100/60 p-5">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-ink-700 flex items-center justify-center"
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        <Avatar name={volunteer.name} src={volunteer.photo} size="md" />
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display text-lg font-semibold text-ink-900">{volunteer.name}</h4>
            <span className="chip-warm text-xs px-2 py-0.5">{matchPercent}%</span>
          </div>
          <p className="text-ink-600 text-sm">
            {volunteer.neighborhood} · {volunteer.nationality}
          </p>
          <p className="text-ink-600 text-sm">
            <span className="text-warm-500">★</span> {volunteer.rating.toFixed(1)} · {volunteer.languages.join(', ')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-warm-50 border border-warm-100">
        <span className="text-base">📍</span>
        <span className="text-sm text-ink-900">
          <span className="font-semibold">{formatDistance(dKm)}</span>
          <span className="text-ink-600"> from {userCity}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {topSkills.map(s => (
          <span key={s} className="chip text-xs px-2.5 py-1">{SKILL_LABELS[s]}</span>
        ))}
      </div>

      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-brand-700 font-medium">
          {reasons.slice(0, 3).map(r => (
            <span key={r}>✦ {r}</span>
          ))}
        </div>
      )}

      <Link
        href={`/volunteers/${volunteer.id}`}
        className="btn-primary w-full mt-4 text-sm py-2.5"
      >
        See full profile →
      </Link>
    </div>
  );
}
