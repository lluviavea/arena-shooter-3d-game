import * as THREE from "three";
import {
  ENEMY_MAX_HEALTH,
  ENEMY_MOVE_SPEED,
  ENEMY_RADIUS,
  ENEMY_FIRE_COOLDOWN,
  ENEMY_AGGRO_RANGE,
  ENEMY_FIRE_RANGE,
  ENEMY_CLOSE_RANGE,
  ENEMY_DAMAGE,
  PLAYER_FIRE_COOLDOWN,
  PLAYER_HEIGHT,
  PLAYER_MAX_HEALTH,
  PLAYER_MOVE_SPEED,
  PLAYER_DAMAGE,
  PLAYER_HITSCAN_RANGE,
  PLAYER_TURN_SPEED,
  DIFFICULTY_SCALE_PER_TIER,
  BOSS_MAX_HEALTH,
  BOSS_DAMAGE,
  BOSS_FIRE_COOLDOWN,
  BOSS_MOVE_SPEED,
  BOSS_RADIUS,
  BOSS_HIT_HEIGHT,
  BOSS_HIT_Y_MAX,
  BOSS_AGGRO_RANGE,
  BOSS_FIRE_RANGE,
  BOSS_CLOSE_RANGE,
  BOSS_SPREAD_PELLETS,
  BOSS_SPREAD_ANGLE,
} from "./constants.js";
import { forwardVector, rightVector, resolveObstacleCollision, clampToArena } from "./world.js";
import { hasLineOfSight, playerHitscan } from "./bullets.js";

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.x = 0;
    this.z = 12;
    this.rotationY = 0;
    this.health = PLAYER_MAX_HEALTH;
    this.fireCooldown = 0;
  }

  reset() {
    this.x = 0;
    this.z = 12;
    this.rotationY = 0;
    this.health = PLAYER_MAX_HEALTH;
    this.fireCooldown = 0;
  }

  update(dt, world, controls) {
    this.rotationY -= controls.consumeMouseDelta() * PLAYER_TURN_SPEED;

    const forward = forwardVector(this.rotationY);
    const right = rightVector(this.rotationY);
    let moveX = 0;
    let moveZ = 0;

    if (controls.hasGamepad) {
      // Analog: stick magnitude scales speed (tilt half = walk half speed)
      const f = -controls.moveY;
      const r = controls.moveX;
      moveX = (forward.x * f + right.x * r) * PLAYER_MOVE_SPEED * dt;
      moveZ = (forward.z * f + right.z * r) * PLAYER_MOVE_SPEED * dt;
    } else {
      if (controls.keys.w) {
        moveX += forward.x * PLAYER_MOVE_SPEED * dt;
        moveZ += forward.z * PLAYER_MOVE_SPEED * dt;
      }
      if (controls.keys.s) {
        moveX -= forward.x * PLAYER_MOVE_SPEED * dt;
        moveZ -= forward.z * PLAYER_MOVE_SPEED * dt;
      }
      if (controls.keys.a) {
        moveX -= right.x * PLAYER_MOVE_SPEED * dt;
        moveZ -= right.z * PLAYER_MOVE_SPEED * dt;
      }
      if (controls.keys.d) {
        moveX += right.x * PLAYER_MOVE_SPEED * dt;
        moveZ += right.z * PLAYER_MOVE_SPEED * dt;
      }
    }

    const resolved = resolveObstacleCollision(
      this.x + moveX,
      this.z + moveZ,
      world.obstacles,
      world.half,
    );
    this.x = resolved.x;
    this.z = resolved.z;

    this.camera.position.set(this.x, PLAYER_HEIGHT, this.z);
    this.camera.rotation.set(0, this.rotationY, 0);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
  }

  tryShoot(bulletManager, world, enemies) {
    if (this.fireCooldown > 0) return false;
    this.fireCooldown = PLAYER_FIRE_COOLDOWN;

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(direction);

    bulletManager.spawnVisualTracer(origin, direction);

    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      if (playerHitscan(origin, direction, enemy, world.obstacles)) {
        enemy.takeDamage(PLAYER_DAMAGE);
        return { hit: true, killed: !enemy.isAlive, enemy };
      }
    }

    return { hit: false };
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount) {
    this.health = Math.min(PLAYER_MAX_HEALTH, this.health + amount);
  }

  get isAlive() {
    return this.health > 0;
  }
}

