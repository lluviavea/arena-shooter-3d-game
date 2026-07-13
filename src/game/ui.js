import { TIER_NAMES, KILLS_PER_TIER } from "./constants.js";

export class UI {
  constructor() {
    this.overlay = document.getElementById("overlay");
    this.crosshair = document.getElementById("crosshair");
    this.message = document.getElementById("message");
    this.playerHealth = document.getElementById("player-health");
    this.enemyHealth = document.getElementById("enemy-health");
    this.difficultyDisplay = document.getElementById("difficulty");
    this.killsDisplay = document.getElementById("kills");
    this.enemyCountDisplay = document.getElementById("enemy-count");
    this.tierProgress = document.getElementById("tier-progress");
    this.startBtn = document.getElementById("start-btn");
    this.controllerStatus = document.getElementById("controller-status");
    this.enemyLabel = document.getElementById("enemy-label");
  }

  setControllerConnected(connected) {
    if (!this.controllerStatus) return;
    this.controllerStatus.classList.toggle("hidden", !connected);
  }

  // Swap the enemy panel label/bar to a boss style during tier 6.
  setBossMode(isBoss) {
    if (this.enemyLabel) {
      this.enemyLabel.textContent = isBoss ? "BOSS" : "ENEMY";
    }
    if (this.enemyHealth) {
      this.enemyHealth.classList.toggle("boss", isBoss);
    }
  }

  showHUD() {
    this.overlay.classList.add("hidden");
    this.overlay.classList.remove("visible");
    this.crosshair.classList.add("visible");
    this.message.classList.add("hidden");
  }

  updatePlayerHealth(ratio) {
    this.playerHealth.style.width = `${ratio * 100}%`;
  }

  updateEnemyHealth(ratio) {
    this.enemyHealth.style.width = `${ratio * 100}%`;
  }

  updateDifficulty(tier) {
    const name = TIER_NAMES[tier - 1] || `Tier ${tier}`;
    this.difficultyDisplay.textContent = `${name} (${tier}/6)`;
  }

  updateKills(count) {
    this.killsDisplay.textContent = `Kills: ${count}`;
  }

  updateEnemyCount(alive, total) {
    if (this.enemyCountDisplay) {
      this.enemyCountDisplay.textContent = `Enemies: ${alive}/${total}`;
    }
  }

  updateTierProgress(tierKills, tier) {
    if (this.tierProgress) {
      const goal = KILLS_PER_TIER[tier - 1] ?? KILLS_PER_TIER[0];
      this.tierProgress.textContent = `Tier kills: ${tierKills}/${goal}`;
    }
  }

  hideCrosshair() {
    this.crosshair.classList.remove("visible");
  }

  showDeathScreen(onRestart) {
    this.hideCrosshair();
    this.message.classList.remove("hidden");
    this.message.innerHTML = `
      <h2>Defeated</h2>
      <p>The bots got you. Try again!</p>
      <button id="restart-btn">Play Again</button>
    `;
    document.getElementById("restart-btn").addEventListener("click", onRestart);
  }

  showWinScreen(onRestart) {
    this.hideCrosshair();
    this.message.classList.remove("hidden");
    this.message.classList.add("win-screen");
    this.message.innerHTML = `
      <div class="win-content">
        <h2 class="win-title">VICTORY</h2>
        <p class="win-subtitle">All 6 tiers conquered!</p>
        <p class="win-stats">You defeated the Grand Finale</p>
        <button id="restart-btn">Play Again</button>
      </div>
    `;
    document.getElementById("restart-btn").addEventListener("click", onRestart);
  }

  showStartScreen() {
    this.overlay.classList.remove("hidden");
    this.overlay.classList.add("visible");
  }
}
