// ---------- world state: player, slop, gems, damage, level-ups ----------
let pl = null, foes = [], gems = [], items = [], shots = [], ebul = [], fx = [], nums = [];
let runT = 0, spawnAcc = 0, evI = 0, bossI = 0, boss = null, bossBanner = null, banner = null, shake = 0, hitstop = 0;
const cam = { x: 0, y: 0 };
let offer = null; // level-up choices on screen
let pendingLv = 0;

function newRun(ci) {
  const c = CHARS[ci];
  pl = { x: 0, y: 0, ci, hp: c.hp, maxHp: c.hp, face: 1, dx: 1, dy: 0, inv: 0, dashT: 0, dashCd: 0, vx: 0, vy: 0, anim: 0, moving: false,
    lv: 1, xp: 0, need: xpNeed(1), weapons: [], pas: {}, rerolls: 3, kills: 0, gems: 0, score: 0, regenAcc: 0, hurtFlash: 0 };
  foes = []; gems = []; items = []; shots = []; ebul = []; fx = []; nums = [];
  runT = 0; spawnAcc = 0; evI = 0; bossI = 0; boss = null; bossBanner = null; banner = null; shake = 0; hitstop = 0; offer = null; pendingLv = 0;
  cam.x = 0; cam.y = 0; addWeapon(c.start);
}
// derived stats
const pasLv = (id) => pl.pas[id] || 0;
const areaMul = () => 1 + pasLv('loupe') * 0.1 + CHARS[pl.ci].area;
const cdMul = () => (1 - pasLv('coffee') * 0.08) * (1 - CHARS[pl.ci].cd);
const amtAdd = () => pasLv('copier');
const magnetR = () => 34 * (1 + pasLv('clip') * 0.3);
const speed = () => 56 * CHARS[pl.ci].spd * (1 + pasLv('shoes') * 0.08);

function addWeapon(id) { pl.weapons.push({ id, lv: 1, evo: false, t: 0.4, ang: 0, ph: 0 }); }
const weaponOf = (id) => pl.weapons.find((w) => w.id === id);

