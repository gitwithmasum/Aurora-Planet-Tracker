# Aurora Planet Tracker

**Galactic Intelligence System — v1.3.0**

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

## Roadmap

v1.4 — calibrated AR sky markers; v1.5 — PWA, offline resilience, internationalization.

Built with React, Vite, React Three Fiber, Three.js and Astronomy Engine.
