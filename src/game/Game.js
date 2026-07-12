import * as THREE from "three";
import { createArena, setupLighting, updateLighting, updateDisco, pickSpawnPosition } from "./world.js";
import { createEnemyMesh, createGunModel, createHealthPickupMesh } from "./models.js";
import { Controls } from "./controls.js";
import { UI } from "./ui.js";
import { BulletManager } from "./bullets.js";
import { AudioManager } from "./audio.js";
import { Player, Enemy } from "./entities.js";
import {
  HEALTH_PICKUP_AMOUNT,
  HEALTH_PICKUP_RADIUS,
  HEALTH_PICKUP_LIFETIME,
  ENEMY_RESPAWN_DELAY,
  KILLS_PER_TIER,
  PLAYER_MAX_HEALTH,
  ENEMY_MAX_HEALTH,
  MAX_TIER,
  ENEMIES_PER_TIER,
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
    this.lights = setupLighting(this.scene);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    this.world = createArena(this.scene);
    this.controls = new Controls(canvas);
    this.ui = new UI();
    this.audio = new AudioManager();
    this.player = new Player(this.camera);
    this.bulletManager = new BulletManager(this.scene);

    this.enemies = [];
    this.enemyPool = [];
    this.gun = createGunModel();
    this.camera.add(this.gun);
    this.scene.add(this.camera);

    this.healthPickups = [];
    this.kills = 0;
    this.tierKills = 0;
    this.difficultyTier = 1;
    this.respawnTimer = 0;
    this.gameWon = false;
    this.elapsed = 0;

    // Win animation state
    this.winAnimTime = 0;
    this.winParticles = [];

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
    this.audio.init();
    this.audio.resume();
    this.reset();
    this.running = true;
    this.controls.requestLock();
    this.ui.showHUD();
    this.clock.start();
    this.audio.startMusic(this.difficultyTier);
    this.loop();
  }

  reset() {
    this.player.reset();
    this.bulletManager.clear();
    this.clearHealthPickups();
    this.clearWinParticles();

    // Clear all enemies
    for (const enemy of this.enemies) {
      this.scene.remove(enemy.mesh);
    }
    this.enemies = [];
    this.enemyPool = [];

    this.kills = 0;
    this.tierKills = 0;
    this.difficultyTier = 1;
    this.respawnTimer = 0;
    this.gameWon = false;
    this.winAnimTime = 0;
    this.elapsed = 0;

    this.spawnTierEnemies();
    this.updateLightingForTier();
    this.audio.startMusic(this.difficultyTier);
    this.ui.updateDifficulty(this.difficultyTier);
    this.ui.updateKills(this.kills);
    this.updateHud();
  }

  spawnTierEnemies() {
    const count = ENEMIES_PER_TIER[this.difficultyTier - 1] || 1;

    for (let i = 0; i < count; i++) {
      const mesh = createEnemyMesh(this.difficultyTier);
      this.scene.add(mesh);
      const enemy = new Enemy(mesh, this.difficultyTier);

      const { x, z } = pickSpawnPosition(this.player, this.world);

      enemy.respawn(this.difficultyTier, x, z);
      this.enemies.push(enemy);
    }
  }

  updateLightingForTier() {
    updateLighting(this.lights, this.difficultyTier);
  }

  endGame() {
    this.running = false;
    this.audio.stopMusic();
    this.audio.playDeath();
    document.exitPointerLock();
    this.ui.showDeathScreen(() => this.start());
  }

  winGame() {
    this.gameWon = true;
    this.winAnimTime = 0;
    this.audio.playVictory();
    this.spawnWinParticles();

    setTimeout(() => {
      this.running = false;
      this.audio.stopMusic();
      document.exitPointerLock();
      this.ui.showWinScreen(() => this.start());
    }, 4000);
  }

  spawnWinParticles() {
    const neonPalette = [0xff2e9a, 0x00f0ff, 0xb026ff, 0xfff200, 0xff6ec7];
    for (let i = 0; i < 80; i++) {
      const geo = new THREE.SphereGeometry(0.15, 8, 8);
      const color = new THREE.Color(neonPalette[i % neonPalette.length]);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 30,
      );
      this.scene.add(mesh);
      this.winParticles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          4 + Math.random() * 8,
          (Math.random() - 0.5) * 8,
        ),
        life: 2 + Math.random() * 2,
      });
    }
  }

  clearWinParticles() {
    for (const p of this.winParticles) {
      this.scene.remove(p.mesh);
    }
    this.winParticles = [];
  }

  updateHud() {
    this.ui.updatePlayerHealth(this.player.health / PLAYER_MAX_HEALTH);

    const aliveEnemies = this.enemies.filter((e) => e.isAlive);
    if (aliveEnemies.length > 0) {
      const maxHp = aliveEnemies[0].scaledStats.maxHealth;
      const avgHealth = aliveEnemies.reduce((sum, e) => sum + e.health, 0) / aliveEnemies.length;
      this.ui.updateEnemyHealth(avgHealth / maxHp);
    } else {
      this.ui.updateEnemyHealth(0);
    }

    this.ui.updateDifficulty(this.difficultyTier);
    this.ui.updateKills(this.kills);
    this.ui.updateEnemyCount(aliveEnemies.length, ENEMIES_PER_TIER[this.difficultyTier - 1]);
    this.ui.updateTierProgress(this.tierKills);
  }

  onEnemyKilled(killedEnemy) {
    this.kills++;
    this.tierKills++;

    // Remove the dead enemy from the scene
    this.scene.remove(killedEnemy.mesh);
    this.enemies = this.enemies.filter((e) => e !== killedEnemy);

    this.spawnHealthPickup(killedEnemy.x, killedEnemy.z);

    // Check if tier is cleared
    if (this.tierKills >= KILLS_PER_TIER) {
      if (this.difficultyTier >= MAX_TIER) {
        this.updateHud();
        this.winGame();
        return;
      }

      // Advance to next tier
      this.difficultyTier++;
      this.tierKills = 0;
      this.audio.startMusic(this.difficultyTier);
      this.updateLightingForTier();

      // Clear remaining enemies from old tier
      for (const e of this.enemies) {
        this.scene.remove(e.mesh);
      }
      this.enemies = [];

      // Spawn new tier enemies after a short delay
      this.respawnTimer = 1.5;
    } else {
      // Spawn a replacement enemy for the same tier
      this.respawnTimer = ENEMY_RESPAWN_DELAY;
    }

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
        this.audio.playPickup();
        this.updateHud();
      }
    }

    this.healthPickups = this.healthPickups.filter((p) => !p.dead);
  }

  updateWinParticles(dt) {
    for (const p of this.winParticles) {
      p.velocity.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      p.mesh.material.opacity = Math.max(0, p.life / 2);
      if (p.mesh.position.y < -1) {
        p.life = 0;
      }
    }

    this.winParticles = this.winParticles.filter((p) => {
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        return false;
      }
      return true;
    });
  }

  loop() {
    if (!this.running) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;

    // Sync disco lights to the music beat
    const beatPhase = this.audio.getBeatPhase ? this.audio.getBeatPhase() : null;
    updateDisco(this.lights, this.elapsed, this.difficultyTier, beatPhase);

    this.player.update(dt, this.world, this.controls);

    if (this.gameWon) {
      this.winAnimTime += dt;

      // Camera zoom out
      const t = Math.min(this.winAnimTime / 2, 1);
      const camDist = 12 + t * 20;
      const camHeight = 1.6 + t * 8;
      this.camera.position.set(
        this.player.x,
        camHeight,
        this.player.z + camDist,
      );
      this.camera.lookAt(this.player.x, 1.6, this.player.z);

      this.updateWinParticles(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(() => this.loop());
      return;
    }

    // Shooting
    if (this.controls.keys.shoot) {
      const aliveEnemies = this.enemies.filter((e) => e.isAlive);
      if (aliveEnemies.length > 0) {
        const result = this.player.tryShoot(this.bulletManager, this.world, aliveEnemies);
        if (result) {
          this.audio.playGunshot();
          if (result.hit) {
            this.audio.playHit();
            if (result.killed) {
              this.onEnemyKilled(result.enemy);
            }
            this.updateHud();
          }
        }
      }
    }

    // Enemy updates
    for (const enemy of this.enemies) {
      if (enemy.isAlive) {
        enemy.update(dt, this.world, this.player, this.bulletManager);
      }
    }

    // Respawn logic
    if (this.enemies.length < (ENEMIES_PER_TIER[this.difficultyTier - 1] || 1)) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        const mesh = createEnemyMesh(this.difficultyTier);
        this.scene.add(mesh);
        const enemy = new Enemy(mesh, this.difficultyTier);
        const { x, z } = pickSpawnPosition(this.player, this.world);
        enemy.respawn(this.difficultyTier, x, z);
        this.enemies.push(enemy);
        this.updateHud();
      }
    }

    this.bulletManager.update(dt, {
      obstacles: this.world.obstacles,
      half: this.world.half,
      player: this.player,
      enemies: this.enemies,
      onPlayerHit: (dmg) => {
        this.player.takeDamage(dmg);
        this.updateHud();
      },
      onEnemyHit: (dmg, enemy) => {
        if (enemy.isAlive) {
          enemy.takeDamage(dmg);
          if (!enemy.isAlive) {
            this.onEnemyKilled(enemy);
          }
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