// ---------- spatial grid for hit queries ----------
const CELL = 24; let grid = new Map();
function buildGrid() {
  grid = new Map();
  for (const e of foes) { const k = ((e.x / CELL) | 0) * 73856093 ^ ((e.y / CELL) | 0) * 19349663; let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(e); }
}
function near(x, y, r, cb) {
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) { const a = grid.get(gx * 73856093 ^ gy * 19349663); if (a) for (const e of a) if (!e.dead && cb(e) === false) return; }
}
function nearest(x, y, maxR) {
  let best = null, bd = maxR * maxR;
  for (const e of foes) { if (e.dead || e.spawnIn > 0) continue; const d = dist2(x, y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}
const onScreen = (e, m = 0) => Math.abs(e.x - cam.x) < LW / 2 + m && Math.abs(e.y - cam.y) < LH / 2 + m;

// ---------- spawning ----------
function spawnFoe(type, x, y, o = {}) {
  const d = FOES[type], k = hpScale(runT) * (o.elite ? 12 : 1) * (o.mini ? 0.35 : 1);
  const e = { type, x, y, hp: d.hp * k, maxHp: d.hp * k, spd: d.spd * (o.elite ? 0.9 : 1) * (o.mini ? 1.25 : 1), dmg: d.dmg * (o.elite ? 1.5 : 1), r: d.r * (o.elite ? 1.7 : o.mini ? 0.7 : 1),
    xp: d.xp * (o.elite ? 0 : 1), elite: !!o.elite, mini: !!o.mini, scale: o.elite ? 1.7 : o.mini ? 0.7 : 1, flash: 0, kx: 0, ky: 0, stun: 0, anim: rand() * 2, t: rand() * 2, spawnIn: 0.25,
    lastScis: -9, dashing: 0, vx: 0, vy: 0 };
  foes.push(e); return e;
}
function ringPos(extra = 0) { const a = rand() * Math.PI * 2, r = Math.hypot(LW, LH) / 2 + 16 + extra; return [pl.x + Math.cos(a) * r, pl.y + Math.sin(a) * r]; }
function weighted(mix) { let s = 0; for (const [, w] of mix) s += w; let r = rand() * s; for (const [t, w] of mix) { if ((r -= w) <= 0) return t; } return mix[0][0]; }
function spawning(dt) {
  const live = foes.length;
  spawnAcc += spawnRate(runT) * dt * (boss && boss.kind !== 'snake' ? 0.5 : 1); // fewer stragglers while a boss is out
  while (spawnAcc >= 1) { spawnAcc--; if (live < aliveCap(runT)) { const [x, y] = ringPos(); spawnFoe(weighted(foeMix(runT)), x, y); } }
  while (evI < EVENTS.length && runT >= EVENTS[evI].at) runEvent(EVENTS[evI++]);
  const nb = BOSSES[bossI];
  if (nb && !boss && runT >= nb.at - 3 && !bossBanner) { bossBanner = { i: bossI, t: 0 }; sfx('warn'); }
  if (nb && !boss && runT >= nb.at) { spawnBoss(bossI); bossI++; }
}
function runEvent(ev) {
  if (ev.k === 'elite') { const [x, y] = ringPos(); spawnFoe(ev.foe, x, y, { elite: true }); }
  if (ev.k === 'ring') { banner = { text: T.swarm, t: 0 }; sfx('warn'); for (let i = 0; i < ev.n; i++) { const a = i / ev.n * Math.PI * 2, r = Math.hypot(LW, LH) / 2 + 10; spawnFoe(ev.foe, pl.x + Math.cos(a) * r, pl.y + Math.sin(a) * r); } }
  if (ev.k === 'wall') {
    banner = { text: T.swarm, t: 0 }; sfx('warn'); const side = rand() < 0.5 ? -1 : 1;
    for (let i = 0; i < ev.n; i++) spawnFoe(ev.foe, pl.x + side * (LW / 2 + 20 + (i % 4) * 10), pl.y + (i / ev.n - 0.5) * LH * 1.3);
  }
}
// slop that wanders too far off screen is moved back in front of the player
function recycle(e) {
  if (e.boss || e.seg) return;
  if (Math.abs(e.x - pl.x) > LW * 0.9 + 60 || Math.abs(e.y - pl.y) > LH * 0.9 + 60) {
    const a = Math.atan2(pl.dy || 0.01, pl.dx || 0.01) + rnd(-0.9, 0.9), r = Math.hypot(LW, LH) / 2 + 12;
    e.x = pl.x + Math.cos(a) * r; e.y = pl.y + Math.sin(a) * r;
  }
}

// ---------- damage ----------
function hurt(e, dmg, kx = 0, ky = 0, kb = 1) {
  if (e.dead) return;
  const tgt = e.seg ? e.parent : e; if (tgt.dead) return;
  dmg = Math.round(dmg * rnd(0.9, 1.1) * (e.seg ? 0.2 : 1)); tgt.hp -= dmg; // tail segments share the head's health: a wide hit across the tail shouldn't count 16 times e.flash = 0.1; if (e.seg) tgt.flash = 0.1;
  if (!tgt.boss && !tgt.heavy) { const k = kb * (FOES[tgt.type]?.heavy ? 0.4 : 1) * (tgt.elite ? 0.3 : 1); e.kx += kx * 70 * k; e.ky += ky * 70 * k; }
  if (nums.length < 120 && !e.seg) nums.push({ x: e.x + rnd(-3, 3), y: e.y - e.r - 2, v: dmg, t: 0, big: dmg >= 60 });
  sfx('hit');
  if (tgt.hp <= 0) kill(tgt);
}
function kill(e) {
  if (e.dead) return; e.dead = true; pl.kills++; pl.score += Math.round(e.maxHp);
  burst(e.x, e.y, e.boss ? 40 : e.elite ? 18 : 6, e.boss ? '#f6d55c' : '#e9e4ff');
  sfx(e.boss ? 'boom' : 'kill');
  if (e.boss) { bossDown(e); return; }
  if (e.elite) { items.push({ k: 'chest', x: e.x, y: e.y, t: 0 }); items.push({ k: 'kimbap', x: e.x + 10, y: e.y, t: 0 }); shake = Math.max(shake, 4); return; }
  if (FOES[e.type].splits && !e.mini) for (let i = 0; i < 2; i++) spawnFoe('jelly', e.x + rnd(-5, 5), e.y + rnd(-5, 5), { mini: true }).spawnIn = 0;
  dropGem(e.x, e.y, e.xp);
  const r = rand(); if (r < 0.014) items.push({ k: 'kimbap', x: e.x, y: e.y, t: 0 }); else if (r < 0.017) items.push({ k: 'clip', x: e.x, y: e.y, t: 0 });
}
function dropGem(x, y, v) {
  if (v <= 0) return;
  if (gems.length > 360) { // too many on the floor: fold the farthest into one big gem
    let far = 0, fd = -1; for (let i = 0; i < gems.length; i++) { const d = dist2(gems[i].x, gems[i].y, pl.x, pl.y); if (d > fd) { fd = d; far = i; } }
    gems[far].v += v; gems[far].tier = 3; return;
  }
  gems.push({ x, y, v, tier: v >= 25 ? 3 : v >= 10 ? 2 : v >= 3 ? 1 : 0, mag: false, vx: 0, vy: 0 });
}
function burst(x, y, n, col) { for (let i = 0; i < n && fx.length < 500; i++) { const a = rand() * 7, s = rnd(20, 70); fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, max: rnd(0.25, 0.5), col }); } }

