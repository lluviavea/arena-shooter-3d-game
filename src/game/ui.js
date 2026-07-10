export class UI {
  constructor() {
    this.overlay = document.getElementById("overlay");
    this.crosshair = document.getElementById("crosshair");
    this.message = document.getElementById("message");
    this.playerHealth = document.getElementById("player-health");
    this.enemyHealth = document.getElementById("enemy-health");
    this.difficultyDisplay = document.getElementById("difficulty");
    this.killsDisplay = document.getElementById("kills");
    this.startBtn = document.getElementById("start-btn");
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
    this.difficultyDisplay.textContent = `Difficulty: ${tier}`;
  }

  updateKills(count) {
    this.killsDisplay.textContent = `Kills: ${count}`;
  }

  hideCrosshair() {
    this.crosshair.classList.remove("visible");
  }

  showDeathScreen(onRestart) {
    this.hideCrosshair();
    this.message.classList.remove("hidden");
    this.message.innerHTML = `
      <h2>Defeated</h2>
      <p>The bot got you. Try again!</p>
      <button id="restart-btn">Play Again</button>
    `;
    document.getElementById("restart-btn").addEventListener("click", onRestart);
  }

  showStartScreen() {
    this.overlay.classList.remove("hidden");
    this.overlay.classList.add("visible");
  }
}
