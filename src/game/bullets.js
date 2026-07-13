import * as THREE from "three";
import {
  BULLET_RADIUS,
  BULLET_SPEED,
  ENEMY_RADIUS,
  PLAYER_HITSCAN_RANGE,
  PLAYER_RADIUS,
  ENEMY_DAMAGE,
  PLAYER_DAMAGE,
} from "./constants.js";

const _enemyCenter = new THREE.Vector3();

export function raycastSphere(origin, direction, center, radius, maxDist) {
  const ocX = origin.x - center.x;
  const ocY = origin.y - center.y;
  const ocZ = origin.z - center.z;
  const b = 2 * (ocX * direction.x + ocY * direction.y + ocZ * direction.z);
  const c = ocX * ocX + ocY * ocY + ocZ * ocZ - radius * radius;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b - sqrtDisc) * 0.5;
  const t2 = (-b + sqrtDisc) * 0.5;
  const t = t1 > 0.001 ? t1 : t2 > 0.001 ? t2 : null;
  if (t === null || t > maxDist) return null;
  return t;
}

export function raycastObstacles(origin, direction, obstacles, maxDist) {
  let closest = maxDist;

  for (const box of obstacles) {
    const t = raycastHorizontalBox(origin, direction, box, maxDist);
    if (t !== null && t < closest) closest = t;
  }

  return closest;
}

function raycastHorizontalBox(origin, direction, box, maxDist) {
  if (origin.y < 0 || origin.y > 3) return null;

  let tMin = 0;
  let tMax = maxDist;

  if (Math.abs(direction.x) > 0.0001) {
    const tx1 = (box.minX - origin.x) / direction.x;
    const tx2 = (box.maxX - origin.x) / direction.x;
    tMin = Math.max(tMin, Math.min(tx1, tx2));
    tMax = Math.min(tMax, Math.max(tx1, tx2));
  } else if (origin.x < box.minX || origin.x > box.maxX) {
    return null;
  }

  if (Math.abs(direction.z) > 0.0001) {
    const tz1 = (box.minZ - origin.z) / direction.z;
    const tz2 = (box.maxZ - origin.z) / direction.z;
    tMin = Math.max(tMin, Math.min(tz1, tz2));
    tMax = Math.min(tMax, Math.max(tz1, tz2));
  } else if (origin.z < box.minZ || origin.z > box.maxZ) {
    return null;
  }

  if (tMin > tMax || tMax < 0) return null;
  const hit = tMin > 0.001 ? tMin : tMax;
  return hit <= maxDist ? hit : null;
}

export function playerHitscan(origin, direction, enemy, obstacles) {
  _enemyCenter.set(enemy.x, 1.35, enemy.z);
  const enemyHitDist = raycastSphere(
    origin,
    direction,
    _enemyCenter,
    ENEMY_RADIUS + 0.15,
    PLAYER_HITSCAN_RANGE,
  );

  if (enemyHitDist === null) return false;

  const wallDist = raycastObstacles(origin, direction, obstacles, PLAYER_HITSCAN_RANGE);
  if (enemyHitDist >= wallDist) return false;

  return true;
}

export class BulletManager {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.geo = new THREE.SphereGeometry(BULLET_RADIUS, 8, 8);
    this.playerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.8,
    });
    this.enemyMat = new THREE.MeshStandardMaterial({
      color: 0xff2e9a,
      emissive: 0xff2e9a,
      emissiveIntensity: 1.8,
    });
  }

  spawnVisualTracer(origin, direction) {
    const mesh = new THREE.Mesh(this.geo, this.playerMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const velocity = direction.clone().normalize().multiplyScalar(BULLET_SPEED * 2);
    this.bullets.push({
      mesh,
      velocity,
      owner: "player",
      alive: true,
      visualOnly: true,
      life: 0.12,
    });
  }

  spawn(origin, direction, owner, damage, source = null) {
    const mesh = new THREE.Mesh(
      this.geo,
      owner === "player" ? this.playerMat : this.enemyMat,
    );
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const velocity = direction.clone().normalize().multiplyScalar(BULLET_SPEED);
    this.bullets.push({ mesh, velocity, owner, alive: true, damage: damage || PLAYER_DAMAGE, source });
  }

  update(dt, context) {
    const { obstacles, half, player, enemies, onPlayerHit, onEnemyHit } = context;

    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;

      if (bullet.visualOnly) {
        bullet.life -= dt;
        if (bullet.life <= 0) {
          this.remove(bullet);
          continue;
        }
      }

      bullet.mesh.position.addScaledVector(bullet.velocity, dt);
      const { x, y, z } = bullet.mesh.position;

      if (bullet.visualOnly) continue;

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
        const pdx = x - player.x;
        const pdz = z - player.z;
        if (Math.hypot(pdx, pdz) < PLAYER_RADIUS + BULLET_RADIUS && y < PLAYER_RADIUS + 1.6) {
          onPlayerHit(bullet.damage);
          this.remove(bullet);
        } else {
          for (const enemy of enemies) {
            if (enemy === bullet.source) continue;
            if (!enemy.isAlive) continue;
            const edx = x - enemy.x;
            const edz = z - enemy.z;
            if (Math.hypot(edx, edz) < ENEMY_RADIUS + BULLET_RADIUS && y < 2.2) {
              onEnemyHit(bullet.damage, enemy);
              this.remove(bullet);
              break;
            }
          }
        }
      } else {
        for (const enemy of enemies) {
          if (!enemy.isAlive) continue;
          const dx = x - enemy.x;
          const dz = z - enemy.z;
          if (Math.hypot(dx, dz) < ENEMY_RADIUS + BULLET_RADIUS && y < 2.2) {
            onEnemyHit(bullet.damage, enemy);
            this.remove(bullet);
            break;
          }
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
