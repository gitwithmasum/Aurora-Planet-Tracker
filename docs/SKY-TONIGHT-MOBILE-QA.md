# v2.3 — Sky Tonight mobile field-test checklist

Run these checks on the latest deployed build over HTTPS, ideally on Chrome Android and Safari iOS.

- [ ] Confirm version 2.3.0 in footer, no blank screen or console exceptions.
- [ ] Open **Observation → Sky Tonight** from mobile sidebar; verify drawer closes on selection.
- [ ] With GPS permission denied, verify manual latitude and longitude still work.
- [ ] With GPS permission granted, confirm position is updated only after pressing USE GPS.
- [ ] Confirm Moon and planet positions update after location changes.
- [ ] ISS: when orbital elements are available and fresh, pass cards include prediction times, approximate sunlight/darkness classification, and expandable timeline.
- [ ] Toggle full-pass analysis for first and another pass; verify no horizontal overflow at 320px and 390px widths.
- [ ] Press LOAD LIVE WEATHER: verify opt-in, current weather and hourly pass-time cloud matching. Deny/block network and confirm meaningful error instead of invented weather data.
- [ ] Check new times use device local timezone; weather forecast timestamps internally use UTC.
- [ ] Confirm dark and sunlit samples have correct legend colors, and no explicit naked-eye visibility guarantee is shown.
- [ ] Test throttled 3G, offline installed PWA, orientation changes, gesture sidebar, and low-power/reduced-motion mode.
- [ ] Check Vercel and GitHub Pages independently; record browser version, device, UTC test time, observer coordinates, console errors and screenshots.

**Important:** CI is NOT a substitute for physical-device verification or for validating ISS optical visibility against actual observer reports.
