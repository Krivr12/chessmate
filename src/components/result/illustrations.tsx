const NAVY = '#0b2a3d'

export function TrophyArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M28 18h44v14c0 16-10 27-22 27S28 48 28 32Z" fill="#ffe29a" />
      <path
        d="M28 24H16v6c0 9 7 15 15 15M72 24h12v6c0 9-7 15-15 15"
        fill="none"
        stroke="#ffe29a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M44 58h12v12H44Z" fill="#f5c96a" />
      <rect x="32" y="70" width="36" height="10" rx="3" fill="#ffe29a" />
      <rect x="26" y="80" width="48" height="8" rx="3" fill="#f5c96a" />
      <path d="M50 26l3 7h7l-5.5 4.5 2 7L50 40l-6.5 4.5 2-7L40 33h7Z" fill="#fff6d6" />
    </svg>
  )
}

/** Toppled king with X eyes. */
export function ToppledKingArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ellipse cx="50" cy="84" rx="38" ry="5" fill="#15364a" />
      <g transform="rotate(-72 50 62)">
        <path d="M47 18h6v8h7v6h-7v8h-6v-8h-7v-6h7Z" fill="#ff8f93" />
        <path
          d="M30 80c-4-9-9-17-9-24 0-9 9-13 16-11 5 1 10 6 13 12 3-6 8-11 13-12 7-2 16 2 16 11 0 7-5 15-9 24Z"
          fill="#eaf5ff"
          stroke={NAVY}
          strokeWidth="3"
        />
        <rect x="24" y="80" width="52" height="9" rx="3" fill="#eaf5ff" stroke={NAVY} strokeWidth="3" />
        <path
          d="M36 58l8 8m0-8l-8 8M56 58l8 8m0-8l-8 8"
          stroke={NAVY}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function DrawArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="38" fill="#15364a" />
      <rect x="28" y="38" width="44" height="8" rx="4" fill="#9fd4ff" />
      <rect x="28" y="54" width="44" height="8" rx="4" fill="#9fd4ff" />
    </svg>
  )
}
