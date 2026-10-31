# ChessMate: Phase 2 Build Plan

Goal: take the MVP (Landing, New game sheet, Game page, hint, win %, grading, result screens, autosave, PWA) and make it feel like a **complete, local-only chess app**, following the ChessMate mockup.

**Stays local and offline.** No accounts, no multiplayer, no online matches, no Daily Challenge.

---

## 1. What we are adding

| # | Feature | Source |
|---|---|---|
| 1 | Promotion picker | Chess basics gap |
| 2 | Captured pieces panel (piece type and count) | Fills the empty space under the game cards |
| 3 | Light mode, with a **theme-linked opponent** (dark = frog, light = chicken). The theme is locked while a battle is in progress, and puzzles and lessons use the locked theme too | Mockup Settings, your direction |
| 4 | Settings page (including sound and haptics) | Mockup |
| 5 | Clear memory / data controls | Earlier request |
| 6 | Help & Support | Mockup drawer item |
| 7 | Game history and per-move analysis data | Needed by review, profile |
| 8 | Game review (View Solution and Analysis) | Mockup |
| 9 | Home dashboard and bottom navigation | Mockup |
| 10 | Profile (stats, history, badges) | Mockup |
| 11 | Puzzles (no Daily Challenge) | Mockup |
| 12 | Learn | Mockup |

**Not in scope:** Daily Challenge, sign in or accounts, sidebar drawer, multiplayer, online play, cloud sync, "Play from here" (backlog), XP and levels (backlog), manual opponent override.

---

## 2. Decisions (confirmed)

All decisions below are confirmed and shape the plan. Changing them later costs more.

