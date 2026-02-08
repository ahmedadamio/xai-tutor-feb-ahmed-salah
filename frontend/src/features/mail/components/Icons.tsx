import { cx } from "../../../lib/utils";

export type IconProps = {
  className?: string;
};

function IconBase({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      className={cx("h-4 w-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function CollapseIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m14 7-5 5 5 5" />
      <path d="m19 7-5 5 5 5" />
    </IconBase>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 10.5V20h11v-9.5" />
    </IconBase>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5.5 16h13" />
      <path d="M7 16v-4a5 5 0 1 1 10 0v4" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function CheckSquareIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </IconBase>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </IconBase>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </IconBase>
  );
}

export function CubeIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m12 12 8-4.5" />
      <path d="m12 12-8-4.5" />
      <path d="M12 12v9" />
    </IconBase>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 5 7.5-5" />
    </IconBase>
  );
}

export function PlugIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 8V4" />
      <path d="M15 8V4" />
      <path d="M7 8h10v4a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V8Z" />
      <path d="M12 17v3" />
    </IconBase>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <path d="M14 19a4 4 0 0 1 6 0" />
    </IconBase>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2" />
      <path d="M12 18.3v2.2" />
      <path d="m5.9 5.9 1.6 1.6" />
      <path d="m16.5 16.5 1.6 1.6" />
      <path d="M3.5 12h2.2" />
      <path d="M18.3 12h2.2" />
      <path d="m5.9 18.1 1.6-1.6" />
      <path d="m16.5 7.5 1.6-1.6" />
    </IconBase>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9.5a2.5 2.5 0 1 1 4.5 1.5c-.7.9-1.7 1.3-2.2 2" />
      <circle cx="12" cy="16.7" r=".8" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="5" width="17" height="4" rx="1.5" />
      <path d="M6 9v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </IconBase>
  );
}

export function ForwardIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 12h13" />
      <path d="m12 6 6 6-6 6" />
    </IconBase>
  );
}

export function DotsIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function OpenMailIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 10.5 12 5l8 5.5" />
      <path d="M4 10.5v8.5h16v-8.5" />
      <path d="m9 13 3 2.2 3-2.2" />
    </IconBase>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4.5 7.5h15" />
      <path d="M9 7.5V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.5" />
      <path d="m7 7.5 1 12a1.5 1.5 0 0 0 1.5 1.4h5a1.5 1.5 0 0 0 1.5-1.4l1-12" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconBase>
  );
}

export function PaperclipIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m9.5 13.5 5.8-5.8a3 3 0 0 1 4.2 4.2l-7.7 7.7a5 5 0 0 1-7.1-7.1l7.2-7.2" />
    </IconBase>
  );
}

export function SmileIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <circle cx="9" cy="10" r=".8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r=".8" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m12 3 1.5 3.8L17 8.3l-3.5 1.5L12 13.5l-1.5-3.7L7 8.3l3.5-1.5L12 3Z" />
      <path d="m5 14 1 2.3L8.3 17 6 18l-1 2.2L4 18l-2.3-1 2.3-.7L5 14Z" />
      <path d="m19 14 1 2.3 2.3.7L20 18l-1 2.2L18 18l-2.3-1 2.3-.7 1-2.3Z" />
    </IconBase>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function ExpandIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M8 3H3v5" />
      <path d="m3 3 6 6" />
      <path d="M16 21h5v-5" />
      <path d="m21 21-6-6" />
    </IconBase>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}
