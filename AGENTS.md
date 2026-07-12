# Instant Arena Shooter

Browser 3D FPS: WASD + mouse look, Space/click to shoot, 5 difficulty tiers (1-5 enemies). Vite + Three.js.

## Commands

- `just setup` — mise trust/install, npm install
- `just run` — dev server (user runs this, not the agent)
- `just build` / `just check` — production build
- `just shots` — capture `screenshots/*.png` via Puppeteer (dev server must already be running)

## Layout

- `src/main.js` — entry; exposes `window.__game` in dev only (`import.meta.env.DEV`)
- `src/game/Game.js` — loop, UI, lifecycle
- `src/game/world.js` — arena, constants, lighting
- `src/game/entities.js` — player + enemy
- `src/game/bullets.js` — projectiles + line-of-sight
- `scripts/capture-screenshots.mjs` — Puppeteer driver, drives `window.__game` to set tier/aim and screenshot

## Conventions

- Keep game logic in `src/game/`; no framework beyond Three.js
- WASD + mouse + Space/click (see `controls.js`); pointer lock for look
- Do not start dev servers from the agent session
- Screenshots are regenerated with `just shots`; do not edit PNGs by hand
