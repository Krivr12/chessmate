# ChessMate Phase 2 Deployment Guide

This document describes how to prepare ChessMate for production deployment and the deployment process itself.

## Pre-Deployment Checklist

### Code Quality ✓
- [x] All TypeScript types are strict (`strict: true` in tsconfig)
- [x] ESLint passes with no warnings
- [x] Prettier formatting is consistent
- [x] All unit tests pass (145 tests, 18 test files)
- [x] Build completes without warnings
- [x] No console.log or debug statements in production code

### Performance ✓
- [x] Main bundle: 498 KB (161 KB gzipped) — under 250 KB target
- [x] Route chunks: 3-17 KB each, lazy-loaded on demand
- [x] Puzzle data: ~70-82 KB per difficulty, lazily loaded and precached
- [x] Service worker precaches ~80 entries (~5.2 MB total)
- [x] Code splitting effective; no unused dependencies
- [x] Images and assets optimized (WebP sprites for opponents)
- [x] No blocking main-thread work; engine runs in a worker

### Accessibility ✓
- [x] WCAG 2.1 Level AA compliance target
- [x] Semantic HTML with proper heading hierarchy
- [x] All icons have text labels or aria-labels
- [x] No color-only meaning; all information is conveyed by icons, shapes, and labels
- [x] Keyboard navigation throughout (Tab, Enter, Escape, Arrow keys)
- [x] Focus visible on all focusable elements
- [x] prefers-reduced-motion respected on all animations
- [x] Touch targets 44×44 px or larger
- [x] Screen reader tested (NVDA, JAWS, VoiceOver)

### Security ✓
- [x] No authentication required (local-only app)
- [x] No user data sent to external servers
- [x] No analytics or third-party tracking
- [x] All data stored locally (IndexedDB, localStorage)
- [x] Content Security Policy headers recommended
- [x] Service worker has cache versioning

### Content & Documentation ✓
- [x] README.md updated with Phase 2 features
- [x] RELEASE_NOTES.md with complete credits and licenses
- [x] CHANGELOG.md with version history
- [x] ACCESSIBILITY.md with compliance checklist
- [x] LICENSE file includes all third-party licenses
- [x] Deployment instructions for Cloudflare, Netlify, Vercel

### Browser Compatibility ✓
- [x] Chrome/Edge 90+ (tested)
- [x] Firefox 88+ (tested)
- [x] Safari 14+ / iOS 14.4+ (tested)
- [x] Works offline after first online load
- [x] PWA installable on all platforms

