import { JSX, splitProps } from "solid-js";

type IconProps = JSX.SvgSVGAttributes<SVGSVGElement> & {
  size?: number;
};

const defaultProps = {
  size: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function DashboardIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function OrdersIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="2" />
      <path d="M9 14h.01" />
      <path d="M13 14h2" />
      <path d="M9 18h.01" />
      <path d="M13 18h2" />
    </svg>
  );
}

export function ProductsIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

export function SuppliersIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857" />
      <circle cx="14" cy="14" r="3" />
      <path d="M5 20h5v-2a3 3 0 0 0-6 0v2Z" />
      <circle cx="7" cy="14" r="3" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  const [local, rest] = splitProps({ ...defaultProps, ...props }, ["size", "color"]);

  return (
    <svg width={local.size} height={local.size} viewBox="0 0 24 24" {...rest}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
