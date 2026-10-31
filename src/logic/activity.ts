const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar day as YYYY-MM-DD. Streaks use the device's date (D6). */
export function dateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export const isDateKey = (v: unknown): v is string => typeof v === 'string' && DAY_RE.test(v)