| # | Decision | Why |
|---|---|---|
| D1 | **Theme decides the opponent.** Dark = frog, Light = chicken. System theme follows the device. | Your direction. Needs an `opponent` abstraction (section 4.4). |
| D2 | **The theme is locked while a battle is in progress.** The theme can only be changed in Settings, and that control is disabled while an unfinished battle exists (running or saved). The Game page has no theme control. If the device flips between dark and light (System theme) during a battle, the app keeps the battle's theme until the battle ends. **Each opponent has its own word bank**, so the frog and chicken each keep their own voice. | The animal always matches the theme, so there is no mixed state to design for. |
| D3 | **Landing is shown on first launch only.** Start goes to Home. After that the app opens on Home. A saved battle appears as a "Resume battle" card on Home. **Landing has no resume button.** | The Home dashboard replaces Landing as the daily entry point. |
| D4 | **No sidebar.** Navigation is the bottom bar (Home, Puzzles, Learn, Profile). Settings is a gear on Home and Profile. Help & Support lives inside Settings. | Matches your scope. |
| D5 | **A puzzle is lost on the first wrong move** (like the mockup's win and loss screens). Retry is unlimited, but only a clean solve counts as "solved on first try". | Simple and matches the mockup. |
| D6 | **"Day streak" = consecutive days with at least one finished game, puzzle, or lesson.** Uses the device's local date. | Daily Challenge is gone, so streak needs a new definition. |
| D7 | **Profile has an editable local display name** (default "Player"). | The mockup shows a name, but there are no accounts. |
| D8 | **Chicken difficulty names:** Chick (Easy), Hen (Medium), Rooster (Hard). Frog keeps Sleepy, Regular, Big brain. | Cute, and each animal gets its own voice. |
| D9 | **Backup and restore (export or import a JSON file) is included in M23.** | iOS can evict local storage. |
| D10 | **Level and XP are out of v1.** They move to the backlog. | Not in your list. |

### Other decisions (confirmed)

| Topic | Decision |
|---|---|
| Storage | Accepted as written in section 4.2 (`idb-keyval` for the current battle, IndexedDB `chessmate` for history, `localStorage` for settings). |
| Opponent override | No manual override. The theme decides the animal. |
| Theme lock scope | Locked everywhere. Puzzles and lessons also use the battle's theme while a battle exists. |
| History cap | No automatic deletion. Settings shows storage usage, and the user deletes games manually. |
| Analyze fallback for old games | Included in M26. |
| "Play from here" | Deferred to the backlog. |
| Learn v1 scope | Ship 10 lessons first (listed in M30). The rest go to the backlog. |
| Puzzle data | Lichess puzzle database, released under CC0 and free to redistribute. Target 500 to 700 per rating bucket. |
| Sound | Effects from a CC0 sound pack, precached. |
| Board and light palette | Warm cream and orange tones taken from the mockup, not the blue palette. |
| Report a problem | Your personal email and LinkedIn profile, set in one config constant. No contact form and no mail sender. |
| Hosting | **My pick: Netlify.** The existing `_headers` and `_redirects` files use Netlify's format. Confirm before M32. |

---

## 3. Baseline (what the plan assumes already works)

Landing, New game sheet (difficulty and color), Game page with animated board, Stockfish engine in a worker, hint sheet, win % and grading, commentary bubble, undo, redo and reset, result screens, autosave and resume of the current battle, PWA with offline engine.

If anything here is not true in your build, fix it first (especially the engine's stale-result handling and resume after reload).

---

## 4. Architecture changes

### 4.1 Routes and layout

```
/                    Landing (first launch only)
/home                Home dashboard            [tab]
/puzzles             Puzzle list               [tab]
/learn               Learn tracks              [tab]
/profile             Profile and stats         [tab]
/play                Game
/review/:gameId      Game review
/puzzle/:puzzleId    Puzzle play
/lesson/:lessonId    Lesson player
/settings            Settings
/help                Help & Support
```

- A `TabLayout` wraps the four tab routes and renders the bottom navigation. Full-screen flows (Game, Review, Puzzle play, Lesson, Settings, Help) hide it.
- Lazy-load every route with `React.lazy`. Keep the entry chunk small (target under about 250 KB gzipped). The service worker precaches all chunks so everything still works offline.

### 4.2 Storage

| What | Where | Why |
|---|---|---|
| Current battle (`battle:current`) | IndexedDB (existing `idb-keyval`) | Keep as is. No migration risk |
| Game history, puzzle progress, lesson progress, badges, profile, activity days | New IndexedDB database via the `idb` library, with versioned migrations | Needs indexes and many records |
| Settings (theme, sound, haptics, hints, highlight, defaults) | `localStorage` via Zustand `persist` | Read synchronously at boot so the theme has no flash |

New database `chessmate`, version 1:

| Store | Key | Index |
|---|---|---|
| `games` | `id` | `endedAt` |
| `puzzles` | `id` | `status` |
| `lessons` | `lessonId` | none |
| `meta` | `key` | none (profile, activityDays, badges, flags such as `hasSeenWelcome`, `schemaVersion`) |

Rules:
- Every write goes through a small storage module with try/catch. A failure must never crash the app.
- Migrations are numbered functions run on open. Write a unit test for each.
- Estimate: a 80-move game is roughly 5 KB, so 1,000 games is about 5 MB. No automatic deletion. Settings shows storage usage, and the user deletes old games manually.

### 4.3 Data models

```ts
type Grade = 'best'|'great'|'good'|'inaccuracy'|'mistake'|'blunder';
type OpponentId = 'frog' | 'chicken';

type Ply = {
  uci: string; san: string; by: 'player' | 'opponent';
  cp?: number; mate?: number;          // evaluation AFTER this move, player's point of view
  winAfter?: number;                   // 0 to 100, player's point of view
  grade?: Grade;                       // player plies only
  bestBefore?: string;                 // engine's best move (UCI) before this ply, player plies only
};

type GameRecord = {
  id: string; startedAt: number; endedAt: number;
  result: 'win' | 'loss' | 'draw';
  reason: 'checkmate'|'resign'|'stalemate'|'insufficient'|'threefold'|'fifty';
  playerColor: 'w' | 'b'; difficulty: 'easy'|'medium'|'hard'; opponent: OpponentId;
  startFen: string; moves: Ply[];
  accuracy: number; gradeCounts: Record<Grade, number>;
  analyzed: boolean;                   // false if any ply is missing an evaluation
};

type PuzzleProgress = {
  id: string; status: 'solved' | 'failed'; attempts: number;
  firstTrySolved: boolean; usedHint: boolean; solvedAt?: number; timeMs?: number;
};

type LessonProgress = { lessonId: string; stepsDone: number; completedAt?: number };
type Settings = {
  theme: 'dark'|'light'|'system'; sound: boolean; haptics: boolean;
  showHints: boolean; highlightLastMove: boolean;
  defaultDifficulty: 'easy'|'medium'|'hard'; defaultColor: 'w'|'b'|'random';
};
```

Every ply already gets an engine evaluation during live play (once after each opponent move and once after each player move). Phase 2 only needs to **save** those values. No extra engine work.

The saved battle record (`battle:current`) gains two fields: `opponent: OpponentId` and `theme: 'dark' | 'light'` (the resolved theme when the battle started). Saves from the MVP have neither, so treat missing values as `frog` and `dark`.

### 4.4 Opponent abstraction

```ts
type Opponent = {
  id: OpponentId; name: string;
  difficultyNames: Record<'easy'|'medium'|'hard', string>;
  Avatar: React.FC<{ mood: Mood; size?: number }>;
  lines: TrashTalkBank;                // own word bank per opponent (D2)
};
const opponentForTheme = (resolved: 'dark'|'light'): OpponentId =>
  resolved === 'dark' ? 'frog' : 'chicken';
```

Every place that mentions the frog (header title, commentary avatar, New game sheet faces, result screens, empty states, trash talk) reads from the active game's opponent instead of hardcoding the frog.

**Effective theme (theme lock).** The app does not render `settings.theme` directly. It renders an *effective* theme:

```ts
const effectiveTheme = savedBattle ? savedBattle.theme : resolve(settings.theme); // resolve('system') reads the device
const opponentId = opponentForTheme(effectiveTheme);
```

While an unfinished battle exists, the whole app stays in that battle's theme, whatever the device or Settings say. A change that arrives during that time (for example the device switching to light mode) is kept as *pending* and applied after the battle ends and the result screen is closed. Puzzles and lessons follow the same lock: while a battle exists, they use the battle's theme and animal. Without a battle, they use the current theme's animal.

### 4.5 Shared board capabilities (built once, used everywhere)

The board is reused by Game, Review, Puzzles, Learn, and Home previews. Extend it with:

| Prop | Used by |
|---|---|
| `readOnly` | Review, Learn demos, mini previews |
| `orientation` (`'w'` or `'b'`) | Play as Black, puzzles |
| `highlights` (square tints) | Hint, lessons, review |
| `arrows` (from, to, color) | Review "best move", puzzle solution, lessons |
| `onMoveAttempt(from, to)` returning allow, reject, or needs-promotion | Game, puzzles, lesson "try it" |
| `MiniBoard` (static SVG from FEN) | Puzzle list thumbnails, Home cards |

### 4.6 Proposed folder additions

```
src/
  screens/ home, puzzles, puzzle-play, learn, lesson, profile, review, settings, help
  components/
    nav/bottom-nav.tsx, tab-layout.tsx
    chess/promotion-picker.tsx, captured-panel.tsx, board-arrows.tsx, mini-board.tsx, eval-graph.tsx
    opponent/frog.tsx, chicken.tsx, opponents.ts
    profile/stat-ring.tsx, performance-bars.tsx, badge-grid.tsx, history-list.tsx
  content/learn/*.json
  data/puzzles/*.json            (generated)
  logic/ captured.ts, streak.ts, badges.ts, stats.ts, puzzle-flow.ts, hint-text.ts
  storage/ db.ts, games.ts, puzzles.ts, lessons.ts, meta.ts, migrations.ts
  store/ settings-store.ts, theme.ts
scripts/build-puzzles.ts
```

---

## 5. Milestones

Effort: **S** (about 1 to 2 days), **M** (3 to 5 days), **L** (1 to 2 weeks). Estimates assume one developer, and they are rough.

Every milestone must meet the common **Definition of done** in section 8.

---

### M18. Foundations (M)

Goal: the plumbing everything else depends on.

- [ ] Add the `idb` database, the storage module, and the migration runner (section 4.2)
- [ ] Add the settings store with `persist` and defaults (`theme: 'system'`, hints on, highlight on, sound and haptics off until M22)
- [ ] Add the `Opponent` abstraction and move all frog references into it (frog only for now)
- [ ] Add `opponent` and `theme` to the saved battle record, treating old saves as frog and dark
- [ ] Extend the board with `readOnly`, `orientation`, `highlights`, `arrows`, `onMoveAttempt`, plus `MiniBoard`
- [ ] Convert routes to the section 4.1 structure and lazy-load route chunks. The tab routes can show a placeholder until built
- [ ] Add Playwright smoke tests (open app, play a move, reload and resume)
- [ ] Add the `hasSeenWelcome` flag and the first-launch Landing redirect rule (D3)

Done when: the app behaves exactly as before, new routes exist as placeholders, and the migration runner has a passing test.

---

### M19. Promotion picker (S to M)

Goal: replace auto-queen with a real choice, including engine and puzzle promotions.

- [ ] When a tapped target has a promotion flag, do not commit the move. Open the picker
- [ ] Picker UI: a small popover anchored on the promotion square showing Queen, Knight, Rook, Bishop stacked toward the board center, with a dimmed scrim. Tapping outside cancels and keeps the pawn selected. Works when the board is flipped (Play as Black)
- [ ] Accessibility: `role="dialog"`, focus moves into the picker, Escape cancels, each button labelled "Promote to queen" and so on
- [ ] Engine moves: parse the 5th UCI character (`e7e8n`), so underpromotion works and is animated: the pawn moves, then morphs into the new piece with a short pop
- [ ] Piece tracking: keep the piece `id` and change its `type`. Undo and redo restore the pawn
- [ ] Hint sheet and trash talk handle promotion text ("Play e8=Q")
- [ ] Unit tests: all four promotions, capture-promotions, both colors, flipped board, undo, redo, resume from a saved game with a promotion

Done when: you can promote to every piece, the frog can underpromote on screen, and a game with a promotion resumes correctly.

---

### M20. Captured pieces panel (S)

Goal: use the empty space under the Hint and Win chance cards.

Design:
- A card titled "Captured" with two rows: **You** and **the opponent's name**
- Each row shows five piece icons (pawn, knight, bishop, rook, queen) with a count badge, for example pawn ×3. The pieces shown are the ones that player captured, drawn in the captured side's color
- Types with zero captures are dimmed (not hidden), so the layout never jumps
- A small material advantage chip (for example "+3") on the side that is ahead
- Count changes animate with a short pop

Tasks:
- [ ] `logic/captured.ts`: derive counts from the move history (`history({ verbose: true })`), so undo, redo, and resume work with no extra state
- [ ] Compute the material advantage from the **pieces on the board** (not captures), so promotions are counted correctly
- [ ] `captured-panel.tsx` using the card style from the design tokens
- [ ] Short screen-reader summary ("You captured 2 pawns and 1 knight")
- [ ] Verify the layout on small phones (360 px wide). If space is tight, shrink icons before adding scroll
- [ ] Unit tests: captures, en passant, promotion captures, undo, redo

Done when: counts are always correct after undo, redo, reset, and resume.

---

### M21. Theme system, light mode, and the chicken (M)

Goal: a full light theme and the theme-linked opponent.

Tokens (warm light palette, taken from the mockup's cream and orange. Validate each pair with a WCAG contrast checker before building on it):

| Role | Dark (existing) | Light (warm, proposed) |
|---|---|---|
| App background | `#061824` | `#FFF8F0` (warm cream) |
| Surface 1 (cards) | `#091F2D` | `#FFFFFF` |
| Surface 2 | `#0D2939` | `#FFF1E3` |
| Surface 3 | `#15364A` | `#FDE3C8` |
| Primary accent | `#9FD4FF` (blue) | orange around `#E8651E` for shapes and accents. Button fill around `#C2560F` with white text, to be checked for 4.5:1 |
| Mint (hint, success) | `#79F2C6` | light mint around `#CDF5E0` with dark text |
| Text primary | `#EAF5FF` | warm dark brown around `#2A2220` |
| Text secondary | `#A8C4D8` | around `#7A6A5E` (check on cream) |
| Border | `#214C65` | around `#F0DCC6` |
| Board light squares | (existing) | around `#FBE8CC` |
| Board dark squares | (existing) | around `#E9A866` |

Tasks:
- [ ] Add light tokens (app, shadcn, and chess tokens) under a `.light` scope or `[data-theme]`. Keep chess tokens separate
- [ ] Board and pieces in light mode: check both piece colors on both square colors. White pieces may need a stronger outline, and the black pieces may need their light inner details adjusted. Adjust the warm square colors if contrast fails
- [ ] Re-check every grade color and icon (mint, blue, yellow, coral) on the warm cream surfaces
- [ ] Prevent theme flash: an inline script in `index.html` reads the saved theme and sets the class before React loads. Follow the system setting for `system` and listen for changes
- [ ] Update `<meta name="theme-color">` when the theme changes. (The manifest color stays the dark value, which is fine.)
- [ ] Build `chicken.tsx` with the same five moods as the frog (idle, think, happy, sad, shock). Suggested look: white and warm yellow body, orange beak and comb, navy eyes
- [ ] Add the chicken's own word bank (section 7). Each opponent has its own bank, so the chicken never uses frog lines (D2)
- [ ] Apply D1: `opponentForTheme`, with the opponent saved on the game when it starts. The New game sheet shows the active theme's animal and its difficulty names (D8)
- [ ] Apply D2 (theme lock): compute the effective theme as in section 4.4, so the whole app uses the battle's theme while a battle exists
- [ ] Handle a device theme change during a battle (System theme): keep it pending and apply it when the battle ends
- [ ] Apply a pending theme only **after the result screen is closed** (not while the win or lose animation plays), with a short crossfade
- [ ] Old MVP saves (no `theme` field) resume as dark with the frog, even on a light-mode device
- [ ] Replace hardcoded frog art in result screens, empty states, Home, and Profile with the active animal
- [ ] Screenshot test both theme and animal combinations on every existing screen

Done when: switching theme in Settings restyles every screen with no flash, new games use the right animal, and while a battle exists the app stays in the battle's theme no matter what the device does.

---

### M22. Settings page (M)

Goal: the mockup's Settings screen, with working behavior.

Layout (follow the spec): back arrow, grouped sections with subtle dividers, shadcn `Switch` and `ToggleGroup`.

| Section | Controls | Behavior |
|---|---|---|
| Appearance | Theme: Dark, Light, System | Applies instantly. The opponent follows the theme. **Disabled while an unfinished battle exists**, with the note "Finish your current battle to change the theme" and two buttons: Resume battle and Clear battle (confirmation, same action as in M23) |
| Gameplay | Show hints, Highlight last move, Default difficulty, Default color (White, Black, Random) | Show hints off: Hint card is visibly disabled with a short reason. Defaults pre-select in the New game sheet |
| Sound & haptics | Move sound, Haptic feedback | See below |
| Data | Clear data (M23) | Rows added in M23, including storage usage |
| Help | Help & Support row (M24) | Navigates to `/help` |
| About | Version, credits link | Version from `package.json` |

Sound:
- [ ] Small effect set from a CC0 sound pack: move, capture, check, promotion, win, lose, hint. Keep the total under about 150 KB and precache them
- [ ] Audio must start from a user gesture on iOS, so unlock the audio context on the first tap
- [ ] Respect the toggle everywhere (game, puzzles, lessons)

Haptics:
- [ ] Use `navigator.vibrate` where available. It works on Android browsers but not in iOS Safari, so show the row as unavailable on iOS rather than a broken toggle
- [ ] Light pulse for moves, stronger for check and the result

Tasks: build the page, wire each setting to its behavior, add a Settings gear to Home and Profile (when they exist), and add tests for the settings store and the theme lock. Confirm the Game page has no Settings or theme control (its overflow menu stays New game and Resign).

Done when: every toggle changes real behavior and persists across reloads.

---

### M23. Clear memory and data controls (S to M)

Goal: let people manage local data safely.

Rows under **Data** in Settings, each opening a confirmation `Dialog` that states exactly what is deleted:

| Action | Deletes |
|---|---|
| Clear current battle | The saved game in progress. This also unlocks the theme setting |
| Clear game history and stats | `games`, activity days, badges |
| Clear puzzle progress | `puzzles` store |
| Clear learning progress | `lessons` store |
| Reset settings | Settings back to defaults. If a battle exists, the theme is left unchanged (theme lock) |
| Clear everything | All of the above, plus the profile name and caches (see below) |

Tasks:
- [ ] Storage module functions per action, with unit tests
- [ ] Destructive buttons in the coral style. "Clear everything" needs a second confirmation
- [ ] Storage usage readout using `navigator.storage.estimate()` (treat the numbers as approximate, since some browsers round or restrict them). This readout also serves the no-auto-deletion history rule (section 4.2)
- [ ] After "Clear everything", also clear the service worker caches and warn first: the engine and assets will need an internet connection to download again on next open
- [ ] Never clear data while a game or puzzle is running without ending it first
- [ ] **Included (D9):** export all data to a JSON file and import it back. Validate imported files (schema version and shape) and never trust them blindly. The backup does not include the current battle, and an import must not change the theme while a battle exists
- [ ] Toast confirmations (`sonner`)

Done when: each action removes exactly what it says, and the app keeps working afterward with empty states.

---

### M24. Help & Support (S)

Goal: a local, offline help page. There is no server, so "support" means self-help plus a way to report problems.

Sections:
- [ ] **Quick start:** three short cards (how to move, how to use hints, how to read win chance and grades)
- [ ] **FAQ (accordion):** ten or so questions. Suggested topics: what win chance means, how grading works, why the frog or chicken sometimes plays badly (difficulty), what happens offline, how to install the app (Android and iPhone steps), where data is stored, how to move a game to another device (using the backup in M23), why haptics may not work on iPhone, what "hint" does
- [ ] **Troubleshooting:** engine will not load (reload, check storage, clear cache), game not resuming, app not updating
- [ ] **About and credits:** app version, Stockfish, chess.js, the piece set, the Lichess puzzle data (CC0), the CC0 sound pack, and libraries, each with its license (check each license text and include what it requires)
- [ ] **Report a problem:** your personal email and LinkedIn profile, set in one config constant. No contact form and no mail sender. Include a **Copy diagnostics** button that copies app version, browser, engine status, and storage estimate (no personal data)

Done when: the page is fully readable offline and all links and the diagnostics button work.

---

### M25. Game history and analysis capture (M)

Goal: save every finished game with its data, ready for review and the profile.

- [ ] On game end (checkmate, resign, stalemate, draw), build a `GameRecord` from the move list and the stored evaluations and save it to `games`
- [ ] Persist per-ply `cp`, `mate`, `winAfter`, `grade`, and `bestBefore` during play (the data already exists in memory)
- [ ] Compute accuracy and grade counts once at save time
- [ ] Mark `analyzed: false` if any ply is missing an evaluation (for example a game finished from an old MVP save)
- [ ] Record the activity day for the streak (D6)
- [ ] Record resign and draw reasons correctly
- [ ] Make saving idempotent so a reload on the result screen cannot create a duplicate record
- [ ] History queries: latest N games, counts by result and difficulty, with unit tests
- [ ] Hook Result screens to show accuracy and grade counts from the saved record

Done when: finishing a game creates exactly one correct record, and querying history returns accurate stats.

---

### M26. Game review: View Solution and Analysis (L)

Goal: replay a finished game and understand where it turned.

Screen layout (top to bottom):
1. Header: back arrow, "Game review", opponent, result
2. Summary strip: accuracy, counts of best moves, mistakes, blunders
3. Read-only board with step controls (first, previous, next, last), auto-play, and a flip button
4. **Win chance graph** across all plies. Tapping jumps to that move. Highlight the biggest drops
5. **Move list** with grade icons (never color alone). Tapping jumps to that move
6. **Critical moments**: your largest win-percentage drops. For each, show the move you played, the engine's better move (an arrow on the board), and a one-line reason when available

Tasks:
- [ ] `review.tsx` using the read-only board, `arrows`, and `highlights`
- [ ] `eval-graph.tsx` as hand-drawn SVG (no chart library, to keep the bundle small), using grade-aware markers
- [ ] Rebuild positions by replaying `moves` from `startFen` (do not store a FEN per ply)
- [ ] **Analyze game** fallback: if `analyzed` is false, run the engine over the whole game in the background with a progress bar, then save the results. Cancelable
- [ ] Keyboard and screen-reader support for stepping through moves
- [ ] Entry points: Result screens ("Review game"), Profile history, Home "Analysis" card
- [ ] Tests: graph data, critical-moment selection, analyze-game fallback

Done when: any saved game can be replayed with a correct graph, arrows for better moves, and no engine work needed for already-analyzed games.

---

### M27. App shell: bottom navigation and Home dashboard (M)

Goal: tab navigation and the Home screen from the mockup.

Bottom navigation: Home, Puzzles, Learn, Profile, using the spec's navigation styling. Keep it visible only on tab routes. The active tab uses the theme's accent color (blue in dark, orange in light) plus a label (never color alone). It respects the iOS safe area. Android back from a tab root should behave sensibly.

Home layout:
- [ ] Header: greeting by time of day with the display name, day streak (flame), and a Settings gear
- [ ] **Hero card:** "Resume battle" (if a save exists) with a secondary "New game", otherwise "Play vs {animal}" opening the New game sheet
- [ ] **Puzzles card:** next puzzle, or "Pick a puzzle"
- [ ] **Learn card:** "Continue" the last lesson, or "Start learning"
- [ ] **Analysis card:** "Review your games" opens the latest game review or the history list
- [ ] **Recent progress:** win rate ring and puzzles solved
- [ ] Friendly empty states for a brand-new player
- [ ] Landing now ends in Home (D3). Landing has no resume button. Home handles resume

Done when: all four tabs navigate correctly, the nav hides on full-screen flows, and Home reflects real data.

---

### M28. Profile, stats, and badges (M)

Goal: the mockup's Profile screen, from local data.

- [ ] Header: animal avatar (follows theme), editable display name (D7), Settings gear
- [ ] **Win rate** ring with wins out of total, and the W / L / D record
- [ ] **Streaks:** current day streak and best win streak
- [ ] **Recent performance:** accuracy bars for the last 10 games (hand-drawn SVG). Tapping a bar opens that review
- [ ] **By difficulty:** wins and losses per level
- [ ] **Puzzle stats:** solved count and first-try rate
- [ ] **History list:** filter All, Wins, Losses, Draws. Each row shows date, result, difficulty, accuracy, and opens the review. Allow deleting a single game with a confirmation
- [ ] **Badges:** grid with locked and unlocked states and a toast on unlock

Starter badge set (rules are computed from stored data):

| Badge | Rule |
|---|---|
| First win | Win any game |
| Getting started | Finish 10 games |
| Giant slayer | Win on Hard |
| Clean game | Win with no mistakes or blunders |
| Comeback | Win after your win chance dropped below 20% at some point |
| Quick mate | Win in 25 moves or fewer |
| Streak 3 and Streak 7 | 3 or 7 day streak |
| Puzzle starter and Puzzle pro | Solve 10 and 100 puzzles |
| Graduate | Complete a full Learn track |

- [ ] `logic/stats.ts`, `streak.ts`, `badges.ts` as pure functions with unit tests (streak around midnight, timezone changes, empty history, ties)

Done when: with seeded fake data, every number and badge is correct, and with no data every section has a clear empty state.

---

### M29. Puzzles (L)

Goal: an offline puzzle trainer using a bundled puzzle set.

**Data source and license.** Use the Lichess puzzle database, released under CC0 and free to redistribute (confirmed). Credit Lichess in Help anyway as a courtesy.

**Format facts (from the Lichess documentation):**
- CSV fields include `PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes, ...`
- Moves are UCI.
- The FEN is the position **before the opponent's first move**. Apply the first move to get the position shown to the player. The second move is the start of the solution.
- All of the player's solution moves are "only moves", except for mate in one, where **any move that checkmates wins**.

**Build script** (`scripts/build-puzzles.ts`, run manually, not at app build time):
- [ ] Read the downloaded CSV (do not commit the big file)
- [ ] Filter for quality (low rating deviation, high popularity, many plays), and whitelist themes (mate in 1, 2, 3, fork, pin, skewer, discovered attack, back-rank mate, hanging piece, sacrifice, endgame, promotion, and similar)
- [ ] Bucket by rating: Easy, Medium, Hard (starting split near 1300 and 1800, tune later)
- [ ] Pick about 500 to 700 per bucket, balanced across themes
- [ ] **Validate every puzzle with chess.js** (legal first move, the whole solution is legal, mate-in-one rule). Drop invalid ones
- [ ] Output compact JSON per bucket (arrays like `[id, fen, moves, rating, themes]`). Expect a few hundred KB total uncompressed and far less gzipped. Load buckets lazily and precache them

**Puzzle list screen** (mockup):
- [ ] Filter chips: All, Easy, Medium, Hard. Optional theme filter and Unsolved only
- [ ] Rows: `MiniBoard` thumbnail, number, friendly theme name ("Mate in 2", "Fork win", "Endgame"), difficulty badge, and a solved check
- [ ] "Load more" pagination (20 at a time) to avoid rendering hundreds of boards

**Puzzle play screen:**
- [ ] Board oriented to the player's side. Auto-play the opponent's first move, then wait for the player
- [ ] Validate each move against the solution. Apply the opponent's reply automatically after a short delay. For mate in one, accept any checkmating move
- [ ] Promotion picker works here (M19)
- [ ] Commentary bubble: the animal reacts to progress ("Nice move, keep going")
- [ ] **Hint:** first tap highlights the piece to move, second tap shows the destination. Mark `usedHint`
- [ ] Toolbar: Restart, Hint, Skip (the Win chance card is replaced by a puzzle info card showing rating and theme)
- [ ] First wrong move ends the attempt (D5): the loss screen offers Try again, View solution, Home
- [ ] Clean solve: the win screen offers Next puzzle, View solution, Home
- [ ] **View solution:** animate the full solution line with step controls and show the SAN list
- [ ] Save `PuzzleProgress`, count the activity day, and update stats
- [ ] **Next puzzle** picks the next unsolved puzzle in the current filter by ascending rating. When all are solved, show a completion state
- [ ] Puzzles never use the engine, so they work even if Stockfish fails to load

Tests: puzzle flow state machine (first move, replies, wrong move, mate-in-one alternatives, promotion), the build script's validator, and progress saving.

Done when: you can solve, fail, hint, view the solution, and move to the next puzzle, with progress saved and everything working offline.

---

### M30. Learn (L)

Goal: short, interactive lessons written by you, so there are no content license issues.

Structure: **Tracks, Lessons, Steps.** The animal acts as the narrator in the speech bubble.

**v1 ships 10 lessons (marked v1). The other lessons go to the backlog.**

| Track | Lessons |
|---|---|
| Basics | **v1:** the board and pieces, how each piece moves, check, checkmate and stalemate. Backlog: special moves (castling, en passant, promotion), reading chess notation |
| Tactics | **v1:** fork, pin, back-rank mate. Backlog: skewer, discovered attack. Each ends with "Practice these puzzles", linking to the matching puzzle theme |
| Openings | **v1:** opening principles. Backlog: a simple e4 opening, a simple d4 opening |
| Endgames | **v1:** king and queen vs king, king and rook vs king. Backlog: opposition and pawn promotion |

That gives 10 in v1: 4 Basics, 3 Tactics, 1 Openings, 2 Endgames.

Step types:
- **text:** a short explanation
- **demo:** a position with highlights, arrows, and an animated move sequence
- **try-it:** the player must make a specific move or capture, validated with chess.js, with a gentle hint and an animal reaction
- **quiz:** optional multiple choice

Tasks:
- [ ] Content format: JSON files in `content/learn/` (`{ id, title, track, steps: [...] }`)
- [ ] **Content validation test:** every FEN and every scripted move in every lesson must be legal. Run it in CI
- [ ] Learn tab: tracks with progress bars and lesson cards with locked, in progress, and done states
- [ ] Lesson player: segmented progress bar at the top, board, speech bubble, Next button
- [ ] Reuse the board capabilities from M18 (read-only, arrows, highlights, move validation)
- [ ] Save step and lesson progress. Show "Continue" on Home
- [ ] Count a finished lesson as an activity day
- [ ] Write the lesson copy in a friendly, short tone (about 2 to 3 sentences per step). Keep content separate from code so it is easy to edit

Done when: all 10 v1 lessons run end to end offline, the validation test passes, and progress shows on Home and Profile.

---

### M31. Integration and polish (M)

- [ ] Home cards, Profile stats, badges, and streak all react to the same stored data
- [ ] Cross-links: Learn tactics link to puzzle themes, Help links to Settings
- [ ] Empty states, loading states (skeletons), and error states for every new screen
- [ ] Page transitions (short, with a reduced-motion alternative)
- [ ] Opponent personality pass: voice and mood use across new screens, chicken bank at least as rich as the frog's
- [ ] Audit icon-and-label pairing everywhere (no color-only meaning)
- [ ] Copy review across the app (sentence case, consistent tone)

---

### M32. QA, performance, and release (M)

- [ ] Test matrix: dark and light, frog and chicken, Play as White and Black, 360, 390, and 430 px widths, Android Chrome, iOS Safari (installed and in browser), desktop
- [ ] Theme lock cases: start a battle and flip the device theme (System mode) and confirm nothing changes; leave mid-game and confirm the Settings theme row is disabled; finish or clear the battle and confirm the pending theme applies after the result screen closes; update from the MVP with a saved battle on a light-mode device and confirm it resumes as dark with the frog; confirm puzzles and lessons use the battle's theme while a battle exists
- [ ] Offline: load once online, then airplane mode and exercise every tab, a full game, a puzzle, a lesson, a review, and settings changes
- [ ] Performance: entry chunk size, route chunk sizes, animation at 60 fps, no long main-thread tasks during engine work, memory use on a mid-range phone
- [ ] Data safety: migration from the MVP's saved battle, corrupt data handling, storage full, private browsing, a large history (1,000 games)
- [ ] Update flow: ship an update with a schema migration and confirm installed users keep their data
- [ ] Accessibility pass (section 8) with a screen reader on at least one platform
- [ ] Lighthouse PWA and accessibility audits
- [ ] Update the README, credits, and license notices (Lichess CC0 data, CC0 sound pack, Stockfish, chess.js, piece set, fonts)
- [ ] Tag a version, deploy to Netlify, and verify the live install

---

## 6. Suggested order and dependencies

```
M18 Foundations
 ├─ M19 Promotion picker ─────────────┐
 ├─ M20 Captured panel                │
 ├─ M21 Theme, light mode, chicken    │
 │    └─ M22 Settings                 │
 │         ├─ M23 Clear data          │
 │         └─ M24 Help & Support      │
 ├─ M25 History capture               │
 │    ├─ M26 Game review              │
 │    └─ M28 Profile (needs M27)      │
 ├─ M27 Bottom nav and Home           │
 ├─ M29 Puzzles (needs M19) ◄─────────┘
 └─ M30 Learn (links to M29)
M31 Integration → M32 QA and release
```

| Phase | Milestones | Why this order |
|---|---|---|
| A. Chess quality | M18, M19, M20 | Fix basics first. Promotion is needed by puzzles |
| B. Look and settings | M21, M22, M23, M24 | Theme and opponent abstraction touch every screen, so do them before building new screens |
| C. Your data | M25, M26 | History capture before anything that reads history |
| D. App shell | M27, M28 | Navigation and Profile once history exists |
| E. Content | M29, M30 | The largest pieces, built on stable foundations |
| F. Finish | M31, M32 | Integration and release |

Rough effort: about 4 S/M items in Phase A and B, then four heavier items (M26, M29, M30, and M28) that make up most of the remaining time. Expect roughly **8 to 12 weeks** for one developer. Learn is now 10 lessons, so it is at the lower end of that range.

---

## 7. Opponent voice: chicken starter lines

The chicken has its own word bank (D2). It never reuses frog lines. Starter lines, to be expanded:

```ts
chickenLines = {
  gameStart:   ["Let's see what you've got, chick."],
  best:        ["Bawk... lucky scratch.", "Hmph. Beginner's luck."],
  great:       ["Not bad for a hatchling.", "Don't get cocky."],
  good:        ["Fine. Acceptable.", "Keep pecking."],
  inaccuracy:  ["Hmm, are you sure about that?", "A little wobbly there."],
  mistake:     ["That was egg-sactly the wrong move.", "Oops. On purpose?"],
  blunder:     ["Bawk! Did you mean to do that?", "I've seen eggs play better."],
  opponentCaptures: ["Cluck cluck, mine now!", "Gotcha!"],
  playerCaptures:   ["Hey! That was mine.", "Ouch. My feathers."],
  playerChecks:     ["Eep! Hold on.", "Bawk! Check?"],
  hintUsed:         ["Peeking, are we?", "Need a little help? Cute."],
  playerWins:       ["You got me. Bawk...", "Rematch. Now."],
  playerLoses:      ["Better luck next time.", "Cluck cluck!"],
  resume:           ["You're back. Let's finish this."]
};
```

Keep every line playful and never mean.

---

## 8. Definition of done (applies to every milestone)

- Works offline after the first load
- Looks right in **dark and light**, with the **frog and chicken**
- Works at 360 px and 430 px widths, with iOS and Android safe areas respected
- Touch targets about 44 px or more for primary controls
- Keyboard focus visible, `aria-label` on icon-only controls, dialogs and sheets trap and restore focus
- Meaning is never carried by color alone (always an icon, shape, or label)
- Respects `prefers-reduced-motion`
- Pure logic has unit tests, and critical flows have a Playwright test where it is practical
- No data loss on reload, update, or migration
- Strings follow sentence case and the friendly tone

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Theme-linked opponent touches every screen | Build the `Opponent` abstraction in M18 and finish M21 before new screens |
| Theme lock confuses people (a disabled theme row, or the app ignoring a device theme change) | Clear explanation text, a one-tap way to clear the battle, and apply any pending change as soon as the battle ends |
| Light mode makes pieces or grade colors hard to read | Contrast-check both piece colors on both squares, and every grade color, before building on top |
| Puzzle data bugs (illegal moves, wrong side) | Validate every puzzle in the build script, and test the flow state machine |
| Mate-in-one alternatives rejected as "wrong" | Implement the "any checkmate wins" rule explicitly, with a test |
| Learn content is large and slow to write | Ship 10 lessons in v1 and keep the rest in the backlog. Content stays separate from code |
| Local storage can be evicted (especially iOS) | `navigator.storage.persist()`, plus backup and restore (D9) |
| Bundle growth hurts first load | Lazy-load routes, load puzzle buckets on demand, hand-drawn SVG charts instead of a chart library |
| Schema changes break old data | Versioned migrations with tests, and a migration step in the QA checklist |
| Licenses (pieces, puzzle data, audio, fonts) | Keep a credits and license list in Help, and check each license text before shipping |
| Sound and haptics vary by platform | Treat them as progressive enhancement, and show unsupported states clearly |
| Scope creep from the mockup | Keep Daily Challenge, sidebar, accounts, online features, "Play from here", and XP and levels out of this phase |
| Light palette is warm, so the chicken and the light theme must match | Use the same warm palette for the chicken's colors and the board, and review both in the screenshot tests |

---

## 10. Open questions

None. Every decision is resolved and recorded in section 2. The plan is ready for M18.
