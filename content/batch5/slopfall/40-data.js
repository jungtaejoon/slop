// ---------- game data ----------
// weapons: stats by level (1..6), evolution partner passive. `amt` grows with the Copier.
const WEAPONS = {
  brush: { evoWith: 'loupe', st: (lv) => ({ dmg: 15 + lv * 4, cd: 1.05 - lv * 0.04, r: 38 + lv * 2.5, back: true, amt: 1 + (lv >= 4) }) },
  hl: { evoWith: 'coffee', st: (lv) => ({ dmg: 13 + lv * 3, cd: 1.25 - lv * 0.05, len: 120 + lv * 12, amt: 1 + (lv >= 2) + (lv >= 5) }) },
  stamp: { evoWith: 'vita', st: (lv) => ({ dmg: 24 + lv * 7, cd: 1.9 - lv * 0.08, r: 23 + lv * 2.5, amt: 2 + (lv >= 3) + (lv >= 5) }) },
  scis: { evoWith: 'shoes', st: (lv) => ({ dmg: 7 + lv * 3, amt: 1 + Math.ceil(lv / 2), r: 28 + lv * 2, spin: 2.8 + lv * 0.25 }) },
  plane: { evoWith: 'copier', st: (lv) => ({ dmg: 10 + lv * 3, cd: 1.35 - lv * 0.06, amt: 1 + (lv >= 2) + (lv >= 4) + (lv >= 6), pierce: 1 + (lv >= 5) }) },
  eraser: { evoWith: 'clip', st: (lv) => ({ dmg: 14 + lv * 4, cd: 2.1 - lv * 0.08, chain: 2 + lv, amt: 1 + (lv >= 4) }) },
};
const W_ORDER = ['brush', 'hl', 'stamp', 'scis', 'plane', 'eraser'];
const PASSIVES = { coffee: 5, loupe: 5, shoes: 5, clip: 5, vita: 5, copier: 2 }; // max level
const P_ORDER = ['coffee', 'loupe', 'shoes', 'clip', 'vita', 'copier'];
const MAX_W = 6, MAX_LV = 6;
// three ways to play. Mina: fragile and fast, hits harder the more she bleeds, and every level sharpens her.
// Doyun: a chain of kills without being hit speeds every weapon up; crits grow with level; one hit breaks the chain.
// Granny Ok: slow and hard to kill; armour, regeneration, thorns, and the more health she has the harder she hits.
// `pool`: the six skills this curator can ever learn. No two curators share a pool.
const CHARS = [
  { start: 'brush', hp: 90, spd: 1.12, area: 0.1, cd: 0, dash: 0.7, armor: 0, rage: 1.3, bloodHeal: 15, perLv: { dmg: 0.035 }, pool: ['brush', 'scis', 'knife', 'ink', 'aura', 'tape'] },
  { start: 'hl', hp: 100, spd: 1, area: 0, cd: 0.1, dash: 1.1, armor: 0, combo: 1, crit: 0.12, perLv: { crit: 0.016 }, pool: ['hl', 'plane', 'strike', 'stapler', 'mine', 'postit'] },
  { start: 'stamp', hp: 160, spd: 0.84, area: 0.1, cd: 0, dash: 1.5, armor: 0.25, regen: 0.4, thorns: 0.25, hpPower: 1, perLv: { hp: 8 }, pool: ['stamp', 'eraser', 'sun', 'abacus', 'tea', 'bell'] },
];
const critChance = () => { const c = CHARS[pl.ci]; return c.crit ? Math.min(0.6, c.crit + c.perLv.crit * (pl.lv - 1)) : 0; };
const comboCd = () => (CHARS[pl.ci].combo ? Math.min(0.35, pl.combo * 0.004) : 0);
// skill trees: two branches per weapon, three tiers each. A tier unlocks once that weapon has erased enough slop,
// and the more it has erased, the more often its next tiers come up when you level up.
const TREES = {
  brush: [[{ area: 0.2 }, { amt: 1 }, { wave: 1 }], [{ dmg: 0.25 }, { leech: 1 }, { exec: 0.15 }]],
  hl: [[{ amt: 1 }, { width: 0.6 }, { cross: 1 }], [{ dmg: 0.25 }, { cd: 0.15 }, { burn: 1 }]],
  stamp: [[{ area: 0.2 }, { stun: 0.7 }, { echo: 1 }], [{ amt: 1 }, { cd: 0.15 }, { seal: 1 }]],
  scis: [[{ amt: 1 }, { spin: 0.4 }, { area: 0.35 }], [{ dmg: 0.3 }, { rate: 1 }, { bleed: 1 }]],
  plane: [[{ amt: 1 }, { pierce: 1 }, { bomb: 1 }], [{ speed: 0.3 }, { dmg: 0.3 }, { long: 1 }]],
  eraser: [[{ chain: 2 }, { speed: 0.3 }, { dust: 1 }], [{ dmg: 0.3 }, { knock: 1 }, { clean: 1 }]],
};
const TREE_NEED = [0, 50, 180]; // kills with that weapon to open tier 1 / 2 / 3 (tier 1 also needs weapon level 2)
// only one branch per weapon can reach tier 3: each weapon ends up leaning one way
function treeMods(w) { const m = {}; TREES[w.id].forEach((br, b) => { for (let t = 0; t < w.tr[b]; t++) for (const k in br[t]) m[k] = (m[k] || 0) + br[t][k]; }); return m; }
// enemies: hp, speed (px/s), contact damage, radius, xp, behaviour
const FOES = {
  hand: { hp: 10, spd: 30, dmg: 5, r: 6, xp: 1 },
  glyph: { hp: 6, spd: 47, dmg: 4, r: 5, xp: 1 },
  clock: { hp: 42, spd: 17, dmg: 10, r: 7, xp: 3, heavy: 1 },
  worm: { hp: 18, spd: 27, dmg: 8, r: 6, xp: 2, dasher: 1 },
  eye: { hp: 14, spd: 24, dmg: 5, r: 6, xp: 2, shooter: 1 },
  jelly: { hp: 22, spd: 26, dmg: 6, r: 6, xp: 2, splits: 1 },
  echo: { hp: 20, spd: 34, dmg: 6, r: 6, xp: 2, splits: 1 },
  // area gimmicks: they stand still and break when hit
  crate: { hp: 16, spd: 0, dmg: 0, r: 6, xp: 0, prop: 1 },
  barrel: { hp: 8, spd: 0, dmg: 0, r: 6, xp: 0, prop: 1, boom: 1 },
};
// regions: look (floor, wall top, wall face, accent, darkness), slop mix, hazard tiles, music
const BIOMES = {
  out: { floor: ['#1d1a26', '#211d2b', '#1a1722'], top: '#3b3550', face: '#2a253a', trim: '#f0a03c', accent: '#f0a03c', dark: 0.5, hazard: null, music: 0,
    mix: [['hand', 5], ['glyph', 2], ['jelly', 1]] },
  gal: { floor: ['#2a2420', '#2f2924', '#26201c'], top: '#5a4a3c', face: '#3e3229', trim: '#e9c46a', accent: '#e76f51', dark: 0.42, hazard: 'paint', music: 1,
    mix: [['hand', 3], ['clock', 2], ['jelly', 2], ['glyph', 1]] },
  arc: { floor: ['#140f24', '#170f2b', '#120c20'], top: '#3a1f63', face: '#25133f', trim: '#ff4fd8', accent: '#22d3ee', dark: 0.6, hazard: null, music: 1,
    mix: [['eye', 3], ['worm', 3], ['glyph', 2], ['hand', 1]] },
  news: { floor: ['#221c17', '#251f19', '#1f1914'], top: '#4b3f33', face: '#332a22', trim: '#d6c7a8', accent: '#f4f0e8', dark: 0.48, hazard: null, music: 1,
    mix: [['glyph', 5], ['jelly', 2], ['hand', 2], ['eye', 1]] },
  mir: { floor: ['#122329', '#152830', '#101f25'], top: '#3a7280', face: '#224752', trim: '#7fe3d6', accent: '#7fe3d6', dark: 0.42, hazard: null, music: 2,
    mix: [['echo', 4], ['glyph', 2], ['eye', 2], ['worm', 1]] },
  tow: { floor: ['#16191f', '#1a1e25', '#14161b'], top: '#434b58', face: '#2a3039', trim: '#2dd4bf', accent: '#fb7185', dark: 0.5, hazard: 'glitch', music: 2,
    mix: [['hand', 2], ['glyph', 2], ['clock', 2], ['eye', 2], ['worm', 2], ['jelly', 1], ['echo', 1]] },
};
// four acts (기·승·전·결): lanes are the parallel roads on the map; act II's lanes are its three districts
const ACTS = [
  { biomes: ['out', 'out', 'out'], cols: 4, boss: 0 },
  { biomes: ['gal', 'arc', 'news'], cols: 5, boss: 1 },
  { biomes: ['mir', 'mir', 'mir'], cols: 4, boss: 2 },
  { biomes: ['tow', 'tow'], cols: 3, boss: 3 },
];
const BOSSES = [
  { hp: 1500, r: 17, spd: 21, dmg: 14, kind: 'face' },
  { hp: 3600, r: 17, spd: 25, dmg: 16, kind: 'box' },
  { hp: 8000, r: 7, spd: 58, dmg: 12, kind: 'mirror' },
  { hp: 32000, r: 12, spd: 34, dmg: 18, kind: 'snake' },
];
// difficulty by depth (how many areas you have crossed)
const hpScale = (d) => 1 + d * 0.22 + d * d * 0.011;
const spawnRate = (d) => 0.85 + d * 0.16;
const aliveCap = (d) => Math.min(240, 70 + d * 9);
const gateNeed = (d) => 48 + d * 10;
const xpNeed = (lv) => Math.floor(5 + lv * 3.4 + lv * lv * 0.45);
