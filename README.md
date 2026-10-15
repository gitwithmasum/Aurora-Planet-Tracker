# Aurora Planet Tracker

**Galactic Intelligence System — v1.6.0**

An immersive interactive space-themed web app with an animated galaxy entry, explorable 3D Solar System, planet intelligence cards, and observer-based astronomical planet coordinates.

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

## Roadmap

v1.7 — measured camera intrinsics, device-specific optical calibration and field QA; v1.8 — PWA, offline resilience and internationalization.

Built with React, Vite, React Three Fiber, Three.js and Astronomy Engine.
