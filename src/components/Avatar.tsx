import { type BrandHue, hashToHue } from "../lib/color";

const PALETTE: Record<BrandHue, string> = {
  brand: "bg-brand/15 text-brand",
  cyan: "bg-cyan/15 text-cyan",
  violet: "bg-violet/15 text-violet",
  warning: "bg-warning/15 text-warning",
};

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
  const palette = PALETTE[hashToHue(name)];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${palette} ${SIZE_CLASSES[size]}`}
    >
      {initials(name)}
    </span>
  );
}
