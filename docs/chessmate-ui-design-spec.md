# ChessMate UI Design Specification

Implementation-ready design guide for building the ChessMate chess PWA
with **React, Shadcn UI, Tailwind CSS, Lucide React, and chess.js**.

> The reference image is a visual mockup, not a source design file.
> Colors and dimensions below are proposed values tuned to match the
> reference rather than exact extracted design tokens.

## 1. Product and visual direction

ChessMate uses a dark, mobile-first interface with deep navy surfaces,
thin blue borders, pastel blue primary actions, mint-green positive
feedback, and restrained playful accents. The chessboard is the central
interactive element. Supporting UI should feel polished and friendly
without competing with the board.

Core design principles:

-   Use a consistent dark navy background and elevated surfaces.
-   Use pastel blue for primary actions and the board.
-   Use mint for hints, positive feedback, and success actions.
-   Use yellow for last-move highlights and selected rewards.
-   Use coral sparingly for errors, blunders, and loss feedback.
-   Prefer thin outlines and subtle shadows over heavy elevation.
-   Keep typography, spacing, icon sizing, and corner radii consistent.
-   Build reusable components rather than implementing each screen
    independently.

## 2. Color system

### Core colors

  -----------------------------------------------------------------------
  Token                   Hex                     Use
  ----------------------- ----------------------- -----------------------
  App background          `#061824`               Main page and outer
                                                  background

  Primary surface         `#091F2D`               Cards, drawers, bottom
                                                  navigation

  Elevated surface        `#0D2939`               Nested cards, popovers,
                                                  dialogs

  Secondary surface       `#15364A`               Inactive controls,
                                                  muted surfaces

  Primary blue            `#9FD4FF`               Primary buttons,
                                                  win-chance card, active
                                                  icons

  Mint accent             `#79F2C6`               Hint cards, success,
                                                  positive highlights

  Lemon yellow            `#FFE29A`               Last-move highlight,
                                                  rewards

  Lavender                `#C5B8FF`               Optional puzzle state
                                                  or alternate accent

  Coral                   `#FF8F93`               Mistakes, blunders,
                                                  loss indicators

  Primary text            `#EAF5FF`               Headings and
                                                  high-emphasis text

  Secondary text          `#A8C4D8`               Descriptions,
                                                  subtitles, labels

  Default border          `#214C65`               Card outlines,
                                                  separators, input
                                                  borders

  Muted blue              `#102B3A`               Subtle surfaces

  Progress track          `#15364A`               Progress bar track
  -----------------------------------------------------------------------

### Chessboard colors

  Token                  Hex         Use
  ---------------------- ----------- ----------------------------------
  Light square           `#D2E9FF`   Light board squares
  Dark square            `#82B9E9`   Dark board squares
  Selected square        `#FFE29A`   Currently selected piece square
  Last-move highlight    `#B8F3D9`   From/to squares of the last move
  Legal-move indicator   `#248C73`   Legal destination dots
  Check highlight        `#FF8F93`   King in check

### Suggested accent proportions

As a starting point, use approximately 70% dark surfaces, 20% blue, and
10% mint/yellow/coral accents. This is a visual guideline, not a strict
color calculation. Avoid using every accent at once.

## 3. Typography

Use **Inter** throughout for a clean, readable interface. An alternative
is Plus Jakarta Sans for headings and Inter for body text.

  Token                        Size     Weight Use
  --------------- ----------------- ---------- --------------------------------
  Display               32px / 2rem   700--800 Welcome and result titles
  Page heading        24px / 1.5rem        700 Dashboard, puzzles, profile
  Card heading          16px / 1rem        600 Daily Puzzle, Hint, statistics
  Body              14px / 0.875rem   400--500 Descriptions and content
  Button            14px / 0.875rem        600 Actions and navigation
  Label              12px / 0.75rem        500 Metadata and captions
  Tiny metadata            10--11px   400--500 Coordinates and compact stats

Recommended line heights:

-   Headings: `1.2`
-   Body: `1.5`
-   Labels: `1.35`

Use sentence case for most labels and headings. Reserve uppercase for
occasional small overlines.

## 4. Spacing, corners, borders, and shadows

### Spacing scale

Use a consistent spacing scale based on multiples of 4px:

-   `4px`: tight icon/text gaps
-   `8px`: compact element gaps
-   `12px`: card content spacing
-   `16px`: standard card padding
-   `24px`: page padding and section gaps
-   `32px`: large section separation

