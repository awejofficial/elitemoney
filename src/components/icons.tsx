import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5V8H5.5A2.5 2.5 0 0 1 3 5.5" />
      <path d="M3 7.5v9A2.5 2.5 0 0 0 5.5 19h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18.5 9H16a2 2 0 1 0 0 4" />
    </Base>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11.5 4H6.5A2.5 2.5 0 0 0 4 6.5v5c0 .53.21 1.04.586 1.414l7.5 7.5a2 2 0 0 0 2.828 0l5-5a2 2 0 0 0 0-2.828l-7.5-7.5A2 2 0 0 0 11.5 4Z" />
      <circle cx="8.25" cy="8.25" r="1.25" />
    </Base>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 1 1 8 0V11" />
    </Base>
  );
}

export function FingerprintIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4a7 7 0 0 0-7 7c0 2.5.5 4 1.5 6" />
      <path d="M12 4a7 7 0 0 1 7 7c0 1.2-.1 2.2-.35 3.2" />
      <path d="M8.5 20c-1-1.8-1.5-3.5-1.5-6a5 5 0 0 1 10 0c0 .8-.05 1.5-.2 2.2" />
      <path d="M12 9.5a1.5 1.5 0 0 0-1.5 1.5c0 3-.3 5-1.5 7" />
      <path d="M12 9.5a1.5 1.5 0 0 1 1.5 1.5c0 1.7-.1 3-.5 4.3" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l4 4" />
    </Base>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7l.75 11.25A2 2 0 0 0 9.24 20h5.52a2 2 0 0 0 1.99-1.75L17.5 7" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 6l6 6-6 6" />
    </Base>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Base>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Base>
  );
}

export function LogoIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3.1" y="12.5" width="4.3" height="8.2" rx="1" fill="#f7f5ec" />
      <rect x="9.8" y="8.2" width="4.3" height="12.5" rx="1" fill="#f7f5ec" />
      <rect x="16.6" y="3.8" width="4.3" height="16.8" rx="1" fill="#cbd081" />
    </svg>
  );
}

export function LedgerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </Base>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 17L17 7" />
      <path d="M8.5 7H17v8.5" />
    </Base>
  );
}

export function ArrowDownRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 8.5V17H8.5" />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 9.5h16" />
      <path d="M8 3.5v4M16 3.5v4" />
    </Base>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </Base>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </Base>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5h4V20h3a1 1 0 0 0 1-1v-9" />
    </Base>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M20 20H4" />
    </Base>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 4.5a3 3 0 0 1 0 6" />
      <path d="M17 14.2c2.5.5 3.5 2.2 3.5 4.8" />
    </Base>
  );
}

export function HandCoinsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="8" cy="7" r="3" />
      <path d="M3 20v-1a5 5 0 0 1 5-5h1" />
      <path d="M13 13.5h3.5a1.5 1.5 0 0 1 0 3H14" />
      <path d="M13 13.5l5.5-2a1.7 1.7 0 0 1 2.2 2.3L17 18l-4 1.5-3-1" />
    </Base>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}
