import * as THREE from "three";
import {
  BULLET_RADIUS,
  BULLET_SPEED,
  ENEMY_RADIUS,
  PLAYER_RADIUS,
} from "./world.js";

export class BulletManager {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.geo = new THREE.SphereGeometry(BULLET_RADIUS, 8, 8);
    this.playerMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.8,
    });
    this.enemyMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.8,
    });
  }

  spawn(origin, direction, owner) {
    const mesh = new THREE.Mesh(
      this.geo,
      owner === "player" ? this.playerMat : this.enemyMat,
    );
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const velocity = direction.clone().normalize().multiplyScalar(BULLET_SPEED);
    this.bullets.push({ mesh, velocity, owner, alive: true });
  }

  update(dt, context) {
    const { obstacles, half, player, enemy, onPlayerHit, onEnemyHit } = context;

    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;

      bullet.mesh.position.addScaledVector(bullet.velocity, dt);
      const { x, y, z } = bullet.mesh.position;

      if (Math.abs(x) > half || Math.abs(z) > half || y < 0 || y > 5) {
        this.remove(bullet);
        continue;
      }

      for (const box of obstacles) {
        if (x > box.minX + PLAYER_RADIUS && x < box.maxX - PLAYER_RADIUS &&
            z > box.minZ + PLAYER_RADIUS && z < box.maxZ - PLAYER_RADIUS &&
            y < 3) {
          this.remove(bullet);
          break;
        }
      }
      if (!bullet.alive) continue;

      if (bullet.owner === "enemy") {
        const dx = x - player.x;
        const dz = z - player.z;
        if (Math.hypot(dx, dz) < PLAYER_RADIUS + BULLET_RADIUS && y < PLAYER_RADIUS + 1.6) {
          onPlayerHit(12);
          this.remove(bullet);
        }
      } else {
        const dx = x - enemy.x;
        const dz = z - enemy.z;
        if (Math.hypot(dx, dz) < ENEMY_RADIUS + BULLET_RADIUS && y < 2.2) {
          onEnemyHit(18);
          this.remove(bullet);
        }
      }
    }

    this.bullets = this.bullets.filter((b) => b.alive);
  }

  remove(bullet) {
    bullet.alive = false;
    this.scene.remove(bullet.mesh);
  }

  clear() {
    for (const bullet of this.bullets) {
      this.scene.remove(bullet.mesh);
    }
    this.bullets = [];
  }
}

export function hasLineOfSight(from, to, obstacles) {
  const dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z);
  const dist = dir.length();
  if (dist < 0.01) return true;
  dir.normalize();

  const steps = Math.ceil(dist / 0.5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = from.x + dir.x * dist * t;
    const z = from.z + dir.z * dist * t;
    for (const box of obstacles) {
      if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
        return false;
      }
    }
  }
  return true;
}
