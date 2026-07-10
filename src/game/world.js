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

const TIER_LIGHTING = [
  // Tier 1: calm blue/green
  { bg: 0x0b1020, fog: 0x0b1020, ambient: 0x6070a0, rim: 0x44bba4, ambientIntensity: 0.55 },
  // Tier 2: warm amber
  { bg: 0x12100a, fog: 0x12100a, ambient: 0x807050, rim: 0xe9a820, ambientIntensity: 0.6 },
  // Tier 3: orange/red
  { bg: 0x150a08, fog: 0x150a08, ambient: 0x906040, rim: 0xe85d3a, ambientIntensity: 0.65 },
  // Tier 4: deep red
  { bg: 0x180808, fog: 0x180808, ambient: 0xa04040, rim: 0xdc2626, ambientIntensity: 0.7 },
  // Tier 5: purple/crimson
  { bg: 0x120515, fog: 0x120515, ambient: 0x9040a0, rim: 0x9333ea, ambientIntensity: 0.75 },
];

export function createArena(scene) {
  const group = new THREE.Group();

  const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a2035,
    roughness: 0.85,
    metalness: 0.15,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const grid = new THREE.GridHelper(ARENA_SIZE, 18, 0x334155, 0x1e293b);
  grid.position.y = 0.02;
  group.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    roughness: 0.7,
    metalness: 0.2,
  });

  const half = ARENA_SIZE / 2;
  const walls = [
    { w: ARENA_SIZE, d: 0.6, x: 0, z: -half },
    { w: ARENA_SIZE, d: 0.6, x: 0, z: half },
    { w: 0.6, d: ARENA_SIZE, x: -half, z: 0 },
    { w: 0.6, d: ARENA_SIZE, x: half, z: 0 },
  ];

  for (const wall of walls) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.w, WALL_HEIGHT, wall.d),
      wallMat,
    );
    mesh.position.set(wall.x, WALL_HEIGHT / 2, wall.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const coverMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.6,
    metalness: 0.25,
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
      coverMat,
    );
    mesh.position.set(cover.x, cover.h / 2, cover.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
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
  scene.fog = new THREE.Fog(cfg.fog, 20, 55);

  const ambient = new THREE.AmbientLight(cfg.ambient, cfg.ambientIntensity);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff0dd, 1.1);
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

  const rim = new THREE.PointLight(cfg.rim, 0.6, 40);
  rim.position.set(-10, 6, -10);
  scene.add(rim);

  return { ambient, sun, rim, scene };
}

export function updateLighting(lights, tier) {
  const cfg = TIER_LIGHTING[Math.min(tier - 1, TIER_LIGHTING.length - 1)];

  lights.scene.background = new THREE.Color(cfg.bg);
  lights.scene.fog = new THREE.Fog(cfg.fog, 20, 55);
  lights.ambient.color = new THREE.Color(cfg.ambient);
  lights.ambient.intensity = cfg.ambientIntensity;
  lights.rim.color = new THREE.Color(cfg.rim);
}
