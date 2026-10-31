# ChessMate: Phase 1 Task List

Execution plan for phase 1 (Landing page + Game page, fully offline PWA). Work top to bottom. Each milestone ends with a **Done when** check and leaves the app in a working, demoable state.

Source of truth: `README.md` (section numbers like "README §9" refer to it). Visual tokens come from `docs/chessmate-ui-design-spec.md`.

Legend: `[ ]` to do, `[x]` done. Steps marked *(optional)* are not required for phase 1.

---

## Delivery checkpoints

Milestones are grouped into five releasable slices. Each checkpoint is a point where you can stop, demo, and get feedback.

| Checkpoint | Milestones | What you can show |
|---|---|---|
| **A. Playable board** | 0 to 4 | Themed app, landing page, a full legal game against yourself by tapping |
| **B. Play the frog** | 5 to 7 | Smooth animations, Stockfish opponent at 3 difficulty levels, New game sheet |
| **C. Smart coach** | 8 to 11 | Full game screen with frog, win chance, graded moves, trash talk, hints |
| **D. Complete game loop** | 12 to 14 | Undo/redo/reset/resign, win/loss/draw screens, autosave and resume |
| **E. Shippable** | 15 to 17 | Installable offline PWA, QA'd, live on HTTPS |

Fast path to a first playable: M0 → M1 → M3 → M4 → M6 → M7, then add the rest.

---

## Current status (checked against the repo)

Already in place:
- Vite + React 19 + TypeScript project (`chess_pwa`), `@/` alias in `vite.config.ts` and `tsconfig`
- Tailwind CSS 4 with `@tailwindcss/vite`
- shadcn initialized (`components.json`), with `button`, `dialog`, `drawer`, `sonner`, `tooltip` generated
- Installed deps: `chess.js`, `motion`, `zustand`, `idb-keyval`, `stockfish`, `lucide-react`, `vite-plugin-pwa`, `vitest`

Not yet done (drives Milestone 0 and 1):
- `src/index.css` only imports Tailwind. No ChessMate tokens or shadcn theme yet
- `App.tsx` is still the Vite starter page
- `tsconfig.app.json` has no explicit `"strict": true`
- No router, no Inter font, no Prettier, no `test` script
- `vite-plugin-pwa` is installed but not configured
- Stray or outdated deps from the old plan: `@fontsource/poppins`, `@fontsource-variable/geist`, `cn`, `next-themes`
- `index.html` title is still `chess_pwa`

---

## Milestone 0: Finish project setup

- [x] **0.1 Create the Vite + React + TS project**
- [x] **0.2 Set up the `@/` path alias** (Vite + tsconfig)
- [x] **0.3 Install Tailwind CSS 4**
- [x] **0.4 Initialize shadcn/ui** and generate `button`, `dialog`, `drawer`, `sonner`, `tooltip`
- [x] **0.5 Install core packages:** `chess.js`, `motion`, `zustand`, `idb-keyval`, `stockfish`, `vite-plugin-pwa`, `vitest`
- [x] **0.6 Turn on strict TypeScript:** add `"strict": true` to `tsconfig.app.json` and `tsconfig.node.json`, fix any errors (also removed the deprecated `baseUrl` from `tsconfig.app.json`)
- [x] **0.7 Install missing dependencies** (pinned exact; also added `clsx` and `tailwind-merge`, see 0.8)
  ```bash
  npm i react-router @fontsource-variable/inter
  npm i -D prettier eslint-config-prettier
  ```