export class Enemy {
  constructor(mesh, tier = 1) {
    this.mesh = mesh;
    this.x = 0;
    this.z = -12;
    this.rotationY = 0;
    this.difficultyTier = tier;
    this.health = this.scaledStats.maxHealth;
    this.fireCooldown = 1.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.time = 0;
    this.isWalking = false;

    // Hit-box (overridden by Boss for a bigger/taller target)
    this.hitRadius = ENEMY_RADIUS;
    this.hitHeight = 1.35;
    this.hitYMax = 2.2;
    this.isBoss = false;
    this.isAdd = false;

    const { gunPivot } = mesh.userData;
    this.gunPivot = gunPivot;
    this.muzzle = gunPivot.children.find((c) => c.geometry?.parameters?.radiusTop === 0.09);
    this.muzzleFlashTimer = 0;
  }

  get scaledStats() {
    const scale = 1 + (this.difficultyTier - 1) * DIFFICULTY_SCALE_PER_TIER;
    return {
      maxHealth: Math.round(ENEMY_MAX_HEALTH * scale),
      moveSpeed: ENEMY_MOVE_SPEED * scale,
      fireCooldown: ENEMY_FIRE_COOLDOWN / scale,
      damage: Math.round(ENEMY_DAMAGE * scale),
      aggroRange: ENEMY_AGGRO_RANGE * (1 + (this.difficultyTier - 1) * 0.15),
      fireRange: ENEMY_FIRE_RANGE * (1 + (this.difficultyTier - 1) * 0.1),
      closeRange: ENEMY_CLOSE_RANGE * (1 - (this.difficultyTier - 1) * 0.05),
    };
  }

  reset() {
    this.x = 0;
    this.z = -12;
    this.rotationY = 0;
    this.difficultyTier = 1;
    this.health = this.scaledStats.maxHealth;
    this.fireCooldown = 1.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.time = 0;
    this.isWalking = false;
    this.syncMesh();
  }

  respawn(tier, spawnX, spawnZ) {
    this.difficultyTier = tier;
    this.health = this.scaledStats.maxHealth;
    this.fireCooldown = 1.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.time = 0;
    this.isWalking = false;

    if (spawnX !== undefined && spawnZ !== undefined) {
      this.x = spawnX;
      this.z = spawnZ;
    } else {
      // Safety net: callers should always pass explicit coords from
      // pickSpawnPosition. Keep the enemy inside the arena if they don't.
      const safe = clampToArena(this.x, this.z);
      this.x = safe.x;
      this.z = safe.z;
    }

    this.mesh.visible = true;
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.rotationY;

    const { headPivot, torso } = this.mesh.userData;
    if (!headPivot || !torso) return;

    const bob = Math.sin(this.time * 2.5) * 0.06;
    this.mesh.position.y = bob;

    if (this.isWalking) {
      torso.rotation.z = Math.sin(this.time * 10) * 0.04;
      torso.position.y = 1.35 + Math.abs(Math.sin(this.time * 10)) * 0.03;
    } else {
      torso.rotation.z = 0;
      torso.position.y = 1.35;
    }

    headPivot.rotation.z = Math.sin(this.time * 3) * 0.015;
  }

  // Spawn a single projectile toward the player. Overridden by Boss for a
  // multi-pellet spread.
  _fire(stats, player, bulletManager) {
    const muzzleLocal = new THREE.Vector3(0, 0.02, -1.2);
    const muzzleWorld = muzzleLocal.clone().applyMatrix4(this.gunPivot.matrixWorld);
    muzzleWorld.y = 1.57;

    const direction = new THREE.Vector3(
      player.x - muzzleWorld.x,
      (PLAYER_HEIGHT - muzzleWorld.y) * 0.3,
      player.z - muzzleWorld.z,
    );
    bulletManager.spawn(muzzleWorld, direction, "enemy", stats.damage, this);
  }

