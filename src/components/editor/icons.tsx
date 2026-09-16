export function GripIcon() {
  return (
    <svg
      width="14"
      height="20"
      viewBox="0 0 14 20"
      fill="none"
      aria-hidden="true"
    >
      {[3, 9].map((cx) =>
        [3, 9, 15].map((cy) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy + 1}
            r="1.4"
            fill="currentColor"
          />
        )),
      )}
    </svg>
  );
}

export function DuplicateIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3 10.5V3.5C3 2.94772 3.44772 2.5 4 2.5H10.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 5H12.5M6.5 5V3.5H9.5V5M6.5 7.5V11M9.5 7.5V11M4.5 5L5 12.5C5 13.05 5.45 13.5 6 13.5H10C10.55 13.5 11 13.05 11 12.5L11.5 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3.5V12.5M3.5 8H12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{
        transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 120ms",
      }}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WarningIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 1L11 10H1L6 1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M6 4.7V6.8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="6" cy="8.4" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 2L14 14M6.5 6.7C6.18 7.02 6 7.47 6 8C6 9.1 6.9 10 8 10C8.53 10 8.98 9.82 9.3 9.5M4 4.4C2.8 5.3 2 6.6 2 8C2 8 4 12 8 12C9.2 12 10.2 11.7 11 11.2M13 9.7C13.6 8.9 14 8 14 8C14 8 12 4 8 4C7.6 4 7.2 4.05 6.85 4.13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
