import type { SVGProps } from 'react'

type KnightLogoProps = SVGProps<SVGSVGElement> & {
  /** Accessible name. Omit for a decorative logo. */
  title?: string
}

/**
 * Chunky knight silhouette, the ChessMate brand mark (same shape as the PWA icon).
 * The body uses currentColor, so the logo follows the theme. The eye uses the page
 * background color, so it stays a hole in both themes.
 */
export function KnightLogo({ title, ...props }: KnightLogoProps) {
  return (
    <svg
      viewBox="10 8 76 90"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title && <title>{title}</title>}
      <path
        d="M30 86C30 74 36 68 40 62C34 62 24 60 18 54C14 50 14 46 18 42L32 28L36 12L46 22C52 20 58 22 64 28C74 38 78 56 74 86Z"
        fill="currentColor"
      />
      <rect x="22" y="84" width="60" height="10" rx="4" fill="currentColor" />
      <circle cx="41" cy="35" r="3.2" style={{ fill: 'var(--background)' }} />
    </svg>
  )
}
