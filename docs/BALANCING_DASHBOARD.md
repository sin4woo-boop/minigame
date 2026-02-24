# Balancing Dashboard Notes

## Purpose
Track combat pacing and run quality with a simple manual dashboard before full telemetry.

## Target Ranges (Current Build)
- Average run length (new player): 6-9 minutes
- Average run length (experienced player): 10-14 minutes
- Kill rate:
  - 0-2 min: 20-35 kills/min
  - 2-6 min: 35-55 kills/min
  - 6+ min: 45-70 kills/min
- Level-up cadence:
  - Early (0-3 min): every 18-30s
  - Mid (3-8 min): every 28-45s
  - Late (8+ min): every 40-65s
- Boss fight duration: 35-90s
- Boss win rate after encounter:
  - First boss: 45-65%

## Quick Test Protocol (Per Build)
1. Run 5 sessions with base settings
2. Record:
   - time_survived
   - kills_total
   - level_reached
   - weapons_enabled
   - boss_encounters / boss_defeats
3. Compute:
   - kills_per_min = kills_total / (time_survived/60)
   - level_up_interval estimate
4. Compare to target ranges and adjust `balance.js`

## Tuning Knobs
- Too hard early:
  - Lower `wave.spawnInterval.decayPerSec`
  - Lower `enemies.basic.hp.scalePerSec`
  - Increase base weapon damage
- Too easy late:
  - Increase elite chances (`wave.hammer`, `wave.dasher`)
  - Increase boss hp scaling
- Boss too oppressive:
  - Increase boss skill cooldowns
  - Reduce shockwave/dash damage

## Current Observations
- Dashers feel readable after slowdown and lower spawn chance.
- Boss prototype is engaging but requires 10-run sample for stable numbers.

## Next Step
- Add lightweight run summary popup at game over with these metrics.
