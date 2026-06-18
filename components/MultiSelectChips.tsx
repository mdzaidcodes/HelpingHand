'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion-ease';

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyHint?: string;
}

/**
 * Token-input combobox. Selected values live as small chips inside the input
 * row; typing filters the dropdown options below; clicking outside dismisses.
 */
export function MultiSelectChips({
  options,
  selected,
  onChange,
  placeholder = 'Search…',
  emptyHint,
}: MultiSelectChipsProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking anywhere outside.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  // Keep highlight valid when the filtered list changes.
  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered, highlight]);

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  }

  function remove(value: string) {
    onChange(selected.filter(v => v !== value));
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      onChange(selected.slice(0, -1));
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight(h => Math.min(filtered.length - 1, h + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(0, h - 1));
      return;
    }
    if (e.key === 'Enter' && open && filtered[highlight]) {
      e.preventDefault();
      toggle(filtered[highlight]);
      setQuery('');
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
        className={`w-full rounded-2xl border bg-white px-3 py-2 transition cursor-text min-h-[3.25rem] flex flex-wrap items-center gap-1.5 ${
          open
            ? 'border-brand-400 ring-2 ring-brand-200'
            : 'border-brand-100 hover:border-brand-200'
        }`}
      >
        <AnimatePresence initial={false}>
          {selected.map(s => (
            <motion.span
              key={s}
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-800 pl-2.5 pr-1.5 py-1 text-sm font-medium border border-brand-200"
            >
              {s}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remove(s); }}
                aria-label={`Remove ${s}`}
                className="ml-0.5 w-5 h-5 rounded-full text-brand-700 hover:bg-brand-200 hover:text-brand-900 flex items-center justify-center text-base leading-none"
              >
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent outline-none text-ink-900 placeholder:text-ink-500 px-2 py-1"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-brand-100 rounded-2xl shadow-lift max-h-72 overflow-y-auto z-30"
          >
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-ink-500 italic text-sm">
                {emptyHint ?? `No matches for "${query}"`}
              </div>
            ) : (
              <ul className="py-1.5">
                {filtered.map((opt, i) => {
                  const active = selected.includes(opt);
                  const isHighlighted = i === highlight;
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        onClick={() => { toggle(opt); setQuery(''); inputRef.current?.focus(); }}
                        onMouseEnter={() => setHighlight(i)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                          isHighlighted ? 'bg-brand-50' : ''
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 text-sm transition ${
                            active
                              ? 'border-brand-700 bg-brand-700 text-white'
                              : 'border-brand-200 bg-white'
                          }`}
                        >
                          {active && '✓'}
                        </span>
                        <span className="text-ink-900">{opt}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