### Radius scale

  Token          Value       Use
  -------------- ----------- -----------------------------------
  Small radius   `8px`       Inputs, compact buttons, chips
  Base radius    `12px`      Standard Shadcn radius
  Card radius    `14–16px`   Cards and statistic panels
  Panel radius   `20–24px`   Hero panels and larger containers
  Pill radius    `9999px`    Filter chips, badges, toggles

### Layout dimensions

  Token                         Value
  ----------------------------- --------------------------------
  Page padding                  `20–24px`
  Compact mobile page padding   `12–16px`
  Standard card padding         `16px`
  Compact card padding          `12px`
  Card gap                      `12px`
  Section gap                   `24px`
  Button height                 `44–48px`
  Bottom navigation             `64–72px` plus safe-area inset
  Card border                   `1px solid #214C65`
  Board radius                  `8px`

### Shadows

The reference relies more on contrast and outlines than elevation. Keep
shadows subtle.

``` css
:root {
  --shadow-card: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-popover: 0 16px 48px rgba(0, 0, 0, 0.35);
  --border-subtle: rgba(120, 190, 230, 0.12);
  --border-default: #214c65;
}
```

## 5. Component specifications

### 5.1 Buttons

**Primary button** - Height: `44–48px` - Radius: `10–12px` - Background:
`#9FD4FF` - Text: `#071C2A` - Font: `14px`, weight `600` - Hover:
lighten slightly or add a faint blue glow - Focus: visible 2px ring
using `#9FD4FF`

**Mint action button** - Background: `#79F2C6` - Text: `#072A25` - Use
for hints, successful moves, and next-puzzle actions after a win.

**Secondary button** - Background: `#0D2939` or transparent - Border:
`1px solid #214C65` - Text: `#EAF5FF`

**Suggested sizes** - Default: `h-11 px-4 rounded-xl` - Large:
`h-12 px-5 rounded-xl` - Small: `h-9 px-3 rounded-lg` - Icon-only:
`h-10 w-10 rounded-lg` - Disabled: opacity around `0.45`

Use Shadcn `Button` variants such as `default`, `secondary`, `outline`,
`ghost`, and `destructive`. Override semantic theme tokens instead of
writing one-off styles for every screen.

### 5.2 Cards

Standard cards: - Background: `#091F2D` - Border: `1px solid #214C65` -
Radius: `14–16px` - Padding: `16px` - Internal gap: `12px`

Interactive cards: - Use `cursor-pointer`. - Change the border subtly on
hover. - Use a `150ms` transition. - Preserve a clear focus state for
keyboard navigation.

Stat cards: - Padding: `12px` - Radius: `12px` - Compact labels and
prominent values.

Primary navigation cards can use pastel blue or mint fill. Secondary
cards should use dark elevated surfaces.

Recommended Shadcn components: `Card`, `CardHeader`, `CardTitle`,
`CardDescription`, and `CardContent`.

### 5.3 Bottom navigation

Destinations: 1. Home 2. Puzzles 3. Learn 4. Profile

Dimensions and colors: - Height: `64–72px`, plus device safe-area
inset - Background: `#091F2D` - Top border: `1px solid #214C65` - Icons:
`18–20px` - Labels: `10–11px` - Active icon and label: `#9FD4FF` -
Inactive icon and label: `#A8C4D8`

Use a fixed bottom navigation on mobile. On wider screens, consider a
sidebar.

### 5.4 Chessboard and pieces

The chessboard is the most important component. It should be reusable,
responsive, and visually consistent on puzzle, analysis, and result
screens.

  Element               Specification
  --------------------- --------------------------------------
  Light square          `#D2E9FF`
  Dark square           `#82B9E9`
  Selected square       `#FFE29A`
  Last-move highlight   `#B8F3D9`
  Legal move dot        `#248C73` at 65--75% opacity
  Check highlight       `#FF8F93`
  Board border          `1px solid #214C65`
  Board radius          `8px`
  Coordinates           `10–11px`, muted navy
  Piece size            Approximately 72--82% of square size

Use a consistent Staunton-style set with transparent backgrounds.
Unicode chess glyphs are useful for prototypes but may render
differently across operating systems. For production, SVG piece assets
provide predictable silhouettes, stroke weights, and sizing.

Suggested board CSS:

``` css
.chessboard {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.chess-square {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  user-select: none;
  touch-action: manipulation;
}

.chess-piece {
  width: 82%;
  height: 82%;
  object-fit: contain;
  pointer-events: none;
}
```

Use `chess.js` for legal moves, check detection, castling, en passant,
promotion, and game status. Render the board from the current FEN and
update the position after each legal move.

### 5.5 Hint card

-   Background: `#79F2C6`
-   Text: `#08352D`
-   Radius: `14–16px`
-   Height: approximately `92–110px`
-   Icon: `Lightbulb`, `20–24px`
-   Heading: `16px`, weight `600`
-   Supporting text: `12px`
-   Action: "Show hint" or a right-arrow affordance

