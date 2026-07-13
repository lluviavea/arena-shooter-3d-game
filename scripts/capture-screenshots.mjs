import puppeteer from "puppeteer";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const URL = process.env.CAPTURE_URL || "http://localhost:5173";
const OUT = path.resolve("screenshots");
const W = 1600;
const H = 900;
const SCALE = 2;

const TIER_NAMES = ["Funk", "Groove", "Neon", "Fever", "Megamix", "Grand Finale"];

const consoleErrors = [];
const pageErrors = [];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shoot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: "png" });
  const s = await stat(file);
  const kb = Math.round(s.size / 1024);
  console.log(`   saved ${name}.png (${kb} KB)`);
  return kb;
}

async function verifyHud(page, tier) {
  const difficulty = await page.evaluate(
    () => document.getElementById("difficulty").textContent,
  );
  const enemies = await page.evaluate(
    () => document.getElementById("enemy-count").textContent,
  );
  const expected = `${TIER_NAMES[tier - 1]} (${tier}/6)`;
  const ok = difficulty === expected;
  console.log(`   HUD: difficulty="${difficulty}" enemies="${enemies}" ${ok ? "OK" : "MISMATCH"}`);
  return ok;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--use-gl=angle",
      "--use-angle=metal",
      `--window-size=${W},${H}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });

  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(e.message));

  console.log(`-> loading ${URL}`);
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => !!window.__game, { timeout: 10000 });

  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch {}

  // 1. Menu (overlay visible on load)
  console.log("capture: menu");
  await wait(900);
  await shoot(page, "menu");

  // Start the game loop once for all gameplay shots (no pointer lock, no audio).
  await page.evaluate(() => {
    const g = window.__game;
    g.reset();
    g.running = true;
    g.ui.showHUD();
    g.loop();
  });
  await wait(500);

  // 2..6. Tiers 1..6
  for (let t = 1; t <= 6; t++) {
    const name = `tier-${t}-${TIER_NAMES[t - 1].toLowerCase()}`;
    console.log(`capture: ${name}`);
    await page.evaluate((tier) => {
      const g = window.__game;
      for (const e of g.enemies) g.scene.remove(e.mesh);
      g.enemies = [];
      g.difficultyTier = tier;
      g.spawnTierEnemies();
      g.updateLightingForTier();
      g.updateHud();

      const p = g.player;
      p.x = 0;
      p.z = 12;
      p.health = 100;
      let nearest = null;
      let best = Infinity;
      for (const e of g.enemies) {
        const d = (e.x - p.x) ** 2 + (e.z - p.z) ** 2;
        if (d < best) {
          best = d;
          nearest = e;
        }
      }
      if (nearest) p.rotationY = Math.atan2(p.x - nearest.x, p.z - nearest.z);
    }, t);
    await wait(450);
    await verifyHud(page, t);
    await shoot(page, name);
  }

  // 7. Death (uses current scene, shows death overlay)
  console.log("capture: death");
  await page.evaluate(() => window.__game.endGame());
  await wait(500);
  await shoot(page, "death");

  // 8. Victory (reset to a clean tier-6 boss scene, run the win flow)
  console.log("capture: victory");
  await page.evaluate(() => {
    const g = window.__game;
    g.reset();
    for (const e of g.enemies) g.scene.remove(e.mesh);
    g.enemies = [];
    g.difficultyTier = 6;
    g.spawnTierEnemies();
    g.updateLightingForTier();
    g.updateHud();
    g.running = true;
    g.ui.showHUD();
    g.loop();
    setTimeout(() => g.winGame(), 300);
  });
  await wait(5200);
  await shoot(page, "victory");

  // Report
  console.log(`\nconsole errors: ${consoleErrors.length}`);
  consoleErrors.forEach((e) => console.log(`   ! ${e}`));
  console.log(`page errors: ${pageErrors.length}`);
  pageErrors.forEach((e) => console.log(`   ! ${e}`));

  await browser.close();
  if (pageErrors.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
