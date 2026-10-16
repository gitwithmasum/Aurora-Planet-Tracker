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
