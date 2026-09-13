import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14c2.4.3 4 2 4 5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v13a2 2 0 0 0-2-2H5Z" />
      <path d="M5 4.5V18a2 2 0 0 0 2 2h10" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M6 3.5h12v17l-2.5-1.5L13 20.5 10.5 19 8 20.5 5.5 19V3.5Z" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5.2" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base(props)} aria-hidden="true">
      <path d="M3.5 12.5h5l1.5 2.5h4l1.5-2.5h5" />
      <path d="M5.5 6.5 3.5 12.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-5.5l-2-6a1.5 1.5 0 0 0-1.4-1H6.9a1.5 1.5 0 0 0-1.4 1Z" />
    </svg>
  );
}
