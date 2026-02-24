const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hpEl = document.getElementById("hp");
const levelEl = document.getElementById("level");
const xpEl = document.getElementById("xp");
const xpNeedEl = document.getElementById("xpNeed");
const hpFillEl = document.getElementById("hpFill");
const xpFillEl = document.getElementById("xpFill");
const weaponPillsEl = document.getElementById("weaponPills");
const pauseLoadoutWrapEl = document.getElementById("pauseLoadoutWrap");
const modeLabelEl = document.getElementById("modeLabel");
const timeEl = document.getElementById("time");
const zombieCountEl = document.getElementById("zombieCount");
const bossHudEl = document.getElementById("bossHud");
const bossNameEl = document.getElementById("bossName");
const bossFillEl = document.getElementById("bossFill");
const topUiEl = document.querySelector(".top-ui");
const moveStickEl = document.getElementById("moveStick");
const moveStickKnobEl = document.getElementById("moveStickKnob");
const mobilePauseBtnEl = document.getElementById("mobilePauseBtn");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const choicesWrap = document.getElementById("upgradeChoices");
const restartBtn = document.getElementById("restartBtn");

const keys = new Set();
const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const isPortraitMobile = () => window.innerWidth <= 920 && window.innerHeight > window.innerWidth;

function syncCanvasForViewport() {
  const portrait = isPortraitMobile();
  const targetW = portrait ? 540 : 960;
  const targetH = portrait ? 960 : 540;
  if (canvas.width === targetW && canvas.height === targetH) return;
  canvas.width = targetW;
  canvas.height = targetH;
  state.ambience = createAmbience();
  if (state.player) {
    state.player.x = clamp(state.player.x, state.player.r, canvas.width - state.player.r);
    state.player.y = clamp(state.player.y, state.player.r, canvas.height - state.player.r);
  }
}

const images = {};
const BALANCE = window.GAME_BALANCE;
const MAX_WEAPON_LEVEL = 5;
const TEST_EVOLUTION_KEYS = ["pea+spike", "spore+vine", "cherry+corn", "pea+spore", "corn+spike"];
const EVOLUTION_PAIRS = [
  ["pea", "spike"],
  ["spore", "vine"],
  ["corn", "cherry"],
  ["pea", "spore"],
  ["spike", "corn"],
];
const EVOLUTIONS = {
  "pea+spike": {
    title: "진화: 가시 포탑",
    desc: "완두콩+선인장 합체. 선인장 강화 오브가 전장을 쓸어버립니다.",
    icon: "spike",
    keep: "spike",
    consume: "pea",
    apply: () => {
      const keep = state.player.weapons.spike;
      const consume = state.player.weapons.pea;
      consume.enabled = false;
      consume.level = 0;
      consume.lockedByEvolution = true;
      keep.label = "가시 포탑";
      keep.evolvedKey = "pea+spike";
      keep.damage += 16;
      keep.orbCount = Math.min(14, (keep.orbCount || 2) + 2);
      keep.orbitSpeed = (keep.orbitSpeed || 2.9) + 0.6;
      keep.level = MAX_WEAPON_LEVEL;
    },
  },
  "spore+vine": {
    title: "진화: 맹독 정원",
    desc: "버섯+지면 덩굴 합체. 독성 포자 폭발이 연쇄로 퍼집니다.",
    icon: "spore",
    keep: "spore",
    consume: "vine",
    apply: () => {
      const keep = state.player.weapons.spore;
      const consume = state.player.weapons.vine;
      consume.enabled = false;
      consume.level = 0;
      consume.lockedByEvolution = true;
      keep.label = "맹독 정원";
      keep.evolvedKey = "spore+vine";
      keep.damage += 18;
      keep.splash += 30;
      keep.fireRate = Math.max(0.45, keep.fireRate * 0.82);
      keep.level = MAX_WEAPON_LEVEL;
    },
  },
  "cherry+corn": {
    title: "진화: 초신성 폭격",
    desc: "옥수수+체리폭탄 합체. 대폭발 탄막이 생성됩니다.",
    icon: "cherry",
    keep: "cherry",
    consume: "corn",
    apply: () => {
      const keep = state.player.weapons.cherry;
      const consume = state.player.weapons.corn;
      consume.enabled = false;
      consume.level = 0;
      consume.lockedByEvolution = true;
      keep.label = "초신성 폭격";
      keep.evolvedKey = "cherry+corn";
      keep.damage += 28;
      keep.splash += 40;
      keep.fireRate = Math.max(1.0, keep.fireRate * 0.78);
      keep.level = MAX_WEAPON_LEVEL;
    },
  },
  "pea+spore": {
    title: "진화: 포자 연사포",
    desc: "완두콩+버섯 합체. 연사와 독포자 범위가 함께 강화됩니다.",
    icon: "spore",
    keep: "spore",
    consume: "pea",
    apply: () => {
      const keep = state.player.weapons.spore;
      const consume = state.player.weapons.pea;
      consume.enabled = false;
      consume.level = 0;
      consume.lockedByEvolution = true;
      keep.label = "포자 연사포";
      keep.evolvedKey = "pea+spore";
      keep.damage += 14;
      keep.fireRate = Math.max(0.5, keep.fireRate * 0.72);
      keep.splash += 22;
      keep.level = MAX_WEAPON_LEVEL;
    },
  },
  "corn+spike": {
    title: "진화: 가시 폭격",
    desc: "선인장+옥수수 합체. 회전 오브가 폭발 파편을 흩뿌립니다.",
    icon: "corn",
    keep: "corn",
    consume: "spike",
    apply: () => {
      const keep = state.player.weapons.corn;
      const consume = state.player.weapons.spike;
      consume.enabled = false;
      consume.level = 0;
      consume.lockedByEvolution = true;
      keep.label = "가시 폭격";
      keep.evolvedKey = "corn+spike";
      keep.damage += 18;
      keep.splash += 28;
      keep.fireRate = Math.max(1.05, keep.fireRate * 0.8);
      keep.level = MAX_WEAPON_LEVEL;
    },
  },
};

function getEvolutionDef(a, b) {
  const sortedKey = makeEvolutionKey(a, b);
  return EVOLUTIONS[sortedKey] || EVOLUTIONS[`${a}+${b}`] || EVOLUTIONS[`${b}+${a}`] || null;
}

function validateEvolutionConfig() {
  for (const [a, b] of EVOLUTION_PAIRS) {
    if (!getEvolutionDef(a, b)) {
      console.warn(`[evolution] missing definition for pair: ${a}+${b}`);
    }
  }
}

function getPreset() {
  return BALANCE.presets[state.difficulty] || BALANCE.presets.normal;
}

function getBossPhaseName(phase = 1) {
  if (phase === 1) return "망치 대장";
  if (phase === 2) return "포자 군주";
  return "모닝스타 집행자";
}

