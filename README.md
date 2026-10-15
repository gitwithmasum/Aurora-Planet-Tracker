# Aurora Planet Tracker

**Galactic Intelligence System — v1.1.0**

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

## Roadmap

v1.1 — realistic procedural planet materials and responsive visualization refinements; v1.2 — verified sky map and observing forecasts; v1.3 — calibrated AR sky markers; v1.4 — PWA, offline resilience, internationalization.

Built with React, Vite, React Three Fiber, Three.js and Astronomy Engine.
