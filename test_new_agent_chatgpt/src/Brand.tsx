export function PulseMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 21h9l5-13 9 25 5-12h8"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`brand ${light ? "brand-light" : ""}`}
      href="#home"
      aria-label="PulseMind home"
    >
      <PulseMark />
      <span>
        PulseMind
        <span className="brand-period" aria-hidden="true">
          +
        </span>
      </span>
    </a>
  );
}
