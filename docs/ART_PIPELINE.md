# Character Art Pipeline

## Goal
- Keep the game friendly and readable for kids while scaling to commercial-level consistency.

## Visual Direction
- Core keywords: Round, Bright, Toy-like.
- Avoid: Horror eyes, sharp teeth, muddy grayscale.
- Readability first: Character team and role should be recognizable in under 0.5s.

## Role Silhouette Rules
- Player: Most rounded head/body, clean green palette, calm smile.
- Basic enemy: Smaller, softer shape, muted green/gray.
- Elite enemy: Add unique gear (hammer, wheel, helmet).
- Boss: 1.4x to 1.8x visual mass, clear crown/armor accents.

## Palette System
- Use one shared palette family.
- Team accent mapping:
  - Player: green + cream highlights
  - Normal enemies: sage + olive
  - Elites: add warm accents (amber/copper)
  - Boss: warm red/pink accent for threat readability

## Sprite Spec (Current Project)
- Master size: 96x96 for normal units, 156x156 for boss.
- Idle frame: required.
- Optional first pass: move(2), attack windup(1), hit(1).
- Keep eye position and mouth height consistent to prevent uncanny look.

## File Naming Convention
- Character: `assets/char-{role}-{variant}.svg`
  - Examples: `assets/char-player-pea.svg`, `assets/char-enemy-basic.svg`
- VFX: `assets/vfx-{type}-{variant}.svg`
- Bullet: `assets/bullet-{weapon}.svg`
- Boss: `assets/char-boss-{name}.svg`

## Production Steps
1. Silhouette pass in grayscale (readability check only)
2. Flat color pass with shared palette
3. Face pass (eyes/mouth/cheeks)
4. Accessory pass (role indicators)
5. In-game readability check at gameplay speed
6. Final polish (outline weight, highlights, saturation)

## QA Checklist
- Distinguishable from background at all corners of map
- Looks non-threatening at idle
- Readable while screen shake is active
- No visual confusion between elite and boss
- Works at both desktop and mobile canvas scale

## Current Sprint Tasks
- [x] Define style guide + naming rules
- [x] Redesign player base sprite
- [x] Redesign basic enemy sprite
- [ ] Align hammer/dasher/boss style to same line weight
- [ ] Add 2-frame idle bob variants for player/basic
