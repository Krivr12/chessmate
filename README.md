# ChessMate: Offline Chess PWA

A local, offline-first chess app with cute animal opponents (frog in dark mode, cat in light mode), AI play at three difficulty levels, hints, win percentage analysis, graded moves, puzzles, lessons, and full game history. Dark and light themes, installable as a PWA. No backend, no accounts, no multiplayer.

**Current Version:** Phase 2 complete - Full featured local app with Home dashboard, Puzzles, Learn, Profile, Game review, Settings, and Help.

**Status:** Ready for testing and deployment.

> **Design source:** `docs/chessmate-ui-design-spec.md` (colors, typography, spacing, component specs, icons)
>
> **Phase 2 spec:** `phase-2.md` (architecture, milestones, decisions, risks)

---

## What's included

### Core gameplay
- Play against Stockfish engine at Easy (10%), Medium (50%), or Hard (100%) strength
- Play as white or black
- Animated piece movement with promotion picker
- Undo, redo, restart moves
- Real-time win chance percentage and move grading (Best, Great, Good, Inaccuracy, Mistake, Blunder)
- Opponent commentary with mood expressions
- Autosave and resume from the last game

### Dashboard & Navigation
- Home screen with resume battle, quick access to puzzles and lessons, recent stats
- Bottom navigation (Home, Puzzles, Learn, Profile)
- Responsive design for phones (360 px and up)

### Puzzles
- 500+ chess puzzles bundled offline, categorized by difficulty
- Puzzle library with filtering by level and theme
- Progress tracking (first-try solves, hints used)
- Hint system with piece and destination highlighting
- Solution playback with move annotation

### Learn
- Interactive chess lessons with text, demonstrations, quizzes, and "try it" exercises
- Multiple tracks: Basics, Tactics, Openings, Endgames
- Progress tracking across lessons
- Reusable lesson board with highlights and arrows

### Analysis & Review
- Full game review for every finished game with win chance graph
- Critical moment identification (biggest win % drops)
- Move-by-move replay with keyboard shortcuts
- Play from any position to continue practice
- Background engine analysis for games saved without full evaluation

### Profile & Statistics
- Win rate, streaks (day and win), and game counts by result
- Accuracy bars for recent games
- Win/loss counts by difficulty
- Puzzle statistics and lesson completion
- Editable player name
- Badge system: First Win, Getting Started, Giant Slayer, Clean Game, Comeback, Quick Mate, Streaks, Puzzle badges, Graduate

### Settings
- Theme selection (Dark, Light, System) with opponent locked to theme
- Highlight last move toggle
- Hint display toggle
- Default difficulty and color for new games
- Sound and haptic feedback options
- Data management: clear history, puzzles, lessons, settings, everything
- Export/import game data for backup

### Other features
- Help & Support with FAQ, quick start, troubleshooting, credits, and diagnostics
- Offline first: works without internet after first load
- PWA: installable on phones, home screen icon, works offline
- Theme system: automatically switches between dark and light based on device setting (configurable)
- Theme lock: during an active game, theme stays locked to prevent jarring switches

### Performance
- Main bundle: 498 KB (161 KB gzipped)
- Route chunks: 3-17 KB each (lazy-loaded)
- Puzzle data: ~70-82 KB per difficulty (lazy-loaded, precached)
- Service worker precaches all chunks and engine for offline

---

## 1. Phase 1 goals (baseline)



1. Deployed and installable as a PWA, fully playable offline
2. AI opponent (Stockfish WASM) with difficulty levels
3. Hint function (suggests the best move)
4. Win percentage calculation
5. Grade and label every player move (Best, Great, Good, Inaccuracy, Mistake, Blunder)
6. Opponent trash talk based on the grade (static text bank for now)
7. Clean custom SVG chess pieces
8. Landing page (placeholder character icon and an Enter game button)
9. Smooth piece movement animation
10. Full-screen win, lose, and draw result screens with animation
11. Undo, redo, and restart (they are in the design toolbar)
12. Autosave and resume of the current battle

**Phase 1 is two pages only: the Landing page and the Game page.** The New game sheet, hint sheet, and result screens belong to those two pages. They are not separate pages.

**Out of scope for phase 1:** Settings page, sidebar or side drawer, bottom navigation, analysis or solution review page, Home dashboard, accounts and sign in, puzzles, daily challenge, Learn, profile and statistics, achievements, sound and haptics, light theme, multiple animal opponents. See section 19.

---

## 2. Design reconciliation (what changed from version 1)

Your new design is a full puzzle app. This app is a play-against-the-AI app, and phase 1 builds only the Landing page and the Game page. The table shows how each part of the design maps to phase 1.

