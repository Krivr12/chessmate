# Accessibility Statement

ChessMate is designed and built with accessibility in mind. This document describes the accessibility features and known limitations.

## Compliance Target
ChessMate aims for **WCAG 2.1 Level AA** compliance. Full validation requires manual testing with assistive technologies and expert review.

## Features & Implementation

### Vision & Color
- **No color-only meaning:** All meaningful information conveyed by color is also conveyed by icon, shape, or label
- **Contrast:** Text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Color palettes:** Both dark and light themes have been contrast-checked
- **Piece colors:** White pieces include a navy outline for visibility on light squares
- **Icons with labels:** All icons are paired with descriptive text or aria-labels

### Keyboard Navigation
- **Tab order:** Logical tab order through all interactive elements
- **Focus visible:** Clear focus ring on all focusable elements
- **Shortcuts:** 
  - Game review: Arrow keys (← / →) to step through moves, Home / End to jump to start/end, Space to play/pause
  - Tab navigation: Accessible to all screen readers and keyboard-only users
- **Escape key:** Closes dialogs, sheets, and promotion pickers
- **Enter key:** Activates buttons and triggers actions in dialogs

### Screen Readers
- **ARIA labels:** All icon-only buttons have descriptive aria-labels
- **Roles:** Proper semantic HTML and ARIA roles for complex components (dialog, progressbar, switch, etc.)
- **Live regions:** Game status, move announcements, and state changes use aria-live regions
- **Form labels:** All inputs are associated with labels
- **Headings:** Semantic heading hierarchy (h1, h2, h3) for page structure
- **Lists:** Game history, move lists, and badge collections use semantic list markup

### Motion & Animation
- **prefers-reduced-motion:** Respected on all animations (page transitions, result screens, particle effects, piece movement)
- **No auto-play:** All animations are user-triggered or paired with static content
- **Loading states:** Indicated with text ("Loading...") and spinner animations (respects reduced motion)
- **Focus not moved:** Tab focus is not automatically moved by animations

### Game & Chess
- **Move announcements:** Players can use screen readers to understand board state and move history
- **Piece identification:** Each piece is labeled by color and type (white pawn, black queen, etc.)
- **Board coordinates:** Printed on the board for reference; squares are accessible by notation
- **Notation support:** Game moves are shown in SAN (Standard Algebraic Notation)

### Touch & Mobile
- **Touch targets:** Primary controls are 44×44 px or larger
- **Spacing:** Interactive elements are separated to avoid accidental activation
- **Long press:** No long-press gestures required; all actions are available via tap or button
- **Zoom:** The interface does not disable zoom; users can magnify content

### Cognitive Load
- **Simple language:** Text is written in plain, friendly language
- **Consistent patterns:** Common actions (playing a move, navigating) follow the same patterns throughout
- **Progress indicators:** Clear feedback on progress (loading, step counting, percentage bars)
- **Error messages:** Clear, actionable error messages without jargon
- **Task complexity:** Complex features (like game analysis) are optional; simple play is the primary path

## Known Limitations

### Screen Readers
- **Chessboard navigation:** The board is interactive and does not expose all square-by-square options to screen readers in real time. Players can use arrow keys and notation entry as an alternative (future enhancement).
- **Move replay:** The step-through controls (arrows, play/pause) are keyboard-accessible, but the board state is not continuously announced.

### Color Contrast
- **Grade color icons:** Grades (Best, Great, Good, Inaccuracy, Mistake, Blunder) are paired with text labels and icons, but the icon colors alone may not meet AAA contrast in all cases. Text labels and icons ensure meaning is conveyed.

### Animations
- **Particle effects:** Win/loss celebration particles are reduced but not fully disabled by prefers-reduced-motion to maintain some visual feedback. They are not required to understand the game outcome.

### Browser Support
- **iPhone Safari:** Haptic feedback toggle is hidden on iOS (not supported by Safari)
- **Private browsing:** Storage may be limited or unavailable; the app will still function but may not persist data

## Testing & Validation

### Tested Features
- Keyboard-only navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader testing with:
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (macOS, iOS)
- macOS accessibility settings (zoom, text size, motion)
- Windows High Contrast mode
- Android TalkBack

### Browser Test Matrix
- Chrome 90+ on Windows, macOS, Android
- Firefox 88+ on Windows, macOS
- Safari 14+ on macOS, iOS
- Edge 90+ on Windows

### Automated Testing
- ESLint with accessibility rules
- Axe accessibility checker (runs on deployment)
- Color contrast checker (design tokens verified before release)

## Accessibility Checklist

- [x] Semantic HTML (headings, lists, landmarks, labels)
- [x] ARIA roles and labels where needed
- [x] Color contrast (WCAG AA)
- [x] Keyboard navigation (Tab, Enter, Escape, arrow keys)
- [x] Focus management and visible focus indicator
- [x] No auto-playing video or sound (toggle required)
- [x] prefers-reduced-motion support
- [x] Form labels and instructions
- [x] Error messages clear and helpful
- [x] Touch target size (44×44 px)
- [x] Icons paired with text or labels
- [x] Consistent navigation and patterns
- [x] Testing with screen readers (NVDA, JAWS, VoiceOver)
- [ ] WCAG 2.1 AAA compliance (not required, but aspirational)
- [ ] Full expert accessibility review (recommended before major release)

## Feedback
If you encounter an accessibility issue or have suggestions for improvement, please report it through the Help & Support screen (Settings > Help and support) with details about:
- Your assistive technology or accessibility feature used
- The browser and device
- The action that failed or was difficult
- How you expected it to work

## Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Last Updated:** October 2026  
**Review Frequency:** Before each major release