### 5.6 Win chance card

-   Background: `#9FD4FF`
-   Text: `#092C45`
-   Radius: `14–16px`
-   Height: approximately `92–110px`
-   Label: `10–12px`, medium weight
-   Percentage: `24–28px`, weight `700`
-   Progress track: `#CDE7FC` or `#15364A`
-   Progress fill: dark navy or mint, depending on the design

On mobile, show Hint and Win Chance as two equal columns if the viewport
allows. Stack them when the viewport is too narrow.

**Product accuracy:** If the percentage is an engine evaluation rather
than a calibrated probability, label it accordingly. A chess evaluation
score should not be presented as a literal win probability without a
suitable conversion model.

### 5.7 Win and loss screens

**Win screen** - Large trophy illustration - Heading: "You Win!" - Short
positive message - Final win chance card - Mint primary "Next Puzzle"
button - Outlined "View Solution" button

**Loss screen** - Chess-piece illustration or expressive chess king -
Heading: "You Loss" - Encouraging short message - Final win
chance card - Blue primary "Try Again" button - Outlined "View Solution"
button

Keep the dark background on both screens. Use mint accents and subtle
particles for a win, and restrained coral accents for a loss.

Animation recommendations: - Duration: `350–650ms` - Easing:
`cubic-bezier(0.16, 1, 0.3, 1)` - Trophy scale: `0.75` to `1` - Progress
bar: animate over `600–900ms` - Respect `prefers-reduced-motion`. -
Avoid forcing the user to wait before the next action becomes available.

CSS transitions or Framer Motion can be used for more elaborate
sequences.

## 6. Icon system

Use **Lucide React** consistently. It integrates well with Shadcn and
provides a coherent outline style.

Install:

``` bash
npm install lucide-react
```

  UI element        Lucide component
  ----------------- --------------------------------
  Brand logo        Custom SVG chess knight
  Home              `House`
  Puzzles           `Puzzle`
  Learn             `BookOpen`
  Profile           `UserRound`
  Settings          `Settings2`
  Undo              `Undo2`
  Redo              `Redo2`
  Restart           `RefreshCw`
  Hint              `Lightbulb`
  Win probability   `ChartNoAxesColumnIncreasing`
  Win result        `Trophy`
  Loss / retry      `Heart` or `RotateCcw`
  Daily streak      `Flame`
  Achievements      `Award`, `Star`, `Crown`
  Close dialog      `X`
  Back              `ArrowLeft`
  Next              `ChevronRight` or `ArrowRight`
  Search puzzles    `Search`
  Move history      `History`
  Sound             `Volume2`
  Haptics           `Vibrate`
  Light theme       `Sun`
  Dark theme        `Moon`
  System theme      `Monitor`

Icon sizing: - Main navigation: `20px` - Card icons: `20–24px` - Compact
inline icons: `14–16px` - Primary action icons: `18–20px` - Result
illustrations: `48–72px`, preferably custom SVG artwork

Use `strokeWidth={1.8}` for most Lucide icons. Keep the outline style
consistent; use filled icons sparingly for active states.

Example:

``` tsx
import { Puzzle } from "lucide-react";

<Puzzle size={20} strokeWidth={1.8} aria-hidden="true" />
```

A custom SVG chess knight is recommended for the ChessMate logo, as it
is more recognizable as a chess product than a generic puzzle icon.

## 7. Screen-by-screen layout specification

Assume a mobile viewport around `390 × 844 CSS pixels` as a starting
point. All screens should adapt to the actual viewport and device safe
areas.

### 7.1 Welcome / Landing page

-   Full-height background: `#061824`
-   Centered knight logo, `64–80px`
-   App name: `32px`, bold
-   Tagline and short product description
-   Primary "Get Started" button near the bottom
-   Secondary "Sign In" link
-   Optional geometric shapes in muted blue

This is the PWA entry page before onboarding or authentication.

### 7.2 Home / Dashboard

-   Header with wordmark and settings icon
-   Greeting and daily streak
-   Large mint "Play Puzzle" card
-   Smaller Practice and Analysis cards
-   Recent progress with win rate and puzzles solved
-   Fixed bottom navigation

The puzzle entry point should be the most prominent element.

### 7.3 Puzzle / Gameplay

-   Header with back arrow, puzzle ID, overflow menu
-   Previous-move commentary bubble
-   Large 8 × 8 chessboard
-   Undo, redo, and restart toolbar
-   Hint and win chance cards
-   Optional move status and evaluation

