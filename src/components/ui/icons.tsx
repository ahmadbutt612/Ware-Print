// Small line icons drawn for Ware Print (1.5px strokes, square caps).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    "aria-hidden": true,
    ...props,
  } as SVGProps<SVGSVGElement>;
}

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="4.75" />
    <path d="M10.5 10.5 14 14" />
  </svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </svg>
);
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </svg>
);
export const IconPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 14.5s4.5-4.3 4.5-8a4.5 4.5 0 0 0-9 0c0 3.7 4.5 8 4.5 8Z" />
    <circle cx="8" cy="6.5" r="1.6" />
  </svg>
);
export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 1.75 2.75 3.75v4c0 3.2 2.2 5.5 5.25 6.5 3.05-1 5.25-3.3 5.25-6.5v-4L8 1.75Z" />
    <path d="m5.5 8 1.75 1.75L10.75 6" />
  </svg>
);
export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 2.75h-2v11.5h9V2.75h-2" />
    <path d="M5.5 1.75h5v2h-5zM5.5 7.5h5M5.5 10.5h3.5" />
  </svg>
);
export const IconGauge = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.25 11.5a6 6 0 1 1 11.5 0" />
    <path d="m8 9.5 3-3.5" />
    <circle cx="8" cy="9.75" r=".9" fill="currentColor" stroke="none" />
  </svg>
);
export const IconEye = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);
export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3.25v9.5L12.5 8 5 3.25Z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 2.5v11M2.5 8h11" />
  </svg>
);
export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
  </svg>
);
export const IconUp = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4 10 4-4 4 4" />
  </svg>
);
export const IconDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4 6 4 4 4-4" />
  </svg>
);
export const IconLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 4 6 8l4 4" />
  </svg>
);
export const IconRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 4 4 4-4 4" />
  </svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 4h12M2 8h12M2 12h12" />
  </svg>
);
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M1.75 3.25h12.5v9.5H1.75z" />
    <path d="m2 3.5 6 5 6-5" />
  </svg>
);
export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 1.75h2.5l1.25 3.25-1.5 1a8 8 0 0 0 4.75 4.75l1-1.5 3.25 1.25V13a1.5 1.5 0 0 1-1.5 1.5A11.75 11.75 0 0 1 1.5 3.25 1.5 1.5 0 0 1 3 1.75Z" />
  </svg>
);
export const IconImage = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M1.75 2.75h12.5v10.5H1.75z" />
    <path d="m1.75 11 3.5-3.5 3 3 2-2 4 4" />
    <circle cx="10.5" cy="5.75" r="1.1" />
  </svg>
);
export const IconVideo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M1.75 3.75h9v8.5h-9zM10.75 6.5l3.5-2v7l-3.5-2" />
  </svg>
);
export const IconLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 9.5 9.5 6.5M7 4.5l1.25-1.25a2.5 2.5 0 0 1 3.5 3.5L10.5 8M9 11.5l-1.25 1.25a2.5 2.5 0 0 1-3.5-3.5L5.5 8" />
  </svg>
);
export const IconLayers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m8 1.75 6.25 3.25L8 8.25 1.75 5 8 1.75Z" />
    <path d="m1.75 8 6.25 3.25L14.25 8M1.75 11 8 14.25 14.25 11" />
  </svg>
);
export const IconExternal = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M11.5 9.5v4h-9v-9h4" />
  </svg>
);
