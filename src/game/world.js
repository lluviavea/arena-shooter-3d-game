import * as THREE from "three";

export const ARENA_SIZE = 36;
export const WALL_HEIGHT = 4;
export const PLAYER_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.45;
export const ENEMY_RADIUS = 0.7;
export const BULLET_SPEED = 28;
export const BULLET_RADIUS = 0.12;
export const PLAYER_MAX_HEALTH = 100;
export const ENEMY_MAX_HEALTH = 100;
export const PLAYER_FIRE_COOLDOWN = 0.35;
export const ENEMY_FIRE_COOLDOWN = 0.9;
export const MOVE_SPEED = 7;
export const TURN_SPEED = 0.5;
export const ENEMY_MOVE_SPEED = 4.5;
export const PLAYER_HITSCAN_RANGE = 55;

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
  const darkMetal = { color: 0x1a1a2e, roughness: 0.35, metalness: 0.7 };
  const accentGlow = new THREE.MeshStandardMaterial({
    color: 0xe63946,
    emissive: 0xe63946,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.5,
  });
  const helmetMat = { color: 0x16213e, roughness: 0.3, metalness: 0.75 };

  // --- TORSO ---
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.55), new THREE.MeshStandardMaterial(darkMetal));
  torso.position.y = 1.35;
  torso.castShadow = true;
  enemy.add(torso);

  // Glowing chest strip
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.06), accentGlow);
  chest.position.set(0, 1.35, 0.28);
  enemy.add(chest);

  // Side accents
  for (const side of [-1, 1]) {
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.35), accentGlow);
    accent.position.set(side * 0.42, 1.35, 0);
    enemy.add(accent);
  }

  // --- SHOULDER PADS ---
  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.18, 0.4),
      new THREE.MeshStandardMaterial({ ...darkMetal, color: 0x0f3460 }),
    );
    pad.position.set(side * 0.55, 1.95, 0);
    pad.castShadow = true;
    enemy.add(pad);
  }

  // --- HEAD (Vader-style helmet) ---
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.0, 0);
  enemy.add(headPivot);

  // Helmet dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial(helmetMat),
  );
  dome.position.y = 0.12;
  dome.castShadow = true;
  headPivot.add(dome);

  // Face plate
  const facePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.35, 0.12),
    new THREE.MeshStandardMaterial({ ...helmetMat, color: 0x1a1a2e }),
  );
  facePlate.position.set(0, -0.05, 0.22);
  headPivot.add(facePlate);

  // Cheek guards
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.25, 0.18),
      new THREE.MeshStandardMaterial(helmetMat),
    );
    cheek.position.set(side * 0.25, -0.1, 0.15);
    headPivot.add(cheek);
  }

  // Brow ridge
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.08, 0.16),
    new THREE.MeshStandardMaterial(helmetMat),
  );
  brow.position.set(0, 0.1, 0.18);
  headPivot.add(brow);

  // Visor slits (glowing red eyes)
  for (const side of [-1, 1]) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.06), accentGlow);
    slit.position.set(side * 0.13, 0.03, 0.28);
    headPivot.add(slit);
  }

  // Nose ridge
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.18, 0.1),
    new THREE.MeshStandardMaterial(helmetMat),
  );
  nose.position.set(0, -0.06, 0.27);
  headPivot.add(nose);

  // Jaw / chin guard
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.12, 0.2),
    new THREE.MeshStandardMaterial({ ...helmetMat, color: 0x0f3460 }),
  );
  jaw.position.set(0, -0.22, 0.1);
  headPivot.add(jaw);

  // --- GUN ARM (right side) ---
  const gunPivot = new THREE.Group();
  gunPivot.position.set(0.5, 1.55, 0);
  enemy.add(gunPivot);

  const gunBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.25, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 }),
  );
  gunBody.position.set(0, 0, -0.2);
  gunPivot.add(gunBody);

  const gunBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.15 }),
  );
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.02, -0.55);
  gunPivot.add(gunBarrel);

  const muzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.06, 8),
    accentGlow,
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.02, -0.73);
  gunPivot.add(muzzle);

  // --- LEFT ARM ---
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.55, 0.2),
    new THREE.MeshStandardMaterial(darkMetal),
  );
  leftArm.position.set(-0.5, 1.35, 0);
  leftArm.castShadow = true;
  enemy.add(leftArm);

  // --- BACK POWER UNIT ---
  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.5, 0.2),
    new THREE.MeshStandardMaterial({ ...darkMetal, color: 0x0f3460 }),
  );
  backpack.position.set(0, 1.45, -0.35);
  enemy.add(backpack);

  // Animation references
  enemy.userData = { headPivot, torso };

  return enemy;
}
