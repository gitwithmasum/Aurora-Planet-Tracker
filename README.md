<p align="center">
  <img src="src/assets/Aurora%20Planet%20Tracker%20Dashboard.png" alt="Aurora Planet Tracker — Pink & Gold Dashboard Preview" width="100%" />
</p>

## v5.0.0 — Moonverse Observatory: Planetary Natural Satellite Explorer

- **A new EXPLORATION → Moonverse** module, available from Sidebar, Dashboard, Universal Space Search, Solar System's selected-planet panel and Planet Intelligence. Planet selection stays linked to the existing solar scene; previous satellite tracking continues to cover **artificial spacecraft**, not natural moons.
- **36 curated named natural moons** grouped by Earth, Mars, Jupiter, Saturn, Uranus, Neptune and dwarf planet Pluto. Mercury and Venus correctly present a *no confirmed natural moons* state. Major Galilean moons, Titan, Enceladus, Triton, Uranian moons and small Pluto satellites are included. **This is deliberately not the full recognized moon catalog**: NASA/JPL report hundreds of planetary satellites; a future catalog-expansion version may cover them. Do not equate curated counts with planetary totals.
- **Educational interactive 3D Moon System** in a separately lazy-loaded React Three Fiber scene. Rotate, zoom, pause/resume and control playback speed, select a moon by click or catalog and choose a model date. The parent globe uses the existing local planet textures (when present), otherwise an honest colored fallback. Saturn and Uranus have a lightweight representative ring. Scene rendering pauses when the viewport/tab is hidden or the user prefers reduced motion; no background sensor/GPS/remote data access is required.
- **Major-moon science profiles:** rounded mean radius, approximate orbital semimajor distance, sidereal period, eccentricity, discovery history, characteristic geology, major mission names, source links and scientific highlight. Named small moons with limited details show only values included in the curated dataset. Do not invent moon gravity, temperature, atmosphere or density when not verified.
- **CRITICAL DATA LABEL:** the 3D positions are **illustrative**, not current sky positions. `src/moonOrbitMath.mjs` uses a simplified Keplerian two-body ellipse with a chosen demonstration epoch and no measured initial orbital phases, node/inclination orientation, perturbations, obliquity or barycenter corrections. Orbital distances are logarithmically compressed and moon radii enlarged for visibility. Some moon periods carry a negative sign to indicate retrograde direction, but this visualization is **not** JPL Horizons ephemerides, cannot predict eclipses or actual satellite viewing positions, and does not promise scientific orbit accuracy. Source physical parameters are approximate, rounded and not all equally well constrained.
- **Performance & access:** scene caps active 3D moons at 12 while retaining the full selected-planet curated catalog in an accessible searchable list. Primary controls support keyboard selection and responsive 320px+ layout, with Halftone Pink & Gold and the other established Aurora themes retained.
- **Reference material:** [NASA Solar System Moons](https://science.nasa.gov/solar-system/moons/facts/), [JPL satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/), [JPL satellite orbital elements](https://ssd.jpl.nasa.gov/sats/elem/). Follow individual mission links from NASA for source interpretation.
- **Automated regression:** `tests/moonverseCore.test.mjs` validates group counts, input constraints, ellipse periodicity, prograde/retrograde treatment, finite geometry and performance cap. `tests/moonverseIntegration.test.mjs` guards navigation, bilingual search, planetary shortcuts, lazy scene and truthful orbital labels. Desktop and emulated-mobile Chromium QA now checks Jupiter/Europa, Mars/Phobos, Mercury empty state and horizontal layout, in addition to existing Field Journal, recovery and offline checks.
- **Release:** package, service worker, offline-assets generator and release QA versions use **v5.0.0**. Run `npm run qa` then `npm run qa:browser`; check real GitHub Actions results before claiming successful hosted deployment. Android/iOS physical-PWA and WebGL frame-rate tests remain separate. Next iteration: full confirmed moon catalog, mission-specific high-resolution image attribution, and real Horizons-driven ephemeris service with explicit UTC and API data-age handling.

## v4.9.0 — Real-Device PWA QA Center & Privacy-Safe Release Evidence

- Adds **SCIENCE → Device QA** as a separate lazy-loaded module, accessible from the Sidebar, Dashboard shortcuts and Universal Space Search, with Bangla/English primary UI and existing galaxy, cyber and pink/gold themes.
- **On-demand, in-browser diagnostics:** detected platform class (Windows, Android, iOS/iPadOS, macOS, Linux or Other), standalone display mode, connectivity, active service-worker controller, confirmed static JS/CSS asset cache completeness, temporary browser-local storage write/read, touch detection, reduced-motion preference, viewport dimensions, approximate storage usage/quota and browser requestAnimationFrame cadence. These probes do not request camera/GPS permission, do not activate sensors or upload data. An offline cache does not provide fresh satellite elements or live weather.
- **Manual physical-device checklist:** eight explicit tasks covering installed app icon launch, airplane-mode offline reload, touch/scroll, disposable journal persistence, backup/restore, sky interaction, optional permissions and user-approved updates. Each row defaults to **NOT TESTED**. PASS/FAILED/BLOCKED choices are saved to `aurora-device-qa-v1` in the current browser and are **self-reported only**. A full checklist does not constitute independently verified physical-device certification.
- **Privacy-minimized JSON QA export:** exports a versioned report with coarse platform, known numeric/boolean probes, manual checklist results and timestamp. It explicitly excludes raw user-agent strings, personal journal text, observer coordinates, location, accounts and secrets. Reports are local downloads; no cloud sync or persistent external monitoring is introduced. QA statuses are intentionally **not** included in Recovery Center journal backups.
- **Automated regression:** `tests/deviceQaCore.test.mjs` guards normalization, self-reported completion semantics, platform generalization and data exclusion; `tests/deviceQaIntegration.test.mjs` guards lazy navigation, primary bilingual labels and passive permissions. The desktop Chromium browser QA also opens Device QA, executes probes, selects a manual test result and downloads/checks the sanitized report.
- **Physical verification:** run tests on actual Windows 11/Android/iOS installed PWAs and keep real-world screenshots/evidence separate. Details: [v4.9 Physical Device QA Guide](docs/DEVICE_QA_v4.9.md). Chromium's Pixel emulation verifies an interface only; it is **not** a physical Android/iOS test and the displayed animation cadence is **not** GPU draw FPS.
- **Versioning:** package, built lazy-asset manifest, service worker cache and release fixtures are synchronized at **4.9.0**. Run `npm run qa` for Node/build/static checks and `npm run qa:browser` (after installing Playwright Chromium) for desktop/mobile-emulation PWA regression. Live Vercel/Pages deployment must be confirmed independently.

## v4.8.1 — QA Hotfix: Mobile Layout, Current Pages Smoke Test, CI Dependencies

- **CI findings from v4.8.0:** the GitHub Pages build and published HTML/JS/CSS initially succeeded, but its old browser smoke script still expected a removed `Search dashboard modules` input. The new **Universal Space Search** is a launcher/dialog. The Release QA desktop navigation, Field Journal persistence, JSON restore roundtrip and emulated mobile offline reload tests passed; its mobile layout test found **393px viewport / 408px page scroll width** on the Dashboard.
- **Responsive fix:** explicitly constrain the Dashboard's one-column grid track to `minmax(0,1fr)` rather than an implicit min-content track, and allow the search launcher to flex/shrink/wrap correctly at phone widths. The QA test now reports the specific elements overhanging the viewport instead of silently hiding overflow with `overflow-x:hidden`.
- **Current live smoke tests:** `scripts/browser-smoke.mjs` tests the real Universal Search → Earth Observation route, Dashboard hero/cards and theme, Satellite Tracker, Field Journal, Observation Analytics and Offline Recovery. The deeper local Chromium browser suite remains separate and tests backup restoration plus service-worker-controlled offline reload. Stale legacy v3 selectors and external weather-dependent checks are removed from the Pages smoke test.
- **Dependency installation reliability:** pin Vite `6.3.5` and compatible `@vitejs/plugin-react` `4.7.0`, and retry one transient npm install failure in the release and Pages workflows. We do **not** use `--legacy-peer-deps` or ignore real peer conflicts.
- **Version/pwa coherency:** `package.json`, `public/sw.js`, offline asset manifest output and relevant test fixtures are all versioned **4.8.1**, ensuring a new service-worker namespace for users who approve an update. No Field Journal schema or observing records are changed.
- **Release verification:** read the latest workflow logs rather than assuming source integration alone implies a successful deploy. A successful Vercel status is independent of GitHub Pages and actual hardware testing. The [physical cross-device QA matrix](docs/CROSS_DEVICE_QA_v4.8.md) remains pending real Android, Windows and iOS evidence.

## v4.8.0 — Release Stabilization & Cross-Device QA

- **PWA stability fix:** fixes a React effect bug where the visibility-change callback was registered before initialization, risking a runtime error in the header's PWA status/update controls. Keeps update checks throttled, user-approved and safe after unmount.
- **Accessible mobile navigation:** opening the drawer locks background scrolling, focuses navigation and traps Tab/Shift+Tab until dismissed. Escape closes the drawer and restores focus to the hamburger toggle; Sidebar identifies itself as a modal while open. On narrow displays, controls gain 44px minimum touch targets and safe-area spacing.
- **Cross-device responsive fixes:** replaces the clipped fixed-height mobile header with a wrapped layout and naturally sized language/theme/PWA tools; constrains main content, improves small-screen handling, and prevents iOS input zoom through 16px form fonts. Keeps existing galaxy and pink/gold themes.
- **Real headless Chromium browser QA (CI):** `scripts/browser-qa.mjs` launches Vite production preview and validates Dashboard boot, desktop navigation, Field Journal state across reloads, **Recovery JSON export → local reset → import → confirmed restore → reload**, mobile drawer navigation and keyboard dismissal, horizontal overflow, and a service-worker-controlled **offline reload** under mobile emulation. Failures save screenshots to `artifacts/browser-qa/`.
- **Cross-deployment regression:** the `Aurora Release QA` GitHub Actions workflow installs Playwright Chromium, runs browser QA against the GitHub Pages `/Aurora-Planet-Tracker/` build, rebuilds with `VERCEL=1`, checks the root-path distribution and repeats the browser tests. `npm run qa` remains the fast Node/build/static smoke gate; `npm run qa:browser` is the explicit headless browser command. Playwright is pinned to `1.64.1`.
- **Release integrity:** service worker, offline asset manifest, automated assertions, PWA version and npm release metadata all use **v4.8.0**. `tests/releaseStabilization.test.mjs` guards the previously failing callback order, accessible drawer, mobile CSS and presence of actual dual-base browser QA.
- **Physical QA remains separate:** the Android Pixel test is a **Chromium emulation**, not a test on a real Android phone. Real Windows/Android/iOS home-screen installation, iOS Safari service-worker offline mode, low-storage failures, physical device scroll FPS, camera sensors and touch performance need manual evidence. See [Cross-Device QA Matrix](docs/CROSS_DEVICE_QA_v4.8.md). A successful Vercel deployment does not automatically establish GitHub Actions or actual mobile installation success.

## v4.7.0 — PWA End-to-End Reliability & Data Integrity QA

- **Deployment-coherent offline shell:** the service worker pins HTML from its own successfully installed release and **never overwrites that offline copy** when an online navigation sees a newer deployment. This avoids pairing offline HTML with missing hashed JS/CSS from another release. Installation checks the matching `offline-assets.json` version, requires every HTML boot asset to appear in the manifest, and must fetch all boot JS/CSS before saving the offline HTML. A missing core bundle or wrong-version manifest rejects the new worker while leaving the previous active worker and its caches intact. Optional lazy modules may still be only partially cached; Offline Recovery reports that accurately.
- **Cache privacy and isolation:** fetch interception remains limited to GET requests in the worker's own origin and URL scope; only hashed JS/CSS and an allowlist of public images, icons, static satellite JSON and manifest assets can be cached. Private/API JSON routes and URLs with query parameters bypass runtime caching. Offline astronomy calculations may run with installed JS but **cloud forecasts and fresh satellite orbital elements are not guaranteed offline**.
- **Reconnect and user-controlled updates:** when connectivity returns or a tab is revisited, the PWA performs a throttled service-worker update check. Waiting workers are still activated only after a user confirms the update and is prompted to save in-progress field notes/back up local data. Background tab/controller changes never force a page reload without that explicit approval.
- **Safer Field Journal restore:** Merge fails before writing if combining sessions would exceed the 150-record cap; malformed local records or unknown/duplicate watchlist IDs fail closed. After each local-storage write, the recovery transaction reads back and verifies the value. On failure it attempts to return all touched keys to their previous contents and reports any rollback failures. This is best-effort browser-local integrity, **not a cross-device transactional database**.
- **Executable worker integration suite:** `tests/swRuntime.test.mjs` runs the real `public/sw.js` in a Node VM with simulated CacheStorage, network, service-worker events and response objects. It exercises installation, offline and online navigation, returning connectivity, lazy-bundle retrieval, API privacy, failed update retention, old-cache cleanup, partial-cache diagnostics and opportunistically cached imagery.
- **Production HTTP smoke checks for both deployment bases:** `scripts/smoke-static-build.mjs` serves actual `dist/` files over a temporary loopback server and verifies HTML boot assets, emitted manifest version, worker and every listed JS/CSS bundle through HTTP. `npm run qa` now runs the full tests, build/asset checks and GitHub Pages-path HTTP smoke; the GitHub Release QA workflow **also builds with `VERCEL=1`** and runs the root-domain smoke check.
- **Remaining manual QA:** these are meaningful Node-level integration and static HTTP tests, not actual installed mobile-PWA browser measurements. Verify Safari/Android offline installation, airplane-mode load, interrupted upgrade, real scroll/FPS and actual browser storage-quota behavior separately before calling device QA complete.

## v4.6.0 — Offline Reliability & Data Recovery

- **SCIENCE → Offline Recovery** is a dedicated, bilingual, mobile-responsive recovery hub. Also reachable from the Dashboard and Universal Space Search. Previous v4.5 performance work, all observing/science modules, themes, alerts and browser-local journal data stay intact.
- **Pre-cache lazy astronomy modules:** Vite now writes its build manifest (`build.manifest: true`). `scripts/build-offline-manifest.mjs` turns the emitted files into a validated `dist/offline-assets.json` list of JS/CSS, including dynamically imported module chunks. The service worker installs the same-origin app shell, bootstrap files and bounded optional JS/CSS chunks, preserving the previous active worker if core installation fails. The pre-cache is capped at **24 MiB** or **180 files**, prioritizing entry modules; incomplete optional pre-cache is reported accurately rather than silently promised as complete.
- **PWA cache diagnostics:** the recovery module sends a same-origin service-worker message to count listed/cached JS/CSS and display the current worker version and shell readiness. A complete JS/CSS cache **does not imply** all artwork, weather data, satellite orbit elements or third-party APIs are available offline. Images load opportunistically after they are visited; stale TLEs still fail the existing five-day freshness rule and are not treated as live.
- **Safer PWA update:** a new worker no longer forces every open tab to reload without warning. The installed waiting worker is activated **only after an explicit confirmation** to save unsaved notes/back up local data; a controller-change reload is performed only for that approved update.
- **Versioned local backup/recovery:** export `aurora-recovery-v1` JSON including **Field Journal sessions, the Observation Planner watchlist and a few explicitly supported preferences** (language, theme, graphics mode, collapsed-sidebar state). The backup does **not** contain unrelated browser data, login state, or external weather/satellite feeds. It **may contain personal journal notes and exact saved observer coordinates**. Store exports privately.
- **Restore preview and validation:** select a JSON file of **up to 2 MiB**, preview record/target/settings counts and whether coordinates are present; the file selection causes **no writes**. A separate confirmation can **Merge** valid journal records and watchlists while preserving existing preferences, or **Replace** those records and included preferences. Invalid/duplicate sessions, unknown target IDs, unsupported settings, malformed local input and oversized files fail closed. Changes use a best-effort rollback if storage writes fail; browsers can still disable/quota-limit local storage. Reload explicitly after a successful restore to refresh all modules.
- **Scoped privacy and reliability:** no cloud backup, automatic remote uploads or credential copying are added. PWA caches are for public same-origin files, never journal/session data. Clearing browser site data or using private browsing can still erase the recovery source; keep external backup copies.
- **Release validation:** run `npm run qa`, which executes the full Node test suite, then Vite production build, builds the offline manifest and verifies built entry assets. Tests include `tests/recoveryCore.test.mjs`, `tests/offlineManifest.test.mjs`, plus the `tests/productionAssets.test.mjs` check for the emitted offline manifest. Final live deployment and real mobile/offline browser regression must be checked separately; hosting build-rate limits may prevent the latest commit from going live.

## v4.5.0 — Performance Optimization & Release QA

This release focuses on **lower startup work, smooth scrolling, conditional WebGL animation and transparent QA**, rather than introducing more features.

- **Code-split Solar System 3D:** extracted the Three.js / React Three Fiber / drei + procedural surface generator and render effects to lazily imported `src/SolarScene.jsx`. Dashboard, Sky Tonight, Field Journal and research views no longer eagerly import the main WebGL renderer; user visits to Command Center or Solar System load it through a Suspense fallback. Existing orbit math, NASA/JPL texture selection, Earth cloud/city glow, ring shaders, bloom, scale modes and selection controls remain.
- **Pause invisible rendering:** a route-scoped `IntersectionObserver` watches the scene viewport (and disconnects on navigation). The canvas switches to React Three Fiber's render-on-demand mode when the tab is hidden, the viewport is out of view, the user presses Pause, or OS reduced-motion is enabled. Observer-independent 30-second application clock ticks also stop in hidden tabs, resuming immediately when visible. Older browsers without IntersectionObserver gracefully keep scene visible.
- **ECO-mode GPU savings:** antialiasing is disabled and WebGL requests a lower-power context when ECO quality is selected. Planet mesh segments are reduced on ECO hardware. Existing high-quality texture/geometry, realistic lighting and visual themes are preserved.
- **Scroll rendering:** removed smooth scrolling as a global default; disabled costly backdrop blurring for the sticky header/sidebar and heavy dashboard cards. Frozen full-screen cosmic background breathing animation; original theme colors and artwork are kept. Long field/report item lists use `content-visibility:auto` with size-appropriate placeholders when supported.
- **On-demand performance QA:** a new **PERF QA** button within Solar System / Command Center shows currently selected graphics mode, whether the canvas is actively animating, viewport intersection, reduced-motion preference, and a brief browser requestAnimationFrame cadence estimate. **Browser rAF is not measured WebGL GPU FPS**; use browser Performance/Rendering tools for real device FPS, memory, GPU metrics, energy cost and visual alignment. The sampling loop exists only while the QA panel is open and the scene is active.
- **Accessibility:** reduced-motion is respected even when users previously manually selected HIGH graphics, and user-driven orbit/camera controls still work in render-on-demand mode. Performance controls have keyboard focus and state labels.
- **Test and release gates:** added `tests/performanceRelease.test.mjs` with eight focused groups verifying viewport and motion policy, deferred WebGL imports, frame cadence parsing, active/demand renderer selection, scroll CSS and on-demand diagnostics. Run `npm run qa` for full `npm test` plus the production `vite build` and built-asset verification. A new read-only GitHub Actions workflow `.github/workflows/aurora-release-qa.yml` also runs tests and production build on main and pull requests.
- **Verification caveat:** the new structural/policy test groups were executed with a V8 compatibility harness. Full `npm run qa` in the GitHub runner, actual browser/mobile scroll FPS, Pages deployment and Vercel deployment remain separate checks and must not be asserted successful until verified. Hosting build-rate restrictions may block automatic deployment despite the committed source.

## v4.4.0 — Observation Analytics & Research Dashboard

- Adds the dedicated **SCIENCE → Observation Analytics** module to the existing Sidebar, Dashboard Mission shortcuts and Universal Space Search. **VIEW ANALYTICS** in Field Journal opens the new panel; **OPEN FIELD JOURNAL** returns directly to the source records. Preserves v4.3 sessions, v4.2 weather, v4.1 planning, themes, localization, PWA and science modules.
- All analytical results are derived from the user's **local browser Field Journal** using the existing validated session format; no cloud account, artificial sample data, telemetry or background task is introduced. Cross-tab edits refresh this view through the local storage event and there is an explicit refresh control.
- **Filtering:** last 7, 30 or 90 local calendar days, or all recorded sessions; category filters for planet, galaxy, satellite and custom objects. Date filters are based on the session's originally **scheduled local date** and exclude future sessions from historical ranges. A separate metric counts future planned sessions from all journal dates.
- **Research breakdowns:** planned / in-progress / completed, *self-reported* seen / not seen / unknown, distinct targets, category distribution, user-entered sky conditions, number of sessions with field notes and observing equipment, plus a top-20 target summary. Outcomes are not derived from astronomical predictions.
- **Responsible rate:** the displayed seen/explicit-attempts ratio is **seen / (seen + not seen)** among completed sessions with a specifically answered outcome. It is **unknown (—)** when the denominator is zero; completed-but-unknown and unattempted sessions are excluded. This is not a detection-efficiency or scientific forecast-accuracy score.
- **Low-overhead charts:** a bounded local-day timeline displays counts of *scheduled sessions* and currently marked self-reported sightings for those scheduled dates, with up to 30 days displayed at once. Interactive controls update on demand using memoized pure calculations; the chart uses HTML/CSS, not heavy WebGL.
- **Aggregate research export:** downloadable JSON, CSV and TXT contain **aggregated counts**, target names and a daily timeline, but **never export raw session notes, observer names or GPS coordinates**. Beware that user-supplied custom target names may contain identifying information. CSV quoting protects custom target names beginning with spreadsheet formula characters. For complete individual-record backups use the existing Field Journal exporter instead.
- **Responsive UI:** existing galaxy/nebula themes and Halftone Pink & Gold are supported, including mobile screens and reduced-motion settings; bilingual text for primary controls and explanations.
- **Tests:** `tests/observationAnalytics.test.mjs` covers a truly empty journal, date range handling, target filtering, self-reported outcome denominators, timeline consistency, notes/equipment coverage, invalid inputs and privacy-preserving JSON/CSV/TXT output. Separate production browser tests, GitHub Pages checks and full regression suite remain necessary.

## v4.3.0 — Astronomy Observation Sessions & Field Log

- Adds a dedicated **SCIENCE → Field Journal** module to the Sidebar, Dashboard shortcuts and Universal Space Search; preserves Planet/Galaxy Observation Planner, Satellite Weather, Space Intelligence, AR and themes.
- Create an observation **session** with a planned local time, target selected from the planet, galaxy and curated satellite catalogs, or a custom target. The user's explicitly selected observer label and coordinates are saved as a session snapshot in browser localStorage, not uploaded.
- **Planned → In progress → Completed** statuses, with **Observed by me**, **Not observed** and **Not attempted/unknown** outcomes. Predicted or simulated objects never automatically become actual sighting records: outcomes are **self-reported, not independently verified**.
- Field notes up to 2,000 characters, equipment, sky conditions and atmospheric seeing; edit, start, finish, delete with confirmation, search and status filters. Each entry retains immutable ID, target and captured observer.
- **LOG SESSION** from Planet/Galaxy Observation Planner and **LOG THIS PASS** from Satellite Weather open a prefilled log with selected target and estimated starting time.
- Export your records as a portable **JSON** backup, a **CSV** table or a printable **TXT** science field report. Import valid Aurora JSON backups (file limit 1 MB); normalize and deduplicate records by ID and latest edit timestamp. CSV fields are escaped against spreadsheet formula execution. Capacity is 150 valid sessions.
- Privacy and reliability: no GPS, camera, account or notification permissions are newly requested. Journal is local browser storage with cross-tab storage-event refresh. Export regular backups; site data clearing may erase entries. JSON/CSV/TXT exports can contain personal field notes and saved coordinates — share intentionally.
- Regression tests in **tests/fieldJournal.test.mjs** cover creation, sightings, update invariants, observer validation, note caps, duplicate merge, reporting totals and CSV safety. Production mobile and browser QA remain separate.

## v4.2.0 — Satellite Observation Planner & Weather Intelligence

- Adds a dedicated **SCIENCE → Satellite Weather** module, reachable via Sidebar, Dashboard quick links, or Universal Space Search. All prior satellite visualization, ISS alert, research dashboard, AR, Earth Observation, v4.1 observation planner, themes, and PWA functionality remain.
- **Validated 24-hour satellite pass planner:** uses the existing curated, recent satellite TLE catalog and shared `satellitePassPlanner.mjs` 30-second SGP4 pass sampling. Selecting a satellite and minimum peak elevation (10°/15°/20°/30°) displays approximate pass start/end, peak elevation, and direction from true north. No invented live spacecraft telemetry.
- **Estimated satellite sunlight at pass peak** reuses the educational simplified Earth-shadow model from `issVisibility.mjs`, and compares observer Sun altitude with the civil-twilight (−6°) threshold. This is not apparent magnitude, precise Earth penumbra, or a guarantee that a satellite can be seen.
- **On-demand Open-Meteo weather:** click **LOAD WEATHER** to send the already selected observer coordinates to the provider; no new GPS permission is requested. A three-day UTC hourly forecast provides cloud cover, precipitation and precipitation probability, which are matched to each predicted pass **only if an hourly sample is within 70 minutes of the pass peak**. No extrapolation, and mismatched coordinates cannot reuse forecast results.
- **Honest assessment:** distinguishes `Potential window`, `Mixed conditions`, `Cloud limited`, `Rain risk`, `Earth shadow`, `Sky too bright`, `Low horizon`, `Geometry favorable` (weather unknown), and `Unknown`. These are descriptive, qualitative heuristics, **not probability scores**. Missing, expired (older than three hours since fetching), or unsuccessful weather forecasts cannot produce a weather-supported `Potential window`.
- **Data provenance and limitations:** satellite provider and fetch timestamp are displayed when available; each selected spacecraft shows TLE epoch age and freshness category. Real atmospheric visibility, light pollution, terrain and local cloud variability are unmodeled. Predictions are not background monitoring and this page does not schedule notifications; the existing Satellite Tracker alert system remains separate.
- **Performance and UI:** only loads satellite TLE when this route is visited; only propagates the **selected** satellite for 24 hours, memoized per minute; weather is loaded only through an explicit user action, with cancellation on route/unmount. Fits galaxy themes and Halftone Pink & Gold, with responsive cards and Bangla/English interface text.
- **Regression coverage:** `tests/satelliteWeatherMath.test.mjs` includes 8 test groups for hourly UTC parsing and rejection of invalid data, strictly bounded forecast matching, observer-coordinate cache protection, Sun/shadow qualification, missing weather, rain/cloud classes and expiry. Live browser/FPS and complete CI test suite are tracked separately.

## v4.1.0 — Smart Astronomy Observation Planner

- **Science → Observation Planner** is a dedicated observing-session planner, accessible through Sidebar, Dashboard quick links and Universal Space Search. Existing scientific modules, themes and PWA settings remain in place.
- Uses **Astronomy Engine planet positions**, the existing **Galaxy Observatory catalog**, and observer latitude/longitude already selected in the app to find the next 24 hours of potential astronomical observing intervals for seven planets (Earth is not a sky target) and ten curated galaxies.
- **Conservative sample-based timing**: local calculations check target altitude and solar altitude at 15-minute intervals. An interval must have at least two adjacent qualifying samples to be listed; times are approximations, not precise rise/set crossings. The prediction updates as the 15-minute clock bucket changes or filters are changed.
- Interactive constraints: minimum target altitude (15°, 25°, 35° or 45°), Sun altitude threshold (−6°, −12° or −18°), target category and shortlist-only filter. Cards show a first estimated interval, peak sample altitude, approximate bearing and interval length. Results are ordered by the start of the nearest qualifying window.
- **Observation shortlist:** bookmark targets locally via `localStorage`; storage failures are tolerated. Saved target IDs are validated against the 17 known catalog objects and deduplicated. No location or notes are uploaded.
- **Local calendar export:** download an individual target's next estimated window or export one next window for each shortlisted target as a standard `.ics` file, which can be imported into Google Calendar, Outlook or compatible applications. This is a local file export, not a notification service or direct calendar integration; an import is necessary before calendar entries exist.
- **Scientific limitations:** geometric visibility does not guarantee naked-eye visibility, weather/cloud clearance, dark-sky quality, or telescope suitability. Moon illumination is displayed as context only, not used for a scientifically unjustified numerical visibility score; light pollution, terrain, obstruction and weather are not incorporated.
- **Performance and testing:** visibility calculations only run when the Planner route is open; Sun altitude is sampled once per time step, and model calculations are memoized for 15-minute clock buckets. `tests/observationPlanner.test.mjs` covers twilight thresholds, windows, missing records, shortlist validation and ICS output. Full production browser/regression testing remains required.

## v4.0.0 — Advanced Space Intelligence

- Adds a dedicated **Science → Space Intelligence** module in the sidebar, reachable through Universal Search or the Dashboard's Mission Control shortcuts. Preserves all existing v3.9 search, multi-satellite, AR, NASA imagery, galaxy, PWA and theme modules.
- **Scientific orbital overview** uses the same validated, recently ingested public orbital element records as Satellite Tracker. Users can select a spacecraft and inspect SGP4-derived orbital inclination, eccentricity, approximate orbital period and revolutions/day, propagated geodetic altitude and speed, and observer-relative true-north bearing, elevation and slant range. Values are calculated estimates, not live satellite downlink telemetry.
- **Data quality and provenance** show each selected TLE epoch and its age relative to the displayed model time, a transparent age category (recent: ≤24h; monitor: >24–72h; aging: >72h), public source and source refresh timestamp when provided. These labels **are not accuracy scores**, nor do they give statistical error bars. Invalid/missing elements never produce fabricated orbital values.
- **Observer-based sky science** shows computed Sun altitude, Moon illumination, darkness/twilight context, above-horizon planet angles and known catalog galaxies visible *geometrically above the horizon*; users can open a galaxy in its existing Observatory. Optical visibility is not guaranteed by geometry.
- **Time shift** lets visitors compare NOW with ±30 and ±60-minute model times, explicitly labeling predictions. It does not change the app's stored observer coordinates, system time or alerts.
- **No new permissions:** reuses the existing manual/GPS observer already set in the app, without accessing GPS, microphone or camera from the new module. Celestial coordinates are computed locally with Astronomy Engine; valid TLEs are propagated by satellite.js/SGP4. Satellite data is only fetched when the module is opened or explicitly refreshed.
- **Language and presentation:** SCIENCE sidebar navigation, Universal Search entry, bilingual page headings/explanations, dark galaxy and Halftone Pink & Gold UI with responsive data panels.
- **Regression coverage:** `tests/spaceScienceMath.test.mjs` tests orbital units, epoch-age thresholds, missing records and observer coordinate validation. Real-device browser QA and production deployment verification remain separate tasks.

## v3.9.0 — Universal Space Search

- New global **Universal Space Search** panel available from the top bar and Dashboard search launcher; open from any page with **Ctrl+K / Cmd+K**, dismiss using Escape or the close button.
- Searches the actual **eight app planets**, the **ten galaxies** from the existing Galaxy Observatory catalog, the **validated current satellite catalog** (name, category and NORAD ID), and all ten main application modules.
- Supports partial names, case-insensitive matching, Messier identifiers (e.g. M31), NORAD identifiers (e.g. 25544), relevant keywords and multi-term lookups. Exact and title matches are prioritized, and results are bounded for responsiveness.
- Selecting a planet opens its **Planet Intelligence** detail. Selecting a validated spacecraft focuses that craft in **Satellite Tracker**. Selecting a galaxy opens its **Galaxy Observatory** entry. Modules navigate to their existing pages without resetting existing app settings.
- Satellite orbital rows are loaded **on demand**, only when search opens, and restricted to validated, recent TLE records. If the network/catalog is unavailable, planet, galaxy and module search still work, with an explicit satellite status; no fake spacecraft telemetry is displayed.
- Responsive, keyboard-operable search dialog provides arrow-key selection, Enter-to-open, Escape-to-close, focus return, theme-aware styling and English/Bangla prompts. No server search history, login or new permission is required.
- Regression tests in `tests/spaceSearch.test.mjs` cover categories, alias matches, NORAD/Messier IDs, ranking, result limits and offline behavior. Device-level mobile browser QA and live deployment verification remain required.

## v3.8.0 — Ultimate Performance & Stability

- **Adaptive graphics:** the 3D Solar System now defaults to AUTO graphics quality. A conservative, capability-based decision uses available CPU cores, device memory, viewport size, coarse pointer, reduced-motion preferences and Save-Data settings. No device identification or extra permissions. Users can override with HIGH or ECO; that selection persists locally.
- **Foreground-aware rendering:** Solar System and Earth Observation WebGL scenes stop continuous rendering when the app tab is hidden, resuming on return. Earth Observation also suspends its 1-second simulation clock and imagery timeline playback in the background.
- **Reduced frame allocations:** solar planet camera tracking and Earth Observation's globe-follow camera reuse Three.js vectors rather than allocating transient vectors every animation frame.
- **Smoother scrolling:** ECO mode omits fixed noise and expensive glass backdrop blur, while dark-mode header blur and fixed cosmic background rendering are simplified. The underlying original wallpaper and all four selectable appearances remain.
- **Earth Observation integration:** its initial ECO recommendation follows the app's resolved AUTO/HIGH/ECO choice; the module's own graphics toggle remains manually adjustable.
- **PWA release safety:** cache namespace advanced to `aurora-v3.8.0` to avoid accidentally mixing old application shell/assets after upgrade.
- **Regression coverage:** `tests/performance.test.mjs` checks AUTO quality selection, low-end devices, accessibility preferences, missing browser metrics and manual overrides. The existing `npm test` and `npm run build` commands remain unchanged.
- **QA limitation:** actual browser FPS, Android/iOS GPU and production deployment success still require observed device/browser and CI checks; no unverified speed-up percentage is claimed.

## v3.7.0 — Pink & Gold Typography Halftone Theme + Dashboard

- Adds **Halftone · Pink & Gold Text** as a fourth app appearance, selectable from the existing header Theme dropdown and saved in localStorage. Previous Classic Cyber, Deep Galaxy and Full Galaxy Nebula themes remain selectable. New installations default to Halftone; existing stored preferences are respected.
- The entire app shell, sidebar and welcome screen use an original **white-and-teal flowing halftone dot-wave illustration** inspired by the user's supplied reference. **Pink and gold are typographic accents**; backgrounds stay white/teal, with translucent glass surfaces and teal iconography.
- Adds a **new, real Dashboard page** in the sidebar, preserving the original Command Center separately. Dashboard contains a responsive real 3D Earth preview (existing Earth texture), factual mission modules that open their pages, quick search/navigation, a satellite catalog count (when data available), observer-aware above-horizon planet overview, quick mission links and existing Earth imagery navigation.
- Fictional stats from concept mockups (e.g. 99.9% uptime, arbitrary satellite counts, Pro billing) are **not implemented**. All visible figures are calculated or labeled according to available public data.
- The original Solar System, Satellite Tracker, Earth Observation, AR Scanner, Sky Tonight, Galaxy Observatory, persistent language/nav preferences and existing astronomy data are preserved.
- QA includes updated Chromium smoke testing of full-page halftone wallpaper, Dashboard component, keyword search and route navigation, followed by existing orbital and imagery regression checks.
- Existing browsers with a stored older appearance keep that preference; select **Halftone · Pink & Gold Text** once to switch.

## v3.6.0 — Global Location Explorer

- A separate worldwide **Global Location Explorer** panel inside Earth Observation: on-demand city/place search via Open-Meteo Geocoding API, country/admin labels, validated manual latitude and longitude coordinates, and location-specific globe focusing.
- Search is debounced and stale network requests are canceled, preventing excessive browser requests. Coordinate focus works without a geocoding/weather response.
- On selecting a location, requests current model-estimated temperature, cloud coverage, precipitation and wind, plus dated recent daily temperature/precipitation history and a lightweight chart.
- The existing v3.5 curated offline-friendly 18-city summary remains available below; historical dates and source attribution are preserved.
- Global search and selected coordinates make direct requests to Open-Meteo servers. No geolocation permission, camera upload or persistent location collection is added.
- Unit tests validate coordinate boundaries, geocoding normalization and dated weather response; Chromium smoke checks manual coordinate focus, Kyoto geocoding and current weather.
- Live global queries depend on third-party availability and connection; the Earth globe and other modules continue functioning when those services fail.

## v3.5.0 — Earth Observation Intelligence

- Independent Earth Observation page gains a searchable **curated city/country location explorer** (18 supported cities), country filter, smooth 3D city camera focus, and a selected-location map marker. This is not a worldwide geocoding service.
- Open-Meteo model-based current estimates for temperature, cloud coverage, precipitation, humidity and wind, with a dated 7-day daily-min/max temperature history chart and precipitation table.
- A historical comparison tool displays recent daily-midpoint averages and 7-day rainfall totals for two selected cities.
- First-party validated JSON is updated using scheduled GitHub Actions every ~4 hours. The observedAt source timestamp is shown and values are not presented as guaranteed station measurements.
- Existing satellite controls, NASA EONET events, imagery mosaics, timelines, browser permissions and AR systems are preserved.
- Unit and Chromium smoke tests cover source validation, country filtering, Dhaka focus, Tokyo comparison, and prior satellite/imagery workflows.
- No GPS location access is requested; the user selects from fixed named cities.

## v3.4.0 — Advanced Earth Visualization

- NASA MODIS Terra imagery gains an **archive timeline**, previous/next controls and optional playback cycling through **available actual dated mosaics only**.
- **Before/After** uses a responsive 2D swipe-preview with independent dates and adjustable split; the 3D globe continues showing the selected AFTER date. No costly second WebGL renderer.
- A cloud-coverage marker-size slider visualizes sparse **Open-Meteo estimated cloud percentages**—not a continuous weather-satellite cloud sheet. NONE correctly removes weather point markers.
- ECO graphics now defaults on for smaller screens or reduced-motion preferences. Existing manual ECO control remains available.
- New unit tests cover archive ordering, comparison validation and marker bounds. Live browser smoke test covers date comparison and cloud controls.
- Imagery layers, NASA events, orbital trajectories, AR Finder, observations and earlier user preferences are preserved.
- Image differences can represent cloud variability, imaging swath gaps, viewing geometry and acquisition changes—not necessarily physical changes on Earth.

## v3.3.0 — NASA Worldview Imagery (NASA GIBS)

- NASA GIBS WMS provides actual **MODIS Terra corrected-reflectance true-color daily browse mosaics** for the Earth Observation globe, saved as date-specific JPEG snapshots on GitHub Pages.
- A scheduled GitHub Actions workflow refreshes up to three dated equirectangular mosaics daily; first-party static imagery paths avoid browser cross-origin dependencies.
- In Earth Observation, the user can opt into the NASA imagery overlay, select an archived date, and adjust the overlay opacity from 20% to 100%. The original Earth texture remains if imagery fails or is disabled.
- Source, provider, dataset, mosaic date and texture loading state are explicit. GIBS daily browse imagery can contain gaps or missing swaths and is **not a live stream or a single instant global photograph**.
- NASA MODIS Terra imagery and NASA Worldview are separate from the Open-Meteo forecast-based cloud percentage markers; prior overlays and tracking features remain unaffected.
- Ingestion verifies JPEG content and only publishes dated images; unit and browser tests check manifest validation, archive switching and successful WebGL texture loading.
- NASA GIBS API: https://nasa-gibs.github.io/gibs-api-docs/access-basics/ ; Worldview: https://worldview.earthdata.nasa.gov/.

## v3.2.0 — NASA Earth Events Explorer

- Filter **NASA EONET** events by category, date range (7, 14, 30, 90, 365 days), or case-insensitive search.
- Select a dated event to highlight its coordinates and smoothly center the interactive 3D Earth camera on the reported point. Exit event focus to resume regular orbit viewing.
- Event details link to the official NASA EONET source record. An event location is a reported point, not a verified hazard footprint.
- Existing weather layers, six-craft satellite mission view, pass predictors, alerts and AR Finder are unchanged.
- New unit and live Chromium browser tests cover filtering, event selection, camera focus, source link and empty state.
- NASA Worldview raster imagery is **not included in this release**: use only after dataset/time licensing, projection and tile-delivery checks. EONET events can be updated retrospectively and this view is not an emergency alert service.

## v3.1.0 — Earth Science Data Layers

- **Independent Earth Observation** page gains optional cloud coverage, 2m air temperature and precipitation sample-marker overlays, plus recent NASA EONET event locations on the existing 3D Earth.
- Weather data comes from **Open-Meteo current model estimates** at **20 intentionally sparse world reference points**—not a uniform raster, satellite-derived global cloud texture, or direct real-time measurements. Source-specific timestamps are shown.
- NASA EONET v3 provides curated open event reports with dated geographic coordinates. Not all events represent live activity and the Earth markers are approximate event-report locations, **not** emergency alerts or footprints.
- A scheduled GitHub Actions ingestion job refreshes the first-party dataset approximately every three hours. Each upstream provider's values and original timestamps remain intact when a provider is temporarily unavailable; the UI displays warnings.
- Dataset markers, a searchable-looking sample card collection, source attribution, date readouts, selected-sample details and enabled/disabled overlays improve the Earth observation explorer.
- Browser tests validate cloud and event layer switching and first-party data loading. Unit tests validate ranges, coordinates, timestamps and layer labels.
- Existing 3D Earth, satellite labels, follow-camera, time offset, Satellite Tracker, AR Finder and alerts are preserved.
- Source references: https://open-meteo.com/en/docs and https://eonet.gsfc.nasa.gov/docs/v3 .

## v3.0.0 — Earth Observation, Phase A

- Introduces **Earth Observation** as a dedicated page in the Observation sidebar. The existing Satellite Tracker and other modules remain independent.
- A full-size interactive WebGL Earth globe uses the bundled Earth texture and calculates locations/colored orbital paths from validated public TLEs. Search the catalog, select a craft, show/hide individual orbits, enable labels, and smoothly follow the selected satellite.
- Maximum six visible satellite orbit tracks, plus reduced star count/DPR eco mode, to bound graphics and SGP4 update work on mobile devices. Time offset can vary ±90 minutes; pause/resume simulation and reset time.
- Shows mission info, current estimated altitude, speed, coordinates and NORAD ID. This is educational, computed SGP4 telemetry—not direct live spacecraft tracking or NASA affiliation.
- NASA-style Earth-science data layers and recent-event feeds are **not** included in Phase A; they require properly sourced timestamped datasets and separate QA.
- A Chromium browser regression test navigates into the independent Earth Observation page, selects Hubble and verifies Follow Satellite toggle.
- Actual Android GPU stability and camera behavior remain device QA items.

## v2.9.0 — Orbital Mission Control

- Mission dashboard inside Observation → Satellite Tracker: current catalog count, oldest orbital element age, number of locally recorded observations and comparison capacity.
- Up to **three satellites** can be compared side-by-side with their calculated latitude, longitude, altitude, velocity and orbit period at the same minute. A VIEW ORBIT action switches the existing globe/AR/pass calendar selection.
- **Observation history** saves manually initiated calculated snapshots and optional notes (240-character limit), allows record removal and clear-all with confirmation, and supports JSON export. The ledger is stored in localStorage and never uploaded.
- Validation rejects incomplete snapshots, deduplicates IDs and limits storage to 150 entries. Only the first 15 recent entries are displayed, with bounded history to prevent uncontrolled growth.
- Existing orbital catalog, alert permissions, Satellite Finder, saved settings and all other modules are preserved.
- QA includes unit tests for bounded/deduplicated history and comparison rows plus Chromium test for comparison and saving a local observation. Performance is bounded by three compared craft/minute; comprehensive performance benchmarking on real phones is pending.
- **Important:** These are propagated TLE estimates, not real satellite telemetry or evidence of a visually witnessed sighting.

## v2.8.1 — Satellite AR Reliability & Mobile Calibration

- Orientation sensor readings now expire after five seconds. An unavailable/stale or non-absolute heading falls back to manually calibrated heading rather than following an unreliable sensor direction.
- Automatic sensor-based pitch is now an explicit opt-in, labeled experimental. Manual elevation stays the default because DeviceOrientation beta is not a consistently calibrated rear-camera pitch.
- Camera tracks are stopped when the browser tab becomes hidden or the finder unmounts; delayed camera permission results are ignored after the user closes the finder.
- UI exposes fresh/stale sensor status, reported absolute compass status and screen rotation, with more robust narrow-screen HUD and calibration controls.
- Chromium smoke test checks the default stale sensor state and a 390px mobile viewport. Real Android/iOS camera and magnetic compass alignment are **not yet field verified**.
- The existing ISS pass alert, multi-satellite catalog, 3D globe and pass calendar remain unchanged.

## v2.8.0 — AR Satellite Finder

- New **camera-assisted satellite finder** in Observation → Satellite Tracker. Uses the selected ISS, Tiangong, Hubble, NOAA or Starlink craft's SGP4 look angles with the observer's location and time.
- Rear-camera live preview requests camera permission only when the user taps START CAMERA. Live camera tracks stop when turned off or the component unmounts.
- Optional DeviceOrientation compass permission uses absolute headings when reported. Relative (uncalibrated) alpha readings are not treated as verified north headings; manually adjustable compass offset and elevation remain available.
- Transparent on-camera HUD provides horizontal bearing, predicted elevation, left/right and up/down correction, and a projected marker when the target is above the horizon and within the estimated field of view.
- Manual heading, elevation, camera HFOV and sensor offset calibrations, with reset and browser-persisted heading/elevation/offset.
- Sensors and camera have explicit permission requests and fallback UI; no automatic video uploads, recordings or location sharing. GPS coordinates are requested only by an explicit user action.
- Camera alignment is educational and approximate: rear-camera pitch, optical field of view, magnetic interference and device orientation differ. Browser tests validate fallback/manual mode; actual phone sensor/camera field QA remains pending.

## v2.7.0 — Multi-Satellite Pass Predictor

- Dedicated **per-satellite pass calendar** under Satellite Tracker, available for any craft with validated TLE data in the v2.6 catalog (ISS, Tiangong, Hubble, NOAA, selected Starlink).
- 24-hour, 3-day and 7-day selection, plus 10°, 20° or 30° minimum elevation filters; pass times, bearings, peak altitude and an educational visibility-geometry estimate.
- Visibility estimates use approximate peak satellite sunlight, observer dusk/darkness and elevation, **not** observed optical magnitude, live clouds or a statistical probability. Long-range forecasts can diverge as TLE ages.
- **Opt-in custom satellite alert** per NORAD ID with 5/10/15/30-minute warning and optional synthesized sci-fi audio. Browser notifications require HTTPS/permission and alerts run only while the Satellite Tracker page is mounted/awake; no backend push exists.
- Favorites and individual alert settings persist in local browser storage. Session-level deduplication avoids repeated notifications for the same pass.
- Original always-available, app-wide ISS 10-minute alert remains unchanged; if both independent systems are enabled an ISS notification may occur from each.
- Regression tests for invalid orbit data, threshold boundaries and unique pass IDs, plus a Chromium smoke test opening the Hubble planner.
- Browser/device QA is still necessary to verify OS sound restrictions and suspended-tab behavior.

## v2.6.0 — Multi-Satellite Tracking

- Observation → Satellite Tracker now displays a searchable, category-filtered **multi-satellite catalog** with active NORAD IDs.
- Includes validated recent orbital elements for the **ISS (25544), Tiangong Tianhe (48274), Hubble (20580), NOAA 19 (33591), NOAA 20 (43013)** and a selected **sample of four Starlink craft** from a recent public TLE group. Starlink sample identifiers may vary when the catalog refreshes.
- Clicking a satellite switches the same interactive Earth globe, predicted 3D orbit trail, ground track, and derived altitude, speed, position and orbital-period telemetry to that craft.
- Scheduled GitHub Actions refreshes the published JSON catalog from CelesTrak approximately every six hours. Data is validated against NORAD ID and a recent orbital epoch; missing/stale objects are omitted, never replaced with invented telemetry.
- The first-party JSON catalog enables browser loading without cross-origin CelesTrak requests. A separate ISS data source is preserved as fallback.
- **ISS pass countdown, alert notifications and sounds remain ISS-only.** Selecting other satellites changes orbital visualization, not the ISS notification target.
- A category filter and name/NORAD search work with mobile layouts. Unit tests cover category search and rejection of invalid/stale orbital elements.
- Calculated positions use SGP4 orbital propagation, not direct satellite telemetry. This is an educational tracker, not authoritative positioning data.

## v2.5.4 — Satellite Tracker rendering hotfix

- Fixed a reproducible `TypeError: now.getTime is not a function` in orbit sampling: the 3D globe passed a numeric Unix-millisecond timestamp into a helper that previously required a `Date`.
- Orbit sampling now accepts both `Date` and timestamp, validating timestamps before propagation.
- Added an orbit regression test and extended the live Chromium smoke check to open the Satellite Tracker page and fail if its error boundary appears.
- Other astronomy features and saved preferences are unchanged.

# Aurora Planet Tracker

**Galactic Intelligence System — v2.3.1**

An immersive interactive space-themed web app with an animated galaxy entry, explorable 3D Solar System, planet intelligence cards, and observer-based astronomical planet coordinates.

## v2.5.0 — Interactive 3D Earth and ISS orbital tracker

- New **interactive 3D Earth globe** in Observation → Satellite Tracker, with OrbitControls drag-to-orbit and zoom and the existing NASA/JPL Earth surface image.
- **ISS calculated location:** satellite.js SGP4 propagates current ISS orbital elements and converts Earth-centered inertial vectors to geodetic Earth-fixed latitude/longitude/altitude, then to a globe marker and sampled 3D orbital trail.
- **Telemetry cards** show geodetic latitude, longitude, estimated orbital altitude in kilometers, inertial speed in km/s, orbital period, and the selected model time.
- **Ground-track map:** simplified equirectangular lat/long grid with dateline-safe path segments and current ISS point. Not a full GIS geographic basemap.
- **Time Warp:** −90 to +90 minutes for educational orbit preview and NOW reset. Path samples recalculate at minute resolution while satellite telemetry updates from the shared one-second clock.
- **Graphics quality:** balanced and mobile ECO mode, with reduced stars/pixel ratio/trail sampling for low-power devices.
- ISS **orbit data fetch is independent of notification opt-in**: users can explore the globe without enabling sounds or notifications. Existing pass alerts, countdown, chime and Sky Tonight remain.
- Automatic pass tracking still uses live orbital TLE fetched on client; when fresh elements are inaccessible, no ISS coordinates are fabricated.
- Astronomical accuracy limitations: 3D satellite marker is enlarged, Earth radius and relative altitude scale are schematic, TLE prediction accuracy deteriorates farther from epoch, and the orientation of the Earth surface map is illustrative rather than a certified geodetic visualization.
- Tests added for globe coordinate mapping, altitude scaling, missing data and international-dateline split. Manual browser/GPU testing remains necessary.

## v2.4.0 — Satellite Pass Alert with Sound

- **Satellite Tracker** is a dedicated Observation sidebar page that shares the existing global ISS alert state with Sky Tonight and offers observer coordinates, countdown, sound controls, and true-north direction guidance. The feature currently covers ISS, not arbitrary satellites.


- An opt-in **ENABLE PASS ALERTS** control in Sky Tonight uses live ISS TLE (NORAD 25544), existing satellite.js SGP4 pass predictions and an approximate 10° elevation threshold.
- While the application is open, it counts down to the next predicted pass and sends one notification per pass after the predicted pass start enters the 10-minute warning window; alerts also work when browsing other Aurora tabs (in-page panel).
- **North-referenced direction arrow** and compass bearing help indicate where to face; once a pass is underway the pointer uses updated ISS azimuth and altitude.
- **Synthesized sci-fi audio chime** with enable/disable switch and test button, implemented with Web Audio (no copyrighted audio files). User gesture is required to unlock sound.
- Browser notifications require explicit permission, HTTPS, and support from the browser. Alerts and audio are **not guaranteed when the browser tab or installed PWA is suspended, closed or background-throttled**; this is not an OS background scheduler or push notification system.
- Alert enablement persists on the current device, with an easy disable option. No browser notification permissions are requested until the user enables the feature.
- Disabled / stale / inaccessible ISS orbital data results in a clear status and no fabricated pass times.
- Includes tests for alert threshold, countdown, direction and pass selection. A real mobile device check is still required to validate sound unlock, browser notifications and page suspension behaviour.

## v2.3.1 — Startup Recovery & Asset Reliability

- Removed the blocking "Aurora startup recovery" panel. The application shows a lightweight loading state until React mounts.
- If app files fail to load, it automatically attempts one targeted service-worker/cache reset and reloads once. It never clears general localStorage, browser profiles, account logins or other sites' caches.
- When auto-repair fails, a non-destructive manual retry action and a specific error message remain available instead of an endless reload loop.
- The bootstrap now ignores third-party font/image load errors when deciding whether an app script failed.
- Production builds verify that HTML references the actual generated JS/CSS assets, and Vercel root-path resolution checks multiple Vercel environment signals.
- v2.3.1 rotates the Aurora-specific PWA cache namespace, preserving user data and all astronomy UI.

## v2.3.0 — Full ISS pass analysis and hourly weather

- Samples each predicted ISS pass at approximately 20-second steps, estimating Sun illumination, observer twilight and (when loaded) pass-time cloud forecast.
- Expandable timeline identifies likely favorable, cloud-limited, unfavorable and uncertain segments, and displays an estimated best viewing interval when available.
- Optional **LOAD LIVE WEATHER** calls Open-Meteo with user-selected latitude and longitude and requests current weather plus hourly UTC cloud forecasts; no weather data is sent or fetched without the user's action.
- Hourly forecasts are used only within 70 minutes of a matching forecast hour; missing or outdated forecasts are never represented as measured conditions.
- Adds tests for UTC forecast matching and invalid/missing data; detailed Android and iOS manual QA checklist in `docs/SKY-TONIGHT-MOBILE-QA.md`.
- These optical predictions remain **approximate**. Umbra estimation is simplified; estimated favorable segments are not an assurance of naked-eye visibility, and weather forecasts are not guaranteed.

## v2.2.1 — ISS visibility and local sky weather

- Per-ISS-pass **approximate** sunlight/shadow indication at maximum elevation using a geocentric Sun vector and cylindrical Earth shadow approximation. A sunlit satellite and sufficiently dark observer sky are classified as *potentially visible*, never guaranteed visible.
- Daytime passes and Earth-shadowed passes are labeled unlikely for naked-eye viewing. This does not substitute for full pass-wise illumination, penumbra modeling, atmospheric refraction, satellite brightness or observing conditions.
- Optional LOAD LIVE WEATHER explicitly sends selected coordinates to Open-Meteo for current cloud cover and precipitation only after user action; no continuous weather tracking.
- Cloud cover only influences the classification when the predicted peak is within one hour of the weather fetch. Current cloud cover is not treated as a future-hour forecast.
- CelesTrak ISS orbital elements may be inaccessible because of connectivity or browser CORS; when unavailable the interface does not invent pass times.
- Mobile responsive status cards and test coverage for unknown data. Existing Sky Tonight, ISS SGP4, Solar System, AR and Galaxy Observatory remain available.

## Start locally

```bash
npm install
npm run dev
```

Run a production build with `npm run build`. Deploy as a Vite app on Vercel: build command `npm run build`, output directory `dist`.

## Features

- Animated galaxy portal and responsive command-center interface
- Interactive Three.js Solar System: orbit, select, pan and zoom, cinematic planet-focus tracking; **procedural artistic materials, not photographic textures or to scale**
- Procedural gas bands and rocky surface variations, atmospheric glow, multi-layer Saturn rings and subtle Uranus ring
- Real astronomical altitudes, azimuths and approximate Earth distances via [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- GPS permission and manually editable latitude/longitude (Dhaka is only the illustrative default)
- Planet catalogue and search; pause/resume orbital animation
- Experimental mobile camera preview and direction sensor readout, with permission handling

## Scientific / AR limitations

The on-screen 3D orbit geometry and animation are **artistic**, not live ephemerides and not to scale. The position dashboard computes astronomical coordinates using actual observation time and selected Earth position. Above horizon is not the same as visible to the naked eye. Camera view does **not** yet align planet markers with the camera: camera-assisted scanning is a later development phase, and no image recognition is claimed. Compass readings are device/browser dependent. HTTPS is required for camera and GPS access on deployed websites.

## v1.2 cinematic universe controls

- **FOCUS PLANET** tracks the selected planet while preserving camera distance.
- **INSPECT** moves closer to the selected 3D planet; exit using **EXIT INSPECT**.
- **ORBIT SPEED** allows 0.25x / 1x / 3x / 8x simulated orbital animation (not physical-time ephemeris playback).
- **GRAPHICS** switches between high-detail starfield and reduced particle/GPU settings.
- Layered procedural galaxy dust adds depth to the 3D view.

These enhancements are artistic visualizations; precise sky coordinates still use the independent Astronomy Engine, not positions from the 3D scene.

## v1.3 — 360° Sky Observatory

- Interactive horizon-to-zenith azimuth projection and compass heading rotation, with calculated locations of planets above the horizon
- GPS and manually entered observer latitude/longitude
- Planet selection, altitude, azimuth, Earth distance, map-heading guidance
- Observation-time offset of −24 to +48 hours and quick return to now
- Sampled 24-hour geometric observing-window guide (planet altitude >= 10° and Sun altitude <= −6°); **not a weather, atmospheric, or naked-eye visibility forecast**
- The sky map uses physical ephemerides independently of the artistic 3D Solar System. This is not yet camera AR alignment.

## v1.4 — Mobile camera-assisted planet scanner

- Rear-facing camera preview (permission-based) with fallbacks when unavailable.
- Approximate planet markers calculated from observer coordinates and current time.
- Manually adjustable camera heading, elevation and horizontal field of view, plus reset controls.
- Experimental device orientation telemetry and optional unverified sensor-heading assistance.
- GPS or manually entered coordinates, selectable planets and estimated Earth distance.
- Sensor/browser caveats and simulated backdrop clearly identified in the UI.

**Scientific limitations:** This is approximate camera-assisted sky guidance, **not calibrated optical AR or image recognition**. Phone orientation alpha/beta readings are not reliable camera attitudes on all devices; the user must manually align the sky overlay. Camera FOV is a manual approximation and screen orientation/camera intrinsics are not fully calibrated. For accurate pointing, further calibration and real-device tests are required. Overlay markers can appear when planets are not optically visible.

## v1.5 — Mobile AR reliability pass

- Detect stale device orientation events and disable experimental sensor-heading controls when readings are stale or lack an absolute reference.
- Display screen rotation angle, camera stream resolution and honest calibration status in the AR telemetry panel.
- Detect unexpected camera track termination and show a restart error instead of silently leaving a frozen scanner.
- Manual heading/elevation/FOV controls remain the recommended fallback, and optically verified AR alignment is not claimed.
- GitHub Pages and Vercel use distinct Vite build bases to support both hosts.

**QA still required:** a successful CI build does not verify real camera and compass alignment; test physical Android/iPhone devices separately.

## v1.6 — Advanced perspective sky guidance

- Replaces the earlier linear azimuth/altitude screen placement with a perspective camera projection in local East/North/Up coordinates, incorporating heading, elevation, roll, horizontal field of view and measured viewport aspect.
- Supports manual roll correction and stores only non-location roll/FOV preferences locally.
- Calibrates experimental compass offset to a **user-confirmed known reference**, with a sensor-freshness safety fallback when device readings cease.
- Camera lens distortion, exact focal lengths, screen rotation transformations and physical device-camera alignment are **not yet independently calibrated**. This is not verified augmented-reality pointing accuracy.
- Deterministic node tests for projection center, cardinal direction, above/below, wraparound, roll and aspect; CI now runs these tests before building.

Validate with `npm test` and `npm run build`, then test on an actual smartphone over HTTPS. Do not use the marker alignment as a precision instrument.

## v1.7 — AR mobile field-test console

In **AR Scanner**, use the field-test checklist to verify HTTPS, rear camera, observer coordinates, compass, portrait/landscape handling, manual reference alignment, fallback controls, and camera restart. Add device/browser model and manual notes, then export a JSON diagnostic report locally. The app **does not upload** these reports and intentionally excludes observer GPS coordinates from the exported data. Reports may include your device/browser details; review before sharing.

A checklist completion is not a scientific accuracy certification. Marker placement remains approximate until device-specific optics and orientation calibration are empirically validated on real phones.

## v1.8.5 — Full Galaxy Nebula theme

- Added **Full Galaxy Nebula** as a third, persistent theme via the header selector, preserving Classic Cyber and Deep Galaxy.
- A new original locally hosted cyan-purple-magenta nebula SVG (not the watermarked user reference photograph) is used as the fixed full-page background, including navigation screens, Planet Intelligence, Sky Tracker, AR Scanner, and the entrance portal.
- Semi-transparent panels preserve contrast and readability while showing the cosmic background underneath. Smaller/mobile layouts retain a lightweight effect.
- No changes to astronomical calculations, location permissions, 3D controls or saved observations.

## v1.8.3 — Planet Intelligence visual redesign

- Replaced flat CSS-globe icons in Planet Intelligence with a reusable planet preview rendered from locally hosted NASA/JPL maps.
- Each selected planet has a prominent cinematic deep-space portrait with spherical lighting, controlled glow, surface texture and visual scale optimized for desktop/mobile.
- Saturn and Uranus previews use visible stylized rings. This is a *3D-looking CSS projection* rather than an orbiting WebGL globe; the main Solar System retains the existing real WebGL spheres.
- The eight small planet list icons use matching source-derived spherical thumbnail styling.
- Science distinction: generated cinematic concept art shown in ChatGPT is **not** represented as NASA photography; JPL maps used in the interface include reconstructed, false-color and representative source material. Consult `public/planet-textures/SOURCES.json`.

## v1.8.2 — NASA/JPL sourced planet surface maps

- 3D spheres now attempt to load locally hosted JPEG map textures from `public/planet-textures/`; they retain the original procedural fallback if download/import is unavailable.
- Official source catalog: [NASA/JPL Solar System Simulator](https://maps.jpl.nasa.gov/tmaps/). See `public/planet-textures/SOURCES.json` once the import workflow succeeds for per-planet credit and source URLs.
- Trigger the **Import NASA/JPL Planet Texture Maps** GitHub Action to download and commit source maps. It also runs when its workflow or import script changes.
- **Science disclosure:** Mercury is partly reconstructed; Venus is radar/false-color, Earth is a topographic rendering, Jupiter is an older representative Voyager mosaic. Saturn, Uranus and Neptune in this archive are explicitly fictional or representative textures, not raw NASA photographs; those assets improve cinematic appearance but are not authentic optical color measurements.
- Planet rotations, orbit radii and motion are still visualization art, **not an ephemeris-based 3D simulation**. Astronomy calculations used in Sky Tracker remain independent.
- No images from stock-photo screenshot or watermarked artwork have been embedded.

## v1.8.1 — Deep Galaxy theme

- Select **Deep Galaxy** or **Classic Cyber** from the header to change the visual universe without modifying scientific planet calculations.
- The Deep Galaxy theme adds an original, internally hosted nebula/starfield SVG and atmospheric styling to the entrance, 3D viewport, and glassy dashboard.
- Theme preference is saved in local storage. The source image is original SVG artwork—not the watermarked reference image supplied for inspiration.
- Existing 3D controls, Sky Tracker, AR Scanner and PWA features remain available. Actual photo-realistic planet textures are not part of this visual pass.

## v1.8 — Bilingual foundation, install and offline astronomy

- Manifest + SVG app icon, install prompt where supported; mobile Safari typically uses Share → Add to Home Screen instead of the browser install prompt.
- Same-origin service worker caches the application shell and hashed JavaScript/CSS bundles for repeat offline visits; astronomy calculations execute locally after the necessary scripts have been cached. Open the site online once after installation before testing offline.
- Offline access is best-effort; browser storage eviction, disabled JavaScript or cache clearing can make it unavailable. GPS permissions and live camera feeds are not offline data sources.
- English and Bangla language switcher with persisted preference. Core navigation, portal, primary dashboard actions, and selected Sky Map / AR Scanner labels are translated; **advanced telemetry and secondary panels are not fully localized yet**.
- Update notification appears when the service worker installs a replacement and is waiting for activation. Existing user observations and settings are not deleted by the worker.
- GitHub Pages repo base and Vercel root base are handled independently.

## Roadmap

v1.9 — complete Bangla localization, automated offline tests and PWA install QA; later — measured camera intrinsics and verified optical calibration on tested devices.

Built with React, Vite, React Three Fiber, Three.js and Astronomy Engine.