| Design element | Phase 1 decision |
|---|---|
| Dark navy palette, pastel blue, mint, yellow, coral | **Adopted.** Replaces the Lily pad palette from version 1 |
| Inter font | **Adopted.** Replaces Poppins. Self-host it (offline) |
| Thin low-contrast borders (`#214C65`), subtle shadows | **Adopted.** Keep them quiet so the design stays clean. No heavy outlines |
| Board radius 8 px, coordinates (a to h, 1 to 8), Staunton-style SVG pieces | **Adopted** (version 1 had chunky shapeless pieces and no coordinates) |
| Landing: knight logo, name, tagline, Get Started | **Adapted** to a placeholder character icon and an "Enter game" button. **Dropped:** the knight logo, app name, tagline, "Sign In" link, and the extra description line (no accounts) |
| Home dashboard (Play Puzzle, Daily Challenge, Practice, Analysis, progress) | **Deferred.** Phase 1 goes Landing to New game to Game |
| Bottom navigation (Home, Puzzles, Learn, Profile) and side drawer (sidebar) | **Deferred** (those destinations do not exist yet) |
| Puzzle screen layout | **Adopted as the Game screen**, with puzzle-specific parts replaced (see section 6.3) |
| Commentary bubble with a person avatar | **Adopted, with the animal opponent in the avatar slot.** The bubble shows the move grade and the opponent's trash talk |
| Undo, Redo, Reset toolbar | **Adopted** (phase 1) |
| Hint card (mint) | **Adopted** |
| Win Chance card (blue, percentage, progress bar) | **Adopted** |
| Hint panel with "Play Nf7+" and "Dismiss" | **Adopted** as a bottom sheet (section 6.4) |
| Win screen (trophy, "You Win!", mint button) and Loss screen (toppled king, "You Loss!") | **Adopted**, with a "Game summary" card replacing "Final Win Chance" (section 6.5) |
| "Next Puzzle" and "View Solution" buttons | Replaced by "Play again" and "Home". "Review game" comes later with analysis |
| Puzzle library, thumbnails, filters | **Deferred** |
| Solution / move analysis screen | **Deferred** |
| Profile, win rate, streaks, performance chart, badges | **Deferred** (could be local-only stats from IndexedDB later) |
| Settings screen (Appearance, Sound & Haptics, Gameplay, About) | **Deferred.** No Settings page in phase 1. Hints and last-move highlight are always on, and difficulty is chosen in the New game sheet |
| Next.js style `app/` folder structure | **Adapted** to Vite + React Router (section 4) |
| Optional packages: framer-motion, recharts, next-themes, dnd-kit | Use Motion (the current name of framer-motion). Skip recharts, next-themes, and dnd-kit for now |

---

## 3. Tech stack

| Area | Choice | Notes |
|---|---|---|
| Language | TypeScript | Strict mode on |
| Build | Vite + React | Static output, ideal for PWA |
| Routing | React Router | Two routes: `/` (Landing) and `/play` (Game). Gives proper back-button behavior on phones |
| Styling | Tailwind CSS 4 + CSS variables | Theme setup as in spec section 8 |
| Components | shadcn/ui | See component list below |
| Icons | lucide-react | `strokeWidth={1.8}`, sizes from spec section 6. Custom SVG for the pieces, trophy, and toppled king. The opponent faces are WebP sprites |
| Rules | chess.js | Move validation, FEN, check, mate, draws |
| Engine | Stockfish WASM (npm `stockfish`) | Single-threaded lite build in a Web Worker |
| Animation | Motion (`motion/react`) | Pieces, sheets, result screens |
| State | Zustand | One game store |
| Storage | IndexedDB via `idb-keyval` | Current battle. Last chosen difficulty in `localStorage` |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest, service worker, precache |
| Fonts | `@fontsource-variable/inter` | Bundled locally so it works offline |
| Tests | Vitest | Pure logic: win %, grading, accuracy, piece tracking |
| Hosting | Cloudflare Pages, Vercel, or Netlify | Any static host with HTTPS |

shadcn components to add for phase 1:

```bash
npx shadcn@latest add button card badge dialog dropdown-menu progress sheet toggle-group tooltip separator sonner skeleton
```

(`tabs`, `avatar`, `switch`, and the profile and puzzle-related parts of the spec list are not needed yet.)

Use the single-threaded Stockfish build. The multi-threaded build needs `SharedArrayBuffer`, which requires special cross-origin headers (COOP and COEP) that complicate hosting. Single-threaded is plenty strong for this app.

---

## 4. Architecture and folder structure

