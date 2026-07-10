import * as THREE from "three";
import {
  createArena,
  createEnemyMesh,
  createGunModel,
  setupLighting,
} from "./world.js";
import { BulletManager } from "./bullets.js";
import { Player, Enemy } from "./entities.js";
import {
  ENEMY_MAX_HEALTH,
  PLAYER_MAX_HEALTH,
} from "./world.js";

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
    this.player = new Player(this.camera);
    this.bulletManager = new BulletManager(this.scene);

    const enemyMesh = createEnemyMesh();
    this.scene.add(enemyMesh);
    this.enemy = new Enemy(enemyMesh);

    this.gun = createGunModel();
    this.camera.add(this.gun);
    this.scene.add(this.camera);

    this.ui = {
      overlay: document.getElementById("overlay"),
      crosshair: document.getElementById("crosshair"),
      message: document.getElementById("message"),
      playerHealth: document.getElementById("player-health"),
      enemyHealth: document.getElementById("enemy-health"),
      startBtn: document.getElementById("start-btn"),
    };

    this.bindEvents();
    this.onResize();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.onResize());

    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.running) return;
      if (e.code === "Space") {
        const result = this.player.tryShoot(this.bulletManager, this.world, this.enemy);
        if (result === "hit") this.updateHud();
      }
      this.player.handleKey(e.code, true);
    });

    window.addEventListener("keyup", (e) => {
      if (!this.running) return;
      this.player.handleKey(e.code, false);
    });

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
    this.ui.overlay.classList.add("hidden");
    this.ui.overlay.classList.remove("visible");
    this.ui.crosshair.classList.add("visible");
    this.ui.message.classList.add("hidden");
    this.clock.start();
    this.loop();
  }

  reset() {
    this.player.reset();
    this.enemy.reset();
    this.bulletManager.clear();
    this.updateHud();
  }

  endGame(won) {
    this.running = false;
    this.ui.crosshair.classList.remove("visible");
    this.ui.message.classList.remove("hidden");
    this.ui.message.innerHTML = `
      <h2>${won ? "Victory!" : "Defeated"}</h2>
      <p>${won ? "You eliminated the arena bot." : "The bot got you. Try again!"}</p>
      <button id="restart-btn">Play Again</button>
    `;
    document.getElementById("restart-btn").addEventListener("click", () => this.start());
  }

  updateHud() {
    this.ui.playerHealth.style.width = `${(this.player.health / PLAYER_MAX_HEALTH) * 100}%`;
    this.ui.enemyHealth.style.width = `${(this.enemy.health / ENEMY_MAX_HEALTH) * 100}%`;
  }

  loop() {
    if (!this.running) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.player.update(dt, this.world);
    if (this.player.keys.shoot) {
      const result = this.player.tryShoot(this.bulletManager, this.world, this.enemy);
      if (result === "hit") this.updateHud();
    }

    this.enemy.update(dt, this.world, this.player, this.bulletManager);

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
        this.enemy.takeDamage(dmg);
        this.updateHud();
      },
    });

    if (!this.player.isAlive) this.endGame(false);
    else if (!this.enemy.isAlive) this.endGame(true);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.loop());
  }
}