  update(dt, world, player, bulletManager) {
    const stats = this.scaledStats;
    const playerPos = { x: player.x, z: player.z };
    const enemyPos = { x: this.x, z: this.z };
    const dist = Math.hypot(player.x - this.x, player.z - this.z);
    const canSee = hasLineOfSight(enemyPos, playerPos, world.obstacles);

    this.isWalking = false;

    if (canSee && dist < stats.aggroRange) {
      const dx = player.x - this.x;
      const dz = player.z - this.z;
      this.rotationY = Math.atan2(dx, dz);

      if (dist > stats.closeRange) {
        const moveX = Math.sin(this.rotationY) * stats.moveSpeed * dt;
        const moveZ = Math.cos(this.rotationY) * stats.moveSpeed * dt;
        const resolved = resolveObstacleCollision(
          this.x + moveX,
          this.z + moveZ,
          world.obstacles,
          world.half,
        );
        this.x = resolved.x;
        this.z = resolved.z;
        this.isWalking = true;
      }

      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && dist < stats.fireRange) {
        this.fireCooldown = stats.fireCooldown + Math.random() * 0.4;
        this._fire(stats, player, bulletManager);
        this.muzzleFlashTimer = 0.08;
      }
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1.5 + Math.random() * 2;
        this.wanderAngle = Math.random() * Math.PI * 2;
      }
      this.rotationY = this.wanderAngle;
      const moveX = Math.sin(this.rotationY) * (stats.moveSpeed * 0.5) * dt;
      const moveZ = Math.cos(this.rotationY) * (stats.moveSpeed * 0.5) * dt;
      const resolved = resolveObstacleCollision(
        this.x + moveX,
        this.z + moveZ,
        world.obstacles,
        world.half,
      );
      this.x = resolved.x;
      this.z = resolved.z;
      this.isWalking = true;
    }

    this.time += dt;

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzle) this.muzzle.material.emissiveIntensity = 3.0;
    } else if (this.muzzle) {
      this.muzzle.material.emissiveIntensity = 0.8;
    }

    this.syncMesh();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  get isAlive() {
    return this.health > 0;
  }
}

// Tier-6 boss — the Grand Finale. A big, high-HP target that fires a
// 3-pellet horizontal spread, forcing the player to keep moving.
export class Boss extends Enemy {
  constructor(mesh, tier = 6) {
    super(mesh, tier);
    this.isBoss = true;
    this.hitRadius = BOSS_RADIUS;
    this.hitHeight = BOSS_HIT_HEIGHT;
    this.hitYMax = BOSS_HIT_Y_MAX;
  }

  get scaledStats() {
    return {
      maxHealth: BOSS_MAX_HEALTH,
      moveSpeed: BOSS_MOVE_SPEED,
      fireCooldown: BOSS_FIRE_COOLDOWN,
      damage: BOSS_DAMAGE,
      aggroRange: BOSS_AGGRO_RANGE,
      fireRange: BOSS_FIRE_RANGE,
      closeRange: BOSS_CLOSE_RANGE,
    };
  }

  // Fire a fan of BOSS_SPREAD_PELLETS bullets around the aim direction.
  _fire(stats, player, bulletManager) {
    const muzzleLocal = new THREE.Vector3(0, 0.02, -1.2);
    const muzzleWorld = muzzleLocal.clone().applyMatrix4(this.gunPivot.matrixWorld);
    muzzleWorld.y = BOSS_HIT_HEIGHT;

    const base = new THREE.Vector3(
      player.x - muzzleWorld.x,
      (PLAYER_HEIGHT - muzzleWorld.y) * 0.3,
      player.z - muzzleWorld.z,
    );

    const yAxis = new THREE.Vector3(0, 1, 0);
    const half = (BOSS_SPREAD_PELLETS - 1) / 2;
    for (let i = 0; i < BOSS_SPREAD_PELLETS; i++) {
      const offset = (i - half) * BOSS_SPREAD_ANGLE;
      const dir = base.clone().applyAxisAngle(yAxis, offset);
      bulletManager.spawn(muzzleWorld, dir, "enemy", stats.damage, this);
    }
  }
}
