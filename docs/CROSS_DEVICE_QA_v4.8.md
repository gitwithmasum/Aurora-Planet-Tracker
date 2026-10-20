# Aurora Planet Tracker v4.8 — Cross-Device Release QA

This document distinguishes **automated Chromium desktop/mobile emulation** from
**manual physical-device verification**. An emulated mobile viewport is not a
successful Android Chrome or iOS Safari installation.

## Automated local / CI commands

```bash
npm install
npm run qa
npx playwright install chromium
npm run qa:browser
```

`npm run qa` runs all Node tests, the production build, the generated offline
asset checks and the GitHub Pages-prefix HTTP smoke test. `npm run qa:browser`
launches Vite preview on localhost and opens **headless Chromium** at 1440×900
(desktop) and an emulated Pixel 7 touchscreen viewport (393×851).

The GitHub `Aurora Release QA` workflow additionally installs Chromium and
runs those browser tests **twice**: once against the `/Aurora-Planet-Tracker/`
base, then against a separately built root-path (Vercel) distribution.

### Browser-level acceptance

- App boot renders the Dashboard without unhandled page exceptions.
- Desktop Sidebar reaches Field Journal and Observation Analytics.
- No horizontal overflow at desktop and emulated mobile widths.
- Mobile Sidebar opens by touch, closes with Escape and navigates to Offline Recovery.
- Creating a Field Journal entry survives a real browser reload.
- A JSON backup can be downloaded, the original local journal cleared, the
  backup uploaded/validated/restored, and the record recovered after reload.
- With service worker installed and controlling the mobile emulation tab,
  a reload under browser-controlled offline mode still renders the app shell.

Screenshots from failed cases are written to `artifacts/browser-qa/` and
uploaded as a short-lived artifact by the GitHub Actions workflow when it fails.

**Automation limitations:** Browser tests emulate a device, network
conditions and Chromium's service worker; they cannot prove Android hardware
sensors, native PWA installation UX, the iOS share-sheet, persistent storage
under low disk space, realistic FPS, GPS permission UX or physical camera AR.

## Physical device matrix (manual — record evidence before marking PASS)

| Device/browser | Install path | Offline test | UI / touch check |
| --- | --- | --- | --- |
| Windows 11 Chrome | Browser Install app | Disconnect Wi-Fi and reload installed app | Sidebar, scrolling, field inputs, theme and recovery |
| Windows 11 Edge | Browser Apps → Install this site as an app | Offline reload | Window resizing, focus, keyboard shortcuts and touchpad |
| Android Chrome | Browser menu → Add to Home screen / Install app | Airplane mode after first successful online load | 320px/393px layouts, drawer gestures and keyboard |
| iOS Safari | Share → Add to Home Screen | Airplane mode after web app and cache are ready | Safe-area insets, no focus zoom, field inputs and overlay dismissal |

For each device, log OS/browser version, date, whether the app was launched
from the installed icon, route tested, observed behavior, screenshots or video
reference, and PASS/FAIL/SKIPPED (with reason). Do not record private GPS
coordinates or field-note content in public QA artifacts.

## Guided failure / upgrade cases

1. Save a new Field Journal entry with a recognizable **nonpersonal** label.
2. Export a Recovery backup; confirm the JSON includes the record and does
   **not** include external weather or satellite service credentials.
3. With the app previously loaded and controlled by the service worker,
   disable network access and reopen: previously cached routes should render.
4. In Offline Recovery, run `CHECK OFFLINE CACHE`. If cached files are
   incomplete, that module must display the incomplete count, not `complete`.
5. Return online; check weather or orbit feeds only with valid data. A stale
   TLE must not be represented as live just because the page loads offline.
6. When an updated worker becomes available, confirm that it prompts before
   reloading. Try canceling first: no reload should occur.
7. Export the backup again; delete or clear the **test-only** record, then
   import it in Offline Recovery. Review the preview before confirming.
8. Test both **Merge** and **Replace** on disposable test data. Verify the
   150-session limit cannot cause silent deletion, and that a storage failure
   shows an error. Never test Restore Replace on important original notes
   without an external backup.
9. Inspect keyboard focus, Tab/Shift+Tab cycling and Escape dismissal in the
   mobile drawer. Check screen widths 320, 360, 393, 768, 1024 and 1440px.
10. Profile scroll responsiveness and solar animation with actual hardware
    browser devtools; the on-screen rAF cadence is **not GPU draw FPS**.

## Release gate

Ship only after automated Node, desktop/mobile emulated Chromium, GitHub Pages
and Vercel-root build checks pass **and** any claimed physical-device QA has
recorded actual physical testing evidence.

A successful Vercel deployment status does not imply GitHub Pages deployment,
all GitHub Actions jobs or real-device installation have passed.
