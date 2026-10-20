# Aurora Planet Tracker v4.9 — Real-Device PWA Verification

This phase adds an in-app **SCIENCE → Device QA** workspace. Browser evidence,
user-confirmed hardware checks and actual cross-device release sign-off are
**three different things**. The app never marks a physical phone as verified
on the basis of automated Chromium emulation.

## Workflow (repeat on each actual device)

1. Update to v4.9.0 through a successful site deployment; open
   **SCIENCE → Device QA** and click **RUN DEVICE CHECKS**.
2. Review standalone/browser display mode, online state, service-worker
   control, cache entries, browser storage read-back, touch support, visible
   viewport and reduced-motion settings. A successful installed display
   flag means *only* that the web app is running in standalone display mode.
3. Install as a PWA and reopen using the installed icon (Android Chrome:
   Install app / Add to Home screen; Windows Chrome or Edge: Install app;
   iPhone/iPad Safari: Share → Add to Home Screen). PWA availability depends
   on the browser's support and installation policy.
4. With the site loaded successfully online, enable **airplane mode manually**.
   Reopen the installed PWA, navigate to Dashboard/Planet Intelligence and
   report whether cached science modules load. Live weather and new satellite
   TLE feeds may be unavailable offline.
5. Exercise scroll and touch gestures. At narrow widths verify that the page
   is not horizontally clipped; open and close the mobile Sidebar, including
   keyboard Escape if supported.
6. Before using Recovery, export a separate backup from **Offline Recovery**.
   Work with disposable sample data only; create a Field Journal sample,
   reload, export JSON, clear that sample and import/restore. Avoid using
   **Replace** on irreplaceable personal records.
7. Navigate to Sky Tonight, Solar System and AR Scanner. Verify device
   permission prompts only when you actually want to allow sensors or camera
   access. Test landscape portrait switching and reduced-motion preference.
8. When a new app worker is waiting, test that update asks permission, can
   be deferred, and preserves saved journal content.
9. For each row in Device QA manually select **PASS — SELF REPORTED**,
   **FAILED**, **BLOCKED / UNSUPPORTED** or **NOT TESTED**; select PASS only
   when the check actually succeeded on that physical device.
10. Click **EXPORT PRIVACY-SAFE QA JSON**. Repeat separately on Windows,
    Android and iOS as relevant. Attach observations/screenshots externally
    if you require documented device sign-off.

## What the diagnostic measures

| Browser probe | Meaning | Limitation |
| --- | --- | --- |
| Standalone display | Match media / iOS standalone flag | Not proof of hardware installation method |
| Service worker | API available and controller present | Not necessarily ready for offline use |
| Cache completeness | Service worker's matching-version listed JS/CSS | Does not include live weather or every image |
| Storage write/read | Temporary localStorage entry round-trip | Not a durability guarantee after clearing browser data |
| Browser storage estimate | Approximate browser quota/usage | May be unavailable or rounded for privacy |
| Touch | Coarse pointer or max touch points | Does not measure gesture accuracy |
| Screen | Browser inner width and height | Not physical display resolution |
| Animation cadence | User-triggered requestAnimationFrame cadence | **Not** Three.js GPU FPS or frame timing |

No GPS location, camera, microphone or other permission is requested by
the diagnostics. Their presence and operation must be tested separately.

## Report privacy and retention

The report exports **only** a coarse platform category, known boolean/numeric
browser probes, user-reported checklist states, release number and timestamp.
It excludes journal notes, observer coordinates, raw user-agent, GPS,
network addresses, accounts, permissions and tokens. Reports are saved
directly to the user's device and never uploaded by the QA module.
Checklist results are saved in this browser's localStorage under
`aurora-device-qa-v1`. They are intentionally not part of Recovery Center's
journal backup and will not automatically synchronize to other devices.

## Release sign-off

- Automated GitHub Actions `npm run qa` and `npm run qa:browser` must pass.
- Deployment must be confirmed on the actual target host, not inferred from a
  different provider.
- Physical-device manual checks are not complete merely because the summary
  says `PASS`: those are self-reported entries. Review tester identity and
  independent evidence outside this application as needed.
- A pass on emulated Android Chromium does **not** certify Android native
  installation, and does not test actual iOS Safari.