This is the main interactive screen and deserves the most implementation
attention.

### 7.4 Win screen

-   Large trophy illustration
-   "You Win!" heading
-   Short success message
-   Final win chance card
-   Mint "Next Puzzle" button
-   Outlined "View Solution" button

Treat this as a dedicated result state, not merely a toast notification.

### 7.5 Loss screen

-   Chess-piece illustration or expressive chess king
-   "You Loss" heading
-   Short, encouraging message
-   Final win chance card
-   Blue "Try Again" button
-   Outlined "View Solution" button

The experience should encourage learning rather than make failure feel
punitive.

### 7.6 Puzzle library

-   Page title and difficulty filter chips
-   Scrollable list of puzzle cards
-   Puzzle ID, type, difficulty, and thumbnail
-   Right chevron for navigation
-   Bottom navigation

Use small chessboard thumbnails to help users identify puzzle positions
at a glance.

### 7.7 Solution / Move analysis

-   Board with the solution position
-   Best-move label and notation
-   Brief natural-language explanation
-   Previous and next move controls
-   View solution or return to puzzle action

Keep analysis below the board rather than shrinking the board to fit all
content.

### 7.8 Hint modal

-   Dimmed game screen
-   Centered elevated dialog
-   Large lightbulb icon
-   Short hint explanation
-   Mint "Got it" button
-   Close button in the top-right

Use a Shadcn `Dialog` for focus management, keyboard behavior, and
accessibility.

### 7.9 Settings

-   Appearance: Dark, Light, System
-   Board and piece themes
-   Sound and haptics toggles
-   Gameplay settings, including hints and last-move highlights
-   About and app version

Separate groups with subtle borders. Use Shadcn `Switch` components for
toggles.

### 7.10 Profile / Statistics

-   Avatar, username, level, and streak
-   Win-rate and puzzle-count cards
-   Recent performance chart
-   Achievement badges
-   Bottom navigation

Use simple circular progress indicators and small charts. Keep profile
data-driven so it can grow with the user.

## 8. Shadcn theme setup

The following example assumes **Tailwind CSS 4 and a current Shadcn
setup**. If using Tailwind CSS 3, adjust the theme-variable mapping and
import syntax.

``` css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.75rem;

  --background: #061824;
  --foreground: #eaf5ff;

  --card: #091f2d;
  --card-foreground: #eaf5ff;

  --popover: #0d2939;
  --popover-foreground: #eaf5ff;

  --primary: #9fd4ff;
  --primary-foreground: #071c2a;

  --secondary: #15364a;
  --secondary-foreground: #eaf5ff;

  --muted: #102b3a;
  --muted-foreground: #a8c4d8;

  --accent: #79f2c6;
  --accent-foreground: #072a25;

  --destructive: #ff8f93;
  --destructive-foreground: #30141b;

  --border: #214c65;
  --input: #214c65;
  --ring: #9fd4ff;

  --chart-1: #9fd4ff;
  --chart-2: #79f2c6;
  --chart-3: #ffe29a;
  --chart-4: #c5b8ff;
  --chart-5: #ff8f93;

  --sidebar: #091f2d;
  --sidebar-foreground: #eaf5ff;
  --sidebar-primary: #9fd4ff;
  --sidebar-primary-foreground: #071c2a;
  --sidebar-accent: #15364a;
  --sidebar-accent-foreground: #eaf5ff;
  --sidebar-border: #214c65;
  --sidebar-ring: #9fd4ff;
}

.dark {
  color-scheme: dark;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

button,
[role="button"] {
  -webkit-tap-highlight-color: transparent;
}

::selection {
  background: #9fd4ff;
  color: #071c2a;
}
```

Keep chess-specific tokens separate from Shadcn's semantic tokens. This
allows a future light theme to change surfaces and text without
unintentionally changing chessboard state colors.

## 9. Recommended React project structure

Avoid implementing all screens in one large component. Keep the
chessboard and shared UI primitives reusable, then compose each page
around them.

``` text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── puzzles/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── analysis/page.tsx
│   ├── profile/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── ui/                   # Shadcn components
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── bottom-nav.tsx
│   │   ├── app-header.tsx
│   │   └── sidebar.tsx
│   ├── chess/
│   │   ├── chessboard.tsx
│   │   ├── chess-square.tsx
│   │   ├── chess-piece.tsx
│   │   ├── board-coordinates.tsx
│   │   ├── move-toolbar.tsx
│   │   ├── move-commentary.tsx
│   │   ├── hint-card.tsx
│   │   └── win-chance-card.tsx
│   ├── puzzles/
│   │   ├── puzzle-card.tsx
│   │   ├── puzzle-filters.tsx
│   │   ├── hint-dialog.tsx
│   │   ├── win-screen.tsx
│   │   └── loss-screen.tsx
│   ├── dashboard/
│   │   ├── streak-card.tsx
│   │   ├── progress-card.tsx
│   │   └── stat-card.tsx
│   └── profile/
│       ├── performance-chart.tsx
│       └── achievement-list.tsx
├── hooks/
│   ├── use-chess-game.ts
│   └── use-theme.ts
├── lib/
│   ├── chess.ts
│   ├── utils.ts
│   └── routes.ts
├── data/
│   └── puzzles.ts
└── styles/
    └── globals.css
```

