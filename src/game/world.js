import * as THREE from "three";
import { ARENA_SIZE, WALL_HEIGHT, PLAYER_RADIUS } from "./constants.js";

export function clampToArena(x, z, margin = 1.2) {
  const limit = ARENA_SIZE / 2 - margin;
  return {
    x: THREE.MathUtils.clamp(x, -limit, limit),
    z: THREE.MathUtils.clamp(z, -limit, limit),
  };
}

export function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function forwardVector(rotationY) {
  return new THREE.Vector3(-Math.sin(rotationY), 0, -Math.cos(rotationY));
}

export function rightVector(rotationY) {
  return new THREE.Vector3(Math.cos(rotationY), 0, -Math.sin(rotationY));
}

// Retro 80's disco palettes per tier — all neon, increasing intensity/heat
const TIER_LIGHTING = [
  // Tier 1 - Funk: cool magenta/cyan
  { bg: 0x140428, fog: 0x2a0a4a, ambient: 0x6a2ea0, ambientIntensity: 0.45, beat: 1.0 },
  // Tier 2 - Groove: cyan/purple
  { bg: 0x0a1a3a, fog: 0x0e2a6a, ambient: 0x4070c0, ambientIntensity: 0.5, beat: 1.15 },
  // Tier 3 - Neon: hot pink/purple
  { bg: 0x1a0628, fog: 0x3a0a5a, ambient: 0xa040c0, ambientIntensity: 0.55, beat: 1.3 },
  // Tier 4 - Fever: magenta/red neon
  { bg: 0x280418, fog: 0x5a0a2a, ambient: 0xc04060, ambientIntensity: 0.6, beat: 1.45 },
  // Tier 5 - Megamix: electric purple/pink max
  { bg: 0x300628, fog: 0x6a0a4a, ambient: 0xd040a0, ambientIntensity: 0.65, beat: 1.6 },
  // Tier 6 - Grand Finale (boss): crimson/black, hottest
  { bg: 0x3a0008, fog: 0x6a0010, ambient: 0xff2040, ambientIntensity: 0.7, beat: 1.8 },
];

// Four orbiting disco light colors (kept constant across tiers)
const DISCO_LIGHT_COLORS = [
  0xff2e9a, // magenta
  0x00f0ff, // cyan
  0xb026ff, // purple
  0xfff200, // yellow
];

export function createArena(scene) {
  const group = new THREE.Group();

  // --- Floor: dark glossy with neon grid ---
  const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0118,
    roughness: 0.25,
    metalness: 0.7,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Bright neon grid lines on the floor (two-tone synthwave grid)
  const grid = new THREE.GridHelper(ARENA_SIZE, 18, 0xff2e9a, 0x00f0ff);
  grid.position.y = 0.02;
  grid.material.transparent = true;
  grid.material.opacity = 0.9;
  group.add(grid);

  // --- Walls: dark panels with neon emissive strips ---
  const wallBaseMat = new THREE.MeshStandardMaterial({
    color: 0x10021f,
    roughness: 0.4,
    metalness: 0.6,
  });
  const wallStripMat = new THREE.MeshStandardMaterial({
    color: 0xff2e9a,
    emissive: 0xff2e9a,
    emissiveIntensity: 1.6,
  });

  const half = ARENA_SIZE / 2;
  const walls = [
    { w: ARENA_SIZE, d: 0.6, x: 0, z: -half, stripAxis: "x", stripX: 0, stripZ: -half + 0.32 },
    { w: ARENA_SIZE, d: 0.6, x: 0, z: half, stripAxis: "x", stripX: 0, stripZ: half - 0.32 },
    { w: 0.6, d: ARENA_SIZE, x: -half, z: 0, stripAxis: "z", stripX: -half + 0.32, stripZ: 0 },
    { w: 0.6, d: ARENA_SIZE, x: half, z: 0, stripAxis: "z", stripX: half - 0.32, stripZ: 0 },
  ];

  for (const wall of walls) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.w, WALL_HEIGHT, wall.d),
      wallBaseMat,
    );
    mesh.position.set(wall.x, WALL_HEIGHT / 2, wall.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Horizontal neon strip near top of wall
    const stripGeo =
      wall.stripAxis === "x"
        ? new THREE.BoxGeometry(ARENA_SIZE - 0.6, 0.18, 0.08)
        : new THREE.BoxGeometry(0.08, 0.18, ARENA_SIZE - 0.6);
    const strip = new THREE.Mesh(stripGeo, wallStripMat);
    strip.position.set(wall.stripX, WALL_HEIGHT - 0.6, wall.stripZ);
    group.add(strip);
  }

  // --- Cover obstacles: glowing neon-edged blocks ---
  const coverBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a2e,
    roughness: 0.3,
    metalness: 0.7,
  });
  const coverEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.4,
  });

  const covers = [
    { x: -8, z: -6, w: 3, h: 2, d: 3 },
    { x: 8, z: 6, w: 3, h: 2, d: 3 },
    { x: 0, z: 0, w: 4, h: 2.5, d: 2 },
    { x: -5, z: 8, w: 2, h: 1.5, d: 5 },
    { x: 6, z: -8, w: 5, h: 1.5, d: 2 },
  ];

  const obstacles = [];

  for (const cover of covers) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(cover.w, cover.h, cover.d),
      coverBaseMat,
    );
    mesh.position.set(cover.x, cover.h / 2, cover.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Neon top edge frame
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(cover.w + 0.12, 0.12, cover.d + 0.12),
      coverEdgeMat,
    );
    edge.position.set(cover.x, cover.h + 0.02, cover.z);
    group.add(edge);

    obstacles.push({
      minX: cover.x - cover.w / 2 - PLAYER_RADIUS,
      maxX: cover.x + cover.w / 2 + PLAYER_RADIUS,
      minZ: cover.z - cover.d / 2 - PLAYER_RADIUS,
      maxZ: cover.z + cover.d / 2 + PLAYER_RADIUS,
    });
  }

  scene.add(group);
  return { obstacles, half };
}

