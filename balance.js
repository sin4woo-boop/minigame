window.GAME_BALANCE = {
  presets: {
    easy: { name: "EASY", enemyHp: 0.84, enemySpeed: 0.9, enemyDamage: 0.84, spawnRate: 0.9, eliteRate: 0.85 },
    normal: { name: "NORMAL", enemyHp: 1, enemySpeed: 1, enemyDamage: 1, spawnRate: 1, eliteRate: 1 },
    hard: { name: "HARD", enemyHp: 1.15, enemySpeed: 1.12, enemyDamage: 1.18, spawnRate: 1.15, eliteRate: 1.2 }
  },
  weapons: {
    pea: { fireRate: 0.32, damage: 13, speed: 430, radius: 10, splash: 0, pierce: 0, enabled: true, sprite: "pea", label: "완두콩" },
    spike: { fireRate: 0.48, damage: 22, speed: 520, radius: 10, splash: 0, pierce: 2, enabled: false, sprite: "spike", label: "선인장" },
    spore: { fireRate: 1.1, damage: 16, speed: 290, radius: 11, splash: 44, pierce: 0, enabled: false, sprite: "spore", label: "버섯" },
    corn: { fireRate: 1.8, damage: 34, speed: 280, radius: 13, splash: 72, pierce: 0, enabled: false, sprite: "corn", label: "옥수수 폭격" },
    cherry: { fireRate: 3.2, damage: 62, speed: 250, radius: 15, splash: 118, pierce: 0, enabled: false, sprite: "cherry", label: "체리폭탄" },
    vine: { fireRate: 1.55, damage: 30, speed: 0, radius: 18, splash: 56, pierce: 0, enabled: false, sprite: "vine", label: "지면 덩굴" }
  },
  enemies: {
    basic: {
      radius: { min: 17, max: 22 },
      hp: { min: 14, max: 24, scalePerSec: 0.009 },
      speed: { min: 45, max: 68, scalePerSec: 0.009 },
      damage: 8
    },
    hammer: {
      radius: { min: 24, max: 28 },
      hp: { min: 52, max: 72, scalePerSec: 0.011 },
      speed: { min: 28, max: 40 },
      damage: 5,
      slamRadius: 72,
      slamDamage: 26,
      slamCooldown: 3.2,
      windup: { min: 0.8, max: 1.6 }
    },
    dasher: {
      radius: 20,
      hp: { min: 42, max: 60, scalePerSec: 0.01 },
      cooldown: { min: 1.3, max: 2.2 },
      dashSpeed: { min: 360, max: 430 },
      dashDamage: 20
    },
    bomber: {
      radius: { min: 21, max: 24 },
      hp: { min: 38, max: 56, scalePerSec: 0.01 },
      speed: { min: 35, max: 47, scalePerSec: 0.007 },
      damage: 7,
      throwRange: 250,
      throwCooldown: { min: 2.8, max: 4.1 },
      windup: 0.58,
      bomb: {
        radius: 72,
        damage: 26,
        fuse: 1.2,
        flightTime: 0.42
      }
    },
    boss: {
      radius: 34,
      hpBase: 900,
      hpScalePerSec: 1.15,
      speed: 34,
      contactDamage: 10,
      summonCooldown: 8.4,
      summonCount: 2,
      shockwave: { cooldown: 7.4, radius: 95, damage: 28, windup: 0.85 },
      dash: { cooldown: 5.4, speed: 390, duration: 0.85, damage: 36, windup: 0.52 },
      mace: { cooldown: 3.7, windup: 0.7, swingTime: 0.54, range: 290, lengthMul: 1.74, headRadius: 24, damage: 38 }
    }
  },
  wave: {
    spawnInterval: { start: 1, decayPerSec: 0.0085, min: 0.28 },
    extraSpawnChancePerSec: 0.009,
    dasher: {
      unlockSec: 24,
      chanceBase: 0.018,
      chancePerSec: 0.0009,
      chanceMax: 0.09,
      maxConcurrent: 2
    },
    hammer: {
      unlockSec: 25,
      chanceBase: 0.06,
      chancePerSec: 0.0022,
      chanceMax: 0.24
    },
    bomber: {
      unlockSec: 30,
      chanceBase: 0.026,
      chancePerSec: 0.0012,
      chanceMax: 0.15,
      maxConcurrent: 3
    },
    boss: {
      firstSpawnSec: 60,
      intervalSec: 90
    }
  }
};
