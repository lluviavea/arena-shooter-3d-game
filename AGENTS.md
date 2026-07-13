# Instant Arena Shooter

Browser 3D FPS: WASD + mouse look, Space/click to shoot, 5 difficulty tiers (1-5 enemies). Vite + Three.js. PS5 DualSense gamepad supported via the standard Gamepad API.

## Commands

- `just setup` — mise trust/install, npm install
- `just run` — dev server (user runs this, not the agent)
- `just build` / `just check` — production build
- `just shots` — capture `screenshots/*.png` via Puppeteer (dev server must already be running)

## Layout

- `src/main.js` — entry; exposes `window.__game` in dev only (`import.meta.env.DEV`)
- `src/game/Game.js` — loop, UI, lifecycle, menu poll (gamepad start/restart)
- `src/game/world.js` — arena, constants, lighting
- `src/game/entities.js` — player + enemy
- `src/game/bullets.js` — projectiles + line-of-sight
- `src/game/controls.js` — keyboard/mouse + PS5 DualSense gamepad (standard Gamepad API)
- `scripts/capture-screenshots.mjs` — Puppeteer driver, drives `window.__game` to set tier/aim and screenshot

## Conventions

- Keep game logic in `src/game/`; no framework beyond Three.js
- WASD + mouse + Space/click (see `controls.js`); pointer lock for look (skipped when a gamepad is active)
- Gamepad: left stick = move (analog), right stick X = look, R2 = shoot, Cross/Options = start/restart; vibration on player damage (Chromium only)
- Do not start dev servers from the agent session
- Screenshots are regenerated with `just shots`; do not edit PNGs by hand
