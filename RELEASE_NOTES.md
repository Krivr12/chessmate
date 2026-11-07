# ChessMate Phase 2 Release Notes

## What's New

### Bug Fixes & Polish (Post-Launch)
- **Navigation:** Fixed home button and back button redirects in game screens (now navigate to `/home` instead of landing page)
- **Game Replay:** Fixed piece movement glitch during replay by maintaining piece identity across move sequences
- **Completed Lessons:** Enhanced visual distinctiveness with primary color badges and centered text
- **Toast Notifications:** Repositioned from top to bottom of screen for better visibility in mobile PWA context
- **Copy Feedback:** Refactored copy mechanism to use inline state-based feedback instead of global toasts
  - Copy buttons now swap their entire content to a centered success message ("Copied Diagnostics!" or "Copied Email!")
  - Button dimensions remain fixed during content swap to prevent layout shift
  - Success message displays for 2 seconds before reverting to original state
- **Light Mode Colors:** Swapped Win Chance and Hint card background colors for consistent visual hierarchy across dark and light themes

### Major Features (Phase 2)
- **Home Dashboard:** Resume active games, quick access to Puzzles, Learn, and recent analysis
- **Puzzles:** 500+ offline puzzles organized by difficulty and theme, with progress tracking
- **Learn:** Interactive chess lessons covering basics, tactics, openings, and endgames
- **Game Review:** Replay any finished game with win chance graph, critical moment analysis, and the ability to play from any position
- **Profile:** Player name, stats (win rate, streaks, accuracy), badge collection, and game history
- **Settings:** Theme selection with opponent locked to theme, gameplay preferences, data management, help and support
- **Light Theme:** New light theme with cat opponent; theme-linked opponent (dark=frog, light=cat)
- **Theme Lock:** During active games, the theme is locked to prevent jarring switches
- **Page Transitions:** Smooth animations between tab routes with prefers-reduced-motion support
- **Copy & Polish:** Consistent, friendly copy tone across all screens
- **Enhanced Opponent:** Cat opponent with unique personality and 50+ dialogue lines

### Performance
- Main bundle: 498 KB (161 KB gzipped) — under the 250 KB target
- Route code splitting: ~3-17 KB per route chunk
- Puzzle data: ~70-82 KB per difficulty, lazy-loaded and precached
- Service worker precaches all assets and engine for full offline support

### Architecture
- IndexedDB storage with versioned migrations for games, puzzles, lessons, and metadata
- Theme system with system preference detection and lock mechanism during gameplay
- Opponent abstraction: single source for personality, trash talk, and sprites
- Reusable board component with read-only mode, highlights, arrows, and drag support
- Pure logic functions for grading, accuracy, stats, and badge calculation

### Accessibility
- All icons paired with text labels or aria-labels
- No color-only meaning: icons, shapes, and labels convey all information
- Keyboard navigation throughout (arrow keys for step-through, keyboard shortcuts)
- Screen reader support with proper ARIA labels, roles, and live regions
- Reduced motion respected on all animations

### Testing
- 145 unit tests covering pure logic (grading, win %, stats, streaks, badges, migrations, board state)
- Trash talk banks verified for completeness and no cross-contamination
- All screens verified for empty, loading, and error states
- Build and bundle size verified

## Breaking Changes
None. This is the second full version of the app.

## Migration from Phase 1
- Old saved battles (no `opponent` or `theme` fields) resume as dark mode with the frog
- Settings migrate automatically with defaults applied
- Existing move history is preserved and analyzed

## Known Limitations
- Theme changes during an active game are queued and applied after the game ends
- Puzzle hints are two-step (piece, then destination) to maintain simplicity
- Learn lessons are shipped with the app; new lessons require an update
- Sound and haptics are toggles but not implemented in this phase
- Diagnostics copy may fail silently in browsers that block clipboard access (a fallback error message is logged to console)

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS 14.4+)
- Works offline after first load on all platforms

## Deployment
Deploy `dist/` to Cloudflare Pages, Netlify, or Vercel using the build command `npm run build`.

- **Cloudflare Pages:** Uses `public/_headers` and `public/_redirects` automatically
- **Netlify:** Uses `public/_redirects` and `public/_headers` automatically
- **Vercel:** Add `vercel.json` with rewrites and headers for `/play` and service worker caching

The service worker precaches ~80 entries (~5.2 MB total), including the Stockfish engine and all route chunks.

## Credits & Licenses

### Libraries & Data
- **Chess.js** — Chess rules and state (license: BSD-3-Clause)
- **Stockfish.js 19** — UCI chess engine (license: GPLv3, see `public/engine/COPYING-stockfish.txt`)
- **Motion (framer-motion)** — Animations (license: MIT)
- **shadcn/ui** — Component library built on Radix UI (license: MIT)
- **Radix UI** — Headless components (license: MIT)
- **Tailwind CSS** — Utility CSS (license: MIT)
- **Zustand** — State management (license: MIT)
- **idb** — IndexedDB wrapper (license: Apache-2.0)
- **idb-keyval** — Simple key-value storage (license: Apache-2.0)
- **Sonner** — Toast notifications (license: MIT)
- **Lucide React** — Icons (license: ISC)
- **Lichess Puzzle Database** — Puzzle set (~500 selected for Phase 2, license: CC0)

### Design & Art
- UI design: ChessMate design spec
- Chess pieces: Staunton-style custom SVG
- Opponent sprites (frog & cat): Generated from emote sheet (kawaii-style, subject to appropriate licensing)
- Colors & tokens: Custom theme inspired by the ChessMate design

### Build & Development
- Vite — Build tool (license: MIT)
- React 19 — UI library (license: MIT)
- React Router 7 — Routing (license: MIT)
- TypeScript — Language (license: Apache-2.0)
- ESLint — Linting (license: MIT)
- Prettier — Formatting (license: MIT)
- Vitest — Testing (license: MIT)

## Feedback & Issues
Report bugs or suggestions via the Help & Support screen (Settings > Help and support) or directly to the project maintainer.

## Future Roadmap (Phase 3+)
- Daily Challenge with streak and leaderboard (local only)
- More opponents with distinct personalities
- Custom time controls
- Sound effects and haptic feedback
- Move notation variants (algebraic, descriptive)
- Endgame tablebases
- More lesson tracks and content
- Performance optimizations (WebAssembly board)

---

**Release Date:** October 2026 (Latest: November 2026)  
**App Version:** 2.0.1  
**Engine:** Stockfish 19 (lite, single-threaded WASM)  
**Puzzle Count:** 500+ (categorized by difficulty and theme)