// Pick a spawn point on a ring of radius [minDist, maxDist] around the player,
// rejecting spots that land inside obstacles or outside the arena.
export function pickSpawnPosition(player, world, { minDist = 9, maxDist = 14 } = {}) {
  const limit = world.half - 1.5;
  for (let attempt = 0; attempt < 30; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const x = player.x + Math.sin(angle) * dist;
    const z = player.z + Math.cos(angle) * dist;

    if (x < -limit || x > limit || z < -limit || z > limit) continue;

    const blocked = world.obstacles.some(
      (b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ,
    );
    if (blocked) continue;

    return { x, z };
  }
  // Fallback: a clamped point in front of the player
  return clampToArena(player.x, player.z + maxDist);
}

export function resolveObstacleCollision(x, z, obstacles, half) {
  let nx = x;
  let nz = z;

  const wallMargin = PLAYER_RADIUS + 0.3;
  nx = THREE.MathUtils.clamp(nx, -half + wallMargin, half - wallMargin);
  nz = THREE.MathUtils.clamp(nz, -half + wallMargin, half - wallMargin);

  for (const box of obstacles) {
    if (nx > box.minX && nx < box.maxX && nz > box.minZ && nz < box.maxZ) {
      const pushLeft = nx - box.minX;
      const pushRight = box.maxX - nx;
      const pushTop = nz - box.minZ;
      const pushBottom = box.maxZ - nz;
      const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);

      if (minPush === pushLeft) nx = box.minX;
      else if (minPush === pushRight) nx = box.maxX;
      else if (minPush === pushTop) nz = box.minZ;
      else nz = box.maxZ;
    }
  }

  return { x: nx, z: nz };
}

export function setupLighting(scene) {
  const cfg = TIER_LIGHTING[0];

  scene.background = new THREE.Color(cfg.bg);
  scene.fog = new THREE.Fog(cfg.fog, 18, 52);

  const ambient = new THREE.AmbientLight(cfg.ambient, cfg.ambientIntensity);
  scene.add(ambient);

  // Soft directional fill for shadows
  const sun = new THREE.DirectionalLight(0xff6ec7, 0.5);
  sun.position.set(12, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  scene.add(sun);

  // Four orbiting disco lights
  const discoLights = [];
  const lightRadius = 12;
  for (let i = 0; i < 4; i++) {
    const light = new THREE.PointLight(DISCO_LIGHT_COLORS[i], 2.2, 30, 1.5);
    light.position.set(0, 7, 0);
    scene.add(light);
    discoLights.push({
      light,
      phase: (i / 4) * Math.PI * 2,
      radius: lightRadius,
      baseIntensity: 2.2,
    });
  }

  // --- Disco ball: faceted mirror sphere (tiny mirror tiles) on a thin post ---
  const ballGroup = new THREE.Group();
  const ballGeo = new THREE.IcosahedronGeometry(0.9, 4);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.08,
    flatShading: true,
  });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.castShadow = true;
  ballGroup.add(ball);

  // Thin support post
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a2e,
    metalness: 0.8,
    roughness: 0.3,
  });
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3.5, 6),
    postMat,
  );
  post.position.y = 1.75;
  ballGroup.add(post);

  ballGroup.position.set(0, 6, 0);
  scene.add(ballGroup);

  return { ambient, sun, discoLights, ballGroup, ball, scene };
}

export function updateLighting(lights, tier) {
  const cfg = TIER_LIGHTING[Math.min(tier - 1, TIER_LIGHTING.length - 1)];

  lights.scene.background = new THREE.Color(cfg.bg);
  lights.scene.fog = new THREE.Fog(cfg.fog, 18, 52);
  lights.ambient.color = new THREE.Color(cfg.ambient);
  lights.ambient.intensity = cfg.ambientIntensity;
}

// Beat rate (BPM) per tier, read by audio + lights for sync
export function tierBeatRate(tier) {
  const cfg = TIER_LIGHTING[Math.min(tier - 1, TIER_LIGHTING.length - 1)];
  // Base ~125 BPM scaled by tier beat multiplier
  return (125 / 60) * cfg.beat;
}

// Animate disco lights + ball each frame.
// `elapsed` is total seconds, `tier` for beat rate, `audioBeat` optional 0..1 phase.
export function updateDisco(lights, elapsed, tier, audioBeat = null) {
  const beatRate = tierBeatRate(tier);
  // Beat phase 0..1: either from audio or derived from time
  const beatPhase =
    audioBeat !== null ? audioBeat : (elapsed * beatRate) % 1;

  // Pulsing intensity: sharp attack on each beat
  const pulse = Math.pow(1 - beatPhase, 2.5);

  for (let i = 0; i < lights.discoLights.length; i++) {
    const d = lights.discoLights[i];
    const angle = elapsed * 0.8 + d.phase;
    d.light.position.set(
      Math.cos(angle) * d.radius,
      6 + Math.sin(elapsed * 1.3 + d.phase) * 1.5,
      Math.sin(angle) * d.radius,
    );
    d.light.intensity = d.baseIntensity * (0.4 + pulse * 0.9);
  }

  // Spin the disco ball (mirror tiles catch the orbiting lights)
  if (lights.ball) {
    lights.ball.rotation.y = elapsed * 0.9;
    lights.ball.rotation.x = elapsed * 0.4;
    // Subtle bob
    lights.ballGroup.position.y = 6 + Math.sin(elapsed * 0.7) * 0.15;
  }
}