```
┌──────────────────────────── React UI ────────────────────────────┐
│ Landing  →  New game sheet  →  Game                              │
│ Game: header · opponent bubble · board · toolbar · cards         │
│       hint sheet · result screen (win / loss / draw)             │
└───────────────┬───────────────────────────────┬──────────────────┘
                │ Zustand stores                │ Motion animations
                ▼
        game logic (chess.js) ◄──► engine service ◄──► Web Worker (Stockfish WASM)
                │
                ▼
        persistence (IndexedDB battle + localStorage difficulty)
```

Rules of thumb:
- **chess.js is the source of truth for the position.** The UI only renders it.
- **Only one place talks to the engine** (`engine/engine-service.ts`). Components never touch the worker.
- **Grading, win % and accuracy are pure functions** (no React, no worker), so they are easy to test.
- **Keep chess tokens separate from shadcn tokens** (as the spec recommends), so a future light theme cannot change board state colors by accident.

```
src/
  main.tsx
  App.tsx                         // router
  constants.ts                    // APP_NAME, defaults
  styles/globals.css              // Tailwind, tokens, Inter import
  screens/
    landing.tsx
    game.tsx
  components/
    ui/                           // shadcn generated
    layout/
      app-shell.tsx               // safe-area, max width, background
      app-header.tsx              // back arrow, title, overflow menu
    chess/
      chessboard.tsx
      chess-square.tsx
      chess-piece.tsx             // animated wrapper
      pieces/                     // king.tsx, queen.tsx, rook.tsx, bishop.tsx, knight.tsx, pawn.tsx
      board-coordinates.tsx
      move-toolbar.tsx            // undo, redo, reset
      move-commentary.tsx         // avatar + bubble (grade headline + trash talk)
      hint-card.tsx
      win-chance-card.tsx
      hint-sheet.tsx
      new-game-sheet.tsx
    opponent/
      frog.tsx                    // SVG with moods
    result/
      win-screen.tsx
      loss-screen.tsx
      draw-screen.tsx
      game-summary-card.tsx
      particles.tsx
  hooks/
    use-chess-game.ts
    use-board-pieces.ts           // piece identity across moves
    use-reduced-motion.ts
  engine/
    engine-service.ts             // promise-based wrapper over UCI
    uci.ts                        // parse info and bestmove lines
  logic/
    win-percent.ts
    grade-move.ts
    accuracy.ts
    hint-text.ts                  // short natural-language hint from move flags
    trash-talk.ts
    difficulty.ts
  store/
    game-store.ts
  storage/
    battle-storage.ts
  lib/utils.ts
public/
  engine/                         // stockfish .js and .wasm
  icons/                          // PWA icons
docs/
  chessmate-ui-design-spec.md
```

---

## 5. Design system

Use the spec's tokens exactly. Quick reference:

| Role | Token | Hex |
|---|---|---|
| App background | `--app-bg` | `#061824` |
| Cards, navigation | `--surface-1` | `#091F2D` |
| Nested cards, dialogs | `--surface-2` | `#0D2939` |
| Inactive controls | `--surface-3` | `#15364A` |
| Primary (buttons, win chance card) | `--blue` | `#9FD4FF` |
| Success, hint, positive | `--mint` | `#79F2C6` |
| Last move, rewards | `--yellow` | `#FFE29A` |
| Optional accent | `--lavender` | `#C5B8FF` |
| Errors, mistakes, loss | `--coral` | `#FF8F93` |
| Primary text | `--text-primary` | `#EAF5FF` |
| Secondary text | `--text-secondary` | `#A8C4D8` |
| Borders | `--border-default` | `#214C65` |

Board tokens (kept separate from shadcn tokens): light square `#D2E9FF`, dark square `#82B9E9`, selected `#FFE29A`, last move `#B8F3D9`, legal move dot `#248C73` at 65 to 75% opacity, check `#FF8F93`.

Other rules from the spec worth remembering:
- **Typography:** Inter. Display 32 px, page heading 24 px, card heading 16 px, body 14 px, label 12 px, tiny 10 to 11 px. Sentence case.
- **Spacing:** multiples of 4 px. Page padding 16 to 24 px, card padding 16 px, card gap 12 px.
- **Radius:** inputs and chips 8 px, standard 12 px, cards 14 to 16 px, panels 20 to 24 px, board 8 px, pills fully round.
- **Buttons:** 44 to 48 px tall. Primary is blue, "positive" actions are mint, secondary is outlined with a 1 px `#214C65` border.
- **Cards:** `#091F2D`, 1 px `#214C65` border, 14 to 16 px radius. Interactive cards get a 150 ms transition and a visible focus ring.
- **Shadows:** subtle. The design relies on contrast and thin outlines.
- **Accent proportions:** about 70% dark surfaces, 20% blue, 10% mint, yellow, and coral. Do not use every accent at once.

