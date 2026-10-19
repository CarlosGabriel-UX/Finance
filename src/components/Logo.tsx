export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <g fill="#4ade80">
        <path d="M16 3l4.5 8h-9z" />
        <path d="M16 29l-4.5-8h9z" />
        <path d="M3 16l8-4.5v9z" />
        <path d="M29 16l-8 4.5v-9z" />
      </g>
      <circle cx="16" cy="16" r="3" fill="#f07a2a" />
    </svg>
  );
}
