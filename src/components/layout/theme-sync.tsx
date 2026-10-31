import { useEffect, useRef } from 'react'
import { useEffectiveTheme } from '@/store/theme'
import type { ResolvedTheme } from '@/store/theme-lock'

/** Writes the theme to <html>, the color-scheme, and the browser's theme-color. */
function applyToDocument(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'light' ? '#FFFDF8' : '#061824',
  )
}

/**
 * Keeps the document in sync with the effective theme. Renders nothing.
 * A change crossfades for a short moment, unless the user prefers reduced motion.
 */
export function ThemeSync() {
  const theme = useEffectiveTheme()
  const first = useRef(true)

  useEffect(() => {
    const root = document.documentElement
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let timer: number | undefined
    if (!first.current && !reduce) {
      root.classList.add('theme-fade')
      timer = window.setTimeout(() => root.classList.remove('theme-fade'), 280)
    }
    first.current = false
    applyToDocument(theme)
    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
        root.classList.remove('theme-fade')
      }
    }
  }, [theme])

  return null
}