This structure is a recommendation. Adapt route placement to your router
and framework.

## 10. Recommended packages

Core:

``` bash
npm install lucide-react chess.js
```

Shadcn components to add:

``` bash
npx shadcn@latest add button card badge dialog dropdown-menu \
  progress switch tabs separator sheet tooltip avatar \
  toggle-group skeleton
```

Optional packages: - `framer-motion`: win/loss transitions and
celebratory animations - `recharts`: profile and performance charts -
`next-themes`: theme selection when using Next.js - `@dnd-kit/core`:
optional drag-and-drop interactions

## 11. Responsive behavior

  -----------------------------------------------------------------------
  Viewport                            Recommended behavior
  ----------------------------------- -----------------------------------
  Under 380px                         Reduce page padding to 12--16px;
                                      preserve a square board

  380--639px                          Full-width board, compact cards,
                                      bottom navigation

  640--767px                          Constrain content width and
                                      increase outer margins

  768--1023px                         Center the game layout; consider
                                      two-column analysis

  1024px and above                    Optional sidebar and
                                      board-plus-analysis layout
  -----------------------------------------------------------------------

For desktop puzzle gameplay, use a two-column composition: board and
move toolbar on the left, move history and analysis cards on the right.
On mobile, use one vertical column with the board first.

## 12. Accessibility and interaction details

-   Ensure text and icons have sufficient contrast against dark
    surfaces.
-   Do not use color alone to communicate a correct move, mistake, win,
    or loss.
-   Give icon-only buttons accessible labels.
-   Add keyboard focus styles to interactive cards and controls.
-   Ensure dialogs manage focus and can be dismissed appropriately.
-   Respect `prefers-reduced-motion`.
-   Use at least approximately 44px touch targets for primary
    interactive controls.
-   Keep board squares easy to tap on small screens.
-   Provide non-color indicators for selected squares, legal moves, and
    check states.
-   Ensure screen readers can understand whose turn it is and whether
    the puzzle is complete.

## 13. Final design tokens

This compact set can be used as the shared foundation for the UI.

``` css
:root {
  /* Colors */
  --app-bg: #061824;
  --surface-1: #091f2d;
  --surface-2: #0d2939;
  --surface-3: #15364a;

  --blue: #9fd4ff;
  --mint: #79f2c6;
  --yellow: #ffe29a;
  --lavender: #c5b8ff;
  --coral: #ff8f93;

  --text-primary: #eaf5ff;
  --text-secondary: #a8c4d8;
  --border-default: #214c65;

  /* Chessboard */
  --board-light: #d2e9ff;
  --board-dark: #82b9e9;
  --board-selected: #ffe29a;
  --board-last-move: #b8f3d9;
  --board-legal-move: #248c73;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-card: 16px;
  --radius-panel: 24px;
  --radius-pill: 9999px;

  /* Spacing */
  --page-padding: 24px;
  --card-padding: 16px;
  --card-gap: 12px;
  --section-gap: 24px;

  /* Motion */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

## 14. Suggested implementation order

1.  Set up the global theme, typography, spacing, and shared Shadcn
    components.
2.  Build the app shell, header, and bottom navigation.
3.  Implement the chessboard with real SVG pieces, coordinates, selected
    squares, legal moves, and last-move highlights.
4.  Build the puzzle screen with commentary, move toolbar, hint card,
    and win-chance card.
5.  Add the win and loss result states and animations.
6.  Assemble the dashboard and puzzle library using shared cards.
7.  Add solution analysis, hint dialog, profile, and settings.
8.  Test responsive layouts, keyboard navigation, touch interactions,
    and reduced-motion behavior.
9.  Add persistence and PWA install/offline behavior where required.

**Main recommendation:** keep the visual design tokens independent of
the chessboard logic. Use Shadcn semantic tokens for buttons, cards,
dialogs, and navigation, and chess-specific variables for board squares,
legal moves, selection, and check states. This separation will make
future theme changes much easier while preserving consistent gameplay
visuals.