function setDifficulty(mode) {
  if (!BALANCE.presets[mode]) return;
  state.difficulty = mode;
  const label = BALANCE.presets[mode].name;
  if (modeLabelEl) modeLabelEl.textContent = label;
  if (!state.gameOver) {
    showOverlay("난이도 변경", `${label} 모드로 전환됨`, []);
    setTimeout(() => {
      if (!state.gameOver && state.paused && state.overlayOptions.length === 0) {
        state.paused = false;
        hideOverlay();
      }
    }, 600);
    state.paused = true;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadAssets() {
  const pairs = await Promise.all([
    loadImage("assets/plant-hero.svg").then((img) => ["plant", img]),
    loadImage("assets/zombie-basic.svg").then((img) => ["zombie", img]),
    loadImage("assets/zombie-hammer.svg").then((img) => ["hammerZombie", img]),
    loadImage("assets/zombie-dasher.svg").then((img) => ["dasherZombie", img]),
    loadImage("assets/zombie-boss-caster.svg").then((img) => ["bossZombieCaster", img]),
    loadImage("assets/zombie-boss-crusher.svg").then((img) => ["bossZombieCrusher", img]),
    loadImage("assets/bullet-pea.svg").then((img) => ["pea", img]),
    loadImage("assets/bullet-spike.svg").then((img) => ["spike", img]),
    loadImage("assets/bullet-spore.svg").then((img) => ["spore", img]),
    loadImage("assets/bullet-corn.svg").then((img) => ["corn", img]),
    loadImage("assets/bullet-cherry.svg").then((img) => ["cherry", img]),
  ]);
  for (const [k, v] of pairs) images[k] = v;
}

function createWeaponConfig() {
  const weapons = {};
  for (const [id, cfg] of Object.entries(BALANCE.weapons)) {
    weapons[id] = {
      label: cfg.label,
      enabled: cfg.enabled,
      lockedByEvolution: false,
      level: cfg.enabled ? 1 : 0,
      fireRate: cfg.fireRate,
      timer: 0,
      damage: cfg.damage,
      speed: cfg.speed,
      radius: cfg.radius,
      sprite: cfg.sprite,
      splash: cfg.splash,
      pierce: cfg.pierce,
    };
    if (id === "spike") {
      weapons[id].orbCount = 2;
      weapons[id].orbitRadius = 78;
      weapons[id].orbitSpeed = 2.9;
    }
  }
  return weapons;
}

const state = {
  running: true,
  paused: false,
  gameOver: false,
  time: 0,
  kills: 0,
  player: null,
  zombies: [],
  bullets: [],
  effects: [],
  hazards: [],
  xpOrbs: [],
  ambience: [],
  spawnTick: 0,
  lastTs: 0,
  screenShake: 0,
  lastWeaponPillsKey: "",
  overlayOptions: [],
  bossDirector: { nextSpawnTime: BALANCE.wave.boss.firstSpawnSec, spawned: 0, lastVariant: null },
  difficulty: "normal",
  bossStats: { encounters: 0, defeats: 0 },
  lastBossVariantDefeated: null,
  settings: { damageText: true, screenShake: true, hitFlash: true },
  audio: {
    enabled: true,
    bgm: true,
    sfx: true,
    master: 0.36,
    ctx: null,
    masterGain: null,
    bgmGain: null,
    sfxGain: null,
    bgmStep: 0,
    bgmTimer: 0,
    beatTimer: 0,
    musicRoot: 146.83,
    shotStamp: {},
    sfxStamp: {},
  },
  evolutionsDone: {},
  runStats: { damageByWeapon: {} },
  testMode: false,
  testEvolutionIndex: 0,
  touchMove: { active: false, ax: 0, ay: 0, pointerId: null },
};

function createAmbience() {
  const arr = [];
  for (let i = 0; i < 42; i += 1) {
    arr.push({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      r: rand(1.4, 3.1),
      vx: rand(-10, 10),
      vy: rand(-18, -8),
      hue: Math.random() < 0.7 ? "rgba(232, 255, 210, 0.35)" : "rgba(255, 244, 214, 0.3)",
    });
  }
  return arr;
}

function nowAudioTime() {
  return state.audio.ctx?.currentTime || 0;
}

function ensureAudio() {
  if (!state.audio.enabled || state.audio.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctxAudio = new AC();
  const master = ctxAudio.createGain();
  const bgm = ctxAudio.createGain();
  const sfx = ctxAudio.createGain();
  master.gain.value = state.audio.master;
  bgm.gain.value = 0.2;
  sfx.gain.value = 0.9;
  bgm.connect(master);
  sfx.connect(master);
  master.connect(ctxAudio.destination);
  state.audio.ctx = ctxAudio;
  state.audio.masterGain = master;
  state.audio.bgmGain = bgm;
  state.audio.sfxGain = sfx;
}

function resumeAudio() {
  ensureAudio();
  if (state.audio.ctx?.state === "suspended") {
    state.audio.ctx.resume().catch(() => {});
  }
}

function playTone(freq, dur, volume = 0.12, type = "triangle", start = null, glideTo = null) {
  if (!state.audio.enabled || !state.audio.sfx || !state.audio.ctx || !state.audio.sfxGain) return;
  const t0 = start ?? nowAudioTime();
  const osc = state.audio.ctx.createOscillator();
  const gain = state.audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(state.audio.sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playNoise(dur, volume = 0.08, hpFreq = 1000) {
  if (!state.audio.enabled || !state.audio.sfx || !state.audio.ctx || !state.audio.sfxGain) return;
  const len = Math.max(1, Math.floor(state.audio.ctx.sampleRate * dur));
  const buf = state.audio.ctx.createBuffer(1, len, state.audio.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = state.audio.ctx.createBufferSource();
  src.buffer = buf;
  const filter = state.audio.ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hpFreq;
  const gain = state.audio.ctx.createGain();
  const t0 = nowAudioTime();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(state.audio.sfxGain);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function playBgmNote(freq, dur, volume = 0.06, type = "triangle", detune = 0) {
  if (!state.audio.enabled || !state.audio.bgm || !state.audio.ctx || !state.audio.bgmGain) return;
  const t0 = nowAudioTime();
  const osc = state.audio.ctx.createOscillator();
  const gain = state.audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.detune.setValueAtTime(detune, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(state.audio.bgmGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function playSfxEvent(id) {
  if (!state.audio.enabled || !state.audio.sfx) return;
  resumeAudio();
  const t = nowAudioTime();
  const stamp = state.audio.sfxStamp[id] || 0;
  if (t - stamp < 0.04) return;
  state.audio.sfxStamp[id] = t;
  if (id === "levelUp") {
    playTone(392, 0.14, 0.12, "triangle");
    playTone(523.25, 0.16, 0.14, "triangle", t + 0.08);
    playTone(659.25, 0.18, 0.14, "triangle", t + 0.16);
    return;
  }
  if (id === "evolution") {
    playTone(261.63, 0.18, 0.12, "sawtooth");
    playTone(392, 0.2, 0.12, "triangle", t + 0.08);
    playTone(783.99, 0.26, 0.13, "triangle", t + 0.18);
    playTone(587.33, 0.22, 0.09, "sine", t + 0.1);
    playNoise(0.1, 0.05, 1300);
    return;
  }
  if (id === "bossSpawn") {
    playTone(130.81, 0.26, 0.16, "sawtooth", t, 90);
    playTone(98, 0.24, 0.12, "triangle", t + 0.12);
    return;
  }
  if (id === "playerHit") {
    playTone(180, 0.12, 0.13, "square", t, 120);
    playNoise(0.08, 0.09, 950);
    return;
  }
  if (id === "killPop") {
    playTone(510, 0.07, 0.07, "triangle");
    return;
  }
  if (id === "bigBoom") {
    playTone(120, 0.14, 0.12, "sawtooth", t, 70);
    playNoise(0.12, 0.1, 650);
  }
}

function playWeaponSfx(weaponId, evolvedKey = "") {
  if (!weaponId || !state.audio.enabled || !state.audio.sfx) return;
  resumeAudio();
  const t = nowAudioTime();
  const minGap = weaponId === "pea" ? 0.06 : weaponId === "spike" ? 0.08 : 0.11;
  const stamp = state.audio.shotStamp[weaponId] || 0;
  if (t - stamp < minGap) return;
  state.audio.shotStamp[weaponId] = t;
  if (weaponId === "pea") {
    playTone(670, 0.06, 0.06, "triangle", t, 610);
  } else if (weaponId === "spike") {
    if (evolvedKey === "pea+spike") {
      playTone(330, 0.08, 0.08, "square", t, 270);
      playTone(520, 0.06, 0.05, "triangle", t + 0.03, 470);
    } else {
      playTone(290, 0.07, 0.07, "square", t, 240);
    }
  } else if (weaponId === "spore") {
    if (evolvedKey === "spore+vine") {
      playTone(300, 0.12, 0.08, "sine", t, 210);
      playTone(510, 0.08, 0.05, "triangle", t + 0.04, 430);
      playNoise(0.06, 0.05, 1300);
    } else if (evolvedKey === "pea+spore") {
      playTone(420, 0.08, 0.08, "triangle", t, 340);
      playTone(620, 0.06, 0.05, "sine", t + 0.02, 560);
    } else {
      playTone(350, 0.11, 0.08, "sine", t, 260);
      playNoise(0.05, 0.04, 1500);
    }
  } else if (weaponId === "corn") {
    if (evolvedKey === "corn+spike") {
      playTone(250, 0.1, 0.09, "square", t, 175);
      playTone(370, 0.06, 0.05, "triangle", t + 0.03, 320);
    } else {
      playTone(230, 0.1, 0.09, "square", t, 165);
    }
  } else if (weaponId === "cherry") {
    if (evolvedKey === "cherry+corn") {
      playTone(184, 0.13, 0.11, "sawtooth", t, 96);
      playTone(460, 0.09, 0.06, "triangle", t + 0.06, 240);
      playNoise(0.1, 0.07, 860);
    } else {
      playTone(168, 0.12, 0.1, "sawtooth", t, 92);
      playNoise(0.08, 0.06, 920);
    }
  } else if (weaponId === "vine") {
    playTone(260, 0.09, 0.07, "triangle", t, 190);
  }
}

function updateAudio(dt) {
  if (!state.audio.enabled || !state.audio.bgm || !state.audio.ctx || state.paused || state.gameOver) return;
  state.audio.bgmTimer += dt;
  state.audio.beatTimer += dt;
  const stepDur = 0.25;
  while (state.audio.bgmTimer >= stepDur) {
    state.audio.bgmTimer -= stepDur;
    const step = state.audio.bgmStep % 16;
    const root = state.audio.musicRoot;
    const scale = [0, 3, 5, 7, 10, 12];
    const melody = [0, 2, 3, 4, 3, 2, 1, 2, 0, 2, 4, 5, 4, 2, 1, 0];
    const note = root * (2 ** (scale[melody[step] % scale.length] / 12));
    playBgmNote(note, 0.2, 0.048, "triangle", step % 2 === 0 ? -3 : 3);
    if (step % 4 === 0) playBgmNote(root * 0.5, 0.24, 0.055, "sine");
    if (step === 7 || step === 15) playBgmNote(root * 0.75, 0.18, 0.044, "square");
    state.audio.bgmStep += 1;
  }
}

function applyPlayerDamage(amount, sourceX = null, sourceY = null) {
  if (!amount || amount <= 0 || state.gameOver) return;
  const p = state.player;
  p.hp -= amount;
  p.hurtTimer = Math.max(p.hurtTimer || 0, 0.34);
  bumpScreenShake(Math.min(6, 2.2 + amount * 0.09));
  if (sourceX != null && sourceY != null) {
    const dx = p.x - sourceX;
    const dy = p.y - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const knock = Math.min(12, 3 + amount * 0.08);
    p.x = clamp(p.x + (dx / len) * knock, p.r, canvas.width - p.r);
    p.y = clamp(p.y + (dy / len) * knock, p.r, canvas.height - p.r);
  }
  playSfxEvent("playerHit");
  if (p.hp <= 0) {
    if (state.testMode) {
      p.hp = p.maxHp;
      pushSystemBanner("테스트 모드", "플레이어 체력 자동 회복");
      return;
    }
    p.hp = 0;
    gameOver();
  }
}

function resetGame() {
  syncCanvasForViewport();
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.time = 0;
  state.kills = 0;
  state.zombies = [];
  state.bullets = [];
  state.effects = [];
  state.hazards = [];
  state.xpOrbs = [];
  state.ambience = createAmbience();
  state.spawnTick = 0;
  state.screenShake = 0;
  state.lastWeaponPillsKey = "";
  state.overlayOptions = [];
  state.bossDirector = { nextSpawnTime: BALANCE.wave.boss.firstSpawnSec, spawned: 0, lastVariant: null };
  state.bossStats = { encounters: 0, defeats: 0 };
  state.lastBossVariantDefeated = null;
  state.settings = { damageText: true, screenShake: true, hitFlash: true };
  state.audio.bgmStep = 0;
  state.audio.bgmTimer = 0;
  state.audio.beatTimer = 0;
  state.audio.shotStamp = {};
  state.audio.sfxStamp = {};
  state.evolutionsDone = {};
  state.runStats = { damageByWeapon: {} };
  state.testMode = false;
  state.testEvolutionIndex = 0;
  state.touchMove = { active: false, ax: 0, ay: 0, pointerId: null };
  if (moveStickKnobEl) moveStickKnobEl.style.transform = "translate(-50%, -50%)";

  state.player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 22,
    speed: 210,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNeed: 8,
    hurtTimer: 0,
    face: 1,
    faceVisual: 1,
    moveMag: 0,
    strideT: 0,
    weapons: createWeaponConfig(),
  };

  hideOverlay();
}

function clearCombatField() {
  state.zombies = [];
  state.bullets = [];
  state.effects = [];
  state.hazards = [];
  state.xpOrbs = [];
}

function spawnTrainingDummies(count = 16) {
  const rows = Math.max(2, Math.floor(Math.sqrt(count)));
  const cols = Math.max(2, Math.ceil(count / rows));
  const padX = 86;
  const padY = 76;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (state.zombies.length >= count) return;
      const x = padX + c * ((canvas.width - padX * 2) / Math.max(1, cols - 1)) + rand(-16, 16);
      const y = padY + r * ((canvas.height - padY * 2) / Math.max(1, rows - 1)) + rand(-14, 14);
      state.zombies.push({
        type: "dummy",
        x: clamp(x, 36, canvas.width - 36),
        y: clamp(y, 36, canvas.height - 36),
        r: rand(18, 22),
        hp: 1200,
        maxHp: 1200,
        speed: 0,
        damage: 0,
      });
    }
  }
}

function setAllWeaponsBaseState() {
  for (const [id, w] of Object.entries(state.player.weapons)) {
    const base = BALANCE.weapons[id];
    w.label = base.label;
    w.enabled = false;
    w.lockedByEvolution = false;
    w.level = 0;
    w.fireRate = base.fireRate;
    w.timer = 0;
    w.damage = base.damage;
    w.speed = base.speed;
    w.radius = base.radius;
    w.sprite = base.sprite;
    w.splash = base.splash;
    w.pierce = base.pierce;
    w.evolvedKey = "";
    if (id === "spike") {
      w.orbCount = 2;
      w.orbitRadius = 78;
      w.orbitSpeed = 2.9;
    }
  }
}

function applyEvolutionLoadoutByKey(key) {
  const pair = EVOLUTION_PAIRS.find(([a, b]) => makeEvolutionKey(a, b) === key);
  const evo = EVOLUTIONS[key];
  if (!pair || !evo) return;
  const [a, b] = pair;
  setAllWeaponsBaseState();
  const wa = state.player.weapons[a];
  const wb = state.player.weapons[b];
  wa.enabled = true;
  wa.level = MAX_WEAPON_LEVEL;
  wb.enabled = true;
  wb.level = MAX_WEAPON_LEVEL;
  evo.apply();
  state.evolutionsDone = { [key]: true };
}

function enterEvolutionTestMode(index = 0) {
  state.testMode = true;
  state.testEvolutionIndex = ((index % TEST_EVOLUTION_KEYS.length) + TEST_EVOLUTION_KEYS.length) % TEST_EVOLUTION_KEYS.length;
  const key = TEST_EVOLUTION_KEYS[state.testEvolutionIndex];
  clearCombatField();
  state.paused = false;
  state.gameOver = false;
  state.running = true;
  state.time = 0;
  state.spawnTick = 0;
  state.bossDirector = { nextSpawnTime: 999999, spawned: 0, lastVariant: null };
  state.player.hp = state.player.maxHp;
  state.player.level = 30;
  state.player.xp = 0;
  state.player.xpNeed = 9999;
  applyEvolutionLoadoutByKey(key);
  spawnTrainingDummies(20);
  pushSystemBanner("테스트 모드", `진화 무기: ${state.player.weapons[evoKeepWeaponId(key)]?.label || key}`);
}

function evoKeepWeaponId(key) {
  const evo = EVOLUTIONS[key];
  return evo?.keep || null;
}

function cycleEvolutionTestMode(dir = 1) {
  if (!state.testMode) return;
  const next = state.testEvolutionIndex + dir;
  enterEvolutionTestMode(next);
}

function spawnZombie() {
  const side = Math.floor(rand(0, 4));
  let x = 0;
  let y = 0;
  if (side === 0) { x = rand(0, canvas.width); y = -34; }
  if (side === 1) { x = canvas.width + 34; y = rand(0, canvas.height); }
  if (side === 2) { x = rand(0, canvas.width); y = canvas.height + 34; }
  if (side === 3) { x = -34; y = rand(0, canvas.height); }

  const t = state.time;
  const c = BALANCE.enemies.basic;
  const preset = getPreset();
  const hpScale = 1 + t * c.hp.scalePerSec;
  const speedScale = 1 + t * c.speed.scalePerSec;

  state.zombies.push({
    type: "basic",
    x,
    y,
    r: rand(c.radius.min, c.radius.max),
    hp: Math.round(rand(c.hp.min, c.hp.max) * hpScale * preset.enemyHp),
    speed: rand(c.speed.min, c.speed.max) * speedScale * preset.enemySpeed,
    damage: c.damage * preset.enemyDamage,
  });
}

function spawnHammerZombie() {
  const side = Math.floor(rand(0, 4));
  let x = 0;
  let y = 0;
  if (side === 0) { x = rand(0, canvas.width); y = -40; }
  if (side === 1) { x = canvas.width + 40; y = rand(0, canvas.height); }
  if (side === 2) { x = rand(0, canvas.width); y = canvas.height + 40; }
  if (side === 3) { x = -40; y = rand(0, canvas.height); }

  const t = state.time;
  const c = BALANCE.enemies.hammer;
  const preset = getPreset();
  const hpScale = 1 + t * c.hp.scalePerSec;

  state.zombies.push({
    type: "hammer",
    x,
    y,
    r: rand(c.radius.min, c.radius.max),
    hp: Math.round(rand(c.hp.min, c.hp.max) * hpScale * preset.enemyHp),
    speed: rand(c.speed.min, c.speed.max) * preset.enemySpeed,
    damage: c.damage * preset.enemyDamage,
    slamRadius: c.slamRadius,
    slamDamage: c.slamDamage * preset.enemyDamage,
    slamCooldown: c.slamCooldown,
    slamTimer: rand(c.windup.min, c.windup.max),
    windup: 0,
  });
}

function spawnDasherZombie() {
  const side = Math.floor(rand(0, 4));
  let x = 0;
  let y = 0;
  if (side === 0) { x = rand(0, canvas.width); y = -36; }
  if (side === 1) { x = canvas.width + 36; y = rand(0, canvas.height); }
  if (side === 2) { x = rand(0, canvas.width); y = canvas.height + 36; }
  if (side === 3) { x = -36; y = rand(0, canvas.height); }

  const c = BALANCE.enemies.dasher;
  const preset = getPreset();
  const t = state.time;
  const hpScale = 1 + t * (c.hp?.scalePerSec || 0.01);
  const hp = Math.round(rand(c.hp?.min || 42, c.hp?.max || 60) * hpScale * preset.enemyHp);
  state.zombies.push({
    type: "dasher",
    x,
    y,
    r: c.radius,
    hp,
    maxHp: hp,
    speed: 0,
    damage: 0,
    cooldown: rand(c.cooldown.min, c.cooldown.max),
    phase: "cooldown",
    dashSpeed: rand(c.dashSpeed.min, c.dashSpeed.max) * preset.enemySpeed,
    vx: 0,
    vy: 0,
    dashDamage: c.dashDamage * preset.enemyDamage,
  });
}

function spawnBomberZombie() {
  const side = Math.floor(rand(0, 4));
  let x = 0;
  let y = 0;
  if (side === 0) { x = rand(0, canvas.width); y = -38; }
  if (side === 1) { x = canvas.width + 38; y = rand(0, canvas.height); }
  if (side === 2) { x = rand(0, canvas.width); y = canvas.height + 38; }
  if (side === 3) { x = -38; y = rand(0, canvas.height); }

  const c = BALANCE.enemies.bomber;
  const preset = getPreset();
  const t = state.time;
  const hpScale = 1 + t * c.hp.scalePerSec;
  const speedScale = 1 + t * c.speed.scalePerSec;
  state.zombies.push({
    type: "bomber",
    x,
    y,
    r: rand(c.radius.min, c.radius.max),
    hp: Math.round(rand(c.hp.min, c.hp.max) * hpScale * preset.enemyHp),
    speed: rand(c.speed.min, c.speed.max) * speedScale * preset.enemySpeed,
    damage: c.damage * preset.enemyDamage,
    throwRange: c.throwRange,
    throwTimer: rand(c.throwCooldown.min, c.throwCooldown.max),
    throwCooldown: c.throwCooldown,
    throwWindup: 0,
    bombRadius: c.bomb.radius,
    bombDamage: c.bomb.damage * preset.enemyDamage,
    bombFuse: c.bomb.fuse,
    bombFlightTime: c.bomb.flightTime,
  });
}

function spawnBossZombie() {
  const side = Math.floor(rand(0, 4));
  let x = 0;
  let y = 0;
  if (side === 0) { x = rand(140, canvas.width - 140); y = -54; }
  if (side === 1) { x = canvas.width + 54; y = rand(120, canvas.height - 120); }
  if (side === 2) { x = rand(140, canvas.width - 140); y = canvas.height + 54; }
  if (side === 3) { x = -54; y = rand(120, canvas.height - 120); }

  const c = BALANCE.enemies.boss;
  const preset = getPreset();
  const hp = Math.round(c.hpBase + state.time * c.hpScalePerSec);
  state.zombies.push({
    type: "boss",
    variant: "triad",
    x,
    y,
    r: c.radius,
    hp: Math.round(hp * preset.enemyHp),
    maxHp: Math.round(hp * preset.enemyHp),
    speed: c.speed * preset.enemySpeed,
    damage: c.contactDamage * preset.enemyDamage,
    phase: 1,
    lastPhase: 1,
    summonTimer: c.summonCooldown,
    shockTimer: c.shockwave.cooldown,
    shockWindup: 0,
    dashTimer: c.dash.cooldown,
    dashWindup: 0,
    dashDuration: 0,
    vx: 0,
    vy: 0,
    spawnShield: 1.1,
    castTimer: rand(3.6, 4.8),
    maceTimer: c.mace.cooldown,
    maceWindup: 0,
    maceActive: 0,
    maceActiveMax: c.mace.swingTime,
    maceAngle: 0,
    maceDir: 1,
    maceHitLock: 0,
  });
}

function spawnBasicNear(x, y) {
  const c = BALANCE.enemies.basic;
  const preset = getPreset();
  const t = state.time;
  const hpScale = 1 + t * c.hp.scalePerSec;
  const speedScale = 1 + t * c.speed.scalePerSec;
  const ang = rand(0, Math.PI * 2);
  const dist = rand(44, 96);
  const px = clamp(x + Math.cos(ang) * dist, 16, canvas.width - 16);
  const py = clamp(y + Math.sin(ang) * dist, 16, canvas.height - 16);
  state.zombies.push({
    type: "basic",
    x: px,
    y: py,
    r: rand(c.radius.min, c.radius.max),
    hp: Math.round(rand(c.hp.min, c.hp.max) * hpScale * preset.enemyHp),
    speed: rand(c.speed.min, c.speed.max) * speedScale * preset.enemySpeed,
    damage: c.damage * preset.enemyDamage,
  });
}

function hasActiveBoss() {
  return state.zombies.some((z) => z.type === "boss");
}

function updateBossDirector() {
  if (state.testMode) return;
  const cfg = BALANCE.wave.boss;
  if (state.time < state.bossDirector.nextSpawnTime) return;
  if (hasActiveBoss()) return;
  spawnBossZombie();
  state.bossStats.encounters += 1;
  state.bossDirector.spawned += 1;
  state.bossDirector.nextSpawnTime += cfg.intervalSec;
  state.effects.push({
    type: "banner",
    x: canvas.width / 2,
    y: 66,
    life: 1.35,
    maxLife: 1.35,
    size: 1,
    text: "보스 출현! 삼중 변이체",
    subText: "패턴을 피하면서 처치하세요",
  });
  playSfxEvent("bossSpawn");
}

function spawnEnemy() {
  const wave = BALANCE.wave;
  const preset = getPreset();
  const dasherCfg = wave.dasher;
  const hammerCfg = wave.hammer;
  const bomberCfg = wave.bomber;
  const activeDashers = state.zombies.filter((z) => z.type === "dasher").length;
  const activeBombers = state.zombies.filter((z) => z.type === "bomber").length;
  const dasherChance = state.time < dasherCfg.unlockSec
    ? 0
    : clamp(
      (dasherCfg.chanceBase + (state.time - dasherCfg.unlockSec) * dasherCfg.chancePerSec) * preset.eliteRate,
      dasherCfg.chanceBase,
      dasherCfg.chanceMax
    );
  const hammerChance = state.time < hammerCfg.unlockSec
    ? 0
    : clamp(
      (hammerCfg.chanceBase + (state.time - hammerCfg.unlockSec) * hammerCfg.chancePerSec) * preset.eliteRate,
      hammerCfg.chanceBase,
      hammerCfg.chanceMax
    );
  const bomberChance = state.time < bomberCfg.unlockSec
    ? 0
    : clamp(
      (bomberCfg.chanceBase + (state.time - bomberCfg.unlockSec) * bomberCfg.chancePerSec) * preset.eliteRate,
      bomberCfg.chanceBase,
      bomberCfg.chanceMax
    );
  if (activeDashers < dasherCfg.maxConcurrent && Math.random() < dasherChance) {
    spawnDasherZombie();
    return;
  }
  if (activeBombers < bomberCfg.maxConcurrent && Math.random() < bomberChance) {
    spawnBomberZombie();
    return;
  }
  if (Math.random() < hammerChance) {
    spawnHammerZombie();
    return;
  }
  spawnZombie();
}

function nearestZombie(fromX, fromY) {
  let best = null;
  let bestDist = Infinity;
  for (const z of state.zombies) {
    if (z.targetable === false) continue;
    const dx = z.x - fromX;
    const dy = z.y - fromY;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      best = z;
    }
  }
  return best;
}

function shootWeapon(weapon, target, weaponId = null) {
  const p = state.player;
  const evoMode = getWeaponEvolutionMode(weaponId, weapon);
  if (weapon.sprite === "vine") {
    state.bullets.push({
      kind: "vine",
      weaponId,
      x: target.x,
      y: target.y,
      r: weapon.radius,
      damage: weapon.damage,
      splash: weapon.splash,
      life: 0.85,
      warmup: 0.38,
      triggered: false,
    });
    return;
  }

  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const len = Math.hypot(dx, dy) || 1;

  if (weaponId === "corn") {
    const speed = weapon.speed;
    state.bullets.push({
      kind: "cornShell",
      weaponId,
      x: p.x,
      y: p.y,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      r: weapon.radius,
      damage: weapon.damage,
      splash: weapon.splash,
      life: 1.5,
      sprite: weapon.sprite,
      rotation: Math.atan2(dy, dx),
      traveled: 0,
      explodeDistance: evoMode === "thornBomb" ? clamp(len * 0.52, 110, 220) : clamp(len * 0.6, 120, 240),
      kernelCount: evoMode === "thornBomb" ? 12 : 8,
      evoMode,
    });
    return;
  }

  const baseBullet = {
    kind: "bullet",
    weaponId,
    x: p.x,
    y: p.y,
    vx: (dx / len) * weapon.speed,
    vy: (dy / len) * weapon.speed,
    r: weapon.radius,
    damage: weapon.damage,
    life: 1.4,
    sprite: weapon.sprite,
    splash: weapon.splash,
    pierce: weapon.pierce,
    rotation: Math.atan2(dy, dx),
    hitIds: new Set(),
    toxicGarden: evoMode === "toxicGarden",
    evoMode,
  };
  state.bullets.push(baseBullet);
  if (weaponId === "spore" && evoMode === "sporeGatling") {
    for (const side of [-1, 1]) {
      const ang = Math.atan2(dy, dx) + side * 0.17;
      state.bullets.push({
        kind: "bullet",
        weaponId,
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * weapon.speed * 1.06,
        vy: Math.sin(ang) * weapon.speed * 1.06,
        r: Math.max(6, weapon.radius * 0.82),
        damage: Math.round(weapon.damage * 0.58),
        life: 1.1,
        sprite: weapon.sprite,
        splash: Math.round(weapon.splash * 0.55),
        pierce: 0,
        rotation: ang,
        hitIds: new Set(),
        toxicGarden: false,
        evoMode,
      });
    }
    state.effects.push({
      type: "sporeVolley",
      x: p.x + (dx / len) * 14,
      y: p.y + (dy / len) * 14,
      life: 0.16,
      maxLife: 0.16,
      size: 18,
    });
  }
}

function getWeaponEvolutionMode(weaponId, weapon = null) {
  if (!weaponId) return "";
  const evolvedKey = weapon?.evolvedKey || state.player.weapons[weaponId]?.evolvedKey || "";
  if (weaponId === "spike" && evolvedKey === "pea+spike") return "spikeTurret";
  if (weaponId === "spore" && evolvedKey === "spore+vine") return "toxicGarden";
  if (weaponId === "spore" && evolvedKey === "pea+spore") return "sporeGatling";
  if (weaponId === "cherry" && evolvedKey === "cherry+corn") return "supernova";
  if (weaponId === "corn" && evolvedKey === "corn+spike") return "thornBomb";
  return "";
}

function spikeOrbPosition(weapon, index, nowSec = state.time) {
  const p = state.player;
  const count = Math.max(1, weapon.orbCount || 2);
  const radius = weapon.orbitRadius || 78;
  const base = (Math.PI * 2 * index) / count;
  const ang = base + nowSec * (weapon.orbitSpeed || 2.9);
  return {
    x: p.x + Math.cos(ang) * radius,
    y: p.y + Math.sin(ang) * radius,
  };
}

function getWeaponImpactProfile(weaponId) {
  if (weaponId === "pea") return { shake: 0.7, push: 1.6, size: 8, color: "rgba(190, 255, 180, 0.78)" };
  if (weaponId === "spike") return { shake: 1.3, push: 2.8, size: 11, color: "rgba(215, 255, 210, 0.86)" };
  if (weaponId === "spore") return { shake: 1.05, push: 2.2, size: 10, color: "rgba(211, 164, 255, 0.82)" };
  if (weaponId === "corn") return { shake: 1.35, push: 3.2, size: 12, color: "rgba(255, 237, 168, 0.84)" };
  if (weaponId === "cherry") return { shake: 1.7, push: 3.8, size: 14, color: "rgba(255, 186, 205, 0.88)" };
  if (weaponId === "vine") return { shake: 0.95, push: 2.4, size: 9, color: "rgba(186, 251, 161, 0.82)" };
  return { shake: 0.6, push: 1.2, size: 8, color: "rgba(255, 248, 199, 0.72)" };
}

function applySpikeOrbitDamage(weapon) {
  const orbCount = Math.max(1, weapon.orbCount || 2);
  const orbRadius = Math.max(8, weapon.radius * 1.05);
  const hitDamage = Math.round(weapon.damage * 0.82);
  for (let j = state.zombies.length - 1; j >= 0; j -= 1) {
    const z = state.zombies[j];
    if (z.targetable === false) continue;
    let hit = false;
    let hitX = z.x;
    let hitY = z.y;
    for (let i = 0; i < orbCount; i += 1) {
      const orb = spikeOrbPosition(weapon, i);
      const dx = z.x - orb.x;
      const dy = z.y - orb.y;
      const rr = z.r + orbRadius;
      if (dx * dx + dy * dy <= rr * rr) {
        hit = true;
        hitX = orb.x;
        hitY = orb.y;
        break;
      }
    }
    if (!hit) continue;
    state.effects.push({
      type: "spikeHit",
      x: hitX,
      y: hitY,
      life: 0.12,
      maxLife: 0.12,
      size: orbRadius * 1.55,
    });
    if (hitZombie(z, hitDamage, "spike")) state.zombies.splice(j, 1);
  }
}

function emitSpikeTurretShots(weapon) {
  if (weapon.evolvedKey !== "pea+spike") return;
  if (state.zombies.length === 0) return;
  const orbCount = Math.max(1, weapon.orbCount || 2);
  const shots = Math.min(4, Math.max(2, Math.floor(orbCount / 3)));
  for (let s = 0; s < shots; s += 1) {
    const idx = Math.floor((orbCount * s) / shots);
    const orb = spikeOrbPosition(weapon, idx);
    const target = nearestZombie(orb.x, orb.y);
    if (!target) continue;
    const dx = target.x - orb.x;
    const dy = target.y - orb.y;
    const len = Math.hypot(dx, dy) || 1;
    state.bullets.push({
      kind: "bullet",
      weaponId: "spike",
      x: orb.x,
      y: orb.y,
      vx: (dx / len) * 560,
      vy: (dy / len) * 560,
      r: Math.max(4, weapon.radius * 0.56),
      damage: Math.round(weapon.damage * 0.42),
      life: 0.58,
      sprite: "pea",
      splash: 0,
      pierce: 1,
      rotation: Math.atan2(dy, dx),
      hitIds: new Set(),
    });
    state.effects.push({
      type: "turretShot",
      x: orb.x,
      y: orb.y,
      life: 0.11,
      maxLife: 0.11,
      size: 14,
    });
  }
  playWeaponSfx("pea");
}

function gainXp(value) {
  const p = state.player;
  const timeBoost = 1 + Math.min(1.05, state.time / 420);
  const bossBoost = 1 + Math.min(0.55, (state.bossStats?.defeats || 0) * 0.12);
  const gained = Math.max(1, Math.round(value * timeBoost * bossBoost));
  p.xp += gained;
  while (p.xp >= p.xpNeed) {
    p.xp -= p.xpNeed;
    p.level += 1;
    p.xpNeed = Math.round(p.xpNeed * 1.16 + 1);
    levelUp();
  }
}

function maybeEnableWeapon(name) {
  const w = state.player.weapons[name];
  if (w.enabled || w.lockedByEvolution) return false;
  w.enabled = true;
  w.level = Math.max(1, w.level || 0);
  return true;
}

function getWeaponLevel(weaponId) {
  const w = state.player.weapons[weaponId];
  if (!w || !w.enabled) return 0;
  return Math.max(0, Math.min(MAX_WEAPON_LEVEL, w.level || 1));
}

function canLevelWeapon(weaponId) {
  const w = state.player.weapons[weaponId];
  return Boolean(w && w.enabled && getWeaponLevel(weaponId) < MAX_WEAPON_LEVEL);
}

function levelUpWeapon(weaponId) {
  const w = state.player.weapons[weaponId];
  if (!w || !w.enabled) return;
  w.level = Math.min(MAX_WEAPON_LEVEL, (w.level || 1) + 1);
}

function makeEvolutionKey(a, b) {
  return [a, b].sort().join("+");
}

function canEvolvePair(a, b) {
  const wa = state.player.weapons[a];
  const wb = state.player.weapons[b];
  if (!wa || !wb || !wa.enabled || !wb.enabled) return false;
  if (getWeaponLevel(a) < MAX_WEAPON_LEVEL || getWeaponLevel(b) < MAX_WEAPON_LEVEL) return false;
  const key = makeEvolutionKey(a, b);
  if (state.evolutionsDone[key]) return false;
  return Boolean(getEvolutionDef(a, b));
}

function getAvailableEvolutionUpgrades() {
  const list = [];
  for (const [a, b] of EVOLUTION_PAIRS) {
    if (!canEvolvePair(a, b)) continue;
    const evo = buildEvolutionUpgrade(a, b);
    if (!evo) continue;
    list.push(evo);
  }
  return list;
}

function buildEvolutionUpgrade(a, b) {
  const key = makeEvolutionKey(a, b);
  const evo = getEvolutionDef(a, b);
  if (!evo) return null;
  return {
    title: evo.title,
    desc: evo.desc,
    icon: evo.icon,
    weaponId: evo.keep,
    type: "EVOLVE",
    available: () => canEvolvePair(a, b),
    apply: () => {
      evo.apply();
      state.evolutionsDone[key] = true;
      playSfxEvent("evolution");
      state.effects.push({
        type: "evoBurst",
        x: state.player.x,
        y: state.player.y,
        life: 0.5,
        maxLife: 0.5,
        size: 96,
      });
      state.effects.push({
        type: "banner",
        x: canvas.width / 2,
        y: 66,
        life: 1.6,
        maxLife: 1.6,
        size: 1,
        text: evo.title,
        subText: "합체 진화 완료",
      });
    },
  };
}

function getDamageTypeForWeapon(weaponId) {
  if (weaponId === "cherry" || weaponId === "corn") return "blast";
  if (weaponId === "spore" || weaponId === "vine" || weaponId === "poison") return "toxic";
  if (weaponId === "spike") return "pierce";
  return "normal";
}

function getResistanceMultiplier(zombie, weaponId) {
  if (!weaponId) return 1;
  const kind = getDamageTypeForWeapon(weaponId);
  let mult = 1;
  if (zombie.type === "hammer") {
    if (kind === "pierce") mult *= 1.18;
    if (kind === "toxic") mult *= 0.78;
    if (kind === "blast") mult *= 0.92;
  } else if (zombie.type === "dasher") {
    if (kind === "normal" || kind === "pierce") mult *= 1.15;
    if (weaponId === "vine") mult *= 0.72;
  } else if (zombie.type === "boss") {
    if (zombie.phase === 1) {
      if (kind === "blast") mult *= 0.78;
      if (kind === "toxic") mult *= 1.12;
    } else if (zombie.phase === 2) {
      if (kind === "toxic") mult *= 0.76;
      if (kind === "pierce" || kind === "normal") mult *= 1.14;
    } else {
      if (kind === "pierce") mult *= 0.82;
      if (kind === "blast") mult *= 1.12;
    }
  }
  if ((zombie.vulnTime || 0) > 0) mult *= 1.22;
  return mult;
}

function applyOnHitStatuses(zombie, weaponId) {
  if (!weaponId || zombie.type === "boss") return;
  if (weaponId === "spore") {
    zombie.poisonTime = Math.max(zombie.poisonTime || 0, 2.4);
    zombie.poisonTick = Math.min(zombie.poisonTick || 0.2, 0.2);
    zombie.poisonDamage = Math.max(zombie.poisonDamage || 0, 5);
    zombie.slowTime = Math.max(zombie.slowTime || 0, 0.9);
    zombie.slowMul = Math.max(zombie.slowMul || 0, 0.2);
  }
  if (weaponId === "vine") {
    zombie.slowTime = Math.max(zombie.slowTime || 0, 1.2);
    zombie.slowMul = Math.max(zombie.slowMul || 0, 0.28);
  }
  if (weaponId === "spike") {
    zombie.vulnTime = Math.max(zombie.vulnTime || 0, 1.8);
  }
}

function bumpScreenShake(amount) {
  if (!state.settings.screenShake) return;
  state.screenShake = Math.max(state.screenShake, amount);
}

function getLockedWeaponIds() {
  return Object.entries(state.player.weapons)
    .filter(([, w]) => !w.enabled && !w.lockedByEvolution)
    .map(([id]) => id);
}

function createBossRewardOptions(variant = null) {
  const locked = getLockedWeaponIds();
  const rewards = [];
  let signatureReward = null;
  if (locked.length > 0) {
    const pick = locked[Math.floor(Math.random() * locked.length)];
    const name = state.player.weapons[pick].label;
    rewards.push({
      title: `${name} 즉시 해금`,
      desc: "보스 보상: 잠금 무기 무료 해금",
      apply: () => {
        maybeEnableWeapon(pick);
      },
    });
  } else {
    rewards.push({
      title: "전 무기 강화",
      desc: "활성 무기 데미지 +22%",
      apply: () => {
        for (const w of Object.values(state.player.weapons)) {
          if (!w.enabled) continue;
          w.damage = Math.round(w.damage * 1.22);
        }
      },
    });
  }

  rewards.push({
    title: "햇빛 대회복",
    desc: "체력 55 회복 + 최대치 초과 불가",
    apply: () => {
      state.player.hp = clamp(state.player.hp + 55, 0, state.player.maxHp);
    },
  });

  rewards.push({
    title: "전투 버프",
    desc: "모든 활성 무기 발사속도 14% 상승",
    apply: () => {
      for (const w of Object.values(state.player.weapons)) {
        if (!w.enabled) continue;
        w.fireRate = Math.max(0.12, w.fireRate * 0.86);
      }
    },
  });
  if (variant === "crusher") {
    signatureReward = {
      title: "분쇄자의 문장",
      desc: "활성 무기 데미지 +12%, 범위 +10%",
      apply: () => {
        for (const w of Object.values(state.player.weapons)) {
          if (!w.enabled) continue;
          w.damage = Math.round(w.damage * 1.12);
          if (typeof w.splash === "number" && w.splash > 0) w.splash = Math.round(w.splash * 1.1);
        }
      },
    };
    rewards.push(signatureReward);
  }
  if (variant === "caster") {
    signatureReward = {
      title: "군주의 포자",
      desc: "중독 강화: 버섯/덩굴 데미지 +18%",
      apply: () => {
        const spore = state.player.weapons.spore;
        const vine = state.player.weapons.vine;
        if (spore.enabled) spore.damage = Math.round(spore.damage * 1.18);
        if (vine.enabled) vine.damage = Math.round(vine.damage * 1.18);
      },
    };
    rewards.push(signatureReward);
  }
  if (variant === "triad") {
    signatureReward = {
      title: "모닝스타 핵",
      desc: "활성 무기 데미지 +10%, 발사속도 8% 상승",
      apply: () => {
        for (const w of Object.values(state.player.weapons)) {
          if (!w.enabled) continue;
          w.damage = Math.round(w.damage * 1.1);
          w.fireRate = Math.max(0.12, w.fireRate * 0.92);
        }
      },
    };
    rewards.push(signatureReward);
  }
  if (rewards.length <= 3) return rewards;
  const pool = rewards.filter((r) => r !== signatureReward);
  const picked = [];
  while (pool.length > 0 && picked.length < 2) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return signatureReward ? [signatureReward, ...picked] : picked.slice(0, 3);
}

function onBossDefeated(boss = null) {
  state.lastBossVariantDefeated = boss?.variant || null;
  state.bossStats.defeats += 1;
  playSfxEvent("bigBoom");
  state.paused = true;
  const rewards = createBossRewardOptions(state.lastBossVariantDefeated);
  state.overlayOptions = rewards;
  showOverlay("보스 처치!", "보상 하나를 선택하세요.", rewards);
}

function recordWeaponDamage(weaponId, amount) {
  if (!weaponId || amount <= 0) return;
  const prev = state.runStats.damageByWeapon[weaponId] || 0;
  state.runStats.damageByWeapon[weaponId] = prev + amount;
}

const upgrades = [
  {
    title: "선인장 해금",
    desc: "주변을 도는 가시 오브 2개 생성",
    icon: "spike",
    weaponId: "spike",
    available: () => {
      const w = state.player.weapons.spike;
      return !w.enabled && !w.lockedByEvolution;
    },
    apply: () => {
      if (!maybeEnableWeapon("spike")) {
        state.player.weapons.spike.damage += 4;
      }
    },
  },
  {
    title: "버섯 해금",
    desc: "느리지만 범위 피해 포자탄",
    icon: "spore",
    weaponId: "spore",
    available: () => {
      const w = state.player.weapons.spore;
      return !w.enabled && !w.lockedByEvolution;
    },
    apply: () => {
      if (!maybeEnableWeapon("spore")) {
        state.player.weapons.spore.damage += 3;
      }
    },
  },
  {
    title: "옥수수 폭격 해금",
    desc: "넓은 범위의 고화력 폭탄탄",
    icon: "corn",
    weaponId: "corn",
    available: () => {
      const w = state.player.weapons.corn;
      return !w.enabled && !w.lockedByEvolution;
    },
    apply: () => {
      if (!maybeEnableWeapon("corn")) {
        state.player.weapons.corn.damage += 6;
      }
    },
  },
  {
    title: "체리폭탄 해금",
    desc: "느리지만 화면이 터지는 폭발탄",
    icon: "cherry",
    weaponId: "cherry",
    available: () => {
      const w = state.player.weapons.cherry;
      return !w.enabled && !w.lockedByEvolution;
    },
    apply: () => {
      if (!maybeEnableWeapon("cherry")) {
        state.player.weapons.cherry.damage += 8;
      }
    },
  },
  {
    title: "지면 덩굴 해금",
    desc: "좀비 발밑에서 줄기가 솟아 광역 피해",
    icon: "vine",
    weaponId: "vine",
    available: () => {
      const w = state.player.weapons.vine;
      return !w.enabled && !w.lockedByEvolution;
    },
    apply: () => {
      if (!maybeEnableWeapon("vine")) {
        state.player.weapons.vine.damage += 5;
      }
    },
  },
  {
    title: "완두콩 강화",
    desc: "완두콩 데미지 +6",
    icon: "pea",
    weaponId: "pea",
    available: () => canLevelWeapon("pea"),
    apply: () => {
      state.player.weapons.pea.damage += 6;
      levelUpWeapon("pea");
    },
  },
  {
    title: "선인장 강화",
    desc: "회전 가시 오브 +1, 데미지 +3",
    icon: "spike",
    weaponId: "spike",
    available: () => canLevelWeapon("spike"),
    apply: () => {
      const w = state.player.weapons.spike;
      w.orbCount = Math.min(12, (w.orbCount || 2) + 1);
      w.damage += 3;
      levelUpWeapon("spike");
    },
  },
  {
    title: "버섯 강화",
    desc: "버섯 범위 +12, 데미지 +4",
    icon: "spore",
    weaponId: "spore",
    available: () => canLevelWeapon("spore"),
    apply: () => {
      const w = state.player.weapons.spore;
      w.splash += 12;
      w.damage += 4;
      levelUpWeapon("spore");
    },
  },
  {
    title: "옥수수 강화",
    desc: "옥수수 범위 +16, 데미지 +6",
    icon: "corn",
    weaponId: "corn",
    available: () => canLevelWeapon("corn"),
    apply: () => {
      const w = state.player.weapons.corn;
      w.splash += 16;
      w.damage += 6;
      levelUpWeapon("corn");
    },
  },
  {
    title: "체리폭탄 강화",
    desc: "체리폭탄 쿨타임 20% 감소, 데미지 +6",
    icon: "cherry",
    weaponId: "cherry",
    available: () => canLevelWeapon("cherry"),
    apply: () => {
      const w = state.player.weapons.cherry;
      w.fireRate = Math.max(1.3, w.fireRate * 0.8);
      w.damage += 6;
      levelUpWeapon("cherry");
    },
  },
  {
    title: "지면 덩굴 강화",
    desc: "덩굴 데미지 +10, 범위 +14",
    icon: "vine",
    weaponId: "vine",
    available: () => canLevelWeapon("vine"),
    apply: () => {
      const w = state.player.weapons.vine;
      w.damage += 10;
      w.splash += 14;
      levelUpWeapon("vine");
    },
  },
  {
    title: "줄기 스프린트",
    desc: "이동속도 +18",
    apply: () => { state.player.speed += 18; },
  },
  {
    title: "햇빛 회복",
    desc: "즉시 체력 24 회복",
    apply: () => {
      const p = state.player;
      p.hp = clamp(p.hp + 24, 0, p.maxHp);
    },
  },
];

function pickRandomUpgrades(n) {
  const evolutionPool = getAvailableEvolutionUpgrades();
  const arr = upgrades.filter((u) => !u.available || u.available());
  const chosen = [];
  if (evolutionPool.length > 0 && n > 0) {
    const evo = evolutionPool[Math.floor(Math.random() * evolutionPool.length)];
    chosen.push(evo);
  }
  for (let i = 0; i < n && arr.length > 0; i += 1) {
    if (chosen.length >= n) break;
    const idx = Math.floor(Math.random() * arr.length);
    chosen.push(arr.splice(idx, 1)[0]);
  }
  return chosen;
}

function levelUp() {
  state.paused = true;
  playSfxEvent("levelUp");
  const options = pickRandomUpgrades(3);
  state.overlayOptions = options;
  showOverlay("레벨 업!", "강화를 하나 고르세요.", options);
}

function gameOver() {
  state.gameOver = true;
  state.running = false;
  state.paused = true;
  const minutes = Math.max(0.01, state.time / 60);
  const kpm = (state.kills / minutes).toFixed(1);
  const enabledWeapons = Object.values(state.player.weapons).filter((w) => w.enabled).length;
  showOverlay(
    "게임 오버",
    `버틴 시간 ${formatTime(state.time)}<br>처치 ${state.kills}마리 (${kpm} KPM)<br>보스 ${state.bossStats.defeats}/${state.bossStats.encounters} 처치<br>활성 무기 ${enabledWeapons}개`,
    []
  );
  renderRunReport();
  state.overlayOptions = [];
  restartBtn.classList.remove("hidden");
}

function renderRunReport() {
  const entries = Object.entries(state.runStats.damageByWeapon)
    .map(([id, dmg]) => ({ id, dmg: Math.round(dmg), label: BALANCE.weapons[id]?.label || id }))
    .sort((a, b) => b.dmg - a.dmg);
  const total = entries.reduce((s, e) => s + e.dmg, 0);
  const top = entries.slice(0, 4);

  overlay.classList.add("report-mode");
  choicesWrap.classList.remove("hidden");
  if (top.length === 0) {
    choicesWrap.innerHTML = `<div class="report-card"><div class="report-title">전투 데이터 없음</div><div class="report-value">이번 런에서 유효 데미지 기록이 없어요.</div></div>`;
    return;
  }

  const cards = top.map((e, idx) => {
    const ratio = total > 0 ? ((e.dmg / total) * 100).toFixed(1) : "0.0";
    return `
      <div class="report-card">
        <div class="report-title">${idx + 1}. ${e.label}</div>
        <div class="report-value">${e.dmg.toLocaleString()} DMG</div>
        <div class="report-sub">${ratio}% 기여</div>
      </div>
    `;
  }).join("");
  choicesWrap.innerHTML = cards;
}

function getUpgradeCardMeta(opt) {
  const t = opt.title;
  if (opt.type === "EVOLVE") {
    return { tier: "epic", type: "EVOLVE", icon: opt.icon || "core" };
  }
  if (opt.icon) {
    const unlock = t.includes("해금");
    const support = t.includes("회복") || t.includes("스프린트");
    let tier = "rare";
    let type = "UPGRADE";
    if (unlock) {
      tier = "epic";
      type = "UNLOCK";
    } else if (support) {
      tier = "common";
      type = "SUPPORT";
    }
    return { tier, type, icon: opt.icon };
  }
  const unlock = t.includes("해금");
  const support = t.includes("회복") || t.includes("스프린트");
  let tier = "rare";
  let type = "UPGRADE";
  if (unlock) {
    tier = "epic";
    type = "UNLOCK";
  } else if (support) {
    tier = "common";
    type = "SUPPORT";
  }

  let icon = "core";
  if (t.includes("완두콩")) icon = "pea";
  if (t.includes("선인장")) icon = "spike";
  if (t.includes("버섯")) icon = "spore";
  if (t.includes("옥수수")) icon = "corn";
  if (t.includes("체리")) icon = "cherry";
  if (t.includes("덩굴")) icon = "vine";
  if (t.includes("회복")) icon = "heal";
  if (t.includes("스프린트")) icon = "speed";

  return { tier, type, icon };
}

function renderLeafLevel(level, max = MAX_WEAPON_LEVEL) {
  let html = "";
  for (let i = 0; i < max; i += 1) {
    html += `<span class="leaf ${i < level ? "on" : ""}"></span>`;
  }
  return `<div class="leaf-row">${html}</div>`;
}

function getEvolutionHint(weaponId) {
  const pair = EVOLUTION_PAIRS.find((p) => p.includes(weaponId));
  if (!pair) return "진화 준비: LV5 무기 2개";
  const otherId = pair[0] === weaponId ? pair[1] : pair[0];
  const other = state.player.weapons[otherId];
  const otherLabel = other?.label || otherId;
  return `진화 후보: ${otherLabel} + 현재 무기`;
}

function renderLoadoutStrip() {
  const active = Object.entries(state.player.weapons).filter(([, w]) => w.enabled);
  if (active.length === 0) return "";
  const icons = active.map(([id, w]) => `
    <div class="loadout-item">
      <img src="${getCardIconPath(id)}" alt="${w.label}">
      ${renderLeafLevel(getWeaponLevel(id))}
    </div>
  `).join("");
  return `<div class="loadout-strip">${icons}</div>`;
}

function getCardIconPath(icon) {
  if (icon === "pea") return "assets/bullet-pea.svg";
  if (icon === "spike") return "assets/bullet-spike.svg";
  if (icon === "spore") return "assets/bullet-spore.svg";
  if (icon === "corn") return "assets/bullet-corn.svg";
  if (icon === "cherry") return "assets/bullet-cherry.svg";
  if (icon === "vine") return "assets/bullet-vine.svg";
  if (icon === "heal") return "assets/card-heal.svg";
  if (icon === "speed") return "assets/card-speed.svg";
  return "assets/card-core.svg";
}

function chooseUpgrade(option) {
  if (!option) return;
  playTone(700, 0.08, 0.08, "triangle", nowAudioTime(), 620);
  option.apply(state.player);
  state.paused = false;
  state.overlayOptions = [];
  hideOverlay();
}

function showOverlay(title, text, options) {
  overlay.classList.remove("hidden");
  overlay.classList.remove("report-mode");
  overlayTitle.textContent = options.length > 0 ? "스킬 선택" : title;
  overlayText.innerHTML = text;
  choicesWrap.innerHTML = "";
  if (pauseLoadoutWrapEl) pauseLoadoutWrapEl.classList.add("hidden");
  overlay.classList.toggle("upgrade-mode", options.length > 0);

  if (options.length === 0) {
    choicesWrap.classList.add("hidden");
    if (title === "일시 정지" && pauseLoadoutWrapEl) {
      pauseLoadoutWrapEl.classList.remove("hidden");
    }
    return;
  }

  choicesWrap.classList.remove("hidden");
  choicesWrap.innerHTML = `<div class="choice-grid"></div>`;
  const grid = choicesWrap.querySelector(".choice-grid");
  for (let i = 0; i < options.length; i += 1) {
    const opt = options[i];
    const meta = getUpgradeCardMeta(opt);
    const currentLevel = opt.weaponId ? getWeaponLevel(opt.weaponId) : 0;
    const nextLevel = opt.weaponId
      ? (opt.type === "EVOLVE"
        ? MAX_WEAPON_LEVEL
        : opt.title.includes("강화")
        ? Math.min(MAX_WEAPON_LEVEL, currentLevel + 1)
        : (opt.title.includes("해금") ? Math.max(1, currentLevel) : currentLevel))
      : currentLevel;
    const levelText = opt.weaponId && opt.type === "EVOLVE"
      ? `<div class="choice-level"><span class="choice-level-label">진화 완료</span>${renderLeafLevel(MAX_WEAPON_LEVEL)}</div>`
      : opt.weaponId
      ? `<div class="choice-level"><span class="choice-level-label">LV ${currentLevel} -> ${nextLevel}</span>${renderLeafLevel(nextLevel)}</div>`
      : `<div class="choice-level neutral"><span class="choice-level-label">지원 카드</span></div>`;
    const evoText = opt.type === "EVOLVE"
      ? `<div class="choice-evo">합체 진화: 재료 무기 2개를 1개로 통합</div>`
      : opt.weaponId
      ? `<div class="choice-evo">${getEvolutionHint(opt.weaponId)}</div>`
      : `<div class="choice-evo">진화 비대상</div>`;
    const btn = document.createElement("button");
    btn.className = `choice tier-${meta.tier} icon-${meta.icon}`;
    btn.innerHTML = `
      <div class="choice-key">${i + 1}</div>
      <div class="choice-icon-wrap"><img class="choice-icon" src="${getCardIconPath(meta.icon)}" alt=""></div>
      <div class="choice-top">
        <span class="choice-type">${meta.type}</span>
        <span class="choice-tier">${meta.tier.toUpperCase()}</span>
      </div>
      <div class="choice-title">${opt.title}</div>
      <div class="choice-desc">${opt.desc}</div>
      ${levelText}
      ${evoText}
      <div class="choice-cta">선택</div>
    `;
    btn.style.setProperty("--delay", `${i * 45}ms`);
    btn.addEventListener("click", () => {
      chooseUpgrade(opt);
    });
    if (grid) grid.appendChild(btn);
  }
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlay.classList.remove("upgrade-mode");
  overlay.classList.remove("report-mode");
  if (pauseLoadoutWrapEl) pauseLoadoutWrapEl.classList.add("hidden");
  restartBtn.classList.add("hidden");
}

function pushSystemBanner(text, subText = "") {
  state.effects.push({
    type: "banner",
    x: canvas.width / 2,
    y: 66,
    life: 1.1,
    maxLife: 1.1,
    size: 1,
    text,
    subText,
  });
}

function updatePlayer(dt) {
  const p = state.player;
  p.hurtTimer = Math.max(0, (p.hurtTimer || 0) - dt);
  let ax = 0;
  let ay = 0;
  if (keys.has("ArrowUp") || keys.has("KeyW")) ay -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) ay += 1;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) ax -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) ax += 1;
  if (state.touchMove.active) {
    ax += state.touchMove.ax;
    ay += state.touchMove.ay;
  }

  if (ax || ay) {
    const len = Math.hypot(ax, ay);
    p.x += (ax / len) * p.speed * dt;
    p.y += (ay / len) * p.speed * dt;
    p.moveMag = 1;
    p.strideT += dt * 11;
  } else {
    p.moveMag = Math.max(0, (p.moveMag || 0) - dt * 4.5);
    p.strideT += dt * 2.6;
  }

  if (ax > 0) p.face = 1;
  if (ax < 0) p.face = -1;
  p.faceVisual += (p.face - p.faceVisual) * Math.min(1, dt * 10);
  if (Math.abs(p.faceVisual) < 0.15) {
    p.faceVisual = 0.15 * Math.sign(p.face || 1);
  }

  p.x = clamp(p.x, p.r, canvas.width - p.r);
  p.y = clamp(p.y, p.r, canvas.height - p.r);
}

function updateSpawning(dt) {
  if (state.testMode) return;
  const wave = BALANCE.wave;
  const preset = getPreset();
  state.spawnTick += dt;
  const bossAlive = hasActiveBoss();
  const spawnInterval = clamp(
    wave.spawnInterval.start - state.time * wave.spawnInterval.decayPerSec,
    wave.spawnInterval.min,
    wave.spawnInterval.start
  ) * (bossAlive ? 1.45 : 1) / preset.spawnRate;
  while (state.spawnTick >= spawnInterval) {
    state.spawnTick -= spawnInterval;
    spawnEnemy();
    if (!bossAlive && Math.random() < state.time * wave.extraSpawnChancePerSec * preset.spawnRate) spawnEnemy();
  }
}

function updateWeapons(dt) {
  const p = state.player;
  const crowd = state.zombies.length;
  for (const [name, weapon] of Object.entries(p.weapons)) {
    if (!weapon.enabled) continue;
    if (name === "spike") {
      weapon.timer += dt;
      while (weapon.timer >= weapon.fireRate) {
        weapon.timer -= weapon.fireRate;
        applySpikeOrbitDamage(weapon);
        playWeaponSfx("spike", weapon.evolvedKey || "");
        if (weapon.evolvedKey === "pea+spike") emitSpikeTurretShots(weapon);
      }
      continue;
    }
    weapon.timer += dt;
    while (weapon.timer >= weapon.fireRate) {
      const target = nearestZombie(p.x, p.y);
      if (!target) {
        // Keep the weapon "ready" when no target exists, instead of consuming cooldown.
        weapon.timer = weapon.fireRate;
        break;
      }
      weapon.timer -= weapon.fireRate;
      shootWeapon(weapon, target, name);
      playWeaponSfx(name, weapon.evolvedKey || "");
      if (name === "pea" && crowd > 20) shootWeapon(weapon, target, name);
      if (name === "vine" && crowd > 18) {
        for (let i = 0; i < Math.min(2, state.zombies.length); i += 1) {
          const z = state.zombies[Math.floor(Math.random() * state.zombies.length)];
          if (z) shootWeapon(weapon, z, name);
        }
      }
    }
  }
}

function updateZombies(dt) {
  const p = state.player;
  const bossCfg = BALANCE.enemies.boss;
  for (let i = state.zombies.length - 1; i >= 0; i -= 1) {
    const z = state.zombies[i];
    z.hurtTimer = Math.max(0, (z.hurtTimer || 0) - dt);
    z.spawnShield = Math.max(0, (z.spawnShield || 0) - dt);
    z.slowTime = Math.max(0, (z.slowTime || 0) - dt);
    z.vulnTime = Math.max(0, (z.vulnTime || 0) - dt);
    z.poisonTime = Math.max(0, (z.poisonTime || 0) - dt);
    if ((z.poisonTime || 0) > 0) {
      z.poisonTick = (z.poisonTick || 0.22) - dt;
      if (z.poisonTick <= 0) {
        z.poisonTick = 0.22;
        const dot = z.poisonDamage || 4;
        if (hitZombie(z, dot, "poison")) {
          state.zombies.splice(i, 1);
          continue;
        }
      }
    }
    const slowMul = z.slowTime > 0 ? 1 - clamp(z.slowMul || 0, 0, 0.7) : 1;
    const moveMul = z.hurtTimer > 0 ? 0.12 : 1;
    const finalMoveMul = moveMul * slowMul;
    const dx = p.x - z.x;
    const dy = p.y - z.y;
    const len = Math.hypot(dx, dy) || 1;

    if (z.type === "dummy") {
      continue;
    }

    if (z.type === "boss") {
      const hpRatio = z.hp / z.maxHp;
      z.phase = hpRatio <= 0.35 ? 3 : hpRatio <= 0.7 ? 2 : 1;
      if ((z.lastPhase || 1) !== z.phase) {
        z.lastPhase = z.phase;
        state.effects.push({
          type: "banner",
          x: canvas.width / 2,
          y: 66,
          life: 1.05,
          maxLife: 1.05,
          size: 1,
          text: `${z.phase}페이즈: ${getBossPhaseName(z.phase)}`,
          subText: z.phase === 3 ? "모닝스타를 조심하세요" : "패턴이 변경됩니다",
        });
      }
      const isHammerPhase = z.phase === 1;
      const isSporePhase = z.phase === 2;
      const maceCfg = bossCfg.mace;
      z.maceHitLock = Math.max(0, (z.maceHitLock || 0) - dt);

      if ((z.maceActive || 0) > 0) {
        z.maceActive -= dt;
        const swingT = clamp(1 - (z.maceActive / Math.max(0.01, z.maceActiveMax || maceCfg.swingTime)), 0, 1);
        z.maceAngle = (-1.15 + swingT * 2.3) * (z.maceDir || 1);
        z.x += (dx / len) * z.speed * 0.45 * dt * finalMoveMul;
        z.y += (dy / len) * z.speed * 0.45 * dt * finalMoveMul;
        const chainLen = z.r * (maceCfg.lengthMul || 1.74);
        const headX = z.x + Math.cos(z.maceAngle) * chainLen;
        const headY = z.y - z.r * 0.16 + Math.sin(z.maceAngle) * chainLen * 0.62;
        if ((z.maceHitLock || 0) <= 0) {
          const mdx = p.x - headX;
          const mdy = p.y - headY;
          const hitR = (maceCfg.headRadius || 24) + p.r;
          if (mdx * mdx + mdy * mdy <= hitR * hitR) {
            applyPlayerDamage(maceCfg.damage || 38, headX, headY);
            if (state.gameOver) return;
            z.maceHitLock = 0.22;
            bumpScreenShake(8.2);
          }
        }
        if (z.maceActive <= 0) {
          z.maceTimer = maceCfg.cooldown;
        }
      } else if ((z.maceWindup || 0) > 0) {
        z.maceWindup -= dt;
        z.x += (dx / len) * z.speed * 0.24 * dt * finalMoveMul;
        z.y += (dy / len) * z.speed * 0.24 * dt * finalMoveMul;
        if (z.maceWindup <= 0) {
          z.maceActiveMax = maceCfg.swingTime;
          z.maceActive = maceCfg.swingTime;
          z.maceAngle = -1.15 * (z.maceDir || 1);
          z.maceHitLock = 0;
          bumpScreenShake(7.5);
          state.effects.push({
            type: "dash",
            x: z.x,
            y: z.y,
            life: 0.26,
            maxLife: 0.26,
            size: 58,
          });
        }
      } else if (z.shockWindup > 0) {
        z.shockWindup -= dt;
        if (z.shockWindup <= 0) {
          applySplashDamage(z.x, z.y, bossCfg.shockwave.radius, Math.round(bossCfg.shockwave.damage * 0.35), z);
          bumpScreenShake(11);
          if (len <= bossCfg.shockwave.radius + p.r) {
            applyPlayerDamage(bossCfg.shockwave.damage, z.x, z.y);
            if (state.gameOver) return;
          }
          z.shockTimer = bossCfg.shockwave.cooldown;
        }
      } else {
        const phaseSpeed = z.phase === 1 ? 1 : z.phase === 2 ? 1.18 : 1.28;
        z.x += (dx / len) * z.speed * phaseSpeed * dt * finalMoveMul;
        z.y += (dy / len) * z.speed * phaseSpeed * dt * finalMoveMul;

        z.summonTimer -= dt;
        const summonCd = z.phase === 1 ? bossCfg.summonCooldown + 0.5 : z.phase === 2 ? bossCfg.summonCooldown : bossCfg.summonCooldown - 1.1;
        if (z.summonTimer <= 0) {
          for (let s = 0; s < bossCfg.summonCount; s += 1) spawnBasicNear(z.x, z.y);
          z.summonTimer = summonCd;
          state.effects.push({ type: "pop", x: z.x, y: z.y, life: 0.35, maxLife: 0.35, size: 46 });
        }

        if (isHammerPhase) {
          z.shockTimer -= dt;
          if (z.shockTimer <= 0 && len <= bossCfg.shockwave.radius + 70) {
            z.shockWindup = bossCfg.shockwave.windup;
            z.shockTimer = bossCfg.shockwave.cooldown;
            state.effects.push({
              type: "warn",
              x: z.x,
              y: z.y,
              life: bossCfg.shockwave.windup,
              maxLife: bossCfg.shockwave.windup,
              size: bossCfg.shockwave.radius,
            });
          }
        }

        if (isSporePhase) {
          z.castTimer -= dt;
          const castCd = 3.9;
          if (z.castTimer <= 0) {
            const hx = clamp(p.x + rand(-40, 40), 20, canvas.width - 20);
            const hy = clamp(p.y + rand(-40, 40), 20, canvas.height - 20);
            const radius = 60;
            state.effects.push({
              type: "warn",
              x: hx,
              y: hy,
              life: 0.92,
              maxLife: 0.92,
              size: radius,
              warnRgb: "255, 105, 105",
              dash: [10, 6],
            });
            state.hazards.push({
              type: "casterBlast",
              x: hx,
              y: hy,
              r: radius,
              life: 1.3,
              armTime: 0.92,
              activeTime: 0.2,
              damage: 28,
              fired: false,
            });
            z.castTimer = castCd;
          }
        }

        if (!isHammerPhase && !isSporePhase) {
          z.maceTimer -= dt;
          if (z.maceTimer <= 0 && len <= maceCfg.range) {
            z.maceWindup = maceCfg.windup;
            z.maceDir = dx >= 0 ? 1 : -1;
            state.effects.push({
              type: "warn",
              x: z.x,
              y: z.y,
              life: maceCfg.windup,
              maxLife: maceCfg.windup,
              size: z.r * 2.05,
              warnRgb: "255, 178, 116",
              dash: [6, 6],
            });
          }
        }
      }
    } else if (z.type === "dasher") {
      if (z.phase === "cooldown") {
        z.cooldown -= dt;
        if (z.cooldown <= 0) {
          z.phase = "dashing";
          const dashLen = Math.hypot(dx, dy) || 1;
          z.vx = (dx / dashLen) * z.dashSpeed;
          z.vy = (dy / dashLen) * z.dashSpeed;
          bumpScreenShake(5);
          state.effects.push({
            type: "dash",
            x: z.x,
            y: z.y,
            life: 0.22,
            maxLife: 0.22,
            size: 34,
          });
        }
      } else {
        z.x += z.vx * dt * finalMoveMul;
        z.y += z.vy * dt * finalMoveMul;
        const hitR = z.r + p.r + 2;
        if ((dx * dx + dy * dy) < hitR * hitR) {
          applyPlayerDamage(z.dashDamage * dt * 4, z.x, z.y);
          if (state.gameOver) return;
        }
        if (z.x < -70 || z.x > canvas.width + 70 || z.y < -70 || z.y > canvas.height + 70) {
          state.zombies.splice(i, 1);
          continue;
        }
      }
    } else if (z.type === "bomber") {
      if (z.throwWindup > 0) {
        z.throwWindup -= dt;
        if (z.throwWindup <= 0) {
          const tx = clamp(p.x + rand(-30, 30), 16, canvas.width - 16);
          const ty = clamp(p.y + rand(-30, 30), 16, canvas.height - 16);
          const flightTime = Math.max(0.2, z.bombFlightTime || 0.42);
          state.hazards.push({
            type: "zombieBomb",
            x: z.x,
            y: z.y - z.r * 0.15,
            vx: (tx - z.x) / flightTime,
            vy: (ty - z.y) / flightTime,
            flyTime: flightTime,
            fuse: z.bombFuse || 1.2,
            r: z.bombRadius || 70,
            damage: z.bombDamage || 24,
            fired: false,
            activeTime: 0.18,
            life: flightTime + (z.bombFuse || 1.2) + 0.6,
          });
          z.throwTimer = rand(z.throwCooldown.min, z.throwCooldown.max);
        }
      } else {
        z.throwTimer -= dt;
        if (len > z.throwRange) {
          z.x += (dx / len) * z.speed * dt * finalMoveMul;
          z.y += (dy / len) * z.speed * dt * finalMoveMul;
        } else {
          const keepDistMul = len < z.throwRange * 0.75 ? -0.4 : 0.25;
          z.x += (dx / len) * z.speed * keepDistMul * dt * finalMoveMul;
          z.y += (dy / len) * z.speed * keepDistMul * dt * finalMoveMul;
        }
        if (z.throwTimer <= 0 && len <= z.throwRange + 26) {
          z.throwWindup = BALANCE.enemies.bomber.windup;
          state.effects.push({
            type: "warn",
            x: z.x,
            y: z.y,
            life: z.throwWindup,
            maxLife: z.throwWindup,
            size: 34,
            warnRgb: "255, 168, 112",
            dash: [7, 6],
          });
        }
      }
    } else if (z.type === "hammer") {
      if (z.windup > 0) {
        z.windup -= dt;
        if (z.windup <= 0) {
          applySplashDamage(z.x, z.y, z.slamRadius, Math.round(z.slamDamage * 0.4), z);
          bumpScreenShake(9);
          if (len <= z.slamRadius + p.r) {
            applyPlayerDamage(z.slamDamage, z.x, z.y);
            if (state.gameOver) return;
          }
          z.slamTimer = z.slamCooldown;
        }
      } else {
        z.slamTimer -= dt;
        if (z.slamTimer <= 0 && len <= z.slamRadius + 44) {
          z.windup = 0.7;
          state.effects.push({
            type: "warn",
            x: z.x,
            y: z.y,
            life: 0.7,
            maxLife: 0.7,
            size: z.slamRadius,
          });
        } else {
          z.x += (dx / len) * z.speed * dt * finalMoveMul;
          z.y += (dy / len) * z.speed * dt * finalMoveMul;
        }
      }
    } else {
      z.x += (dx / len) * z.speed * dt * finalMoveMul;
      z.y += (dy / len) * z.speed * dt * finalMoveMul;
    }

    if (len < p.r + z.r - 2) {
      let contactDamage = z.damage;
      if (z.type === "boss" && z.dashDuration > 0) contactDamage = bossCfg.dash.damage;
      applyPlayerDamage(contactDamage * dt, z.x, z.y);
      if (state.gameOver) return;
    }
  }
}

function hitZombie(zombie, damage, sourceWeaponId = null) {
  if (zombie.targetable === false) return false;
  const resist = getResistanceMultiplier(zombie, sourceWeaponId);
  let finalDamage = Math.max(1, Math.round(damage * resist));
  if (zombie.type === "boss") {
    const shieldRatio = clamp((zombie.spawnShield || 0) / 1.1, 0, 1);
    if (shieldRatio > 0) {
      finalDamage = Math.max(1, Math.round(finalDamage * (0.18 + (1 - shieldRatio) * 0.35)));
      state.effects.push({
        type: "bossShield",
        x: zombie.x,
        y: zombie.y,
        life: 0.08,
        maxLife: 0.08,
        size: zombie.r * (1.2 + shieldRatio * 0.2),
      });
    }
    const cap = Math.max(18, Math.round(zombie.maxHp * 0.12));
    finalDamage = Math.min(finalDamage, cap);
  }
  applyOnHitStatuses(zombie, sourceWeaponId);
  zombie.hurtTimer = Math.max(zombie.hurtTimer || 0, 0.12);
  const impact = sourceWeaponId ? getWeaponImpactProfile(sourceWeaponId) : null;
  if (impact) {
    const pushDx = zombie.x - state.player.x;
    const pushDy = zombie.y - state.player.y;
    const pushLen = Math.hypot(pushDx, pushDy) || 1;
    zombie.x += (pushDx / pushLen) * impact.push;
    zombie.y += (pushDy / pushLen) * impact.push;
    bumpScreenShake(impact.shake);
  }
  state.effects.push({
    type: "hit",
    x: zombie.x,
    y: zombie.y,
    life: 0.14,
    maxLife: 0.14,
    size: impact ? impact.size : 8,
  });
  if (impact) {
    state.effects.push({
      type: "impact",
      x: zombie.x,
      y: zombie.y,
      life: 0.12,
      maxLife: 0.12,
      size: impact.size * 1.4,
      color: impact.color,
    });
  }
  const applied = Math.max(0, Math.min(zombie.hp, finalDamage));
  if (state.settings.damageText && applied > 0.5) {
    const rounded = Math.max(1, Math.round(applied));
    state.effects.push({
      type: "dmgText",
      x: zombie.x + rand(-7, 7),
      y: zombie.y - rand(8, 14),
      life: 0.45,
      maxLife: 0.45,
      value: rounded,
      vx: rand(-6, 6),
      vy: -36 - rand(0, 16),
      color: impact ? impact.color : "rgba(240, 248, 255, 0.88)",
    });
  }
  zombie.hp -= finalDamage;
  recordWeaponDamage(sourceWeaponId, applied);
  if (zombie.hp <= 0) {
    if (zombie.type === "dummy") {
      zombie.hp = zombie.maxHp || 1200;
      state.effects.push({
        type: "banner",
        x: canvas.width / 2,
        y: 74,
        life: 0.45,
        maxLife: 0.45,
        size: 1,
        text: "더미 파괴!",
        subText: "테스트용으로 즉시 재생성",
      });
      return false;
    }
    const isBoss = zombie.type === "boss";
    if (!isBoss) playSfxEvent("killPop");
    state.kills += 1;
    if (isBoss) {
      for (let i = 0; i < 12; i += 1) {
        const a = (Math.PI * 2 * i) / 12;
        state.xpOrbs.push({
          x: zombie.x + Math.cos(a) * rand(6, 24),
          y: zombie.y + Math.sin(a) * rand(6, 24),
          r: 5,
          value: 3,
        });
      }
    } else {
      state.xpOrbs.push({ x: zombie.x, y: zombie.y, r: 5, value: 2 + (Math.random() < 0.25 ? 1 : 0) });
    }
    state.effects.push({
      type: "pop",
      x: zombie.x,
      y: zombie.y,
      life: 0.28,
      maxLife: 0.28,
      size: isBoss ? 72 : 28,
    });
    if (isBoss) onBossDefeated(zombie);
    return true;
  }
  return false;
}

function applySplashDamage(x, y, splash, damage, source = null, sourceWeaponId = null) {
  state.effects.push({
    type: "boom",
    x,
    y,
    life: 0.2,
    maxLife: 0.2,
    size: splash,
  });
  if (sourceWeaponId === "cherry" || (sourceWeaponId === "corn" && splash >= 60)) {
    playSfxEvent("bigBoom");
  }
  for (let j = state.zombies.length - 1; j >= 0; j -= 1) {
    const z = state.zombies[j];
    if (source && z === source) continue;
    if (z.targetable === false) continue;
    const dx = z.x - x;
    const dy = z.y - y;
    if (dx * dx + dy * dy <= splash * splash) {
      if (hitZombie(z, damage, sourceWeaponId)) state.zombies.splice(j, 1);
    }
  }
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const b = state.bullets[i];
    if (b.kind === "vine") {
      b.life -= dt;
      b.warmup -= dt;
      if (!b.triggered && b.warmup <= 0) {
        b.triggered = true;
        applySplashDamage(b.x, b.y, b.splash, b.damage, null, b.weaponId);
      }
      if (b.life <= 0) state.bullets.splice(i, 1);
      continue;
    }
    if (b.kind === "sporeCloud") {
      b.life -= dt;
      b.pulse -= dt;
      if (b.toxicGarden) {
        b.spin = (b.spin || 0) + dt * 2.2;
        if (b.pulse <= 0) {
          applySplashDamage(b.x, b.y, b.splash, Math.round(b.damage * 0.72), null, b.weaponId);
          state.effects.push({
            type: "sporeBurst",
            x: b.x,
            y: b.y,
            life: 0.34,
            maxLife: 0.34,
            size: b.splash,
            toxicGarden: true,
          });
          state.effects.push({
            type: "toxicBloom",
            x: b.x,
            y: b.y,
            life: 0.42,
            maxLife: 0.42,
            size: b.splash * 0.95,
          });
          b.pulsesLeft = (b.pulsesLeft || 4) - 1;
          b.pulse = 0.22;
          if (b.pulsesLeft <= 0) b.life = 0;
        }
      } else if (!b.triggered && b.pulse <= 0) {
        b.triggered = true;
        applySplashDamage(b.x, b.y, b.splash, b.damage, null, b.weaponId);
        state.effects.push({
          type: "sporeBurst",
          x: b.x,
          y: b.y,
          life: 0.36,
          maxLife: 0.36,
          size: b.splash,
        });
      }
      if (b.life <= 0) state.bullets.splice(i, 1);
      continue;
    }
    if (b.kind === "cornShell") {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      b.traveled += Math.hypot(b.vx, b.vy) * dt;
      let shouldDetonate = b.traveled >= b.explodeDistance || b.life <= 0;
      if (!shouldDetonate) {
        for (const z of state.zombies) {
          if (z.targetable === false) continue;
          const dx = z.x - b.x;
          const dy = z.y - b.y;
          const rr = z.r + b.r;
          if (dx * dx + dy * dy < rr * rr) {
            shouldDetonate = true;
            break;
          }
        }
      }
      if (shouldDetonate) {
        const thornBomb = b.evoMode === "thornBomb";
        const boomSplash = Math.round(b.splash * (thornBomb ? 1.12 : 0.88));
        const boomDamage = Math.round(b.damage * (thornBomb ? 0.68 : 0.58));
        applySplashDamage(b.x, b.y, boomSplash, boomDamage, null, b.weaponId);
        state.effects.push({
          type: "cornBurst",
          x: b.x,
          y: b.y,
          life: 0.24,
          maxLife: 0.24,
          size: b.splash * 0.8,
          thornBomb,
        });
        if (thornBomb) {
          state.effects.push({
            type: "thornBurst",
            x: b.x,
            y: b.y,
            life: 0.3,
            maxLife: 0.3,
            size: b.splash * 0.95,
          });
        }
        for (let s = 0; s < b.kernelCount; s += 1) {
          const ang = (Math.PI * 2 * s) / b.kernelCount + rand(-0.18, 0.18);
          const speed = rand(220, 340);
          state.bullets.push({
            kind: "bullet",
            weaponId: b.weaponId,
            x: b.x,
            y: b.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            r: Math.max(5, b.r * 0.45),
            damage: Math.round(b.damage * 0.36),
            life: 0.7,
            sprite: "corn",
            splash: Math.round(b.splash * 0.24),
            pierce: 0,
            rotation: ang,
            hitIds: new Set(),
            evoMode: b.evoMode || "",
          });
        }
        if (thornBomb) {
          for (let s = 0; s < 8; s += 1) {
            const ang = (Math.PI * 2 * s) / 8 + rand(-0.08, 0.08);
            const speed = rand(270, 390);
            state.bullets.push({
              kind: "bullet",
              weaponId: "spike",
              x: b.x,
              y: b.y,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed,
              r: Math.max(5, b.r * 0.4),
              damage: Math.round(b.damage * 0.42),
              life: 0.62,
              sprite: "spike",
              splash: 0,
              pierce: 1,
              rotation: ang,
              hitIds: new Set(),
              evoMode: "thornBomb",
            });
          }
        }
        state.bullets.splice(i, 1);
      }
      continue;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    let removeBullet = false;

    for (let j = state.zombies.length - 1; j >= 0; j -= 1) {
      const z = state.zombies[j];
      if (z.targetable === false) continue;
      if (b.hitIds.has(z)) continue;
      const dx = z.x - b.x;
      const dy = z.y - b.y;
      const rr = z.r + b.r;
      if (dx * dx + dy * dy < rr * rr) {
        b.hitIds.add(z);
        if (hitZombie(z, b.damage, b.weaponId)) state.zombies.splice(j, 1);
        if (b.splash > 0) {
          const supernova = b.evoMode === "supernova";
          const splashScale = supernova ? 1.26 : 1;
          const splashDamage = Math.round(b.damage * (supernova ? 0.82 : 0.65));
          applySplashDamage(b.x, b.y, Math.round(b.splash * splashScale), splashDamage, null, b.weaponId);
          if (supernova) {
            state.effects.push({
              type: "novaBurst",
              x: b.x,
              y: b.y,
              life: 0.34,
              maxLife: 0.34,
              size: b.splash * 1.05,
            });
            for (let n = 0; n < 3; n += 1) {
              const a = rand(0, Math.PI * 2);
              const rx = b.x + Math.cos(a) * rand(26, 58);
              const ry = b.y + Math.sin(a) * rand(26, 58);
              applySplashDamage(rx, ry, Math.round(b.splash * 0.45), Math.round(b.damage * 0.32), null, b.weaponId);
            }
          }
          if (b.weaponId === "spore") {
            const toxicGarden = state.player.weapons.spore?.evolvedKey === "spore+vine";
            const mainCloud = {
              kind: "sporeCloud",
              weaponId: "spore",
              x: b.x,
              y: b.y,
              life: toxicGarden ? 1.35 : 0.9,
              pulse: toxicGarden ? 0.16 : 0.22,
              triggered: false,
              splash: Math.round(b.splash * (toxicGarden ? 0.96 : 0.74)),
              damage: Math.round(b.damage * (toxicGarden ? 0.56 : 0.4)),
              toxicGarden,
              evoMode: b.evoMode || "",
            };
            if (toxicGarden) {
              mainCloud.pulsesLeft = 4;
              mainCloud.spin = rand(0, Math.PI * 2);
            }
            state.bullets.push(mainCloud);
            if (toxicGarden) {
              for (let c = 0; c < 2; c += 1) {
                const a = rand(0, Math.PI * 2);
                state.bullets.push({
                  kind: "sporeCloud",
                  weaponId: "spore",
                  x: b.x + Math.cos(a) * rand(16, 28),
                  y: b.y + Math.sin(a) * rand(16, 28),
                  life: 0.95,
                  pulse: 0.2 + c * 0.04,
                  triggered: false,
                  splash: Math.round(b.splash * 0.58),
                  damage: Math.round(b.damage * 0.38),
                  toxicGarden: true,
                  pulsesLeft: 2,
                  spin: rand(0, Math.PI * 2),
                });
              }
            }
          }
        }
        if (b.pierce > 0) {
          b.pierce -= 1;
          b.damage = Math.round(b.damage * 0.85);
        } else {
          removeBullet = true;
          break;
        }
      }
    }

    if (
      removeBullet ||
      b.life <= 0 ||
      b.x < -40 || b.x > canvas.width + 40 ||
      b.y < -40 || b.y > canvas.height + 40
    ) {
      state.bullets.splice(i, 1);
    }
  }
}

function updateXpOrbs(dt) {
  const p = state.player;
  for (let i = state.xpOrbs.length - 1; i >= 0; i -= 1) {
    const o = state.xpOrbs[i];
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const d = Math.hypot(dx, dy) || 1;

    if (d < 120) {
      const pull = (120 - d) * 5;
      o.x += (dx / d) * pull * dt;
      o.y += (dy / d) * pull * dt;
    }

    if (d < p.r + o.r + 4) {
      gainXp(o.value);
      state.xpOrbs.splice(i, 1);
    }
  }
}

function updateEffects(dt) {
  for (let i = state.effects.length - 1; i >= 0; i -= 1) {
    const ef = state.effects[i];
    if (ef.type === "dmgText") {
      ef.x += (ef.vx || 0) * dt;
      ef.y += (ef.vy || 0) * dt;
      ef.vy *= 0.96;
      ef.vx *= 0.93;
    }
    ef.life -= dt;
    if (ef.life <= 0) state.effects.splice(i, 1);
  }
  state.screenShake = Math.max(0, state.screenShake - dt * 28);
}

function updateHazards(dt) {
  const p = state.player;
  for (let i = state.hazards.length - 1; i >= 0; i -= 1) {
    const h = state.hazards[i];
    if (h.type === "zombieBomb") {
      h.life -= dt;
      if (h.flyTime > 0) {
        h.x += (h.vx || 0) * dt;
        h.y += (h.vy || 0) * dt;
        h.flyTime = Math.max(0, h.flyTime - dt);
      } else if (!h.fired) {
        h.fuse = Math.max(0, (h.fuse || 0) - dt);
        if (h.fuse <= 0) {
          h.fired = true;
          h.activeTime = h.activeTime || 0.18;
          bumpScreenShake(9);
          state.effects.push({
            type: "boom",
            x: h.x,
            y: h.y,
            life: 0.28,
            maxLife: 0.28,
            size: h.r * 1.05,
          });
          const dx = p.x - h.x;
          const dy = p.y - h.y;
          if (dx * dx + dy * dy <= (h.r + p.r * 0.35) * (h.r + p.r * 0.35)) {
            applyPlayerDamage(h.damage || 24, h.x, h.y);
            if (state.gameOver) return;
          }
        }
      }
      if (h.fired) h.activeTime -= dt;
      if (h.life <= 0 || (h.fired && h.activeTime <= 0)) {
        state.hazards.splice(i, 1);
      }
      continue;
    }
    if (h.type === "casterBlast") {
      h.life -= dt;
      h.armTime = Math.max(0, (h.armTime || 0) - dt);
      if (!h.fired && h.armTime <= 0) {
        h.fired = true;
        h.activeTime = h.activeTime || 0.2;
        bumpScreenShake(8.5);
        state.effects.push({
          type: "boom",
          x: h.x,
          y: h.y,
          life: 0.24,
          maxLife: 0.24,
          size: h.r * 1.02,
        });
        const dx = p.x - h.x;
        const dy = p.y - h.y;
        if (dx * dx + dy * dy <= (h.r + p.r * 0.3) * (h.r + p.r * 0.3)) {
          applyPlayerDamage(h.damage || 24, h.x, h.y);
          if (state.gameOver) return;
        }
      }
      if (h.fired) h.activeTime -= dt;
      if (h.life <= 0 || (h.fired && h.activeTime <= 0)) {
        state.hazards.splice(i, 1);
      }
      continue;
    }

    h.life -= dt;
    if (h.life <= 0) {
      state.hazards.splice(i, 1);
      continue;
    }
    const dx = p.x - h.x;
    const dy = p.y - h.y;
    if (dx * dx + dy * dy <= (h.r + p.r * 0.3) * (h.r + p.r * 0.3)) {
      applyPlayerDamage((h.dps || 0) * dt, h.x, h.y);
      if (state.gameOver) return;
    }
  }
}

function update(dt) {
  if (!state.running || state.paused) return;

  state.time += dt;
  updateBossDirector();
  updatePlayer(dt);
  updateSpawning(dt);
  updateWeapons(dt);
  updateZombies(dt);
  updateBullets(dt);
  updateXpOrbs(dt);
  updateEffects(dt);
  updateHazards(dt);
  updateAudio(dt);
}

function drawBackground() {
  for (let i = 0; i < 4; i += 1) {
    const cx = ((state.time * (9 + i * 3) + i * 260) % (canvas.width + 220)) - 110;
    const cy = 58 + i * 72 + Math.sin(state.time * 0.2 + i) * 6;
    ctx.fillStyle = "rgba(248, 255, 244, 0.38)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 24, cy + 4, 34, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 24, cy + 5, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const s = 48;
  ctx.fillStyle = "rgba(72, 152, 78, 0.1)";
  for (let y = 0; y < canvas.height; y += s) {
    for (let x = 0; x < canvas.width; x += s) {
      if ((x / s + y / s) % 2 === 0) ctx.fillRect(x, y, s, s);
    }
  }

  // Tiny flowers for a softer, kid-friendly field look.
  for (let y = 18; y < canvas.height; y += 96) {
    for (let x = 24; x < canvas.width; x += 110) {
      const fx = x + Math.sin((state.time + x) * 0.02) * 2;
      const fy = y + Math.cos((state.time + y) * 0.02) * 2;
      ctx.fillStyle = "rgba(255, 235, 245, 0.65)";
      ctx.beginPath();
      ctx.arc(fx - 3, fy, 2.2, 0, Math.PI * 2);
      ctx.arc(fx + 3, fy, 2.2, 0, Math.PI * 2);
      ctx.arc(fx, fy - 3, 2.2, 0, Math.PI * 2);
      ctx.arc(fx, fy + 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 213, 120, 0.8)";
      ctx.beginPath();
      ctx.arc(fx, fy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Wind-swept grass streaks for richer ground texture.
  for (let gy = 22; gy < canvas.height; gy += 28) {
    for (let gx = 8; gx < canvas.width; gx += 22) {
      const sway = Math.sin(state.time * 1.8 + gx * 0.04 + gy * 0.02) * 3.2;
      const len = 5 + ((gx + gy) % 7) * 0.35;
      ctx.strokeStyle = "rgba(98, 162, 89, 0.16)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + sway, gy - len);
      ctx.stroke();
    }
  }
}

function drawSceneAtmosphere() {
  const t = state.time;
  const pulse = 0.1 + (Math.sin(t * 0.4) + 1) * 0.03;

  const sunGrad = ctx.createRadialGradient(
    canvas.width * 0.2,
    canvas.height * 0.12,
    20,
    canvas.width * 0.2,
    canvas.height * 0.12,
    canvas.width * 0.55
  );
  sunGrad.addColorStop(0, `rgba(255, 251, 218, ${0.1 + pulse})`);
  sunGrad.addColorStop(1, "rgba(255, 251, 218, 0)");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3; i += 1) {
    const x = ((t * (16 + i * 7)) % (canvas.width + 320)) - 160;
    const y = 48 + i * 78;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.28);
    const beam = ctx.createLinearGradient(0, 0, 240, 0);
    beam.addColorStop(0, "rgba(255, 248, 214, 0)");
    beam.addColorStop(0.45, "rgba(255, 248, 214, 0.06)");
    beam.addColorStop(1, "rgba(255, 248, 214, 0)");
    ctx.fillStyle = beam;
    ctx.fillRect(0, -18, 260, 36);
    ctx.restore();
  }
}

function getActiveEvolutionCount() {
  let cnt = 0;
  for (const w of Object.values(state.player.weapons)) {
    if (!w?.enabled) continue;
    if (w.evolvedKey) cnt += 1;
  }
  return cnt;
}

function drawLightingOverlay() {
  const p = state.player;
  const evoCount = getActiveEvolutionCount();

  ctx.save();
  ctx.fillStyle = "rgba(8, 21, 15, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "screen";

  const playerR = p.r * (4.3 + evoCount * 0.35);
  const gPlayer = ctx.createRadialGradient(p.x, p.y, p.r * 0.3, p.x, p.y, playerR);
  gPlayer.addColorStop(0, `rgba(224, 255, 184, ${0.34 + evoCount * 0.06})`);
  gPlayer.addColorStop(0.45, `rgba(176, 248, 167, ${0.16 + evoCount * 0.04})`);
  gPlayer.addColorStop(1, "rgba(176, 248, 167, 0)");
  ctx.fillStyle = gPlayer;
  ctx.beginPath();
  ctx.arc(p.x, p.y, playerR, 0, Math.PI * 2);
  ctx.fill();

  for (const b of state.bullets) {
    let radius = 0;
    let color = "";
    if (b.sprite === "spore" || b.kind === "sporeCloud") {
      radius = (b.splash || b.r * 4 || 22) * 0.45;
      color = b.toxicGarden ? "rgba(178, 255, 166, 0.2)" : "rgba(200, 149, 255, 0.18)";
    } else if (b.weaponId === "cherry" || b.evoMode === "supernova") {
      radius = Math.max(24, (b.r || 10) * 3.5);
      color = "rgba(255, 188, 136, 0.2)";
    } else if (b.weaponId === "corn" || b.evoMode === "thornBomb") {
      radius = Math.max(20, (b.r || 10) * 3.1);
      color = b.evoMode === "thornBomb" ? "rgba(196, 255, 181, 0.17)" : "rgba(255, 226, 158, 0.17)";
    } else if (b.weaponId === "spike") {
      radius = Math.max(16, (b.r || 8) * 2.8);
      color = "rgba(208, 255, 218, 0.16)";
    }
    if (radius <= 0) continue;
    const g = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, radius);
    g.addColorStop(0, color.replace("0.2)", "0.28)").replace("0.18)", "0.25)").replace("0.17)", "0.24)").replace("0.16)", "0.22)"));
    g.addColorStop(1, color.replace("0.2)", "0)").replace("0.18)", "0)").replace("0.17)", "0)").replace("0.16)", "0)"));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const h of state.hazards) {
    const hr = h.r * 1.05;
    const active = h.type === "casterBlast" ? (h.fired ? 0.26 : 0.16) : h.type === "zombieBomb" ? (h.fired ? 0.24 : 0.18) : 0.14;
    const col = h.type === "casterBlast"
      ? "rgba(255, 124, 124,"
      : h.type === "zombieBomb"
        ? "rgba(255, 176, 118,"
        : "rgba(190, 132, 235,";
    const g = ctx.createRadialGradient(h.x, h.y, 4, h.x, h.y, hr);
    g.addColorStop(0, `${col} ${active})`);
    g.addColorStop(1, `${col} 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(h.x, h.y, hr, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const z of state.zombies) {
    if (z.type !== "boss") continue;
    const phase = z.phase || 1;
    const r = z.r * (phase === 2 ? 3.1 : phase === 3 ? 3.2 : 2.8);
    const inner = phase === 2
      ? "rgba(194, 144, 255, 0.2)"
      : phase === 3
        ? "rgba(255, 176, 118, 0.2)"
        : "rgba(255, 152, 132, 0.2)";
    const outer = phase === 2
      ? "rgba(194, 144, 255, 0)"
      : phase === 3
        ? "rgba(255, 176, 118, 0)"
        : "rgba(255, 152, 132, 0)";
    const g = ctx.createRadialGradient(z.x, z.y, z.r * 0.4, z.x, z.y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z.x, z.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const ef of state.effects) {
    if (ef.type !== "boom" && ef.type !== "novaBurst" && ef.type !== "evoBurst" && ef.type !== "toxicBloom") continue;
    const a = clamp(ef.life / ef.maxLife, 0, 1);
    const r = ef.size * (0.7 + (1 - a) * 0.25);
    let c0 = "rgba(255, 220, 170, 0.16)";
    if (ef.type === "novaBurst") c0 = "rgba(255, 205, 138, 0.2)";
    if (ef.type === "evoBurst") c0 = "rgba(196, 255, 170, 0.18)";
    if (ef.type === "toxicBloom") c0 = "rgba(181, 255, 170, 0.17)";
    const g = ctx.createRadialGradient(ef.x, ef.y, 4, ef.x, ef.y, r);
    g.addColorStop(0, c0);
    g.addColorStop(1, c0.replace(/0\.\d+\)/, "0)"));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSprite(img, x, y, w, h, rot = 0, scaleX = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scaleX, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function stepFrameValue(t, speed = 10) {
  const f = Math.floor((t * speed) % 4);
  if (f === 0) return -1.4;
  if (f === 1) return 0.35;
  if (f === 2) return 1.4;
  return 0.25;
}

function stepPulseValue(t, speed = 14) {
  const f = Math.floor((t * speed) % 4);
  if (f === 0) return 0.94;
  if (f === 1) return 1.0;
  if (f === 2) return 1.06;
  return 1.0;
}

function drawAmbience(dt) {
  for (const p of state.ambience) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < -10) {
      p.y = canvas.height + 12;
      p.x = rand(0, canvas.width);
    }
    if (p.x < -12) p.x = canvas.width + 10;
    if (p.x > canvas.width + 12) p.x = -10;

    ctx.fillStyle = p.hue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMiniMap() {
  const w = 150;
  const h = 102;
  const x = canvas.width - w - 16;
  const y = 16;

  ctx.fillStyle = "rgba(255, 255, 248, 0.78)";
  ctx.strokeStyle = "rgba(95, 152, 92, 0.78)";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  const scaleX = (w - 12) / canvas.width;
  const scaleY = (h - 12) / canvas.height;
  const ox = x + 6;
  const oy = y + 6;

  for (const z of state.zombies) {
    let c = "#7da87a";
    if (z.type === "hammer") c = "#c99e6f";
    if (z.type === "dasher") c = "#72a9d9";
    if (z.type === "bomber") c = "#d88f61";
    if (z.type === "boss") c = "#ff8d8d";
    if (z.type === "dummy") c = "#c79ff0";
    ctx.fillStyle = c;
    ctx.fillRect(ox + z.x * scaleX, oy + z.y * scaleY, 3, 3);
  }

  ctx.fillStyle = "#5ecf58";
  ctx.beginPath();
  ctx.arc(ox + state.player.x * scaleX, oy + state.player.y * scaleY, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function bulletVisual(sprite) {
  if (sprite === "pea") return { glow: "rgba(131, 255, 122, 0.45)", core: "#ddffd4", trail: "rgba(116, 240, 126, 0.38)" };
  if (sprite === "spike") return { glow: "rgba(155, 255, 204, 0.42)", core: "#ecfff7", trail: "rgba(144, 231, 184, 0.34)" };
  if (sprite === "spore") return { glow: "rgba(224, 173, 255, 0.44)", core: "#f6e8ff", trail: "rgba(206, 151, 250, 0.33)" };
  if (sprite === "corn") return { glow: "rgba(255, 234, 164, 0.45)", core: "#fff5d0", trail: "rgba(255, 220, 126, 0.34)" };
  if (sprite === "cherry") return { glow: "rgba(255, 171, 189, 0.45)", core: "#ffe7ef", trail: "rgba(255, 150, 177, 0.34)" };
  return { glow: "rgba(180, 230, 255, 0.4)", core: "#ffffff", trail: "rgba(162, 221, 255, 0.32)" };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const dtVisual = 1 / 60;
  const shake = state.settings.screenShake ? state.screenShake : 0;
  if (shake > 0) {
    ctx.save();
    ctx.translate(rand(-shake, shake), rand(-shake, shake));
  }
  drawBackground();
  drawSceneAtmosphere();
  drawAmbience(dtVisual);

  for (const o of state.xpOrbs) {
    ctx.fillStyle = "#ffd44a";
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of state.bullets) {
    if (b.kind === "vine") {
      const t = clamp((0.38 - b.warmup) / 0.38, 0, 1);
      const ringR = b.splash * (0.22 + t * 0.82);
      ctx.fillStyle = `rgba(145, 234, 96, ${0.22 + t * 0.18})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, ringR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(233, 255, 189, ${0.4 + t * 0.36})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, ringR * 0.92, 0, Math.PI * 2);
      ctx.stroke();

      const stemH = 10 + 48 * t;
      ctx.strokeStyle = `rgba(56, 125, 44, ${0.6 + t * 0.35})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 10);
      ctx.lineTo(b.x, b.y + 10 - stemH);
      ctx.stroke();

      const topY = b.y + 10 - stemH;
      ctx.fillStyle = `rgba(76, 176, 64, ${0.5 + t * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(b.x - 10, topY + 10, 10, 5.5, -0.56, 0, Math.PI * 2);
      ctx.ellipse(b.x + 10, topY + 6, 10, 5.5, 0.56, 0, Math.PI * 2);
      ctx.ellipse(b.x - 6, topY + 20, 8, 4.2, -0.38, 0, Math.PI * 2);
      ctx.ellipse(b.x + 7, topY + 18, 8, 4.2, 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Tomato fruits on the vine head for high readability.
      const wobble = Math.sin(state.time * 11 + b.x * 0.02) * 1.1;
      const fruits = [
        { x: b.x - 12 + wobble, y: topY + 3, r: 5.8 },
        { x: b.x + 12 - wobble, y: topY + 1, r: 5.8 },
        { x: b.x + wobble * 0.5, y: topY - 4, r: 6.5 },
      ];
      for (const f of fruits) {
        ctx.fillStyle = `rgba(231, 72, 68, ${0.65 + t * 0.3})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 214, 214, ${0.5 + t * 0.22})`;
        ctx.beginPath();
        ctx.arc(f.x - f.r * 0.25, f.y - f.r * 0.3, f.r * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    if (b.kind === "cornShell") {
      const vLen = Math.hypot(b.vx || 0, b.vy || 0) || 1;
      const dirX = (b.vx || 0) / vLen;
      const dirY = (b.vy || 0) / vLen;
      const thornBomb = b.evoMode === "thornBomb";
      ctx.strokeStyle = thornBomb ? "rgba(198, 255, 188, 0.52)" : "rgba(255, 223, 135, 0.45)";
      ctx.lineWidth = Math.max(3, b.r * 0.9);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x - dirX * (b.r * 2.8), b.y - dirY * (b.r * 2.8));
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = thornBomb ? "rgba(188, 246, 174, 0.55)" : "rgba(255, 233, 167, 0.5)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 1.35, 0, Math.PI * 2);
      ctx.fill();
      if (thornBomb) {
        ctx.strokeStyle = "rgba(236, 255, 225, 0.56)";
        ctx.lineWidth = 2;
        for (let s = 0; s < 6; s += 1) {
          const a = (Math.PI * 2 * s) / 6 + state.time * 0.08;
          const r1 = b.r * 0.7;
          const r2 = b.r * 1.85;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1);
          ctx.lineTo(b.x + Math.cos(a) * r2, b.y + Math.sin(a) * r2);
          ctx.stroke();
        }
      }
      if (images.corn) {
        drawSprite(images.corn, b.x, b.y, b.r * 2.5, b.r * 2.5, b.rotation + state.time * 9);
      } else {
        ctx.fillStyle = "#ffd768";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    if (b.kind === "sporeCloud") {
      const cloudAlpha = clamp(b.life / 0.9, 0, 1);
      const cloudR = b.splash * (0.72 + (1 - cloudAlpha) * 0.35);
      if (b.toxicGarden) {
        const spin = b.spin || 0;
        const grad = ctx.createRadialGradient(b.x, b.y, cloudR * 0.2, b.x, b.y, cloudR);
        grad.addColorStop(0, `rgba(201, 255, 164, ${0.2 + cloudAlpha * 0.14})`);
        grad.addColorStop(0.55, `rgba(166, 110, 212, ${0.2 + cloudAlpha * 0.2})`);
        grad.addColorStop(1, "rgba(78, 184, 92, 0.06)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, cloudR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(215, 255, 198, ${0.18 + cloudAlpha * 0.34})`;
        ctx.lineWidth = 2;
        for (let v = 0; v < 4; v += 1) {
          const ang = spin + (Math.PI * 2 * v) / 4;
          ctx.beginPath();
          ctx.ellipse(
            b.x + Math.cos(ang) * cloudR * 0.22,
            b.y + Math.sin(ang) * cloudR * 0.22,
            cloudR * 0.52,
            cloudR * 0.2,
            ang,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
        for (let p = 0; p < 11; p += 1) {
          const a = (Math.PI * 2 * p) / 11 + state.time * 1.2 + spin * 0.4;
          const r = cloudR * (0.34 + (p % 4) * 0.1);
          const px = b.x + Math.cos(a) * r;
          const py = b.y + Math.sin(a) * r;
          ctx.fillStyle = p % 2 === 0
            ? `rgba(188, 255, 161, ${0.16 + cloudAlpha * 0.24})`
            : `rgba(213, 170, 255, ${0.14 + cloudAlpha * 0.22})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.5 + (p % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgba(160, 118, 205, ${0.14 + cloudAlpha * 0.18})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, cloudR, 0, Math.PI * 2);
        ctx.fill();
        for (let p = 0; p < 7; p += 1) {
          const a = (Math.PI * 2 * p) / 7 + state.time * 0.9;
          const r = cloudR * (0.35 + (p % 3) * 0.12);
          const px = b.x + Math.cos(a) * r;
          const py = b.y + Math.sin(a) * r;
          ctx.fillStyle = `rgba(206, 168, 255, ${0.18 + cloudAlpha * 0.22})`;
          ctx.beginPath();
          ctx.arc(px, py, 3.1 + (p % 2), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      continue;
    }

    const img = images[b.sprite];
    const look = bulletVisual(b.sprite);
    const vLen = Math.hypot(b.vx || 0, b.vy || 0) || 1;
    const dirX = (b.vx || 0) / vLen;
    const dirY = (b.vy || 0) / vLen;

    ctx.strokeStyle = look.trail;
    ctx.lineWidth = Math.max(2, b.r * 0.95);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(b.x - dirX * (b.r * 2.2), b.y - dirY * (b.r * 2.2));
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    if (b.evoMode === "supernova") {
      ctx.fillStyle = "rgba(255, 210, 124, 0.24)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (2 + Math.sin(state.time * 18 + b.x * 0.03) * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    if (b.sprite === "spore") {
      if (b.toxicGarden) {
        const ringR = b.r * (1.4 + Math.sin(state.time * 20 + b.x * 0.03) * 0.12);
        ctx.strokeStyle = "rgba(191, 255, 165, 0.62)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let t = 0; t < 3; t += 1) {
        const off = (t + 1) * (b.r * 0.95);
        const px = b.x - dirX * off + rand(-1.5, 1.5);
        const py = b.y - dirY * off + rand(-1.5, 1.5);
        ctx.fillStyle = b.toxicGarden
          ? `rgba(188, 255, 163, ${0.18 + t * 0.08})`
          : `rgba(191, 139, 239, ${0.18 + t * 0.08})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.6, b.r * (0.22 + t * 0.08)), 0, Math.PI * 2);
        ctx.fill();
      }
      if (b.evoMode === "sporeGatling") {
        ctx.strokeStyle = "rgba(235, 255, 202, 0.62)";
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * (1.55 + Math.sin(state.time * 24 + b.y * 0.03) * 0.12), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const pulse = 0.85 + Math.sin(state.time * 22 + b.x * 0.02) * 0.15;
    ctx.fillStyle = look.glow;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * (1.15 + pulse * 0.2), 0, Math.PI * 2);
    ctx.fill();

    if (img) {
      const pulseFrame = stepPulseValue(state.time + b.x * 0.015 + b.y * 0.012, 18);
      drawSprite(img, b.x, b.y, b.r * 2.3 * pulseFrame, b.r * 2.3 * (1.03 - (pulseFrame - 1) * 0.42), b.rotation);
    } else {
      ctx.fillStyle = "#6bd1ff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = look.core;
    ctx.beginPath();
    ctx.arc(b.x - dirX * 1.1, b.y - dirY * 1.1, Math.max(1.6, b.r * 0.26), 0, Math.PI * 2);
    ctx.fill();
  }

  for (const h of state.hazards) {
    if (h.type === "zombieBomb") {
      if (!h.fired) {
        const fuseBase = BALANCE.enemies.bomber.bomb.fuse || 1.2;
        const fuseRatio = clamp((h.fuse || 0) / fuseBase, 0, 1);
        const pulse = 0.82 + Math.sin(state.time * (14 + (1 - fuseRatio) * 24)) * 0.16;
        const bombR = Math.max(7.5, h.r * 0.22);
        const smokeA = 0.16 + (1 - fuseRatio) * 0.22;
        ctx.fillStyle = "rgba(26, 26, 28, 0.95)";
        ctx.beginPath();
        ctx.arc(h.x, h.y, bombR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(108, 112, 118, 0.88)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(h.x, h.y, bombR * 0.94, 0, Math.PI * 2);
        ctx.stroke();
        const fuseLen = bombR * 0.8;
        const fx = h.x + bombR * 0.38;
        const fy = h.y - bombR * 0.76;
        ctx.strokeStyle = "rgba(229, 199, 132, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + fuseLen * 0.6, fy - fuseLen);
        ctx.stroke();
        const sparkX = fx + fuseLen * 0.6;
        const sparkY = fy - fuseLen;
        ctx.fillStyle = `rgba(255, 198, 104, ${0.58 + (1 - fuseRatio) * 0.35})`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2.4 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 228, 178, ${0.5 + (1 - fuseRatio) * 0.35})`;
        ctx.lineWidth = 1.2;
        for (let s = 0; s < 5; s += 1) {
          const a = (Math.PI * 2 * s) / 5 + state.time * 7;
          const rr = 4.8 + s * 0.35;
          ctx.beginPath();
          ctx.moveTo(sparkX, sparkY);
          ctx.lineTo(sparkX + Math.cos(a) * rr, sparkY + Math.sin(a) * rr);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(78, 78, 78, ${smokeA})`;
        ctx.beginPath();
        ctx.arc(sparkX + rand(-1.2, 1.2), sparkY - 5 - rand(0, 3), 4 + rand(0, 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(42, 42, 42, ${smokeA * 0.75})`;
        ctx.beginPath();
        ctx.arc(sparkX + rand(-1.5, 1.5), sparkY - 10 - rand(0, 4), 3.2 + rand(0, 1.7), 0, Math.PI * 2);
        ctx.fill();
        if ((h.flyTime || 0) <= 0) {
          ctx.strokeStyle = `rgba(255, 150, 98, ${0.28 + (1 - fuseRatio) * 0.42})`;
          ctx.lineWidth = 2.2;
          ctx.setLineDash([7, 6]);
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.r * (0.9 + (1 - fuseRatio) * 0.1), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        const fade = clamp((h.activeTime || 0) / 0.18, 0, 1);
        ctx.fillStyle = `rgba(255, 156, 102, ${0.24 * fade})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * (1.04 + (1 - fade) * 0.12), 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    if (h.type === "casterBlast") {
      if (!h.fired && (h.armTime || 0) > 0) {
        const t = clamp(1 - (h.armTime / 0.92), 0, 1);
        ctx.fillStyle = `rgba(255, 84, 84, ${0.1 + t * 0.14})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * (0.82 + t * 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 161, 161, ${0.35 + t * 0.45})`;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * (0.9 + t * 0.08), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const fade = clamp((h.activeTime || 0) / 0.2, 0, 1);
        ctx.fillStyle = `rgba(255, 112, 112, ${0.18 * fade})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r * (1.05 + (1 - fade) * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }
      continue;
    }
    const lifeRatio = clamp(h.life / 5, 0.18, 1);
    ctx.fillStyle = `rgba(157, 104, 170, ${0.14 * lifeRatio})`;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(228, 186, 242, ${0.42 * lifeRatio})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const ef of state.effects) {
    const alpha = clamp(ef.life / ef.maxLife, 0, 1);
    if (ef.type === "hit") {
      ctx.fillStyle = `rgba(255, 251, 194, ${alpha})`;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (1.4 - alpha * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }
    if (ef.type === "pop") {
      ctx.strokeStyle = `rgba(177, 255, 177, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (1.25 - alpha * 0.4), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (ef.type === "boom") {
      ctx.fillStyle = `rgba(255, 196, 132, ${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (1.28 - alpha * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 246, 187, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (1.1 - alpha * 0.15), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (ef.type === "warn") {
      const warnRgb = ef.warnRgb || "255, 221, 152";
      const warnAlpha = ef.warnRgb ? (0.32 + alpha * 0.5) : (0.3 + alpha * 0.4);
      ctx.strokeStyle = `rgba(${warnRgb}, ${warnAlpha})`;
      ctx.lineWidth = 2.4;
      ctx.setLineDash(ef.dash || [8, 8]);
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (1.02 + (1 - alpha) * 0.08), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (ef.type === "dash") {
      ctx.fillStyle = `rgba(195, 232, 255, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (1.4 - alpha * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    if (ef.type === "cornBurst") {
      ctx.strokeStyle = ef.thornBomb
        ? `rgba(214, 255, 196, ${0.35 + alpha * 0.6})`
        : `rgba(255, 241, 170, ${0.35 + alpha * 0.6})`;
      ctx.lineWidth = 2.2;
      for (let k = 0; k < 8; k += 1) {
        const a = (Math.PI * 2 * k) / 8 + (1 - alpha) * 0.5;
        const r1 = ef.size * (0.15 + (1 - alpha) * 0.1);
        const r2 = ef.size * (0.55 + (1 - alpha) * 0.35);
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * r1, ef.y + Math.sin(a) * r1);
        ctx.lineTo(ef.x + Math.cos(a) * r2, ef.y + Math.sin(a) * r2);
        ctx.stroke();
      }
    }
    if (ef.type === "thornBurst") {
      const r = ef.size * (0.34 + (1 - alpha) * 0.86);
      ctx.strokeStyle = `rgba(220, 255, 208, ${0.28 + alpha * 0.52})`;
      ctx.lineWidth = 2.1;
      for (let i = 0; i < 12; i += 1) {
        const a = (Math.PI * 2 * i) / 12 + state.time * 0.05;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * r * 0.22, ef.y + Math.sin(a) * r * 0.22);
        ctx.lineTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
        ctx.stroke();
      }
    }
    if (ef.type === "sporeVolley") {
      const r = ef.size * (0.5 + (1 - alpha) * 0.7);
      ctx.strokeStyle = `rgba(233, 255, 196, ${0.2 + alpha * 0.55})`;
      ctx.lineWidth = 1.9;
      for (let i = 0; i < 3; i += 1) {
        const a = -0.3 + i * 0.3;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, r * (0.7 + i * 0.12), a - 0.3, a + 0.3);
        ctx.stroke();
      }
    }
    if (ef.type === "novaBurst") {
      const r = ef.size * (0.38 + (1 - alpha) * 0.88);
      const grad = ctx.createRadialGradient(ef.x, ef.y, r * 0.25, ef.x, ef.y, r);
      grad.addColorStop(0, `rgba(255, 246, 192, ${alpha * 0.42})`);
      grad.addColorStop(0.5, `rgba(255, 194, 120, ${alpha * 0.22})`);
      grad.addColorStop(1, "rgba(255, 122, 86, 0.02)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 239, 182, ${0.28 + alpha * 0.56})`;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 10; i += 1) {
        const a = (Math.PI * 2 * i) / 10 + state.time * 0.03;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * r * 0.24, ef.y + Math.sin(a) * r * 0.24);
        ctx.lineTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
        ctx.stroke();
      }
    }
    if (ef.type === "impact") {
      const burst = ef.size * (0.7 + (1 - alpha) * 0.45);
      ctx.strokeStyle = ef.color || `rgba(255, 247, 201, ${0.35 + alpha * 0.55})`;
      ctx.lineWidth = 2.1;
      for (let s = 0; s < 8; s += 1) {
        const a = (Math.PI * 2 * s) / 8 + state.time * 0.04;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * burst * 0.25, ef.y + Math.sin(a) * burst * 0.25);
        ctx.lineTo(ef.x + Math.cos(a) * burst, ef.y + Math.sin(a) * burst);
        ctx.stroke();
      }
    }
    if (ef.type === "turretShot") {
      ctx.strokeStyle = `rgba(200, 255, 160, ${0.3 + alpha * 0.58})`;
      ctx.lineWidth = 2;
      for (let s = 0; s < 6; s += 1) {
        const a = (Math.PI * 2 * s) / 6;
        const r = ef.size * (0.32 + (1 - alpha) * 0.9);
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * r * 0.25, ef.y + Math.sin(a) * r * 0.25);
        ctx.lineTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
        ctx.stroke();
      }
    }
    if (ef.type === "evoBurst") {
      const r = ef.size * (0.35 + (1 - alpha) * 0.95);
      ctx.fillStyle = `rgba(170, 255, 124, ${alpha * 0.16})`;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(238, 255, 198, ${0.32 + alpha * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 12; k += 1) {
        const a = (Math.PI * 2 * k) / 12 + (1 - alpha) * 0.4;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * r * 0.2, ef.y + Math.sin(a) * r * 0.2);
        ctx.lineTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
        ctx.stroke();
      }
    }
    if (ef.type === "sporeBurst") {
      if (ef.toxicGarden) {
        ctx.fillStyle = `rgba(165, 255, 145, ${alpha * 0.22})`;
      } else {
        ctx.fillStyle = `rgba(171, 124, 222, ${alpha * 0.28})`;
      }
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (0.65 + (1 - alpha) * 0.38), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ef.toxicGarden
        ? `rgba(224, 255, 206, ${0.32 + alpha * 0.5})`
        : `rgba(222, 194, 255, ${0.3 + alpha * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (0.52 + (1 - alpha) * 0.44), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (ef.type === "toxicBloom") {
      const r = ef.size * (0.28 + (1 - alpha) * 0.86);
      ctx.strokeStyle = `rgba(190, 255, 177, ${0.24 + alpha * 0.56})`;
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 + state.time * 0.08;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * r * 0.2, ef.y + Math.sin(a) * r * 0.2);
        ctx.lineTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(177, 120, 230, ${alpha * 0.16})`;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, r * 0.66, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ef.type === "spikeHit") {
      const burst = ef.size * (0.66 + (1 - alpha) * 0.5);
      ctx.strokeStyle = `rgba(233, 255, 235, ${0.3 + alpha * 0.65})`;
      ctx.lineWidth = 2.3;
      for (let s = 0; s < 10; s += 1) {
        const a = (Math.PI * 2 * s) / 10 + state.time * 0.05;
        const inner = burst * 0.25;
        const outer = burst;
        ctx.beginPath();
        ctx.moveTo(ef.x + Math.cos(a) * inner, ef.y + Math.sin(a) * inner);
        ctx.lineTo(ef.x + Math.cos(a) * outer, ef.y + Math.sin(a) * outer);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(180, 255, 194, ${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, burst * 0.44, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ef.type === "bossShield") {
      ctx.strokeStyle = `rgba(179, 233, 255, ${0.22 + alpha * 0.42})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.size * (0.92 + (1 - alpha) * 0.16), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (ef.type === "dmgText") {
      const t = alpha;
      const s = 0.88 + (1 - t) * 0.2;
      ctx.save();
      ctx.translate(ef.x, ef.y);
      ctx.scale(s, s);
      ctx.font = "700 16px 'Trebuchet MS', 'Malgun Gothic', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = `rgba(15, 20, 18, ${0.42 * t})`;
      ctx.lineWidth = 3;
      ctx.strokeText(String(ef.value), 0, 0);
      ctx.fillStyle = `rgba(239, 252, 240, ${0.25 + t * 0.7})`;
      ctx.fillText(String(ef.value), 0, 0);
      ctx.restore();
    }
    if (ef.type === "banner") {
      const t = alpha;
      const w = Math.min(canvas.width * 0.86, 540);
      const h = 62;
      const x = canvas.width / 2 - w / 2;
      const y = ef.y - h / 2;
      ctx.fillStyle = `rgba(24, 34, 28, ${0.16 + t * 0.4})`;
      ctx.fillRect(x + 5, y + 6, w, h);
      ctx.fillStyle = `rgba(255, 219, 76, ${0.2 + t * 0.75})`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = `rgba(117, 85, 12, ${0.36 + t * 0.55})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = `rgba(43, 30, 7, ${0.35 + t * 0.65})`;
      ctx.font = "900 30px 'Trebuchet MS', 'Malgun Gothic', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ef.text || "보스 출현!", canvas.width / 2, y + 25);
      ctx.font = "700 15px 'Trebuchet MS', 'Malgun Gothic', sans-serif";
      ctx.fillStyle = `rgba(59, 44, 11, ${0.28 + t * 0.58})`;
      ctx.fillText(ef.subText || "", canvas.width / 2, y + 47);
    }
  }

  for (const z of state.zombies) {
    const stepSpeed = z.type === "dasher" ? 16 : z.type === "boss" ? 8.5 : z.type === "hammer" ? 7.8 : z.type === "bomber" ? 9.2 : 11;
    const stepWobble = stepFrameValue(state.time + z.x * 0.01 + z.y * 0.003, stepSpeed);
    const wobble = stepWobble * (z.type === "boss" ? 1.2 : 1);
    const hitFlash = clamp((z.hurtTimer || 0) / 0.12, 0, 1);
    const hammerShake = z.type === "hammer" && z.windup > 0 && z.windup < 0.2
      ? Math.sin(state.time * 95) * 2.6
      : 0;
    ctx.fillStyle = "rgba(56, 88, 54, 0.16)";
    ctx.beginPath();
    ctx.ellipse(z.x, z.y + z.r * 0.8, z.r * 0.88, z.r * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = z.type === "boss"
      ? "rgba(255, 226, 198, 0.32)"
      : "rgba(236, 255, 223, 0.2)";
    ctx.lineWidth = z.type === "boss" ? 2.4 : 1.5;
    ctx.beginPath();
    ctx.arc(z.x, z.y + wobble * 0.4, z.r * (1.05 + (z.type === "boss" ? 0.18 : 0)), 0, Math.PI * 2);
    ctx.stroke();

    if (z.type === "hammer" && z.windup > 0) {
      const t = clamp(1 - z.windup / 0.7, 0, 1);
      ctx.fillStyle = `rgba(255, 170, 120, ${0.16 + t * 0.2})`;
      ctx.beginPath();
      ctx.arc(z.x + hammerShake, z.y, z.slamRadius * (0.25 + t * 0.75), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 245, 190, ${0.42 + t * 0.38})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(z.x + hammerShake, z.y, z.slamRadius * (0.3 + t * 0.7), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (z.type === "dasher" && z.phase === "cooldown") {
      const t = 1 - clamp(z.cooldown / 1.4, 0, 1);
      ctx.fillStyle = `rgba(188, 228, 255, ${0.16 + t * 0.24})`;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * (0.8 + t * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    if (z.type === "dasher" && z.phase === "dashing") {
      const trailX = z.x - z.vx * 0.03;
      const trailY = z.y - z.vy * 0.03;
      ctx.strokeStyle = "rgba(189, 230, 255, 0.5)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(z.x, z.y);
      ctx.lineTo(trailX, trailY);
      ctx.stroke();
    }
    if (z.type === "bomber") {
      const fusePulse = 0.8 + Math.sin(state.time * 12 + z.x * 0.05) * 0.14;
      const bombX = z.x + z.r * 0.5;
      const bombY = z.y - z.r * 0.06;
      ctx.fillStyle = "rgba(28, 28, 30, 0.94)";
      ctx.beginPath();
      ctx.arc(bombX, bombY, z.r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(111, 118, 124, 0.78)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(bombX, bombY, z.r * 0.2 * fusePulse, 0, Math.PI * 2);
      ctx.stroke();
      if (z.throwWindup > 0) {
        const t = 1 - clamp(z.throwWindup / BALANCE.enemies.bomber.windup, 0, 1);
        ctx.strokeStyle = `rgba(255, 176, 120, ${0.4 + t * 0.38})`;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * (1.15 + t * 0.35), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (z.type === "boss") {
      const phase = z.phase || 1;
      const hpRatio = clamp(z.hp / z.maxHp, 0, 1);
      const ringA = 0.16 + (1 - hpRatio) * 0.2;
      ctx.fillStyle = phase === 2
        ? `rgba(211, 160, 255, ${ringA})`
        : phase === 3
          ? `rgba(255, 176, 118, ${ringA})`
          : `rgba(255, 160, 140, ${ringA})`;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * (1.28 + Math.sin(state.time * 4) * 0.05), 0, Math.PI * 2);
      ctx.fill();
      if (z.shockWindup > 0) {
        const t = 1 - clamp(z.shockWindup / BALANCE.enemies.boss.shockwave.windup, 0, 1);
        ctx.strokeStyle = `rgba(255, 241, 198, ${0.4 + t * 0.4})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(z.x, z.y, BALANCE.enemies.boss.shockwave.radius * (0.4 + t * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }
      if ((z.maceWindup || 0) > 0) {
        const t = 1 - clamp((z.maceWindup || 0) / BALANCE.enemies.boss.mace.windup, 0, 1);
        ctx.strokeStyle = `rgba(255, 205, 160, ${0.42 + t * 0.4})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(z.x, z.y, 62 * (0.45 + t * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (phase === 2) {
        const pulse = 0.7 + Math.sin(state.time * 7) * 0.2;
        ctx.strokeStyle = `rgba(221, 190, 255, ${0.34 + pulse * 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * (1.45 + pulse * 0.1), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (phase === 3) {
        const pulse = 0.6 + Math.sin(state.time * 9) * 0.2;
        ctx.strokeStyle = `rgba(255, 218, 166, ${0.32 + pulse * 0.25})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * (1.5 + pulse * 0.12), 0, Math.PI * 2);
        ctx.stroke();
      }
      if ((z.spawnShield || 0) > 0) {
        const t = clamp(z.spawnShield / 1.1, 0, 1);
        ctx.strokeStyle = `rgba(184, 236, 255, ${0.2 + t * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * (1.58 + Math.sin(state.time * 9) * 0.05), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (images.zombie) {
      const bodyPulse = stepPulseValue(state.time + z.x * 0.012, z.type === "boss" ? 8 : 12);
      if (z.type === "hammer" && images.hammerZombie) {
        drawSprite(images.hammerZombie, z.x + hammerShake, z.y + wobble, z.r * 2.85 * bodyPulse, z.r * 2.85 * (1.02 - (bodyPulse - 1) * 0.4));
      } else if (z.type === "dasher" && images.dasherZombie) {
        drawSprite(images.dasherZombie, z.x, z.y + wobble, z.r * 2.75 * (1.02 + (bodyPulse - 1) * 0.5), z.r * 2.75 * (0.98 - (bodyPulse - 1) * 0.4));
      } else if (z.type === "bomber") {
        const by = z.y + wobble;
        ctx.fillStyle = "rgba(41, 51, 46, 0.95)";
        ctx.beginPath();
        ctx.ellipse(z.x, by, z.r * 0.88, z.r * 0.96, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(67, 80, 72, 0.92)";
        ctx.fillRect(z.x - z.r * 0.72, by - z.r * 0.12, z.r * 1.44, z.r * 0.28);
        ctx.strokeStyle = "rgba(239, 216, 120, 0.72)";
        ctx.lineWidth = 1.6;
        for (let s = 0; s < 4; s += 1) {
          const ox = z.x - z.r * 0.56 + s * z.r * 0.37;
          ctx.beginPath();
          ctx.arc(ox, by + z.r * 0.02, z.r * 0.11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(34, 40, 39, 0.96)";
        ctx.beginPath();
        ctx.arc(z.x, by - z.r * 0.66, z.r * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(145, 157, 150, 0.75)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(z.x - z.r * 0.2, by - z.r * 0.66, z.r * 0.13, 0, Math.PI * 2);
        ctx.arc(z.x + z.r * 0.2, by - z.r * 0.66, z.r * 0.13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(122, 136, 129, 0.8)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(z.x - z.r * 0.18, by - z.r * 0.49);
        ctx.lineTo(z.x + z.r * 0.18, by - z.r * 0.49);
        ctx.stroke();
      } else if (
        z.type === "boss" &&
        (images.bossZombieCaster || images.bossZombieCrusher)
      ) {
        const phase = z.phase || 1;
        const baseScale = z.phase === 3 ? 3.28 : z.phase === 2 ? 3.18 : 3.08;
        const bossScale = phase === 2 ? baseScale * 0.92 : baseScale * 1.06;
        const bossImg = phase === 2 ? images.bossZombieCaster : images.bossZombieCrusher;
        if (bossImg) drawSprite(bossImg, z.x, z.y + wobble * 0.6, z.r * bossScale * bodyPulse, z.r * bossScale * (1.02 - (bodyPulse - 1) * 0.35));
        if (phase === 2) {
          const orbR = z.r * 1.34;
          for (let s = 0; s < 4; s += 1) {
            const a = (Math.PI * 2 * s) / 4 + state.time * 0.9;
            const px = z.x + Math.cos(a) * orbR;
            const py = z.y + wobble * 0.6 + Math.sin(a) * (orbR * 0.72);
            ctx.fillStyle = "rgba(211, 150, 255, 0.46)";
            ctx.beginPath();
            ctx.arc(px, py, z.r * 0.24, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(241, 222, 255, 0.55)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py, z.r * 0.17, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.strokeStyle = "rgba(228, 196, 255, 0.7)";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(z.x, z.y - z.r * 0.8);
          ctx.lineTo(z.x, z.y - z.r * 1.22);
          ctx.stroke();
          ctx.fillStyle = "rgba(198, 147, 244, 0.72)";
          ctx.beginPath();
          ctx.arc(z.x, z.y - z.r * 1.3, z.r * 0.16, 0, Math.PI * 2);
          ctx.fill();
        } else if (phase === 3) {
          const maceCfg = BALANCE.enemies.boss.mace;
          const angle = (z.maceActive || 0) > 0
            ? (z.maceAngle || 0)
            : (Math.sin(state.time * 2.8 + z.x * 0.01) * 0.35 + 0.35 * (z.maceDir || 1));
          const chainLen = z.r * (maceCfg.lengthMul || 1.74);
          const ax = z.x + z.r * 0.22;
          const ay = z.y - z.r * 0.24;
          const hx = ax + Math.cos(angle) * chainLen;
          const hy = ay + Math.sin(angle) * chainLen * 0.62;
          ctx.strokeStyle = "rgba(207, 214, 223, 0.82)";
          ctx.lineWidth = 3.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (let s = 0; s <= 6; s += 1) {
            const t = s / 6;
            const px = ax + Math.cos(angle) * chainLen * t;
            const py = ay + Math.sin(angle) * chainLen * 0.62 * t + Math.sin(t * Math.PI) * 4;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.fillStyle = "rgba(128, 132, 140, 0.9)";
          ctx.beginPath();
          ctx.arc(hx, hy, z.r * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(227, 234, 244, 0.68)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(hx, hy, z.r * 0.42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(205, 214, 224, 0.92)";
          for (let s = 0; s < 8; s += 1) {
            const a = (Math.PI * 2 * s) / 8 + angle * 0.2;
            const sx = hx + Math.cos(a) * z.r * 0.38;
            const sy = hy + Math.sin(a) * z.r * 0.38;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(a) * z.r * 0.22, sy + Math.sin(a) * z.r * 0.22);
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = "rgba(198, 208, 218, 0.58)";
          ctx.fillRect(z.x - z.r * 0.72, z.y - z.r * 0.86, z.r * 0.5, z.r * 0.2);
          ctx.fillRect(z.x + z.r * 0.22, z.y - z.r * 0.86, z.r * 0.5, z.r * 0.2);
          ctx.strokeStyle = "rgba(237, 242, 247, 0.62)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(z.x + z.r * 0.8, z.y - z.r * 0.22);
          ctx.lineTo(z.x + z.r * 1.28, z.y - z.r * 0.22);
          ctx.stroke();
          ctx.fillStyle = "rgba(147, 158, 170, 0.66)";
          ctx.fillRect(z.x + z.r * 1.18, z.y - z.r * 0.34, z.r * 0.2, z.r * 0.24);
        }
      } else {
        drawSprite(images.zombie, z.x, z.y + wobble, z.r * 2.5 * bodyPulse, z.r * 2.5 * (1.03 - (bodyPulse - 1) * 0.45));
      }
    } else {
      ctx.fillStyle = "#7a8f6a";
      ctx.beginPath();
      ctx.arc(z.x, z.y + wobble, z.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (z.type === "dummy") {
      ctx.strokeStyle = "rgba(241, 218, 255, 0.78)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y + wobble * 0.5, z.r * 1.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(z.x - z.r * 0.46, z.y + wobble * 0.5);
      ctx.lineTo(z.x + z.r * 0.46, z.y + wobble * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(z.x, z.y + wobble * 0.5 - z.r * 0.46);
      ctx.lineTo(z.x, z.y + wobble * 0.5 + z.r * 0.46);
      ctx.stroke();
    }
    if (state.settings.hitFlash && hitFlash > 0) {
      ctx.fillStyle = `rgba(235, 255, 238, ${0.14 + hitFlash * 0.26})`;
      ctx.beginPath();
      ctx.arc(z.x, z.y + wobble * 0.5, z.r * (1.12 + hitFlash * 0.08), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 230, 165, ${0.22 + hitFlash * 0.34})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y + wobble * 0.5, z.r * (1.02 + hitFlash * 0.06), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const p = state.player;
  const moveBob = stepFrameValue((p.strideT || state.time) + p.x * 0.001, 1.0) * 0.8 * (0.35 + (p.moveMag || 0) * 0.9);
  const bob = Math.sin(state.time * 8) * 1.2 + moveBob;
  const pHurt = clamp((p.hurtTimer || 0) / 0.34, 0, 1);
  const evoCount = getActiveEvolutionCount();
  ctx.fillStyle = "rgba(42, 90, 45, 0.18)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + p.r * 0.95, p.r * 0.95, p.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  const pulse = 0.08 + (Math.sin(state.time * 5) + 1) * 0.04;
  ctx.fillStyle = `rgba(220, 255, 190, ${pulse})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob * 0.5, p.r * 1.45, 0, Math.PI * 2);
  ctx.fill();
  if (evoCount > 0) {
    const evoPulse = 0.5 + Math.sin(state.time * 7.5) * 0.15;
    const evoR = p.r * (1.7 + evoCount * 0.15 + evoPulse * 0.2);
    const evoGrad = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, evoR);
    evoGrad.addColorStop(0, `rgba(214, 255, 182, ${0.16 + evoCount * 0.04})`);
    evoGrad.addColorStop(0.6, `rgba(174, 240, 157, ${0.08 + evoCount * 0.03})`);
    evoGrad.addColorStop(1, "rgba(174, 240, 157, 0)");
    ctx.fillStyle = evoGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob * 0.4, evoR, 0, Math.PI * 2);
    ctx.fill();
  }
  if (pHurt > 0) {
    ctx.fillStyle = `rgba(255, 118, 118, ${0.12 + pHurt * 0.2})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob * 0.5, p.r * (1.5 + pHurt * 0.25), 0, Math.PI * 2);
    ctx.fill();
  }

  if (images.plant) {
    const pPulse = stepPulseValue((p.strideT || state.time) + p.y * 0.001, 9 + (p.moveMag || 0) * 4);
    drawSprite(
      images.plant,
      p.x,
      p.y + bob,
      p.r * 2.72 * (1.02 + (pPulse - 1) * 0.3),
      p.r * 2.95 * (0.99 - (pPulse - 1) * 0.34),
      0,
      p.faceVisual
    );
  } else {
    ctx.fillStyle = "#4a9a3a";
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(243, 255, 230, 0.55)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob * 0.4, p.r * 1.08, 0, Math.PI * 2);
  ctx.stroke();
  if (pHurt > 0) {
    ctx.strokeStyle = `rgba(255, 237, 210, ${0.18 + pHurt * 0.35})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob * 0.5, p.r * (1.18 + pHurt * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }

  const spike = state.player.weapons.spike;
  if (spike?.enabled) {
    const orbCount = Math.max(1, spike.orbCount || 2);
    const orbRadius = Math.max(8, spike.radius * 1.05);
    const evoTurret = spike.evolvedKey === "pea+spike";
    if (evoTurret) {
      const auraR = (spike.orbitRadius || 78) + 14 + Math.sin(state.time * 5.2) * 3;
      ctx.strokeStyle = "rgba(188, 255, 170, 0.38)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob * 0.2, auraR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let s = 0; s < 12; s += 1) {
        const a = (Math.PI * 2 * s) / 12 + state.time * 0.8;
        const r1 = auraR - 8;
        const r2 = auraR + 7 + Math.sin(state.time * 7 + s) * 2;
        ctx.strokeStyle = "rgba(221, 255, 202, 0.28)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(a) * r1, p.y + bob * 0.2 + Math.sin(a) * r1);
        ctx.lineTo(p.x + Math.cos(a) * r2, p.y + bob * 0.2 + Math.sin(a) * r2);
        ctx.stroke();
      }
    }
    for (let i = 0; i < orbCount; i += 1) {
      const orb = spikeOrbPosition(spike, i);
      const halo = evoTurret ? "rgba(201, 255, 163, 0.36)" : "rgba(150, 236, 191, 0.32)";
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orbRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();
      if (evoTurret) {
        ctx.strokeStyle = "rgba(237, 255, 215, 0.58)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orbRadius * (1.02 + Math.sin(state.time * 14 + i) * 0.06), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (images.spike) {
        drawSprite(images.spike, orb.x, orb.y, orbRadius * 2.4, orbRadius * 2.4, state.time * 9 + i * 0.6);
      } else {
        ctx.fillStyle = "#c5ffe3";
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orbRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (shake > 0) ctx.restore();
  drawLightingOverlay();

  drawMiniMap();

  const grad = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.3,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height * 0.72
  );
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(46, 104, 54, 0.13)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (hasActiveBoss()) {
    const bossTone = 0.08 + Math.sin(state.time * 4) * 0.015;
    const bossGrad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.height * 0.25,
      canvas.width / 2,
      canvas.height / 2,
      canvas.height * 0.72
    );
    bossGrad.addColorStop(0, "rgba(255, 115, 126, 0)");
    bossGrad.addColorStop(1, `rgba(121, 28, 35, ${bossTone})`);
    ctx.fillStyle = bossGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (evoCount > 0) {
    const evoTone = Math.min(0.11, 0.03 + evoCount * 0.02);
    const evoTint = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    evoTint.addColorStop(0, `rgba(200, 255, 173, ${evoTone})`);
    evoTint.addColorStop(1, "rgba(173, 255, 214, 0.01)");
    ctx.fillStyle = evoTint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (pHurt > 0) {
    const hurtGrad = ctx.createRadialGradient(p.x, p.y, p.r * 0.8, p.x, p.y, canvas.width * 0.58);
    hurtGrad.addColorStop(0, "rgba(255, 64, 84, 0)");
    hurtGrad.addColorStop(1, `rgba(180, 22, 42, ${0.07 + pHurt * 0.16})`);
    ctx.fillStyle = hurtGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function updateHud() {
  const p = state.player;
  const hp = Math.round(p.hp);
  hpEl.textContent = hp;
  levelEl.textContent = p.level;
  xpEl.textContent = p.xp;
  xpNeedEl.textContent = p.xpNeed;
  timeEl.textContent = formatTime(state.time);
  zombieCountEl.textContent = state.zombies.length;
  hpFillEl.style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
  xpFillEl.style.width = `${clamp((p.xp / p.xpNeed) * 100, 0, 100)}%`;
  modeLabelEl.textContent = state.testMode ? "TEST" : getPreset().name;

  if (topUiEl && bossHudEl) {
    const rect = topUiEl.getBoundingClientRect();
    const nextTop = Math.round(rect.bottom + 8);
    bossHudEl.style.top = `${nextTop}px`;
  }

  const boss = state.zombies.find((z) => z.type === "boss");
  if (state.testMode) {
    bossHudEl.classList.remove("hidden");
    const key = TEST_EVOLUTION_KEYS[state.testEvolutionIndex] || "";
    const keepId = evoKeepWeaponId(key);
    const label = keepId ? (state.player.weapons[keepId]?.label || keepId) : "진화 테스트";
    bossNameEl.textContent = `테스트 모드: ${label}`;
    bossFillEl.style.width = "100%";
  } else if (boss) {
    bossHudEl.classList.remove("hidden");
    const name = getBossPhaseName(boss.phase);
    bossNameEl.textContent = `보스: ${name} (페이즈 ${boss.phase})`;
    bossFillEl.style.width = `${clamp((boss.hp / boss.maxHp) * 100, 0, 100)}%`;
  } else if (state.bossDirector.spawned === 0) {
    const firstBossAt = BALANCE.wave.boss.firstSpawnSec;
    const remainSec = Math.max(0, Math.ceil(firstBossAt - state.time));
    bossHudEl.classList.remove("hidden");
    bossNameEl.textContent = `첫 보스까지 ${formatTime(remainSec)}`;
    bossFillEl.style.width = `${clamp((state.time / firstBossAt) * 100, 0, 100)}%`;
  } else {
    bossHudEl.classList.add("hidden");
  }

  const enabledWeaponEntries = Object.entries(p.weapons).filter(([, w]) => w.enabled);
  const key = enabledWeaponEntries
    .map(([id, w]) => `${id}:${getWeaponLevel(id)}:${w.label}`)
    .sort()
    .join("|");
  if (key !== state.lastWeaponPillsKey) {
    state.lastWeaponPillsKey = key;
    weaponPillsEl.innerHTML = "";
    for (const [id, w] of enabledWeaponEntries) {
      const el = document.createElement("span");
      el.className = `weapon-pill ${id}`;
      el.textContent = `${w.label} Lv${getWeaponLevel(id)}`;
      weaponPillsEl.appendChild(el);
    }
    if (enabledWeaponEntries.length === 0) {
      const el = document.createElement("span");
      el.className = "weapon-pill";
      el.textContent = "없음";
      weaponPillsEl.appendChild(el);
    }
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function tick(ts) {
  if (!state.lastTs) state.lastTs = ts;
  const dt = Math.min(0.033, (ts - state.lastTs) / 1000);
  state.lastTs = ts;

  update(dt);
  draw();
  updateHud();

  requestAnimationFrame(tick);
}

function togglePauseOverlay() {
  if (state.gameOver) return;
  state.paused = !state.paused;
  if (state.paused) {
    showOverlay("일시 정지", "계속하려면 ESC 또는 일시정지 버튼을 누르세요.", []);
  } else {
    hideOverlay();
  }
}

function resetTouchStick() {
  state.touchMove.active = false;
  state.touchMove.ax = 0;
  state.touchMove.ay = 0;
  state.touchMove.pointerId = null;
  if (moveStickKnobEl) moveStickKnobEl.style.transform = "translate(-50%, -50%)";
}

function updateTouchStickFromPoint(clientX, clientY) {
  if (!moveStickEl || !moveStickKnobEl) return;
  const rect = moveStickEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const maxR = rect.width * 0.36;
  const len = Math.hypot(dx, dy) || 1;
  const clamped = len > maxR ? maxR : len;
  const nx = (dx / len) * clamped;
  const ny = (dy / len) * clamped;
  state.touchMove.active = true;
  state.touchMove.ax = nx / maxR;
  state.touchMove.ay = ny / maxR;
  moveStickKnobEl.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
}

window.addEventListener("keydown", (e) => {
  resumeAudio();
  if (e.code === "F6") {
    state.audio.enabled = !state.audio.enabled;
    if (state.audio.masterGain) {
      state.audio.masterGain.gain.value = state.audio.enabled ? state.audio.master : 0.0001;
    }
    if (state.audio.enabled) resumeAudio();
    pushSystemBanner(`오디오 ${state.audio.enabled ? "ON" : "OFF"}`);
    return;
  }
  if (e.code === "F7") {
    state.settings.damageText = !state.settings.damageText;
    pushSystemBanner(`데미지 숫자 ${state.settings.damageText ? "ON" : "OFF"}`);
    return;
  }
  if (e.code === "F8") {
    state.settings.screenShake = !state.settings.screenShake;
    if (!state.settings.screenShake) state.screenShake = 0;
    pushSystemBanner(`화면 흔들림 ${state.settings.screenShake ? "ON" : "OFF"}`);
    return;
  }
  if (e.code === "F9") {
    state.settings.hitFlash = !state.settings.hitFlash;
    pushSystemBanner(`피격 플래시 ${state.settings.hitFlash ? "ON" : "OFF"}`);
    return;
  }
  if (e.code === "F10") {
    if (state.testMode) {
      state.lastTs = 0;
      resetGame();
      pushSystemBanner("테스트 모드 OFF");
    } else {
      enterEvolutionTestMode(state.testEvolutionIndex || 0);
    }
    return;
  }
  if (e.code === "F11") {
    if (state.testMode) cycleEvolutionTestMode(1);
    return;
  }
  if (e.code === "F12") {
    if (state.testMode) {
      clearCombatField();
      spawnTrainingDummies(20);
      pushSystemBanner("테스트 더미 리스폰");
    }
    return;
  }
  if (e.code === "F1") {
    setDifficulty("easy");
    return;
  }
  if (e.code === "F2") {
    setDifficulty("normal");
    return;
  }
  if (e.code === "F3") {
    setDifficulty("hard");
    return;
  }
  if (state.paused && state.overlayOptions.length > 0) {
    if (e.code === "Digit1" || e.code === "Numpad1") chooseUpgrade(state.overlayOptions[0]);
    if (e.code === "Digit2" || e.code === "Numpad2") chooseUpgrade(state.overlayOptions[1]);
    if (e.code === "Digit3" || e.code === "Numpad3") chooseUpgrade(state.overlayOptions[2]);
  }
  keys.add(e.code);
  if (e.code === "Escape" && !state.gameOver) {
    togglePauseOverlay();
  }
});

window.addEventListener("pointerdown", () => {
  resumeAudio();
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

if (moveStickEl) {
  moveStickEl.addEventListener("pointerdown", (e) => {
    resumeAudio();
    moveStickEl.setPointerCapture?.(e.pointerId);
    state.touchMove.pointerId = e.pointerId;
    updateTouchStickFromPoint(e.clientX, e.clientY);
  });
  moveStickEl.addEventListener("pointermove", (e) => {
    if (state.touchMove.pointerId !== e.pointerId) return;
    updateTouchStickFromPoint(e.clientX, e.clientY);
  });
  const endStick = (e) => {
    if (state.touchMove.pointerId !== e.pointerId) return;
    resetTouchStick();
  };
  moveStickEl.addEventListener("pointerup", endStick);
  moveStickEl.addEventListener("pointercancel", endStick);
  moveStickEl.addEventListener("lostpointercapture", () => {
    resetTouchStick();
  });
}

if (mobilePauseBtnEl) {
  mobilePauseBtnEl.addEventListener("click", () => {
    resumeAudio();
    togglePauseOverlay();
  });
}

restartBtn.addEventListener("click", () => {
  state.lastTs = 0;
  resetGame();
});

window.addEventListener("resize", () => {
  syncCanvasForViewport();
});

window.addEventListener("orientationchange", () => {
  syncCanvasForViewport();
});

async function start() {
  syncCanvasForViewport();
  try {
    await loadAssets();
  } catch (err) {
    console.error("Asset load failed", err);
  }
  validateEvolutionConfig();
  resetGame();
  requestAnimationFrame(tick);
}

start();
