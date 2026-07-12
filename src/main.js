import { Game } from "./game/Game.js";

const canvas = document.getElementById("game");
const game = new Game(canvas);

if (import.meta.env.DEV) {
  window.__game = game;
}
