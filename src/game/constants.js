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

// Tier 6 boss — the Grand Finale. Tuned for a "challenging but fair" duel.
export const BOSS_MAX_HEALTH = 700;
export const BOSS_DAMAGE = 14; // per pellet (3-pellet spread)
export const BOSS_FIRE_COOLDOWN = 0.7;
export const BOSS_MOVE_SPEED = 4.5;
export const BOSS_RADIUS = 1.4; // bigger hit target
export const BOSS_HIT_HEIGHT = 1.7;
export const BOSS_HIT_Y_MAX = 3.4;
export const BOSS_AGGRO_RANGE = 26;
export const BOSS_FIRE_RANGE = 24;
export const BOSS_CLOSE_RANGE = 8;
export const BOSS_SPREAD_PELLETS = 3;
export const BOSS_SPREAD_ANGLE = 0.21; // radians, ~12 degrees per side
// Reinforcements that harass the player during the boss fight
export const BOSS_ADD_CAP = 2;
export const BOSS_ADD_INTERVAL = 7; // seconds between add spawns
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
