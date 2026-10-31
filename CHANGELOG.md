# Changelog

All notable changes to ChessMate are documented in this file.

## [2.0.0] - 2026-10-31

### Added
- **Home Dashboard**: Quick access to active games, puzzles, lessons, and analysis
- **Puzzles**: 500+ chess puzzles organized by difficulty and theme, with progress tracking
- **Learn**: Interactive chess lessons covering basics, tactics, openings, and endgames
- **Game Review**: Full replay of finished games with win chance graph, critical moments, and play-from-here feature
- **Profile & Stats**: Player profile with editable name, win rate, streaks, accuracy bars, badge collection, and game history
- **Settings**: Theme selection (dark/light/system), gameplay preferences, data management, help & support
- **Light Theme**: New light theme with cat opponent; theme automatically switches based on device preference
- **Theme Lock**: Theme is locked during active games to prevent jarring switches; queued changes apply after game ends
- **Bottom Navigation**: Tab-based navigation between Home, Puzzles, Learn, and Profile
- **Page Transitions**: Smooth fade+slide animations between routes with prefers-reduced-motion support
- **Enhanced Opponent**: Cat opponent with distinct personality and 50+ unique dialogue lines
- **Badge System**: 11 unlockable badges based on gameplay achievements (First Win, Giant Slayer, Streak badges, Puzzle badges, etc.)
- **Game Analysis**: Background engine analysis for games without full evaluation; optional to replay
- **Backup/Restore**: Export and import game data for device migration
- **Help & Support**: FAQ, quick start, troubleshooting, credits, and diagnostics
- **Accessibility**: Full keyboard navigation, screen reader support, prefers-reduced-motion, WCAG 2.1 AA compliance target
- **Performance**: Code splitting with route chunks (3-17 KB), lazy-loaded puzzle data, precached service worker

### Improved
- **Copy & Tone**: Standardized, friendly tone across all screens; consistent empty/loading states
- **Icon Accessibility**: All icons paired with text labels or aria-labels; no color-only meaning
- **Mobile UX**: Responsive design for 360 px and up; 44×44 px minimum touch targets
- **Code Quality**: 145 unit tests covering logic, grading, stats, migrations, board state
- **Bundle Size**: Main bundle 498 KB (161 KB gzipped), well under 250 KB target

### Changed
- MVP saved battles without `opponent` or `theme` fields now resume as dark mode with the frog
- Settings now use Zustand persist for synchronous theme application on boot

### Fixed
- Theme transitions during gameplay no longer cause visual flicker
- Opponent trash talk banks verified for uniqueness and richness (50+ lines each)
- Board animations respect user preferences (reduced motion)

### Security
- No user accounts, no backend, no network requests (offline-first)
- All data stored locally in IndexedDB and localStorage
- No telemetry or third-party tracking

### Known Limitations
- Puzzle hints are two-step (piece, then destination) to maintain simplicity
- Learn lessons ship with the app; new content requires an update
- Sound and haptics are UI toggles but not implemented (audio/haptic support phase 3)
- Chessboard square-by-square navigation for screen readers is not fully implemented (future enhancement)

### Dependencies
- Upgraded React to 19.3.1
- Upgraded Vite to 8.3.4
- Upgraded TypeScript to 6.0.3
- Added Motion (framer-motion) for animations
- Added idb for IndexedDB with migrations

---

## [1.0.0] - 2024-XX-XX (Phase 1)

### Added (Phase 1)
- Play chess against Stockfish AI at three difficulty levels
- Undo, redo, restart moves
- Real-time win chance percentage
- Move grading (Best, Great, Good, Inaccuracy, Mistake, Blunder)
- Opponent commentary with mood expressions
- Autosave and resume
- Landing page with app intro
- New game sheet for difficulty and color selection
- Hint card with best move suggestion
- Win chance card with trend indicator
- Full-screen result screens (win, loss, draw)
- Opponent (frog) with personality and trash talk
- Offline-first PWA with service worker
- Dark theme (navy and pastel colors)
- Responsive design for phones
- Custom SVG chess pieces

### Known Issues (Phase 1)
- Only dark mode; light theme planned for phase 2
- Single opponent (frog); cat planned for phase 2
- No game history or analysis; review added in phase 2
- No settings page; settings added in phase 2
- Limited accessibility features; enhanced in phase 2

---

## Versioning
ChessMate follows Semantic Versioning (MAJOR.MINOR.PATCH).
- **MAJOR**: Breaking changes or complete feature additions (phases)
- **MINOR**: New features, improvements, or additions within a phase
- **PATCH**: Bug fixes, small optimizations, and documentation updates

---

## Future Plans (Phase 3+)
- Daily Challenge with local leaderboard
- More opponents with distinct personalities and dialects
- Time controls (blitz, rapid, classical)
- Sound effects and haptic feedback
- Move notation variants (descriptive, long algebraic)
- Endgame tablebases (Syzygy)
- More lesson content and tracks
- Piece set customization
- Custom board colors
- Performance optimizations (WebAssembly board evaluation)
- Mobile app versions (React Native)

---

## How to Report Issues
Report bugs or request features via the Help & Support screen (Settings > Help and support) or contact the maintainer directly.

## Credits
See RELEASE_NOTES.md for full credits and third-party licenses.
