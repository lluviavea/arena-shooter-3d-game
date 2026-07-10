import * as THREE from "three";
import { createArena, setupLighting } from "./world.js";
import { createEnemyMesh, createGunModel, createHealthPickupMesh } from "./models.js";
import { Controls } from "./controls.js";
import { UI } from "./ui.js";
import { BulletManager } from "./bullets.js";
import { Player, Enemy } from "./entities.js";
import {
  HEALTH_PICKUP_AMOUNT,
  HEALTH_PICKUP_RADIUS,
  HEALTH_PICKUP_LIFETIME,
  ENEMY_RESPAWN_DELAY,
  KILLS_PER_TIER,
  PLAYER_MAX_HEALTH,
  ENEMY_MAX_HEALTH,
} from "./constants.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    setupLighting(this.scene);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    this.world = createArena(this.scene);
    this.controls = new Controls(canvas);
    this.ui = new UI();
    this.player = new Player(this.camera);
    this.bulletManager = new BulletManager(this.scene);

    const enemyMesh = createEnemyMesh();
    this.scene.add(enemyMesh);
    this.enemy = new Enemy(enemyMesh);

    this.gun = createGunModel();
    this.camera.add(this.gun);
    this.scene.add(this.camera);

    this.healthPickups = [];
    this.kills = 0;
    this.difficultyTier = 1;
    this.respawnTimer = 0;
    this.enemyAlive = true;

    this.bindEvents();
    this.onResize();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.onResize());
    this.ui.startBtn.addEventListener("click", () => this.start());
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    this.reset();
    this.running = true;
    this.controls.requestLock();
    this.ui.showHUD();
    this.clock.start();
    this.loop();
  }

  reset() {
    this.player.reset();
    this.enemy.reset();
    this.bulletManager.clear();
    this.clearHealthPickups();
    this.kills = 0;
    this.difficultyTier = 1;
    this.respawnTimer = 0;
    this.enemyAlive = true;
    this.enemy.mesh.visible = true;
    this.ui.updateDifficulty(this.difficultyTier);
    this.ui.updateKills(this.kills);
    this.updateHud();
  }

  endGame() {
    this.running = false;
    document.exitPointerLock();
    this.ui.showDeathScreen(() => this.start());
  }

  updateHud() {
    this.ui.updatePlayerHealth(this.player.health / PLAYER_MAX_HEALTH);
    if (this.enemyAlive) {
      this.ui.updateEnemyHealth(this.enemy.health / this.enemy.scaledStats.maxHealth);
    } else {
      this.ui.updateEnemyHealth(0);
    }
    this.ui.updateDifficulty(this.difficultyTier);
    this.ui.updateKills(this.kills);
  }

  onEnemyKilled() {
    this.kills++;
    this.difficultyTier = 1 + Math.floor(this.kills / KILLS_PER_TIER);
    this.enemyAlive = false;
    this.enemy.mesh.visible = false;
    this.respawnTimer = ENEMY_RESPAWN_DELAY;

    this.spawnHealthPickup(this.enemy.x, this.enemy.z);
    this.updateHud();
  }

  spawnHealthPickup(x, z) {
    const mesh = createHealthPickupMesh();
    mesh.position.set(x, 0.6, z);
    this.scene.add(mesh);
    this.healthPickups.push({ mesh, life: HEALTH_PICKUP_LIFETIME });
  }

  clearHealthPickups() {
    for (const pickup of this.healthPickups) {
      this.scene.remove(pickup.mesh);
    }
    this.healthPickups = [];
  }

  updateHealthPickups(dt) {
    for (const pickup of this.healthPickups) {
      pickup.life -= dt;
      pickup.mesh.rotation.y += dt * 2;

      const pulse = 0.9 + Math.sin(pickup.life * 4) * 0.1;
      pickup.mesh.scale.setScalar(pulse);

      const core = pickup.mesh.userData.core;
      const glow = pickup.mesh.userData.glow;
      if (core) {
        core.material.opacity = 0.6 + Math.sin(pickup.life * 5) * 0.3;
      }
      if (glow) {
        glow.material.opacity = 0.2 + Math.sin(pickup.life * 3) * 0.1;
      }

      if (pickup.life <= 0) {
        this.scene.remove(pickup.mesh);
        pickup.dead = true;
        continue;
      }

      const dx = this.player.x - pickup.mesh.position.x;
      const dz = this.player.z - pickup.mesh.position.z;
      if (Math.hypot(dx, dz) < HEALTH_PICKUP_RADIUS + 0.45) {
        this.player.heal(HEALTH_PICKUP_AMOUNT);
        this.scene.remove(pickup.mesh);
        pickup.dead = true;
        this.updateHud();
      }
    }

    this.healthPickups = this.healthPickups.filter((p) => !p.dead);
  }

  loop() {
    if (!this.running) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.player.update(dt, this.world, this.controls);

    if (this.controls.keys.shoot) {
      if (this.enemyAlive) {
        const result = this.player.tryShoot(this.bulletManager, this.world, this.enemy);
        if (result === "hit") {
          if (!this.enemy.isAlive) this.onEnemyKilled();
          this.updateHud();
        }
      }
    }

    if (this.enemyAlive) {
      this.enemy.update(dt, this.world, this.player, this.bulletManager);
    } else {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.enemy.respawn(this.difficultyTier);
        this.enemy.mesh.visible = true;
        this.enemyAlive = true;
        this.updateHud();
      }
    }

    this.bulletManager.update(dt, {
      obstacles: this.world.obstacles,
      half: this.world.half,
      player: this.player,
      enemy: this.enemy,
      onPlayerHit: (dmg) => {
        this.player.takeDamage(dmg);
        this.updateHud();
      },
      onEnemyHit: (dmg) => {
        if (this.enemyAlive) {
          this.enemy.takeDamage(dmg);
          if (!this.enemy.isAlive) this.onEnemyKilled();
          this.updateHud();
        }
      },
    });

    this.updateHealthPickups(dt);

    if (!this.player.isAlive) this.endGame();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.loop());
  }
}
