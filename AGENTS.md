# Instant Arena Shooter

Browser 3D FPS: WASD + mouse look, Space/click to shoot, one AI enemy. Vite + Three.js.

## Commands

- `just setup` — mise trust/install, npm install
- `just run` — dev server (user runs this, not the agent)
- `just build` / `just check` — production build

## Layout

- `src/main.js` — entry
- `src/game/Game.js` — loop, UI, lifecycle
- `src/game/world.js` — arena, constants, lighting
- `src/game/entities.js` — player + enemy
- `src/game/bullets.js` — projectiles + line-of-sight

## Conventions

- Keep game logic in `src/game/`; no framework beyond Three.js
- WASD + mouse + Space/click (see `controls.js`); pointer lock for look
- Do not start dev servers from the agent session