Set up the theme once (Tailwind 4 `@theme`/CSS variables mapped to shadcn semantic tokens as in spec section 8), then override shadcn variants instead of styling each screen by hand.

### Grade colors and icons

Grades must never rely on color alone, so each one has a color, an icon, and a label. The palette only has four feedback colors, so some grades share a color and differ by icon and intensity.

| Grade | Headline (player's move) | Color | Lucide icon (check exact names in your version) |
|---|---|---|---|
| Best | "Best move!" | mint | `Star` |
| Great | "Great move!" | mint | `ThumbsUp` |
| Good | "Nice move!" | blue | `Check` |
| Inaccuracy | "A bit shaky" | yellow | `CircleAlert` |
| Mistake | "Mistake" | coral (outline style) | `X` |
| Blunder | "Blunder!" | coral (solid) | `TriangleAlert` |

### Phase 1 icon map

| Use | Icon |
|---|---|
| Pieces, trophy, toppled king | Custom SVG |
| Opponent faces (frog and cat, six moods each) | WebP sprites cut from the emote sheet by `scripts/extract-opponent-sprites.mjs` |
| Back | `ArrowLeft` |
| Overflow menu | `EllipsisVertical` |
| Undo, Redo, Restart | `Undo2`, `Redo2`, `RefreshCw` |
| Hint | `Lightbulb` |
| Win chance | `ChartNoAxesColumnIncreasing` |
| Win result | `Trophy` |
| Close | `X` |

---

## 6. Screens (phase 1)

Assume a mobile viewport near 390 × 844 CSS px, and adapt to real safe areas. Cap the content width at about 430 px and center it on larger screens (a wider two-column layout is a later enhancement, see spec section 11).

### 6.1 Landing

- Full-height `#061824`, optional faint geometric shapes in muted blue
- Placeholder character icon (a human outline, about 112 px) until the final art is added. No app name or tagline
- Primary **Enter game** button near the bottom (blue). It opens Home, and Landing is the first screen on every app open
- Resume battle lives on Home, not on Landing
- Starts downloading and initializing the engine in the background (see section 9)

### 6.2 New game sheet

A small bottom `Sheet` opened by New game on Home (or in the game menu). It is part of the Landing and Game pages, not a separate page, and it is the only place difficulty is chosen because there is no Settings page. To cut scope further, drop it and default to Medium. It contains:
- Difficulty `ToggleGroup`: Easy, Medium, Hard, each with its engine strength (10%, 50%, 100%)
- Play button (mint)
- Remembers the last chosen difficulty

### 6.3 Game screen

```
[←]      vs Frog (Medium)      [⋮]
(frog) ┌────────────────────────────┐
       │ Nice move!                 │
       │ "Hm. You've done this      │
       │  before."                  │
       └────────────────────────────┘
┌──────────────────────────────────┐
8│  board with coordinates         │
 │                                  │
1│                                  │
  a b c d e f g h
[ Undo ] [ Redo ] [ Reset ]
[ Hint card (mint) ] [ Win chance 72% (blue) ]
```

- **Header:** back arrow (returns to Landing, the battle stays saved), title, overflow menu (New game, Resign)
- **Commentary:** frog avatar plus bubble. The bubble's headline is the grade of your last move (with its icon). The body is the frog's trash talk. Before the first move it shows the opening line.
- **Board:** coordinates, selected square, legal move dots, last move highlight, check indicator (see section 7)
- **Toolbar:** Undo, Redo, Reset. Disabled states are clearly dimmed (opacity about 0.45)
- **Hint card:** mint. Opens the hint sheet
- **Win chance card:** blue. Percentage (24 to 28 px, bold), progress bar, and a small trend arrow showing whether your last move raised or lowered it. A small tooltip says "Estimated from the engine's evaluation". The spec asks for this honesty: it is a modeled estimate, not a true probability.
- While the opponent thinks: the board input is locked, the frog shows its "thinking" mood, and the toolbar and Hint are disabled.

### 6.4 Hint sheet

Bottom `Sheet` (matches the design's hint panel):
- Lightbulb icon, "Hint" heading
- "The best move is **Nf3**" (in SAN)
- One short explanation generated from the move's chess.js flags in `hint-text.ts`, for example "This gives check", "This captures a knight", "This castles your king to safety". If nothing special applies, use "This improves your position".
- **Play Nf3** (mint) plays the move, and **Dismiss**
- The suggested from and to squares also get a soft pulsing highlight on the board while the sheet or hint is active

Optional (later): a two-step hint that first shows only the piece to move, then the destination.

### 6.5 Result screens (win, loss, draw)

Dedicated full-screen states, not toasts. They appear after checkmate, stalemate, draw, or resignation. The dark background stays.

| | Win | Loss | Draw |
|---|---|---|---|
| Illustration | Trophy with mint particles | Toppled king with X eyes, restrained coral accents | Two kings or an equal sign |
| Heading | "You Win!" | "You Loss" | "It's a Draw" |
| Message | Short, positive | Short, encouraging, never punishing | Short, neutral |
| Primary button | **Play again** (mint) | **Try again** (blue) | **Play again** (blue) |
| Secondary button | Home (outlined) | Home (outlined) | Home (outlined) |

**Game summary card** (replaces the puzzle app's "Final Win Chance", since a finished game's win chance is just 100% or 0%):
- **Accuracy** percentage with a progress bar (section 11)
- Small counts: moves played, best moves, mistakes, blunders (each with its icon)

Animation (from the spec): 350 to 650 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`, trophy scales 0.75 to 1, the progress bar fills over 600 to 900 ms, particles are subtle and limited to about 30 to 60. Do not delay the buttons. Respect `prefers-reduced-motion` (simple fade and a static illustration).

A small frog cameo (happy on a loss, sad on a win) is a nice optional touch.


---

## 7. Chess pieces and board

### Pieces

- **Staunton-style SVG pieces** with transparent backgrounds, as the spec recommends. Piece size is about 72 to 82% of the square.
- Draw or source six shapes (King, Queen, Rook, Bishop, Knight, Pawn) and color them with CSS variables so one shape serves both sides:
  - Player (white): fill `#FFFFFF`, outline deep navy (about 1.5 px)
  - Opponent (black): fill deep navy (about `#0B2A3D`) with light inner details
- **Contrast matters:** white pieces on the light squares (`#D2E9FF`) are low contrast, so the navy outline on white pieces is required, not optional. Check both piece colors on both square colors.
- If you use an existing open-source piece set instead of drawing your own, **check its license** first. Several popular sets use GPL-style licenses that can affect how you distribute your app.
- Memoize pieces (`React.memo`). Do not use Unicode chess glyphs in production, because they render differently on every device.

### Board

- 8 × 8 grid, square container (`aspect-ratio: 1`), radius 8 px, 1 px border. Coordinates (a to h, 1 to 8) at 10 to 11 px in muted navy.
- At 390 px wide with 16 px page padding, each square is about 44 px, which is the minimum comfortable touch target. Do not shrink the board further to fit other content. Move content below instead.
- Non-color indicators are required (spec section 12):
  - Selected: yellow tint plus the piece lifts slightly
  - Legal move: dot (ring on capture targets)
  - Last move: mint tint on both squares
  - Check: coral tint on the king's square plus a small pulse or ring
- Input is tap-to-select then tap-to-move first. Drag-and-drop is a later upgrade.
- The turn and game status are announced to screen readers through an `aria-live` region.

---

## 8. Board animation

### Piece identity

chess.js does not give pieces IDs, but smooth animation needs them. Keep your own list:

```ts
type PieceState = { id: string; type: 'p'|'n'|'b'|'r'|'q'|'k'; color: 'w'|'b'; square: string | null };
```

When a move is applied (use `from`, `to`, `flags`, `captured`, `promotion` from the chess.js move result):
1. Find the piece on `from` and set its `square` to `to`.
2. If `captured`: set that piece's `square` to `null` (it fades and shrinks out). For en passant (`flags` includes `e`), the captured pawn is on the file of `to` but the rank of `from`.
3. If castling (`flags` includes `k` or `q`): also move the rook.
4. If promotion: change the piece's `type`.

Write unit tests for castling, en passant, and promotion. Those are where animation bugs hide.

### Rendering

- Pieces are absolutely positioned layers above the squares, each 12.5% wide and tall.
- Animate with Motion using percentage transforms: `x: file * 100 + '%'`, `y: rank * 100 + '%'`. Percentages are relative to the piece's own size, so it works at any board size.
- Use a spring transition (for example stiffness about 400, damping about 32). Raise the z-index of the moving piece so it passes over others.
- Captured pieces scale to 0 and fade out. A small particle puff is optional.
- Player and opponent moves use the same animation path.
- Undo and redo animate the pieces back (restore piece identities from the move list).
- Promotion is auto-queen in phase 1. A picker comes later.

---

## 9. Engine (Stockfish)

### Setup

- Install the `stockfish` package and copy the **lite, single-threaded** `.js` and `.wasm` files into `public/engine/` (check the file names in the version you install).
- Create the worker with `new Worker('/engine/<file>.js')` and talk to it with UCI strings through `postMessage`.
- **Lazy-load:** start downloading and initializing the engine when the landing page is idle or when Start is tapped, not on first paint.

### UCI commands used

```
uci
isready
setoption name UCI_LimitStrength value true|false
setoption name UCI_Elo value 1500
setoption name Skill Level value 5
position fen <FEN>
go movetime 300          (or: go depth 12)
stop
```

Parse the output:
- `info depth 12 ... score cp 34 ...` or `score mate 3` (keep the last one before `bestmove`)
- `bestmove e2e4 ponder e7e5`

### Engine service API

A small promise-based API with a request queue (the worker handles one search at a time):

```ts
engine.init(): Promise<void>
engine.analyze(fen, { movetime }): Promise<{ cp: number | null; mate: number | null; best: string }>   // full strength
engine.play(fen, difficulty): Promise<string>                                                        // limited strength move
engine.stop(): void
```

### Two roles, one worker

The opponent is weakened on purpose, but analysis (hints, win %, grading) must run at full strength. With one worker, set the options before each job:

- **Analyze:** `UCI_LimitStrength false`, `go movetime 250` (or depth 12 to 14)
- **Play:** `UCI_LimitStrength true`, `UCI_Elo` or `Skill Level` per difficulty, then `go`

If that is slow or messy, use two workers. It costs more memory, so measure on a mid-range phone first.

### Difficulty levels (starting values, tune by feel)

| Level | Frog name idea | Settings |
|---|---|---|
| Easy | Sleepy | `Skill Level` about 3, low depth |
| Medium | Regular | `UCI_Elo` about 1500 |
| Hard | Big brain | `UCI_Elo` about 2000, or full strength |

Stockfish has a minimum `UCI_Elo` (about 1320 in recent versions). For anything weaker, use `Skill Level` plus a depth limit.

### Making the opponent feel human

- Add a minimum "thinking" delay (about 600 to 900 ms) even if the engine answers instantly.
- Show the frog's thinking mood during the wait.
- Never block the UI thread. All engine work stays in the worker.
- Undo, reset, and leaving the screen call `engine.stop()` so a stale result never lands on a new position.

---

## 10. Win percentage

Stockfish reports a score in centipawns (cp) from the side to move's point of view, or a mate distance. Normalize it to the player's point of view, then convert it.

```ts
// Lichess-style logistic curve
export const winPercent = (cp: number) =>
  50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
```

Rules:
- The score is for the side to move. If it is Black to move, negate it to get White's view. Flip again if the player is Black.
- Mate scores: mate for the player is 100%, mate against is 0%.
- Round to whole numbers for display.
- It means "how good is this position for you against strong play", not "will this person win". The tooltip on the Win chance card says so (spec section 5.6, product accuracy).

Reference values: 0 cp is 50%, +100 cp is about 59%, +300 cp is about 75%.

---

## 11. Move grading and accuracy

### Data flow per full turn

```
(1) After the opponent moves  → analyze(position) = evalBefore (player's POV) + best move   (also powers the Hint)
(2) Player moves              → analyze(position) = evalAfter  (player's POV)
(3) grade = f(winBefore − winAfter, playedMove === bestMove)
(4) Opponent plays (limited strength) → back to (1)
```

Each turn costs two short full-strength analyses plus one opponent search. With `movetime` about 250 ms each, this is fine on modern phones. Cache the result of step (1) so the Hint is instant. For the first move, analyze the start position when the game begins.

### Grade table (starting thresholds, tune later)

| Win % drop | Grade |
|---|---|
| Move equals engine best, or drop under 1 | Best |
| under 3 | Great |
| under 6 | Good |
| under 10 | Inaccuracy |
| under 20 | Mistake |
| 20 or more | Blunder |

Later ideas: Brilliant (a sacrifice that keeps the evaluation high), Book (opening moves).

### Accuracy (for the result screen)

Use a per-move accuracy from the win % drop, then average over the player's moves. A commonly used formula (from Lichess) is:

```ts
// winDiff = winBefore - winAfter, in percentage points (clamp at 0 or more)
const moveAccuracy = (winDiff: number) =>
  Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winDiff) - 3.1669));
```

Treat it as an approximation and verify the constants against the Lichess documentation before relying on it. Show the average as "Accuracy" on the Game summary card.

---

## 12. Opponent: frog, moods, trash talk

### Frog

- Custom SVG, shown in the commentary avatar slot. Suggested look: mint body (`#79F2C6`), pale belly, deep navy eyes and mouth, so it reads well on the dark background.
- Moods: idle, think, happy, sad, shock.
- This is the animal opponent from the original idea. The ChessMate mockup shows a person avatar there, so swap it back if you prefer.

### Trash talk (static bank for now)

Keep a bank per grade in `logic/trash-talk.ts`, pick one at random, and avoid repeating the last line. Keep it playful, never mean.

```ts
export const trashTalk = {
  best:        ["Hmph. Lucky guess.", "Okay, that was annoying.", "Ribbit... not bad."],
  great:       ["Hm. You've done this before.", "Don't get cocky."],
  good:        ["Fine. Acceptable.", "Keep up, hopper."],
  inaccuracy:  ["Hmm, are you sure about that?", "A little wobbly there."],
  mistake:     ["Such a beginner move.", "I'll take that, thanks.", "Oops. Was that on purpose?"],
  blunder:     ["Ha! Did you mean to do that?", "My grandmother plays better. She's a tadpole.", "Wow. Just wow."],
  opponentCaptures: ["Mine now!", "Gotcha!"],
  playerCaptures:   ["Hey! That was mine.", "Ouch."],
  playerChecks:     ["Eep!", "Hold on, hold on..."],
  opponentChecks:   ["Check!", "Watch your king."],
  hintUsed:         ["Need a little help? Cute.", "Peeking, are we?"],
  playerWins:       ["You got me. Ribbit...", "Rematch. Now."],
  playerLoses:      ["You Loss.", "Ribbit ribbit!"],
  gameStart:        ["Amaze me! If you can."],
  resume:           ["You're back. Let's finish this."]
};
```

In the bubble: the **headline** is the grade of your last move (with its icon, from the grade table), and the **body** is the frog's line. The frog's mood follows the event.

---

## 13. Saving the current battle

### Battle (IndexedDB, key `battle:current`)

```ts
type SavedBattle = {
  version: 1;
  startFen: string;               // normally the standard start
  moves: {
    from: string; to: string; promotion?: string;
    san: string; by: 'player' | 'opponent';
    winAfter?: number;            // player's POV
    grade?: Grade;
  }[];
  playerColor: 'w' | 'b';
  difficulty: 'easy' | 'medium' | 'hard';
  startedAt: number;
  updatedAt: number;
};
```

Store the move list, not only the FEN. It rebuilds undo history, the last-move highlight, piece identities, and the grades for the result summary after a reload.

Rules:
- Autosave after every move (slightly debounced) and on `visibilitychange` when the tab is hidden.
- On launch, if a record exists, the landing page offers **Resume battle**. Starting a new game clears it.
- Delete the record when the game ends.
- The redo stack is not saved. After a reload, redo is empty.
- Call `navigator.storage.persist()` once so the browser is less likely to evict the data.
- Wrap storage calls in try/catch (private browsing can fail). Treat a corrupt or unknown-version record as "no save".
- Do not store engine state. Rebuild it from the position.

### Last difficulty (`localStorage`)

Store only the last chosen difficulty (`'easy' | 'medium' | 'hard'`, default `'medium'`) so the New game sheet pre-selects it. There is no Settings page in phase 1. Hints and last-move highlight are always on.

Not needed in phase 1: match history, stats, accounts.

---

## 14. Undo, redo, restart

- **Undo:** rewinds the opponent's last move and your last move, so it is your turn again. If the opponent is mid-search, call `engine.stop()` first, then rewind. Restore the card state (win %, grade, bubble) from the stored move data.
- **Redo:** reapplies undone moves from a redo stack. Any new move clears the redo stack.
- **Reset:** asks for confirmation in a `Dialog` if a game is in progress. It clears the saved battle, resets the engine state, and starts a new game at the same difficulty.
- **Resign** (overflow menu): ends the game as a loss and shows the loss screen.

---

## 15. PWA setup

### Manifest

```
name: "ChessMate"     short_name: "ChessMate"
display: "standalone"
orientation: "portrait"
start_url: "/"        scope: "/"
background_color / theme_color: #061824
icons: 192, 512, and a maskable 512 (knight on navy)
```

Also add the iOS bits in `index.html`: `apple-touch-icon`, `apple-mobile-web-app-capable`, and a status bar style that suits the dark background. iOS does not fire `beforeinstallprompt`, so a small "Add to Home Screen" hint for iPhone users can come later.

### Service worker (vite-plugin-pwa)

- `registerType: 'autoUpdate'`, or `'prompt'` for a "New version available" toast.
- Precache all built assets: JS, CSS, fonts, and icons.
- **The Stockfish WASM is several MB.** Workbox's default precache limit is 2 MB per file, so raise `workbox.maximumFileSizeToCacheInBytes` (for example to 15 MB) and make sure `wasm` is included in `globPatterns`.
- SPA fallback to `index.html` for navigation (needed so the `/play` route still works on reload and when offline).
- Everything must be local: Inter, icons, and the engine. No CDN links.

### Test checklist

1. Build, then serve with `vite preview` (service workers need HTTPS or localhost).
2. Load once online, switch to airplane mode, hard reload. The game must start and the engine must respond.
3. Run a Lighthouse PWA audit.
4. Install on Android (Chrome) and iPhone (Safari, Add to Home Screen), then play a full game offline.
5. Ship an update and confirm the new version replaces the old one.

---

## 16. Deployment

- Build with `npm run build` to produce `dist/`.
- Host `dist/` on Cloudflare Pages, Vercel, or Netlify (all provide HTTPS, which PWAs require).
- Add an SPA fallback rule if your host needs one (the `/play` route must serve `index.html`).
- Make sure `.wasm` is served as `application/wasm` (most hosts do this by default).
- Cache headers: long-term cache for hashed assets, no-cache for `index.html` and the service worker file.

---

## 17. Quality targets and accessibility

- First load under about 2 s on a mid-range phone on 4G (the engine loads lazily)
- Piece animation holds 60 fps, and no engine call blocks the UI
- Works fully offline after the first load
- Touch targets about 44 px or more for primary controls
- Visible keyboard focus on all interactive elements, `aria-label` on icon-only buttons
- Never use color alone for grades, selection, legal moves, check, win, or loss (see section 5 and section 7)
- Dialogs and sheets manage focus and can be dismissed with Escape or the close button
- An `aria-live` region announces whose turn it is, the frog's line, and the result
- Respect `prefers-reduced-motion` for piece movement, sheets, and result screens
- Passes a Lighthouse PWA audit

---

## 18. Known risks and decisions to revisit

| Risk | Mitigation |
|---|---|
| Large WASM size slows first load | Lazy-load, precache, show a small loading state on the frog |
| Piece tracking bugs (castling, en passant, promotion, undo) | Unit tests, replay known PGNs |
| Limited-strength engine plays oddly strong or weak | Tune per level by playtesting, maybe add small move randomness |
| Analysis lag on older phones | Lower `movetime`, reuse the previous analysis |
| White pieces hard to see on light squares | Navy outline on white pieces, check contrast on both square colors |
| Only four feedback colors for six grades | Icon plus label plus intensity, never color alone |
| iOS may evict storage | `navigator.storage.persist()`, and treat saves as best-effort |
| Win % misunderstood by new players | Tooltip on the card ("Estimated from the engine's evaluation") |
| Design shows an account-based puzzle app | Phase 1 scope table in section 2 keeps the work focused |

---

## 19. Later phases (from your design)

| Feature | Notes |
|---|---|
| Settings page (difficulty, show hints, highlight last move, appearance) | Uses shadcn `Switch` and `ToggleGroup`. Settings would then persist in `localStorage` through a small store |
| Sound effects and haptics | Toggles go in Settings. The Vibration API works on Android but not in iOS Safari |
| Sidebar / side drawer and bottom navigation | Add once there is more than one destination |
| Home dashboard | Add with the navigation above |
| Puzzles, daily challenge, difficulty filters, thumbnails | Needs a puzzle dataset. Check the license of any dataset you use (the Lichess puzzle database is openly licensed, but verify). Stockfish can verify solutions |
| Game analysis and "Review game" / solution view | Reuses the stored grades and win % per move |
| Profile, win rate, streaks, performance chart, badges | Can be fully local (IndexedDB) to stay offline-first. Accounts and Sign In only if you later add a backend |
| Appearance settings (Light, System) and board or piece themes | Possible because chess tokens are separate from shadcn tokens |
| More animal opponents with their own personalities | Possibly Maia-style human-like play. Different palettes and trash talk per animal |
| LLM-generated trash talk | Needs a network, so keep the static bank as the offline fallback |
| Promotion picker, drag-and-drop | Incremental |
| Desktop two-column layout (board plus move history and analysis) | Spec section 11 |

---

## 20. Running and deploying

```bash
npm install
npm run dev        # development server
npm test           # unit tests (Vitest)
npm run build      # type-check + production build to dist/ (includes the service worker)
npm run preview    # serve dist/ on localhost to test the PWA and offline mode
npm run icons      # regenerate PWA icons in public/icons (uses sharp)
```

Deploy `dist/` to Cloudflare Pages or Netlify (build command `npm run build`, output `dist`). `public/_headers` sets `application/wasm`, long-term caching for hashed assets, and no-cache for `index.html` and the service worker. `public/_redirects` serves `index.html` for `/play`. On Vercel, add an equivalent rewrite and headers in `vercel.json`.

The engine files in `public/engine/` are Stockfish.js 19 (lite, single-threaded), licensed GPLv3 (`public/engine/COPYING-stockfish.txt`). Distributing the app with it means complying with the GPL.
