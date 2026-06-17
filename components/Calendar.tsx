'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export interface CalendarProps {
  value: Date | null;
  onChange: (d: Date) => void;
}

export function Calendar({ value, onChange }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value.getFullYear(), value.getMonth(), 1) : new Date());
  const today = useMemo(() => startOfDay(new Date()), []);

  const cells = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startDay = first.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewMonth]);

  function move(months: number) {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + months, 1));
  }

  return (
    <div className="bg-white rounded-3xl border border-brand-100 shadow-soft p-5 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <motion.button
          type="button"
          onClick={() => move(-1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-800 flex items-center justify-center"
          aria-label="Previous month"
        >
          ‹
        </motion.button>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="font-display text-xl font-semibold text-ink-900"
          >
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </motion.div>
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => move(1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-800 flex items-center justify-center"
          aria-label="Next month"
        >
          ›
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold uppercase tracking-wide text-ink-500 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={idx} />;
          const past = cell < today;
          const isToday = isSameDay(cell, today);
          const isSelected = value ? isSameDay(cell, value) : false;
          return (
            <motion.button
              key={idx}
              type="button"
              disabled={past}
              onClick={() => onChange(cell)}
              whileHover={!past ? { scale: 1.06 } : undefined}
              whileTap={!past ? { scale: 0.94 } : undefined}
              className={[
                'aspect-square rounded-2xl text-base font-medium transition',
                past
                  ? 'text-ink-300 cursor-not-allowed'
                  : isSelected
                    ? 'bg-brand-700 text-white shadow-lift'
                    : isToday
                      ? 'bg-warm-100 text-brand-900 border border-warm-300 hover:bg-warm-200'
                      : 'bg-white text-ink-800 border border-brand-100/60 hover:bg-brand-50',
              ].join(' ')}
            >
              {cell.getDate()}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
