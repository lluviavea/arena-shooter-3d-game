import * as THREE from "three";

const TIER_COLORS = [
  // Tier 1 - Funk: cyan neon
  {
    body: 0x0a1a3a,
    accent: 0x00f0ff,
    helmet: 0x051028,
    glow: 0x00f0ff,
    gun: 0x00f0ff,
    eyeGlow: 0x00f0ff,
  },
  // Tier 2 - Groove: magenta neon
  {
    body: 0x2a0a2a,
    accent: 0xff2e9a,
    helmet: 0x18051a,
    glow: 0xff2e9a,
    gun: 0xff2e9a,
    eyeGlow: 0xff2e9a,
  },
  // Tier 3 - Neon: purple neon
  {
    body: 0x1a0a3a,
    accent: 0xb026ff,
    helmet: 0x0e0524,
    glow: 0xb026ff,
    gun: 0xb026ff,
    eyeGlow: 0xb026ff,
  },
  // Tier 4 - Fever: yellow/pink neon
  {
    body: 0x2a1a0a,
    accent: 0xfff200,
    helmet: 0x180e05,
    glow: 0xfff200,
    gun: 0xfff200,
    eyeGlow: 0xff6ec7,
  },
  // Tier 5 - Megamix: hot pink/red neon
  {
    body: 0x3a0a1a,
    accent: 0xff0040,
    helmet: 0x24050f,
    glow: 0xff0040,
    gun: 0xff0040,
    eyeGlow: 0xfff200,
  },
];

function tierColor(tier) {
  return TIER_COLORS[Math.min(tier - 1, TIER_COLORS.length - 1)];
}

export function createEnemyMesh(tier = 1) {
  const colors = tierColor(tier);
  const enemy = new THREE.Group();

  const darkMetal = { color: colors.body, roughness: 0.25, metalness: 0.85 };
  const accentGlow = new THREE.MeshStandardMaterial({
    color: colors.accent,
    emissive: colors.glow,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.4,
  });
  const helmetMat = { color: colors.helmet, roughness: 0.3, metalness: 0.75 };

  // TORSO
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

  // SHOULDER PADS
  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.18, 0.4),
      new THREE.MeshStandardMaterial({ ...darkMetal, color: colors.body }),
    );
    pad.position.set(side * 0.55, 1.95, 0);
    pad.castShadow = true;
    enemy.add(pad);
  }

  // HEAD
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.0, 0);
  enemy.add(headPivot);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial(helmetMat),
  );
  dome.position.y = 0.12;
  dome.castShadow = true;
  headPivot.add(dome);

  const facePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.35, 0.12),
    new THREE.MeshStandardMaterial({ ...helmetMat, color: colors.body }),
  );
  facePlate.position.set(0, -0.05, 0.22);
  headPivot.add(facePlate);

  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.25, 0.18),
      new THREE.MeshStandardMaterial(helmetMat),
    );
    cheek.position.set(side * 0.25, -0.1, 0.15);
    headPivot.add(cheek);
  }

  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.08, 0.16),
    new THREE.MeshStandardMaterial(helmetMat),
  );
  brow.position.set(0, 0.1, 0.18);
  headPivot.add(brow);

  for (const side of [-1, 1]) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.06), accentGlow);
    slit.position.set(side * 0.13, 0.03, 0.28);
    headPivot.add(slit);
  }

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.18, 0.1),
    new THREE.MeshStandardMaterial(helmetMat),
  );
  nose.position.set(0, -0.06, 0.27);
  headPivot.add(nose);

  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.12, 0.2),
    new THREE.MeshStandardMaterial({ ...helmetMat, color: colors.body }),
  );
  jaw.position.set(0, -0.22, 0.1);
  headPivot.add(jaw);

  // GUN ARM (right side)
  const gunPivot = new THREE.Group();
  gunPivot.position.set(0.55, 1.6, -0.1);
  enemy.add(gunPivot);

  const gunMat = new THREE.MeshStandardMaterial({
    color: colors.gun,
    emissive: colors.glow,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.5,
  });

  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.65), gunMat);
  gunBody.position.set(0, 0, -0.32);
  gunPivot.add(gunBody);

  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8), gunMat);
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.02, -0.88);
  gunPivot.add(gunBarrel);

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 8), gunMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.02, -1.2);
  gunPivot.add(muzzle);

  // LEFT ARM
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.55, 0.2),
    new THREE.MeshStandardMaterial(darkMetal),
  );
  leftArm.position.set(-0.5, 1.35, 0);
  leftArm.castShadow = true;
  enemy.add(leftArm);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: colors.gun, metalness: 0.5, roughness: 0.3 }),
  );
  leftHand.position.set(0.1, 0.02, -0.75);
  gunPivot.add(leftHand);

  // BACK POWER UNIT
  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.5, 0.2),
    new THREE.MeshStandardMaterial({ ...darkMetal, color: colors.body }),
  );
  backpack.position.set(0, 1.45, -0.35);
  enemy.add(backpack);

  enemy.userData = { headPivot, torso, gunPivot };

  return enemy;
}

export function createGunModel() {
  const gun = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2, metalness: 0.6, roughness: 0.2 }),
  );
  body.position.set(0.22, -0.18, -0.45);
  gun.add(body);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xff2e9a, emissive: 0xff2e9a, emissiveIntensity: 1.0, metalness: 0.8, roughness: 0.15 }),
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.22, -0.16, -0.62);
  gun.add(barrel);

  return gun;
}

export function createHealthPickupMesh() {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
    }),
  );
  group.add(core);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.3,
    }),
  );
  group.add(glow);

  group.userData = { core, glow };
  return group;
}