- [x] **0.8 Remove unused packages** (`@fontsource/poppins`, `@fontsource-variable/geist`, `cn`, `next-themes`, `vaul`). Note: the npm package `cn` was a wrong install that the generated shadcn components imported. `src/lib/utils.ts` now defines `cn` with `clsx` + `tailwind-merge`, and all `ui/` imports use `@/lib/utils`. `sonner.tsx` no longer uses `next-themes` (fixed dark theme)
- [x] **0.9 Add shadcn components for phase 1** (keep `button`, `dialog`, `sonner`, `tooltip`)
  ```bash
  npx shadcn@latest add card badge dropdown-menu progress sheet toggle-group separator skeleton
  ```
  Decision: use shadcn `Sheet` (bottom side) for the New game sheet and Hint sheet (README §6). The generated `drawer` stays unused and is removed. Spec §7.8 shows the hint as a centered `Dialog`; follow README §6.4 (bottom sheet with "Play Nf3" and "Dismiss")
- [x] **0.10 Add scripts and tooling:** `"test": "vitest --run --passWithNoTests"`, `format` script, a Prettier config, a `.prettierignore`, and `eslint-config-prettier` in `eslint.config.js`
- [x] **0.11 Create the folder structure from README §4** (`screens/`, `components/{layout,chess,opponent,result}/`, `hooks/`, `engine/`, `logic/`, `store/`, `storage/`). Empty folders can hold a `.gitkeep`
- [x] **0.12 Add `src/constants.ts`** with `APP_NAME = "ChessMate"` and default difficulty. Use it in `index.html`, the manifest, and the UI
- [x] **0.13 Design spec lives at `docs/chessmate-ui-design-spec.md`** (moved from the repo root; README and tasks references updated)
- [x] **0.14 Remove Vite starter leftovers:** `App.css`, `assets/hero.png`, `react.svg`, `vite.svg`, starter content in `App.tsx`; update `index.html` title and `lang`
- [ ] **0.15 *(optional)* Initial Git commit:** only when you ask for it

**Done when:** `npm run dev` runs, `npm run build` and `npm run lint` pass with strict TS on, and `npm test` runs (even with zero tests).

---

## Milestone 1: Design tokens, app shell, routing

*(README §5, §6, §17)*

- [x] **1.1 Add the ChessMate palette** to `src/index.css` as CSS variables: `--app-bg`, `--surface-1/2/3`, `--blue`, `--mint`, `--yellow`, `--lavender`, `--coral`, `--text-primary/secondary`, `--border-default`
- [x] **1.2 Add board tokens separately from shadcn tokens:** light square, dark square, selected, last move, legal dot, check
- [x] **1.3 Map the palette to shadcn semantic tokens** (`--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--destructive`, `--border`, `--ring`) using the Tailwind 4 `@theme` pattern (spec §8). The app is dark-only: put the palette in `:root` as well as `.dark`, and add `class="dark"` to `<html>`
- [x] **1.4 Self-host Inter:** import `@fontsource-variable/inter` in `main.tsx` and set it as the base font. Define the type scale (32, 24, 16, 14, 12, 10/11 px)
- [x] **1.5 Restyle shadcn primitives to the spec:** Button variants (primary blue, positive mint, outline with 1 px `#214C65` border, 44 to 48 px tall), Card (`#091F2D`, 14 to 16 px radius), sheet/dialog surfaces (`--surface-2`)
- [x] **1.6 Build `app-shell.tsx`:** centered, max width about 430 px, `--app-bg` background, safe-area padding (`env(safe-area-inset-*)`), `viewport-fit=cover` in `index.html`, dynamic viewport height (`dvh`)
- [x] **1.7 Set up React Router** with two routes, `/` (Landing) and `/play` (Game), inside the shell. Add placeholder screens
- [x] **1.8 Mount the `sonner` Toaster** and a `TooltipProvider` at the app root
- [x] **1.9 Add `use-reduced-motion.ts`** hook so animations can respect `prefers-reduced-motion` from the start

**Done when:** `/` and `/play` render placeholder screens on the dark navy background in Inter, a themed Button and Card look like the spec, and the layout holds at 390 px and on a wide desktop window.

---

## Milestone 2: Landing page

*(README §6.1)*

