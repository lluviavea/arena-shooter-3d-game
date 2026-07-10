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
import { hasLineOfSight } from "./bullets.js";

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

  tryShoot(bulletManager) {
    if (this.fireCooldown > 0) return false;
    this.fireCooldown = PLAYER_FIRE_COOLDOWN;

    const origin = new THREE.Vector3(this.x, PLAYER_HEIGHT - 0.05, this.z);
    const direction = forwardVector(this.rotationY);
    direction.y = -0.02;
    bulletManager.spawn(origin, direction, "player");
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
  }

  reset() {
    this.x = 0;
    this.z = -12;
    this.rotationY = 0;
    this.health = ENEMY_MAX_HEALTH;
    this.fireCooldown = 1.2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.rotationY;
  }

  update(dt, world, player, bulletManager) {
    const playerPos = { x: player.x, z: player.z };
    const enemyPos = { x: this.x, z: this.z };
    const dist = Math.hypot(player.x - this.x, player.z - this.z);
    const canSee = hasLineOfSight(enemyPos, playerPos, world.obstacles);

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