function hurtPlayer(d, from) {
  if (pl.inv > 0 || pl.dashT > 0 || state !== 'play') return;
  pl.hp -= d; pl.inv = 0.55; pl.hurtFlash = 0.25; shake = Math.max(shake, 3); sfx('hurt');
  if (from) { const a = Math.atan2(pl.y - from.y, pl.x - from.x); pl.vx += Math.cos(a) * 60; pl.vy += Math.sin(a) * 60; }
  if (pl.hp <= 0) { pl.hp = 0; endRun(false); }
}
function gainXp(v) {
  pl.xp += v; pl.gems += v; pl.score += v * 5;
  while (pl.xp >= pl.need) { pl.xp -= pl.need; pl.lv++; pl.need = xpNeed(pl.lv); pendingLv++; }
}

// ---------- level-up choices ----------
function upgradePool() {
  const pool = [];
  for (const w of pl.weapons) if (!w.evo && w.lv < MAX_LV) pool.push({ k: 'w', id: w.id, lv: w.lv + 1, wt: 3 });
  if (pl.weapons.length < MAX_W) for (const id of W_ORDER) if (!weaponOf(id)) pool.push({ k: 'w', id, lv: 1, wt: 2 });
  const owned = Object.keys(pl.pas);
  for (const id of P_ORDER) { const lv = pasLv(id); if (lv && lv < PASSIVES[id]) pool.push({ k: 'p', id, lv: lv + 1, wt: 2.5 }); else if (!lv && owned.length < 6) pool.push({ k: 'p', id, lv: 1, wt: 1.5 }); }
  return pool;
}
function rollOffer() {
  const pool = upgradePool(), out = [];
  while (out.length < 3 && pool.length) {
    let s = 0; for (const o of pool) s += o.wt; let r = rand() * s, i = 0;
    for (; i < pool.length - 1; i++) if ((r -= pool[i].wt) <= 0) break;
    out.push(pool.splice(i, 1)[0]);
  }
  if (!out.length) out.push({ k: 'heal' }, { k: 'gold' });
  return out;
}
function applyChoice(o) {
  if (o.k === 'w') { const w = weaponOf(o.id); if (w) w.lv = o.lv; else addWeapon(o.id); }
  else if (o.k === 'p') { pl.pas[o.id] = o.lv; if (o.id === 'vita') { pl.maxHp += 20; pl.hp = Math.min(pl.maxHp, pl.hp + 20); } }
  else if (o.k === 'heal') { pl.hp = Math.min(pl.maxHp, pl.hp + 30); sfx('heal'); }
  else if (o.k === 'gold') pl.score += 100;
}
// chests: evolve a maxed weapon whose partner passive is owned; otherwise free upgrades
function canEvolve() { return pl.weapons.find((w) => !w.evo && w.lv >= MAX_LV && pasLv(WEAPONS[w.id].evoWith) > 0); }
function openChest(big) {
  sfx('chest'); const got = [];
  const ev = canEvolve();
  if (ev) { ev.evo = true; got.push({ k: 'evo', id: ev.id }); }
  else { for (let i = 0; i < (big ? 3 : 1); i++) { const p = upgradePool(); if (!p.length) { got.push({ k: 'gold' }); applyChoice({ k: 'gold' }); continue; } const o = pick(p); applyChoice(o); got.push(o); } }
  chestShow = { got, t: 0 }; state = 'chest';
}
let chestShow = null;