- [x] **2.1 Draw the knight logo SVG** (custom, 64 to 80 px)
- [x] **2.2 Build `landing.tsx`:** logo, app name (32 px bold), tagline ("Think. Move. Improve."), faint geometric background shapes
- [x] **2.3 Add the primary Start button** (blue, `ArrowRight`) near the bottom. For now it navigates straight to `/play` (the New game sheet comes in Milestone 7)
- [x] **2.4 Reserve a slot for "Resume battle"** (secondary button, hidden until Milestone 14)
- [x] **2.5 Add a gentle entrance animation** with Motion (respecting reduced motion)
- [x] **2.6 Set the page title and meta** (`APP_NAME`, theme color `#061824`)

**Done when:** the app opens on the landing page and Start navigates to the empty game route; the browser back button returns to the landing page.

---

## Milestone 3: Game logic and pure helpers

*(README §10, §11, §13 types)*

Everything here is plain TypeScript with unit tests, so the UI milestones can build on a verified base.

- [x] **3.1 Create `store/game-store.ts` (Zustand)** holding: chess.js instance, move list, selected square, legal targets, last move, status, difficulty, `thinking` flag, player color
- [x] **3.2 Actions:** `selectSquare`, `makeMove(from, to)`, `newGame(difficulty)`, with auto-promotion to queen
- [x] **3.3 Derived state:** whose turn, in check (and the king's square), checkmate, stalemate, draw reasons (insufficient material, repetition, 50-move)
- [x] **3.4 Write `logic/win-percent.ts`:** logistic formula, mate handling (100 / 0), helper to normalize a side-to-move score to the player's point of view, rounding for display
- [x] **3.5 Write `logic/grade-move.ts`:** takes `winBefore`, `winAfter`, and `isEngineBest`, returns a grade using the table in README §11
- [x] **3.6 Write `logic/accuracy.ts`:** per-move accuracy and the average. Verify the constants against Lichess docs before relying on them
- [x] **3.7 Write `logic/difficulty.ts`:** Easy / Medium / Hard config (starting values from README §9)
- [x] **3.8 Define shared types** (`Grade`, `Difficulty`, `SavedBattle`, `MoveRecord`) in one place
- [x] **3.9 Unit tests (Vitest):**
  - store: legal move, illegal move, short checkmate sequence, stalemate position
  - win percent: 0 cp = 50%, about +100 cp = 59%, +300 cp = 75%, mate cases, sign flips for Black
  - grading: each threshold boundary, "equals best move" shortcut
  - accuracy: 0 drop is about 100, large drop is near 0, clamping

**Done when:** `npm test` passes and a game can be played through the store from a throwaway UI or the console.

---

## Milestone 4: Pieces and static board

*(README §7)*

- [x] **4.1 Create six Staunton-style SVG pieces** (King, Queen, Rook, Bishop, Knight, Pawn) with transparent backgrounds. Color them with CSS variables so one shape serves both sides
- [x] **4.2 Piece colors:** player white (`#FFFFFF` with a navy outline of about 1.5 px), opponent navy (`#0B2A3D`) with light inner detail. Check contrast on both square colors
- [x] **4.3 If using an existing piece set instead,** confirm its license is compatible before adding it
- [x] **4.4 Build `chessboard.tsx` and `chess-square.tsx`:** square container (`aspect-ratio: 1`), 8 px radius, 1 px border, light/dark squares from board tokens
- [x] **4.5 Build `board-coordinates.tsx`** (a to h, 1 to 8, 10 to 11 px, muted)
- [x] **4.6 Render the starting position** with memoized pieces at 72 to 82% of the square
- [x] **4.7 Tap-to-select and tap-to-move:** selected square (yellow tint plus slight piece lift), legal-move dots, ring on capture targets
- [x] **4.8 Last-move highlight** (mint tint on both squares) and **check indicator** (coral tint plus a ring or pulse on the king)
- [ ] **4.9 Hot-seat testing mode** *(skipped: went straight to the engine opponent)* (temporary): let both sides be moved by tapping so the whole rule set can be tried
- [x] **4.10 Keyboard and screen reader basics:** squares are buttons with labels like "e4, white pawn", focus ring visible

**Done when:** you can play a full legal game against yourself by tapping, including castling, en passant, and promotion, with all indicators showing.

---

## Milestone 5: Smooth piece animation

*(README §8)*

- [x] **5.1 Create `hooks/use-board-pieces.ts`** with stable piece IDs: `{ id, type, color, square | null }`
- [x] **5.2 Apply each move from the chess.js move result:** normal, capture, en passant (captured pawn is on the destination file and origin rank), castling (also move the rook), promotion (change type)
- [x] **5.3 Render pieces as absolutely positioned `motion.div` layers** over the squares, each 12.5% wide and tall, animated with percentage transforms (`file * 100%`, `rank * 100%`)
- [x] **5.4 Tune the spring** (start with stiffness about 400, damping about 32) and raise the z-index of the moving piece
- [x] **5.5 Capture animation:** captured piece scales to 0 and fades out
- [x] **5.6 Reduced motion:** skip the spring and snap or fade
- [x] **5.7 Support rebuilding piece IDs from a move list** with no animation (needed later for undo and resume)
- [x] **5.8 Unit tests:** replay a short PGN with castling (both sides), en passant, and promotion, asserting piece positions and IDs after each move

**Done when:** every move type glides smoothly, captured pieces disappear cleanly, and the tests pass.

---

## Milestone 6: Engine service

*(README §9)*

- [x] **6.1 Copy the lite, single-threaded Stockfish `.js` and `.wasm`** from the installed `stockfish` package into `public/engine/`. Confirm the exact file names for the installed version, and note the license (GPL) in the repo
- [x] **6.2 Write `engine/uci.ts`:** parse `info ... score cp|mate` and `bestmove` lines, keeping the last score before `bestmove`
- [x] **6.3 Write `engine/engine-service.ts`:** create the Worker, do the `uci` / `isready` handshake, add a request queue (one search at a time)
- [x] **6.4 Implement `analyze(fen, { movetime })`:** full strength (`UCI_LimitStrength false`), returns `{ cp, mate, best }`
- [x] **6.5 Implement `play(fen, difficulty)`:** `UCI_LimitStrength true` with `UCI_Elo` or `Skill Level` (plus a depth limit for Easy)
- [x] **6.6 Implement `stop()`** and cancellation so stale results never apply to a new position
- [x] **6.7 Lazy-load the engine:** start `init()` when the landing page is idle or Start is tapped, not on first paint
- [x] **6.8 Expose engine status** (`loading`, `ready`, `error`) for the UI
- [x] **6.9 Unit tests for `uci.ts`** (sample output lines)
- [x] **6.10 Manual check in the browser console:** analyze the start position and a known tactic, confirm sensible scores and best moves

**Done when:** `engine.analyze(startFen)` returns about 0 cp and a normal opening move, `play()` returns legal moves at each level, and the UI stays responsive during searches.

---

## Milestone 7: AI opponent and New game sheet (first full playable)

*(README §6.2, §9)*

- [x] **7.1 Build `new-game-sheet.tsx`:** bottom sheet with a Difficulty `ToggleGroup` (Easy / Medium / Hard, with the frog's name per level) and a mint **Play** button
- [x] **7.2 Open the sheet from Start** on the landing page and navigate to `/play` with the chosen difficulty
- [x] **7.3 Remember the last difficulty** in `localStorage` (default Medium) and pre-select it
- [x] **7.4 After the player's move, call `engine.play(...)`** and apply the returned move with animation
- [x] **7.5 Add a minimum thinking delay** (about 600 to 900 ms) and set the `thinking` flag
- [x] **7.6 Lock board input** while the opponent thinks and when the game is over
- [x] **7.7 Let the opponent open** when the player is Black (support `playerColor`, default White)
- [x] **7.8 Detect game end** after either side's move (checkmate, stalemate, draw) and set the status
- [x] **7.9 Remove the hot-seat testing mode** from Milestone 4
- [ ] **7.10 Playtest each level** and adjust settings: Easy beatable by a beginner, Hard a real challenge

**Done when:** you can play a full game against the engine at all three levels, and the last difficulty is remembered. **Checkpoint B reached.**

---

## Milestone 8: Game screen layout and the frog

*(README §6.3, §12, §5 icon map)*

- [x] **8.1 Build `app-header.tsx`:** back arrow (returns to Landing, battle stays saved), title "vs Frog (Medium)", overflow menu (`EllipsisVertical`) with New game and Resign entries (actions wired in Milestone 12)
- [x] **8.2 Draw `opponent/frog.tsx`:** SVG with five moods (idle, think, happy, sad, shock). Mint body, pale belly, navy eyes and mouth
- [x] **8.3 Build `move-commentary.tsx`:** frog avatar plus speech bubble (grade headline with icon, trash talk body), with a small enter animation when text changes
- [x] **8.4 Build `move-toolbar.tsx`:** Undo, Redo, Reset buttons with dimmed disabled states (opacity about 0.45). Handlers come in Milestone 12
- [x] **8.5 Build placeholder `hint-card.tsx` (mint) and `win-chance-card.tsx` (blue)** in the two-card row below the toolbar
- [x] **8.6 Assemble `screens/game.tsx`** in the README §6.3 order: header, commentary, board, toolbar, cards. Keep the board at full width (about 44 px squares at 390 px) and push other content below it
- [x] **8.7 Connect frog moods to events:** thinking while the engine runs, happy on opponent captures, sad on player captures, shock on checks, idle otherwise
- [x] **8.8 Show the opening line** ("Amaze me! If you can.") when the game starts
- [x] **8.9 Add an `aria-live` region** announcing whose turn it is and the frog's line
- [x] **8.10 Show the engine loading state** on the frog (small "waking up" state) if the engine is not ready yet

**Done when:** the game screen matches the layout in README §6.3 and the frog visibly reacts during a game.

---

## Milestone 9: Win chance and move grading

*(README §10, §11)*

- [x] **9.1 Wire the per-turn analysis flow in the store/engine layer:**
  1. At game start (and after each opponent move), `analyze` the position and cache `evalBefore` and `best` (also used by Hint)
  2. After the player moves, `analyze` the new position to get `evalAfter`
  3. Compute `winBefore`, `winAfter`, and the grade
  4. Then let the opponent play
- [x] **9.2 Handle the first move** by analyzing the start position when the game begins. If the player is Black, the first "before" analysis happens after the opponent's opening move
- [x] **9.3 Store `winAfter` and `grade`** on each move record
- [x] **9.4 Implement `win-chance-card.tsx`:** percentage (24 to 28 px, bold), `Progress` bar, trend arrow comparing to the previous value, tooltip "Estimated from the engine's evaluation"
- [x] **9.5 Implement the grade display in the commentary bubble:** icon + label + color per the grade table (README §5), never color alone. Smooth color transition between grades
- [x] **9.6 Guard against stale analysis:** discard results if the position changed (use `stop()` and a request token)
- [ ] **9.7 Measure analysis time on a mid-range phone** and tune `movetime` (start at about 250 ms)

**Done when:** deliberately playing a bad move shows a Mistake or Blunder with a lower win chance, and a strong move shows Best or Great with the chance holding or rising.

---

## Milestone 10: Trash talk

*(README §12)*

- [x] **10.1 Create `logic/trash-talk.ts`** with the line bank (by grade and by event: captures, checks, hint used, game start, resume, win, lose)
- [x] **10.2 Add `pickLine(category)`** that avoids repeating the last line in that category
- [x] **10.3 Show a line after each graded move** and set the matching frog mood
- [x] **10.4 Cover special events:** player/opponent captures, player/opponent checks, game start, resume, win, lose, hint used. Decide priority when several apply (for example, check beats grade line)
- [x] **10.5 Unit tests:** every category has lines, `pickLine` never repeats back to back when more than one line exists
- [ ] **10.6 Playtest the tone.** Keep it playful. Rewrite anything that feels mean

**Done when:** a bad move gets a line like "Such a beginner move." and a great move gets a grumpy compliment, with no immediate repeats.

---

## Milestone 11: Hint

*(README §6.3, §6.4)*

- [x] **11.1 Build `hint-card.tsx`** (mint, `Lightbulb`) that opens the hint sheet
- [x] **11.2 Write `logic/hint-text.ts`:** convert the best move to SAN plus a short reason from chess.js flags (check, capture, castle, promotion, otherwise "This improves your position")
- [x] **11.3 Build `hint-sheet.tsx`:** "The best move is **Nf3**", the explanation, **Play Nf3** (mint) and **Dismiss**
- [x] **11.4 Read the cached `best` move** for the current position (run `analyze` if the cache is empty)
- [x] **11.5 Highlight the suggested from and to squares** with a soft pulsing glow while the hint is active; clear it after the player moves or dismisses
- [x] **11.6 "Play Nf3" makes the move** through the normal move flow (it still gets graded)
- [x] **11.7 Frog reacts to hint use** with a hint trash talk line
- [x] **11.8 Disable the Hint card while the opponent is thinking or the game is over,** with a clear inactive state instead of hiding it
- [x] **11.9 Unit tests for `hint-text.ts`**

**Done when:** tapping Hint shows a strong move with a short reason, highlights it on the board, and the highlight disappears after you play.

**Checkpoint C reached.**

---

## Milestone 12: Undo, redo, reset, resign

*(README §14)*

- [x] **12.1 Undo:** call `engine.stop()`, rewind the opponent's last move and the player's last move, re-animate, and restore the win chance, grade, and bubble from stored move data
- [x] **12.2 Redo:** reapply undone moves from a redo stack; any new move clears it
- [x] **12.3 Edge cases for undo:** undo before any move (disabled), undo when the opponent has not yet replied, undo after the opponent opened as White
- [x] **12.4 Reset:** confirm in a `Dialog` if a game is in progress, clear the saved battle, reset the engine state, start a new game at the same difficulty
- [x] **12.5 Resign** (overflow menu): confirm, then end the game as a loss and show the loss screen (Milestone 13)
- [x] **12.6 New game** (overflow menu): opens the New game sheet
- [x] **12.7 Disable states:** toolbar buttons are dimmed while the opponent thinks or the game is over, Redo disabled when the stack is empty
- [x] **12.8 Unit tests:** undo/redo round trip returns the identical position and piece IDs; a new move clears redo

**Done when:** undo, redo, reset, and resign work reliably from any game state, with no stale engine results.

---

## Milestone 13: Result screens

*(README §6.5)*

- [x] **13.1 Build the result container:** full-screen layer shown after checkmate, stalemate, draw, or resignation (a state of the Game page, not a route). Dark background stays
- [x] **13.2 Draw custom SVGs:** trophy (win), toppled king with X eyes (loss), two kings or equal sign (draw)
- [x] **13.3 Build `win-screen.tsx`:** "You Win!", mint particles, **Play again** (mint) and **Home** (outlined)
- [x] **13.4 Build `loss-screen.tsx`:** "You Loss", restrained coral accents, **Try again** (blue) and **Home**
- [x] **13.5 Build `draw-screen.tsx`:** "It's a Draw", neutral tone, **Play again** and **Home**
- [x] **13.6 Build `game-summary-card.tsx`:** accuracy percentage with a progress bar, counts of moves, best moves, mistakes, blunders (each with its icon)
- [x] **13.7 Build `particles.tsx`:** 30 to 60 particles max, easing `cubic-bezier(0.16, 1, 0.3, 1)`, 350 to 650 ms entrance, progress bar fill 600 to 900 ms, buttons never delayed
- [x] **13.8 Optional frog cameo** (sad on a win, happy on a loss)
- [x] **13.9 Respect `prefers-reduced-motion`:** simple fade and a static illustration
- [x] **13.10 Trigger the right frog line** (win/lose) and clear the saved battle when the game ends
- [x] **13.11 Make the screens accessible:** focus moves to the heading, result is announced via `aria-live`, buttons have 44 px targets

**Done when:** every way a game can end (checkmate for either side, stalemate, each draw type, resignation) shows the correct screen, the summary numbers are correct, and the buttons work.

---

## Milestone 14: Save and resume

*(README §13)*

- [x] **14.1 Write `storage/battle-storage.ts`:** `save`, `load`, `clear` with `idb-keyval` under `battle:current`, using the `SavedBattle` shape, all wrapped in try/catch
- [x] **14.2 Validate on load:** reject unknown versions, malformed data, and illegal move lists (treat as "no save")
- [x] **14.3 Autosave after every move** (lightly debounced) and on `visibilitychange` when the tab is hidden
- [x] **14.4 Clear the record** when a game ends or a new game starts
- [x] **14.5 On app load, check for a saved battle.** If one exists, show **Resume battle** next to Start on the landing page
- [x] **14.6 Rebuild state from the saved move list:** position, piece IDs, last-move highlight, grades, win chance, difficulty, player color. No animation on restore
- [x] **14.7 After resume,** re-run the analysis for the current position so Hint works, and show the resume trash talk line
- [x] **14.8 Call `navigator.storage.persist()`** once
- [x] **14.9 Do not save the redo stack or engine state**
- [x] **14.10 Unit tests:** save then load round trip, corrupt record is ignored, unknown version is ignored
- [ ] **14.11 Manual test:** make several moves, reload mid-game, resume, confirm identical position, then keep playing. Also test private browsing (storage failure must not crash)

**Done when:** closing the tab and reopening restores the game exactly, and a corrupt record is ignored without errors.

**Checkpoint D reached.**

---

## Milestone 15: PWA

*(README §15)*

- [x] **15.1 Create the icons:** 192, 512, a maskable 512, and an Apple touch icon (knight on navy `#061824`)
- [x] **15.2 Configure `vite-plugin-pwa`** in `vite.config.ts` with the manifest: name and short name from `APP_NAME`, `display: standalone`, `orientation: portrait`, `start_url` and `scope` `/`, theme and background `#061824`, icons
- [x] **15.3 Configure Workbox:** precache JS, CSS, fonts, icons, and `wasm` (add to `globPatterns`), raise `maximumFileSizeToCacheInBytes` (for example to 15 MB) so the Stockfish `.wasm` is included
- [x] **15.4 Add the SPA navigation fallback** so `/play` works on reload and offline
- [x] **15.5 Choose the update strategy:** `autoUpdate`, or `prompt` with a "New version available" toast (`sonner`)
- [x] **15.6 Add iOS meta tags** to `index.html`: `apple-touch-icon`, `apple-mobile-web-app-capable`, status bar style for dark
- [x] **15.7 Verify nothing loads from a CDN** (Inter, icons, engine, scripts all local). Check the Network tab
- [x] **15.8 Test offline:** `npm run build && npm run preview`, load once online, go offline, hard reload, play a full game including hints, grading, undo, and resume
- [ ] **15.9 Run a Lighthouse PWA audit** and fix what it reports
- [ ] **15.10 (optional) Install prompt:** custom Install button via `beforeinstallprompt` on Android, and an "Add to Home Screen" hint for iOS

**Done when:** the installed app plays a full game in airplane mode.

---

## Milestone 16: Polish and QA

*(README §17, §18)*

- [x] **16.1 Accessibility pass:** `aria-label` on all icon-only buttons, visible focus rings, 44 px touch targets for primary controls, keyboard-playable board, dialogs and sheets trap focus and close on Escape
- [ ] **16.2 Contrast check:** pieces on both square colors, text on every colored card and all six grade colors
- [x] **16.3 Non-color indicators:** confirm grades, selection, legal moves, check, win, and loss all have an icon, shape, or label in addition to color
- [ ] **16.4 Performance check:** 60 fps piece animation, no long main-thread tasks during engine work, engine is lazy-loaded, first load under about 2 s on mid-range 4G
- [ ] **16.5 Edge cases:**
  - rapid taps during the opponent's turn
  - reset or undo while the engine is thinking
  - leaving the game page mid-search and returning
  - resuming a game that had already ended
  - castling, en passant, and promotion through the UI
  - threefold repetition, 50-move, and insufficient-material draws
  - playing as Black
- [x] **16.6 Handle engine load failure:** friendly retry state on the frog, game remains viewable
- [ ] **16.7 Reduced motion check** across piece movement, sheets, and result screens
- [ ] **16.8 Device testing:** a small Android phone, an iPhone (Safari), and a desktop browser
- [ ] **16.9 Tune** grade thresholds, difficulty levels, and animation springs by playing several full games
- [x] **16.10 Console check:** no errors or warnings during a full game, including offline

**Done when:** several complete games on a real phone feel smooth with no console errors.

---

## Milestone 17: Deploy

*(README §16)*

- [ ] **17.1 Push to GitHub** and connect the repo to Cloudflare Pages, Vercel, or Netlify
- [x] **17.2 Set build command and output:** `npm run build`, output `dist`
- [x] **17.3 Confirm headers:** `.wasm` served as `application/wasm`, hashed assets cached long-term, `index.html` and the service worker file not cached
- [x] **17.4 Add the SPA fallback rule** if the host needs one (`/play` must serve `index.html`)
- [ ] **17.5 Test the live HTTPS URL:** install it on a phone, go offline, play a full game
- [ ] **17.6 Test the update flow:** deploy a small change and confirm the installed app updates
- [x] **17.7 Add a short deploy section to `README.md`** (build, preview, deploy steps)

**Done when:** the live URL is installable and plays offline. **Checkpoint E reached.**

---

## Phase 1 acceptance checklist

Mapped to the 12 goals in README §1.

- [ ] 1. Deployed, installable PWA that is fully playable offline
- [x] 2. AI opponent (Stockfish WASM) with Easy / Medium / Hard
- [x] 3. Hint suggests the best move, with a short reason and board highlight
- [x] 4. Win percentage shown and updated after every move
- [x] 5. Every player move graded (Best, Great, Good, Inaccuracy, Mistake, Blunder) with icon and label
- [x] 6. Opponent trash talk reacts to the grade and to events
- [x] 7. Clean custom SVG chess pieces with good contrast on both square colors
- [x] 8. Landing page with knight logo, name, tagline, Start (and Resume when a save exists)
- [x] 9. Smooth piece animation for all move types, including undo and redo
- [x] 10. Full-screen win, loss, and draw screens with animation and a game summary
- [x] 11. Undo, redo, reset, and resign work
- [x] 12. Current battle autosaves and can be resumed after a reload
- [x] Only two pages exist: Landing and Game (New game sheet, hint sheet, and result screens are part of them)
- [x] Nothing from the "out of scope" list (README §1) was built

---

## Dependency map

```
M0 → M1 → M2
        ↘
         M3 → M4 → M5 ─────────────┐
               ↘                    ↓
                M6 ───────────→ M7 (playable vs AI)
                                    ↓
                       M8 → M9 → M10
                              ↘     ↘
                               M11 ← ┘
                                ↓
                     M12 → M13 → M14
                                ↓
                         M15 → M16 → M17
```

Notes:
- M3's pure helpers (win percent, grading, accuracy) have no UI dependency and can be built any time before M9.
- M5 (animation) and M6 (engine) are independent and can be done in either order or in parallel.
- M12 (undo) relies on the piece-ID rebuild from M5.7; M14 (resume) relies on it too.
- M13 needs the grade data from M9 for the summary card.
