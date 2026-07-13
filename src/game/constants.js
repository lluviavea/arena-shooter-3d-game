// Arena
export const ARENA_SIZE = 36;
export const WALL_HEIGHT = 4;

// Player
export const PLAYER_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.45;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_FIRE_COOLDOWN = 0.15;
export const PLAYER_DAMAGE = 18;
export const PLAYER_MOVE_SPEED = 7;
export const PLAYER_TURN_SPEED = 0.006;
export const PLAYER_HITSCAN_RANGE = 55;

// Enemy
export const ENEMY_RADIUS = 0.7;
export const ENEMY_MAX_HEALTH = 100;
export const ENEMY_FIRE_COOLDOWN = 0.9;
export const ENEMY_MOVE_SPEED = 4.5;
export const ENEMY_DAMAGE = 12;
export const ENEMY_AGGRO_RANGE = 22;
export const ENEMY_FIRE_RANGE = 18;
export const ENEMY_CLOSE_RANGE = 6;

// Bullets
export const BULLET_SPEED = 28;
export const BULLET_RADIUS = 0.12;

// Health pickups
export const HEALTH_PICKUP_AMOUNT = 25;
export const HEALTH_PICKUP_RADIUS = 0.6;

// Difficulty system
export const MAX_TIER = 6;
export const KILLS_PER_TIER = [3, 3, 3, 3, 3, 1];
export const DIFFICULTY_SCALE_PER_TIER = 0.2;
export const ENEMIES_PER_TIER = [1, 2, 3, 4, 5, 1];

export const TIER_NAMES = [
  "Funk",
  "Groove",
  "Neon",
  "Fever",
  "Megamix",
  "Grand Finale",
];

// Tier 6 boss — the Grand Finale. BRUTAL tuning: fast, smart, relentless.
export const BOSS_MAX_HEALTH = 800;
export const BOSS_DAMAGE = 16; // per pellet (5-pellet spread)
export const BOSS_FIRE_COOLDOWN = 0.35;
export const BOSS_MOVE_SPEED = 6.5; // nearly as fast as the player (7)
export const BOSS_RADIUS = 1.4; // bigger hit target
export const BOSS_HIT_HEIGHT = 1.7;
export const BOSS_HIT_Y_MAX = 3.4;
export const BOSS_AGGRO_RANGE = 30;
export const BOSS_FIRE_RANGE = 28;
export const BOSS_CLOSE_RANGE = 6;
export const BOSS_SPREAD_PELLETS = 5;
export const BOSS_SPREAD_ANGLE = 0.15; // radians, ~8.6 degrees per side (tighter = harder to dodge)

// Enrage Phase 2 — triggers at 50% HP. The boss goes berserk.
export const BOSS_ENRAGE_HP_THRESHOLD = 0.5; // fraction of max HP
export const BOSS_ENRAGE_SPEED_MULT = 1.4; // 6.5 -> 9.1 (faster than player!)
export const BOSS_ENRAGE_FIRE_MULT = 0.6; // cooldown multiplier (0.35 -> 0.21s)
export const BOSS_ENRAGE_SPREAD_PELLETS = 7;
export const BOSS_ENRAGE_SPREAD_ANGLE = 0.12; // even tighter wall of bullets
export const BOSS_ENRAGE_LEAD_FACTOR = 0.95; // nearly perfect predictive aim

// Smart AI behaviors
export const BOSS_LEAD_FACTOR = 0.8; // 1.0 = perfect lead, 0 = no lead
export const BOSS_STRAFE_INTERVAL = 1.5; // seconds between strafe direction flips
export const BOSS_STRAFE_SPEED = 0.7; // fraction of move speed used for strafing
export const BOSS_ENRAGE_STRAFE_INTERVAL = 0.9; // faster strafe flips when enraged

// Reinforcements that harass the player during the boss fight
export const BOSS_ADD_CAP = 4;
export const BOSS_ADD_INTERVAL = 4; // seconds between add spawns
export const BOSS_ADD_TIER = 3; // adds use tier-3 stats

// Retro 80's disco neon palette
export const NEON_COLORS = {
  magenta: 0xff2e9a,
  cyan: 0x00f0ff,
  purple: 0xb026ff,
  yellow: 0xfff200,
  pink: 0xff6ec7,
};

// Gamepad (PS5 DualSense, standard mapping)
export const GAMEPAD_DEADZONE = 0.15;
export const GAMEPAD_LOOK_SENSITIVITY = 2.5; // radians/sec at full stick deflection
export const GAMEPAD_VIBRATION_DAMAGE = 300;
export const GAMEPAD_VIBRATION_STRONG = 1.0;
export const GAMEPAD_VIBRATION_WEAK = 0.4;

// Respawn
export const ENEMY_RESPAWN_DELAY = 2.5;

// Win condition
export const TIER_CLEAR_KILLS = KILLS_PER_TIER;
