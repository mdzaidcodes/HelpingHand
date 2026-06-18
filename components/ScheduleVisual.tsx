'use client';

import { motion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';
import {
  DAYS,
  scheduleTotal,
  scheduleDaysCount,
  type CareRequest,
  type WeekSchedule,
} from '@/lib/types';

/**
 * Derives a display-ready WeekSchedule for any request, including legacy ones
 * that pre-date the explicit `schedule` field. Live-in requests return null.
 */
export function deriveSchedule(request: CareRequest): WeekSchedule | null {
  if (request.requestedAvailability === 'Live-in') return null;
  if (request.schedule) return request.schedule;
  const total = request.requestedHoursPerWeek ?? 0;
  if (total <= 0) return null;
  // Spread evenly across weekdays as a sensible fallback.
  const perDay = Math.round((total / 5) * 2) / 2;
  return {
    Mon: perDay, Tue: perDay, Wed: perDay, Thu: perDay, Fri: perDay,
    Sat: 0, Sun: 0,
  };
}

interface ScheduleVisualProps {
  schedule: WeekSchedule;
  title?: string;
  subtitle?: string;
  tone?: 'brand' | 'warm';
}

/**
 * Compact weekly bar chart. Each day is a column whose bar height is
 * proportional to that day's hours; idle days show a faint placeholder.
 */
export function ScheduleVisual({
  schedule,
  title = 'Weekly schedule',
  subtitle,
  tone = 'brand',
}: ScheduleVisualProps) {
  const total = scheduleTotal(schedule);
  const numDays = scheduleDaysCount(schedule);
  const maxHours = Math.max(...DAYS.map(d => schedule[d] ?? 0), 4);

  const barClass = tone === 'warm'
    ? 'bg-gradient-to-t from-warm-400 to-warm-300'
    : 'bg-gradient-to-t from-brand-500 to-brand-300';
  const labelClass = tone === 'warm' ? 'text-warm-500' : 'text-brand-700';

  return (
    <div className="card-elevated">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
        <div className="text-sm text-ink-600">
          <span className={`font-display text-xl font-semibold ${labelClass}`}>{total}</span>
          <span className="ml-1">hrs / week · {numDays} day{numDays === 1 ? '' : 's'}</span>
        </div>
      </div>
      {subtitle && <p className="text-sm text-ink-600 mb-4">{subtitle}</p>}

      <div className="flex items-end justify-between gap-2 h-28 mt-4">
        {DAYS.map((day, idx) => {
          const hrs = schedule[day] ?? 0;
          const active = hrs > 0;
          const heightPct = active ? Math.max(8, (hrs / maxHours) * 100) : 6;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className={`text-xs font-medium ${active ? 'text-ink-900' : 'text-ink-500'}`}>
                {active ? `${hrs}h` : '—'}
              </div>
              <div className="flex-1 w-full flex flex-col justify-end">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${heightPct}%`, opacity: 1 }}
                  transition={{ duration: 0.6, delay: idx * 0.04, ease: EASE_OUT }}
                  className={`w-full rounded-t-md ${active ? barClass : 'bg-brand-100/60 border border-brand-100 border-b-0'}`}
                  aria-label={`${day}: ${hrs} hours`}
                />
              </div>
              <div className={`text-xs ${active ? 'text-ink-700 font-medium' : 'text-ink-500'}`}>
                {day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
