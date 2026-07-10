import * as THREE from "three";
import {
  ENEMY_FIRE_COOLDOWN,
  ENEMY_MAX_HEALTH,
  ENEMY_MOVE_SPEED,
  ENEMY_RADIUS,
  PLAYER_FIRE_COOLDOWN,
  PLAYER_HEIGHT,
  PLAYER_MAX_HEALTH,
  MOVE_SPEED,
  TURN_SPEED,
  forwardVector,
  resolveObstacleCollision,
} from "./world.js";
import { hasLineOfSight, playerHitscan } from "./bullets.js";

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.x = 0;
    this.z = 12;
    this.rotationY = 0;
    this.health = PLAYER_MAX_HEALTH;
    this.fireCooldown = 0;
    this.keys = { up: false, down: false, left: false, right: false, shoot: false };
  }

  reset() {
    this.x = 0;
    this.z = 12;
    this.rotationY = 0;
    this.health = PLAYER_MAX_HEALTH;
    this.fireCooldown = 0;
  }

  handleKey(code, pressed) {
    const map = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      Space: "shoot",
    };
    const key = map[code];
    if (key) this.keys[key] = pressed;
  }

  update(dt, world) {
    if (this.keys.left) this.rotationY += TURN_SPEED * dt;
    if (this.keys.right) this.rotationY -= TURN_SPEED * dt;

    const forward = forwardVector(this.rotationY);
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.up) {
      moveX += forward.x * MOVE_SPEED * dt;
      moveZ += forward.z * MOVE_SPEED * dt;
    }
    if (this.keys.down) {
      moveX -= forward.x * MOVE_SPEED * dt;
      moveZ -= forward.z * MOVE_SPEED * dt;
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

  tryShoot(bulletManager, world, enemy) {
    if (this.fireCooldown > 0) return false;
    this.fireCooldown = PLAYER_FIRE_COOLDOWN;

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(direction);

    bulletManager.spawnVisualTracer(origin, direction);

    if (playerHitscan(origin, direction, enemy, world.obstacles)) {
      enemy.takeDamage(18);
      return "hit";
    }

    return true;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  get isAlive() {
    return this.health > 0;
  }
}

export class Enemy {
  constructor(mesh) {
    this.mesh = mesh;
    this.x = 0;
    this.z = -12;
    this.rotationY = 0;
    this.health = ENEMY_MAX_HEALTH;
    this.fireCooldown = 1.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.time = 0;
    this.isWalking = false;
  }

  reset() {
    this.x = 0;
    this.z = -12;
    this.rotationY = 0;
    this.health = ENEMY_MAX_HEALTH;
    this.fireCooldown = 1.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.time = 0;
    this.isWalking = false;
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

  update(dt, world, player, bulletManager) {
    const playerPos = { x: player.x, z: player.z };
    const enemyPos = { x: this.x, z: this.z };
    const dist = Math.hypot(player.x - this.x, player.z - this.z);
    const canSee = hasLineOfSight(enemyPos, playerPos, world.obstacles);

    this.isWalking = false;

    if (canSee && dist < 22) {
      const dx = player.x - this.x;
      const dz = player.z - this.z;
      this.rotationY = Math.atan2(dx, dz);

      if (dist > 6) {
        const moveX = Math.sin(this.rotationY) * ENEMY_MOVE_SPEED * dt;
        const moveZ = Math.cos(this.rotationY) * ENEMY_MOVE_SPEED * dt;
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
      if (this.fireCooldown <= 0 && dist < 18) {
        this.fireCooldown = ENEMY_FIRE_COOLDOWN + Math.random() * 0.4;
        const origin = new THREE.Vector3(this.x, 1.5, this.z);
        const direction = new THREE.Vector3(
          player.x - this.x,
          (PLAYER_HEIGHT - 1.5) * 0.3,
          player.z - this.z,
        );
        bulletManager.spawn(origin, direction, "enemy");
      }
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1.5 + Math.random() * 2;
        this.wanderAngle = Math.random() * Math.PI * 2;
      }
      this.rotationY = this.wanderAngle;
      const moveX = Math.sin(this.rotationY) * (ENEMY_MOVE_SPEED * 0.5) * dt;
      const moveZ = Math.cos(this.rotationY) * (ENEMY_MOVE_SPEED * 0.5) * dt;
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
    this.syncMesh();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  get isAlive() {
    return this.health > 0;
  }
}
