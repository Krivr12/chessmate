/** Trophy artwork shared with the app icon set: public/icons/trophy.svg. */
export function TrophyArt({ className }: { className?: string }) {
  return <img src="/icons/trophy.svg" alt="" className={className} aria-hidden="true" />
}

/** Sad king artwork shared with the app icon set: public/icons/sad-king.svg. */
export function SadKingArt({ className }: { className?: string }) {
  return <img src="/icons/sad-king.svg" alt="" className={className} aria-hidden="true" />
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
