const GRADIENTS = [
  'bg-gradient-to-br from-brand-400 to-brand-700',
  'bg-gradient-to-br from-warm-400 to-warm-500',
  'bg-gradient-to-br from-brand-500 to-brand-800',
  'bg-gradient-to-br from-warm-300 to-warm-500',
  'bg-gradient-to-br from-brand-600 to-brand-900',
  'bg-gradient-to-br from-warm-300 to-brand-700',
  'bg-gradient-to-br from-brand-300 to-brand-600',
  'bg-gradient-to-br from-warm-200 to-warm-400',
];

const SIZES = {
  sm:  'w-10 h-10 text-sm rounded-xl',
  md:  'w-14 h-14 text-base rounded-2xl',
  lg:  'w-20 h-20 text-xl rounded-2xl',
  xl:  'w-28 h-28 text-3xl rounded-3xl',
  '2xl': 'w-36 h-36 text-4xl rounded-3xl',
} as const;

export type AvatarSize = keyof typeof SIZES;

function initials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function pickGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function Avatar({
  name, src, size = 'md', className = '',
}: {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const sizeCls = SIZES[size];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeCls} object-cover border-2 border-white shadow-soft shrink-0 ${className}`}
      />
    );
  }
  const grad = pickGradient(name);
  return (
    <div
      aria-label={name}
      className={`${sizeCls} ${grad} inline-flex items-center justify-center font-display font-semibold text-white shadow-soft shrink-0 ${className}`}
    >
      {initials(name)}
    </div>
  );
}
