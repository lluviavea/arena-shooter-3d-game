# Instant Arena Shooter

3D first-person arena shooter in the browser. Fight one AI opponent in a neon-lit arena.

## Features

- First-person 3D arena with walls and cover
- Arrow keys to move and turn, Space to shoot
- One computer opponent that patrols, chases, and fires back
- Health bars, win/lose screen, instant replay

## Quick start

```bash
just setup   # install tools + dependencies
just run     # start the dev server (open the URL it prints)
```

Then click **Enter Arena** and play.

## Controls

| Key | Action |
|-----|--------|
| ↑ | Move forward |
| ↓ | Move backward |
| ← | Turn left |
| → | Turn right |
| Space | Shoot |

## Build

```bash
just build
just preview   # serve production build locally
```

## Stack

- [Three.js](https://threejs.org/) — 3D rendering in the browser
- [Vite](https://vite.dev/) — fast dev server and bundler

No backend required. Everything runs client-side.
