const PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
} as const;

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZE_CLASSES }) {
  const palette = PALETTE[hashName(name) % PALETTE.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${palette} ${SIZE_CLASSES[size]}`}
    >
      {initials(name)}
    </span>
  );
}
