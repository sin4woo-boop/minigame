window.GAME_BALANCE = {
  presets: {
    easy: { name: "EASY", enemyHp: 0.84, enemySpeed: 0.9, enemyDamage: 0.84, spawnRate: 0.9, eliteRate: 0.85 },
    normal: { name: "NORMAL", enemyHp: 1, enemySpeed: 1, enemyDamage: 1, spawnRate: 1, eliteRate: 1 },
    hard: { name: "HARD", enemyHp: 1.15, enemySpeed: 1.12, enemyDamage: 1.18, spawnRate: 1.15, eliteRate: 1.2 }
  },
  weapons: {
    pea: { fireRate: 0.28, damage: 10, speed: 480, radius: 8, splash: 0, pierce: 0, bounce: 3, bounceRange: 140, bounceDmgMul: 1.1, enabled: true, sprite: "pea", label: "완두콩" },
    spike: { fireRate: 0.7, damage: 28, speed: 460, radius: 12, splash: 0, pierce: 5, pierceFalloff: 0, enabled: false, sprite: "spike", label: "선인장" },
    spore: { fireRate: 2.0, damage: 6, speed: 0, radius: 14, splash: 55, pierce: 0, cloudDuration: 3.0, tickRate: 0.5, slowMul: 0.35, enabled: false, sprite: "spore", label: "버섯" },
    corn: { fireRate: 1.2, damage: 8, speed: 380, radius: 6, splash: 0, pierce: 0, pellets: 7, spreadAngle: 0.7, enabled: false, sprite: "corn", label: "옥수수" },
    cherry: { fireRate: 4.0, damage: 90, speed: 340, radius: 14, splash: 130, pierce: 0, fuseTime: 1.8, knockback: 80, enabled: false, sprite: "cherry", label: "체리폭탄" },
    vine: { fireRate: 2.5, damage: 20, speed: 0, radius: 22, splash: 70, pierce: 0, snareDuration: 2.0, pullRange: 90, pullForce: 120, enabled: false, sprite: "vine", label: "덩굴" }
  },
  enemies: {
    basic: {
      radius: { min: 12, max: 16 },
      hp: { min: 8, max: 16, scalePerSec: 0.006 },
      speed: { min: 38, max: 55, scalePerSec: 0.006 },
      damage: 4
    },
    hammer: {
      radius: { min: 18, max: 22 },
      hp: { min: 42, max: 62, scalePerSec: 0.008 },
      speed: { min: 28, max: 40 },
      damage: 5,
      slamRadius: 72,
      slamDamage: 26,
      slamCooldown: 3.2,
      windup: { min: 0.8, max: 1.6 }
    },
    dasher: {
      radius: 15,
      hp: { min: 35, max: 50, scalePerSec: 0.008 },
      cooldown: { min: 1.3, max: 2.2 },
      dashSpeed: { min: 360, max: 430 },
      dashDamage: 18
    },
    bomber: {
      radius: { min: 16, max: 19 },
      hp: { min: 32, max: 48, scalePerSec: 0.008 },
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
      hammer: {
        radius: 28,
        hpBase: 1200,
        hpScalePerSec: 1.2,
        speed: 40,
        contactDamage: 12,
        summonCooldown: 8.5,
        summonCount: 2,
        slam: { cooldown: 4.5, radius: 95, damage: 32, windup: 0.8 },
        charge: { cooldown: 6.5, speed: 420, duration: 1.0, damage: 40, windup: 0.7 },
        earthquake: { cooldown: 11.0, count: 4, radius: 65, damage: 28, delay: 0.4, windup: 1.2 }
      },
      spore: {
        radius: 25,
        hpBase: 1500,
        hpScalePerSec: 1.35,
        speed: 36,
        contactDamage: 10,
        summonCooldown: 7.5,
        summonCount: 3,
        toxicBlast: { cooldown: 5.5, range: 450, radius: 85, damage: 26, duration: 4.5, windup: 0.8 },
        sporeSplit: { cooldown: 9.0, count: 5, radius: 18, damage: 22, speed: 180, windup: 1.0 },
        decayBreath: { cooldown: 8.0, range: 220, angle: 1.8, damagePerSec: 18, duration: 2.5, windup: 0.9 }
      },
      morningStar: {
        radius: 26,
        hpBase: 1900,
        hpScalePerSec: 1.5,
        speed: 44,
        contactDamage: 14,
        summonCooldown: 9.0,
        summonCount: 2,
        maceSwing: { cooldown: 3.5, windup: 0.6, swingTime: 0.45, range: 280, lengthMul: 1.74, headRadius: 26, damage: 42 },
        chainThrow: { cooldown: 7.0, range: 380, speed: 650, width: 44, damage: 55, windup: 0.85 },
        berserk: { threshold: 0.4, speedMul: 1.6, damageResist: 0.4, burnRadius: 35, burnDamage: 14 }
      }
    }
  },
  wave: {
    spawnInterval: { start: 0.5, decayPerSec: 0.01, min: 0.1 },
    extraSpawnChancePerSec: 0.02,
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
      spawnSecs: [60, 180, 300]
    }
  }
};
