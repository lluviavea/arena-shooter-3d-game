# Instant Arena Shooter

Browser 3D FPS: arrow keys + space, one AI enemy. Vite + Three.js.

## Commands

- `just setup` — mise trust/install, npm install
- `just run` — dev server (user runs this, not the agent)
- `just build` / `just test` — build and lint check

## Layout

- `src/main.js` — entry
- `src/game/Game.js` — loop, UI, lifecycle
- `src/game/world.js` — arena, constants, lighting
- `src/game/entities.js` — player + enemy
- `src/game/bullets.js` — projectiles + line-of-sight

## Conventions

- Keep game logic in `src/game/`; no framework beyond Three.js
- Arrow keys only (not WASD) per product spec
- Do not start dev servers from the agent session
