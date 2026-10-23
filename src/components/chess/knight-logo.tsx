import type { SVGProps } from 'react'

type KnightLogoProps = SVGProps<SVGSVGElement> & {
  /** Accessible name. Omit for a decorative logo. */
  title?: string
}

/** Chunky knight silhouette used as the ChessMate brand mark. Colored with currentColor. */
export function KnightLogo({ title, ...props }: KnightLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...props}
    >
      <path d="M30 86C30 74 36 68 40 62C34 62 24 60 18 54C14 50 14 46 18 42L32 28L36 12L46 22C52 20 58 22 64 28C74 38 78 56 74 86Z" />
      <rect x="22" y="84" width="60" height="10" rx="4" />
      <circle cx="41" cy="35" r="3.2" fill="var(--app-bg)" />
      <path
        d="M58 28C66 36 68 50 64 66"
        fill="none"
        stroke="var(--app-bg)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  )
}
