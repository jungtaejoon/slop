// ---------- game data ----------
const RUN_LEN = 600; // ten minutes, then the last boss
// weapons: stats by level (1..6), evolution partner passive. `amt` grows with the Copier.
const WEAPONS = {
  brush: { evoWith: 'loupe', st: (lv) => ({ dmg: 15 + lv * 4, cd: 1.05 - lv * 0.04, r: 38 + lv * 2.5, back: true, amt: 1 + (lv >= 4) }) },
  hl: { evoWith: 'coffee', st: (lv) => ({ dmg: 9 + lv * 3, cd: 1.4 - lv * 0.06, len: 110 + lv * 12, amt: 1 + (lv >= 3) + (lv >= 6) }) },
  stamp: { evoWith: 'vita', st: (lv) => ({ dmg: 24 + lv * 7, cd: 1.9 - lv * 0.08, r: 23 + lv * 2.5, amt: 2 + (lv >= 3) + (lv >= 5) }) },
  scis: { evoWith: 'shoes', st: (lv) => ({ dmg: 7 + lv * 3, amt: 1 + Math.ceil(lv / 2), r: 28 + lv * 2, spin: 2.8 + lv * 0.25 }) },
  plane: { evoWith: 'copier', st: (lv) => ({ dmg: 10 + lv * 3, cd: 1.35 - lv * 0.06, amt: 1 + (lv >= 2) + (lv >= 4) + (lv >= 6), pierce: 1 + (lv >= 5) }) },
  eraser: { evoWith: 'clip', st: (lv) => ({ dmg: 14 + lv * 4, cd: 2.1 - lv * 0.08, chain: 2 + lv, amt: 1 + (lv >= 4) }) },
};
const W_ORDER = ['brush', 'hl', 'stamp', 'scis', 'plane', 'eraser'];
const PASSIVES = { coffee: 5, loupe: 5, shoes: 5, clip: 5, vita: 5, copier: 2 }; // max level
const P_ORDER = ['coffee', 'loupe', 'shoes', 'clip', 'vita', 'copier'];
const MAX_W = 6, MAX_LV = 6;
const CHARS = [
  { start: 'brush', area: 0.15, cd: 0, hp: 100, spd: 1 },
  { start: 'hl', area: 0, cd: 0.1, hp: 100, spd: 1 },
  { start: 'stamp', area: 0, cd: 0, hp: 130, spd: 0.92 },
];
// enemies: hp, speed (px/s), contact damage, radius, xp, behaviour
const FOES = {
  hand: { hp: 10, spd: 30, dmg: 5, r: 6, xp: 1 },
  glyph: { hp: 6, spd: 47, dmg: 4, r: 5, xp: 1 },
  clock: { hp: 42, spd: 17, dmg: 10, r: 7, xp: 3, heavy: 1 },
  worm: { hp: 18, spd: 27, dmg: 8, r: 6, xp: 2, dasher: 1 },
  eye: { hp: 14, spd: 24, dmg: 5, r: 6, xp: 2, shooter: 1 },
  jelly: { hp: 22, spd: 26, dmg: 6, r: 6, xp: 2, splits: 1 },
};
const BOSSES = [
  { at: 180, hp: 1100, r: 17, spd: 21, dmg: 14, kind: 'face' },
  { at: 360, hp: 2800, r: 17, spd: 25, dmg: 16, kind: 'box' },
  { at: RUN_LEN, hp: 18000, r: 12, spd: 34, dmg: 18, kind: 'snake' },
];
// which slop shows up when (weights), by elapsed seconds
function foeMix(t) {
  if (t < 60) return [['hand', 1]];
  if (t < 120) return [['hand', 3], ['glyph', 2]];
  if (t < 180) return [['hand', 3], ['glyph', 2], ['jelly', 1]];
  if (t < 300) return [['hand', 2], ['glyph', 2], ['jelly', 2], ['clock', 1], ['eye', 1]];
  if (t < 420) return [['hand', 2], ['glyph', 2], ['clock', 2], ['eye', 2], ['worm', 2]];
  return [['hand', 2], ['glyph', 3], ['clock', 2], ['eye', 2], ['worm', 3], ['jelly', 2]];
}
// scripted moments besides bosses
const EVENTS = [
  { at: 50, k: 'elite', foe: 'hand' }, { at: 120, k: 'ring', foe: 'glyph', n: 36 }, { at: 150, k: 'elite', foe: 'jelly' },
  { at: 240, k: 'elite', foe: 'clock' }, { at: 300, k: 'wall', foe: 'hand', n: 48 }, { at: 330, k: 'elite', foe: 'eye' },
  { at: 420, k: 'ring', foe: 'worm', n: 30 }, { at: 450, k: 'elite', foe: 'worm' }, { at: 480, k: 'wall', foe: 'glyph', n: 64 },
  { at: 510, k: 'elite', foe: 'clock' }, { at: 540, k: 'ring', foe: 'jelly', n: 40 }, { at: 560, k: 'elite', foe: 'jelly' }, { at: 575, k: 'elite', foe: 'eye' },
];
const spawnRate = (t) => (t >= RUN_LEN ? 3 : 0.8 + t / 60 * 1.1); // per second
const aliveCap = (t) => Math.min(380, 50 + t * 0.55);
const hpScale = (t) => 1 + t / 60 * 0.3 + (t / 60) ** 2 * 0.04;
const xpNeed = (lv) => Math.floor(5 + lv * 3.4 + lv * lv * 0.45);