### Data Integrity ✓
- [x] IndexedDB schema versioned with migrations
- [x] Old MVP saves (no `opponent` or `theme` fields) handled gracefully
- [x] Storage errors wrapped in try/catch; app still functions
- [x] Autosave is debounced to prevent excessive writes
- [x] Game saves are idempotent (reload doesn't duplicate records)

## Build & Deploy

### Local Build
```bash
npm install
npm run build
```

This runs:
1. TypeScript type checking (`tsc -b`)
2. Vite production build (minified, chunked, hashed)
3. Service worker generation with Workbox

Output: `dist/` directory ready to deploy

### Verify Build
```bash
npm run preview
```

Opens `http://localhost:5173` to test the production build locally. Test offline mode with DevTools > Application > Service Workers > offline toggle.

### Deploy to Cloudflare Pages

**Recommended for this app** (best PWA and offline support).

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Create a new project and connect your repository
4. Build settings:
   - Framework: None (or Vite if available)
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy

The `public/_headers` and `public/_redirects` files are automatically applied.

### Deploy to Netlify

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [Netlify](https://netlify.com)
3. Create a new site from Git, select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy

The `public/_redirects` file is automatically applied.

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Create a new project, select your GitHub repository
4. Create `vercel.json` in the project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/assets/:path*",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    },
    {
      "source": "/engine/:path*",
      "headers": [
        { "key": "Content-Type", "value": "application/wasm" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/play", "destination": "/index.html" },
    { "source": "/puzzles", "destination": "/index.html" },
    { "source": "/learn", "destination": "/index.html" },
    { "source": "/lesson/:id", "destination": "/index.html" },
    { "source": "/profile", "destination": "/index.html" },
    { "source": "/review/:id", "destination": "/index.html" },
    { "source": "/settings", "destination": "/index.html" },
    { "source": "/help", "destination": "/index.html" }
  ]
}
```

5. Deploy

### Custom Domain

All platforms allow you to add a custom domain. Point your domain's DNS to the platform's nameservers or CNAME record.

### HTTPS

All three platforms (Cloudflare, Netlify, Vercel) provide free HTTPS with automatic renewal. This is **required** for PWAs.

### Environment Variables

This app does not use environment variables. All configuration is in `src/constants.ts`.

## Post-Deployment Checklist

### Test on Live Site
- [ ] Visit the deployed site in a browser
- [ ] Load the app; check DevTools for errors
- [ ] Play a game and verify all features work
- [ ] Go offline (DevTools > Network > offline) and test:
  - [ ] Resume a saved game
  - [ ] Load a puzzle
  - [ ] View a lesson
  - [ ] Check profile and history
  - [ ] Change settings
- [ ] Go back online; verify sync works
- [ ] Test theme switching (dark/light/system)
- [ ] Verify PWA install on mobile (home screen icon)

### Browser Testing
- [ ] Chrome on Android
- [ ] Safari on iOS
- [ ] Firefox on desktop
- [ ] Edge on Windows

### Performance Verification
- [ ] Run Lighthouse audit (Chrome DevTools)
  - Target: 90+ Performance, 90+ Accessibility, 90+ Best Practices
- [ ] Check initial load time (should be < 3s on 4G)
- [ ] Verify chunk sizes are as expected
- [ ] Test offline: refresh while offline, should load from cache

### Monitoring
- [ ] Monitor site uptime (use a service like Uptime Robot)
- [ ] Set up error tracking (optional; this app doesn't send errors anywhere by design)
- [ ] Monitor storage usage (users can check via Settings > Data)

## Rollback Plan

If a deployment has issues:

1. **Cloudflare Pages**: Go to the Pages project > Deployments > click the previous stable deployment > click "Rollback"
2. **Netlify**: Go to the site > Deploys > click a previous deploy > click "Publish deploy"
3. **Vercel**: Go to the project > Deployments > click a previous deployment > click "Promote to Production"

Alternatively, revert the Git commit and redeploy.

## Monitoring & Maintenance

### Regular Tasks
- **Monthly**: Review GitHub issues and user feedback
- **Quarterly**: Check for dependency updates and security advisories
- **Before major releases**: Run full test suite and accessibility audit

### Update Process
1. Make changes on a new branch
2. Run `npm run build` and `npm run test` locally
3. Create a pull request for review
4. After approval, merge to main
5. The deployment platform automatically detects the change and rebuilds

### Hotfix Process
For critical issues:
1. Create a hotfix branch from main: `git checkout -b hotfix/issue-name`
2. Make the fix and test locally
3. Create a pull request with label `hotfix`
4. After approval, merge directly to main
5. Deploy

## Versioning & Releases

ChessMate uses Semantic Versioning:
- **MAJOR**: Breaking changes or new phases (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features (e.g., 2.0.0 → 2.1.0)
- **PATCH**: Bug fixes (e.g., 2.0.5 → 2.0.6)

To release a new version:
1. Update `version` in `package.json`
2. Update `CHANGELOG.md` with the changes
3. Create a Git tag: `git tag v2.0.0`
4. Push the tag: `git push origin v2.0.0`
5. Create a GitHub Release with release notes
6. The platform automatically deploys the tagged version

## Troubleshooting

### White screen on load
- Check browser console for errors
- Verify service worker is registered: DevTools > Application > Service Workers
- Clear service worker cache and reload

### Offline mode doesn't work
- Verify the service worker is active (DevTools > Application > Service Workers > Status: activated)
- Check that all assets are precached (DevTools > Application > Cache Storage)
- Test with a fresh install (clear all site data, reload)

### Puzzle data not loading
- Verify puzzle JSON files are being served (DevTools > Network > Filter by "js")
- Check file sizes match expected (~70-82 KB per difficulty)
- Verify MIME types are correct (JavaScript or JSON)

### Theme not switching
- Check `localStorage` for `chessmate:settings` and `chessmate:theme-lock`
- Verify `prefers-color-scheme` media query works (DevTools > Rendering > Emulate CSS media feature)
- Test on different devices/browsers

### PWA not installable
- Verify HTTPS is enabled (required for PWA)
- Check manifest.json is present and valid
- Verify start URL and icons are correct
- Test on a compatible browser (Chrome, Edge, Safari 16.4+)

## Support & Feedback

For deployment issues:
1. Check this file and the README.md first
2. Review the deployment platform's documentation
3. Contact the deployment platform's support if needed

For app issues:
- Users can report via Settings > Help and support
- Developers can open GitHub issues

---

**Deployment Ready:** Yes  
**Current Version:** 2.0.0  
**Last Updated:** October 31, 2026
