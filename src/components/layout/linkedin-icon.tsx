import type { SVGProps } from 'react'

/**
 * LinkedIn mark. Lucide has no brand icons, so this is drawn inline.
 * Colored with currentColor, so it follows the button's text color.
 */
export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="2.5" y="9" width="4" height="12" rx="0.5" />
      <circle cx="4.5" cy="4.5" r="2.2" />
      <path d="M9.5 9h3.8v1.7c.6-1.1 2-2 4-2 4.2 0 5 2.7 5 6.2V21h-4v-5.5c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4z" />
    </svg>
  )
}
