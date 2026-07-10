import * as THREE from "three";

export const ARENA_SIZE = 36;
export const WALL_HEIGHT = 4;
export const PLAYER_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.45;
export const ENEMY_RADIUS = 0.55;
export const BULLET_SPEED = 28;
export const BULLET_RADIUS = 0.12;
export const PLAYER_MAX_HEALTH = 100;
export const ENEMY_MAX_HEALTH = 100;
export const PLAYER_FIRE_COOLDOWN = 0.35;
export const ENEMY_FIRE_COOLDOWN = 0.9;
export const MOVE_SPEED = 7;
export const TURN_SPEED = 2.4;
export const ENEMY_MOVE_SPEED = 4.5;

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
  // Match Three.js camera: rotation.y = 0 looks down -Z
  return new THREE.Vector3(-Math.sin(rotationY), 0, -Math.cos(rotationY));
}

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
  scene.background = new THREE.Color(0x0b1020);
  scene.fog = new THREE.Fog(0x0b1020, 20, 55);

  const ambient = new THREE.AmbientLight(0x6070a0, 0.55);
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

  const rim = new THREE.PointLight(0x6366f1, 0.6, 40);
  rim.position.set(-10, 6, -10);
  scene.add(rim);
}

export function createGunModel() {
  const gun = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 }),
  );
  body.position.set(0.22, -0.18, -0.45);
  gun.add(body);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 }),
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.22, -0.16, -0.62);
  gun.add(barrel);

  return gun;
}

export function createEnemyMesh() {
  const enemy = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 0.9, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45, metalness: 0.35 }),
  );
  body.position.y = 1.05;
  body.castShadow = true;
  enemy.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4, metalness: 0.4 }),
  );
  head.position.y = 1.85;
  head.castShadow = true;
  enemy.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
  });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
  leftEye.position.set(-0.12, 1.9, 0.26);
  enemy.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.x = 0.12;
  enemy.add(rightEye);

  return enemy;
}
