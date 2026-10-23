import { DIFFICULTIES } from '@/logic/difficulty'
import type { Difficulty, EngineScore } from '@/logic/types'
import { parseBestMove, parseInfoScore } from './uci'

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error'
export type AnalysisResult = EngineScore & { best: string | null }

export class EngineCancelledError extends Error {
  constructor() {
    super('Engine job cancelled')
  }
}

type Job = {
  commands: string[]
  score: EngineScore | null
  cancelled: boolean
  resolve: (r: AnalysisResult) => void
  reject: (e: Error) => void
}

const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`
const INIT_TIMEOUT_MS = 20000

/**
 * The only module that talks to Stockfish. Runs one search at a time through a
 * queue, so analysis (full strength) and opponent moves (limited) share a worker.
 */
class EngineService {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private queue: Job[] = []
  private current: Job | null = null
  private waiters: { token: string; resolve: () => void }[] = []
  private listeners = new Set<(s: EngineStatus) => void>()
  status: EngineStatus = 'idle'

  onStatus(fn: (s: EngineStatus) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private setStatus(s: EngineStatus) {
    this.status = s
    this.listeners.forEach((fn) => fn(s))
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise
    this.setStatus('loading')
    this.initPromise = new Promise<void>((resolve, reject) => {
      const fail = (err: unknown) => {
        this.teardown()
        this.setStatus('error')
        reject(err instanceof Error ? err : new Error(String(err)))
      }
      const timer = setTimeout(() => fail(new Error('Engine init timed out')), INIT_TIMEOUT_MS)
      try {
        const worker = new Worker(ENGINE_URL)
        this.worker = worker
        worker.onmessage = (e) => String(e.data).split('\n').forEach((l) => this.onLine(l.trim()))
        worker.onerror = (e) => {
          clearTimeout(timer)
          fail(new Error(e.message || 'Engine worker failed'))
        }
        this.send('uci')
        this.waitFor('uciok')
          .then(() => {
            this.send('isready')
            return this.waitFor('readyok')
          })
          .then(() => {
            clearTimeout(timer)
            this.setStatus('ready')
            resolve()
            this.pump()
          })
      } catch (err) {
        clearTimeout(timer)
        fail(err)
      }
    })
    // Allow a later retry after failure.
    this.initPromise.catch(() => (this.initPromise = null))
    return this.initPromise
  }

  retry(): Promise<void> {
    this.teardown()
    return this.init()
  }

  /** Full-strength evaluation of a position (hints, win %, grading). */
  analyze(fen: string, movetime = 250): Promise<AnalysisResult> {
    return this.enqueue([
      'setoption name UCI_LimitStrength value false',
      'setoption name Skill Level value 20',
      `position fen ${fen}`,
      `go movetime ${movetime}`,
    ])
  }

  /** Limited-strength opponent move in UCI notation, or null if there is none. */
  async play(fen: string, difficulty: Difficulty): Promise<string | null> {
    const cfg = DIFFICULTIES[difficulty]
    const strength =
      cfg.elo === null
        ? ['setoption name UCI_LimitStrength value false', `setoption name Skill Level value ${cfg.skill}`]
        : [
            'setoption name Skill Level value 20',
            'setoption name UCI_LimitStrength value true',
            `setoption name UCI_Elo value ${cfg.elo}`,
          ]
    const result = await this.enqueue([...strength, `position fen ${fen}`, cfg.go])
    return result.best
  }

  /** Cancel queued jobs and stop the running search. Pending promises reject. */
  stop() {
    const queued = this.queue
    this.queue = []
    queued.forEach((j) => j.reject(new EngineCancelledError()))
    if (this.current && !this.current.cancelled) {
      this.current.cancelled = true
      this.send('stop')
    }
  }

  newGame() {
    this.stop()
    if (this.status !== 'ready') return
    const noop = () => {}
    this.queue.push({
      commands: ['ucinewgame', 'isready'],
      score: null,
      cancelled: false,
      resolve: noop,
      reject: noop,
    })
    this.pump()
  }

  private enqueue(commands: string[]): Promise<AnalysisResult> {
    return new Promise<AnalysisResult>((resolve, reject) => {
      this.queue.push({ commands, score: null, cancelled: false, resolve, reject })
      this.init().then(
        () => this.pump(),
        (err) => {
          this.queue.forEach((j) => j.reject(err))
          this.queue = []
        },
      )
    })
  }

  private pump() {
    if (this.current || this.status !== 'ready') return
    const job = this.queue.shift()
    if (!job) return
    this.current = job
    job.commands.forEach((c) => this.send(c))
    // Jobs without a search (ucinewgame) finish on readyok.
    if (!job.commands.some((c) => c.startsWith('go '))) {
      this.waitFor('readyok').then(() => this.finish({ best: null }))
    }
  }

  private finish(r: { best: string | null }) {
    const job = this.current
    this.current = null
    if (job) {
      if (job.cancelled) job.reject(new EngineCancelledError())
      else job.resolve({ cp: job.score?.cp ?? null, mate: job.score?.mate ?? null, best: r.best })
    }
    this.pump()
  }

  private onLine(line: string) {
    if (!line) return
    const waiter = this.waiters.find((w) => line.startsWith(w.token))
    if (waiter) {
      this.waiters = this.waiters.filter((w) => w !== waiter)
      waiter.resolve()
    }
    const score = parseInfoScore(line)
    if (score && this.current) this.current.score = score
    const best = parseBestMove(line)
    if (best && this.current) this.finish(best)
  }

  private waitFor(token: string) {
    return new Promise<void>((resolve) => this.waiters.push({ token, resolve }))
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd)
  }

  private teardown() {
    this.worker?.terminate()
    this.worker = null
    this.initPromise = null
    this.waiters = []
    const pending = [...(this.current ? [this.current] : []), ...this.queue]
    this.current = null
    this.queue = []
    pending.forEach((j) => j.reject(new Error('Engine stopped')))
  }
}

export const engine = new EngineService()

/** Start loading the engine when the browser is idle. */
export function preloadEngine() {
  const start = () => void engine.init().catch(() => {})
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2000 })
  else setTimeout(start, 500)
}
