import type { SVGProps } from 'react';

/**
 * Small inline icon set (stroke-based, currentColor) so the app ships zero
 * icon-font/image dependencies and works fully offline. Sized 1em by default
 * so they scale with the large-text preference.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: '1.5em',
  height: '1.5em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const HomeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

export const PillIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" />
    <path d="M8.5 8.5 15.5 15.5" />
  </svg>
);

export const PulseIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

/** Lightbulb — used for the Coach feed so it reads as "ideas/insights" and is
 *  visually distinct from the radial settings gear. */
export const LightbulbIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.3 1 2.5h6c0-1.2.3-1.9 1-2.5A6 6 0 0 0 12 3z" />
  </svg>
);

export const GearIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const BellIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export const FlaskIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 3h6M9 3v7l-4 9h14l-4-9V3" />
    <path d="M7 16h10" />
  </svg>
);

export const StopIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
  </svg>
);

export const DropIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" />
  </svg>
);

export const HeartIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z" />
  </svg>
);

export const ScaleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="14" width="18" height="7" rx="2" />
    <path d="M12 14V3" />
    <path d="M8 6l4-3 4 3" />
    <path d="M7 10h10" />
  </svg>
);

export const LeafIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-5 7-11 7-11s7 6 7 11a7 7 0 0 1-7 7z" />
    <path d="M11 20v-9" />
  </svg>
);

export const DumbbellIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <rect x="2" y="5" width="4" height="14" rx="2" />
    <rect x="18" y="5" width="4" height="14" rx="2" />
    <path d="M6 12h12" />
  </svg>
);

export const CalendarIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const ClipboardIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

/** Star for pin/unpin. Pass filled to render it solid. */
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.8 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z" />
  </svg>
);
