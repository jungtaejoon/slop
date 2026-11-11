// ---------- world: the curator, the current area (walls, gate, vents), slop, gems, damage ----------
const TS = 16;
let pl = null, foes = [], gems = [], items = [], shots = [], ebul = [], fx = [], nums = [];
let st = null; // the current area
let runT = 0, spawnAcc = 0, boss = null, bossBanner = null, banner = null, shake = 0, hitstop = 0, winT = 0;
const cam = { x: 0, y: 0 };
let offer = null, pendingLv = 0;

function newRun(ci) {
  const c = CHARS[ci];
  pl = { x: 0, y: 0, ci, hp: c.hp, maxHp: c.hp, face: 1, dx: 1, dy: 0, inv: 0, dashT: 0, dashCd: 0, vx: 0, vy: 0, anim: 0, moving: false,
    lv: 1, xp: 0, need: xpNeed(1), weapons: [], pas: {}, rerolls: 3, kills: 0, gems: 0, score: 0, regenAcc: 0, hurtFlash: 0, combo: 0, bestCombo: 0, wk: {}, buff: null };
  addWeapon(c.start);
}
// derived stats
const pasLv = (id) => pl.pas[id] || 0;
const areaMul = () => 1 + pasLv('loupe') * 0.1 + CHARS[pl.ci].area;
const cdMul = () => (1 - pasLv('coffee') * 0.08) * (1 - CHARS[pl.ci].cd) * (1 - comboCd()) * (pl.buff?.k === 'haste' ? 0.8 : 1);
const amtAdd = () => pasLv('copier');
const magnetR = () => 34 * (1 + pasLv('clip') * 0.3) * (pl.buff?.k === 'magnet' ? 3 : 1);
const speed = () => 56 * CHARS[pl.ci].spd * (1 + pasLv('shoes') * 0.08) * (pl.buff?.k === 'haste' ? 1.3 : 1) * (st && tileAt(pl.x, pl.y) === 2 && st.B.hazard === 'paint' ? 0.6 : 1);
// each curator's own power curve: Mina's rage, Doyun's (none: his edge is speed and crits), Granny Ok's health
function charPower() {
  const c = CHARS[pl.ci]; let k = 1 + (c.perLv.dmg || 0) * (pl.lv - 1);
  if (c.rage) k *= 1 + c.rage * (1 - pl.hp / pl.maxHp);
  if (c.hpPower) k *= 1 + Math.max(0, pl.maxHp - c.hp) / 250;
  return k;
}
const dmgMul = () => (run && run.choice === 'B' ? 1.25 : 1) * charPower() * (pl.buff?.k === 'might' ? 1.5 : 1);
function addWeapon(id) { pl.weapons.push({ id, lv: 1, evo: false, t: 0.4, ang: 0, ph: 0, tr: [0, 0], m: {} }); }
const weaponOf = (id) => pl.weapons.find((w) => w.id === id);

// ---------- area generation: rooms joined by corridors, more than one way through ----------
const irand = (a, b) => a + Math.floor(rand() * (b - a + 1));
function genStage(kind, biome, depth, mod = null) {
  const s = { kind, biome, B: BIOMES[biome], depth, mod, t: 0, charge: 0, open: false, cleared: false, kills0: pl.kills, props: [], vents: [], eliteDead: true,
    crates: [], barrels: [], shrines: [], vault: null, gims: [], shards: [] };
  if (kind === 'boss' || kind === 'ambush' || kind === 'gen') {
    const W = kind === 'boss' ? 40 : 34, H = kind === 'boss' ? 28 : 24; s.W = W; s.H = H; s.tiles = new Uint8Array(W * H).fill(1);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) s.tiles[y * W + x] = 0;
    for (const [px, py] of [[0.25, 0.3], [0.75, 0.3], [0.25, 0.7], [0.75, 0.7]]) { const x = Math.floor(W * px), y = Math.floor(H * py); for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) s.tiles[(y + dy) * W + x + dx] = 1; }
    s.start = { x: W / 2 * TS, y: (H - 4) * TS }; s.exit = { x: W / 2 * TS, y: 3.5 * TS };
  } else {
    const W = 64, H = 40, CX = 4, CY = 3, cw = 16, ch = 13; s.W = W; s.H = H; s.tiles = new Uint8Array(W * H).fill(1);
    const carve = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) s.tiles[y * W + x] = 0; };
    const rooms = [];
    for (let j = 0; j < CY; j++) for (let i = 0; i < CX; i++) {
      const w = irand(8, 12), h = irand(6, 9), x = i * cw + 1 + irand(0, cw - w - 2), y = j * ch + 1 + irand(0, ch - h - 2);
      rooms.push({ i, j, x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) carve(xx, yy);
    }
    const R = (i, j) => rooms[j * CX + i], link = (a, b) => { // L-shaped corridor, three tiles wide
      const horizFirst = rand() < 0.5; let x = a.cx, y = a.cy;
      const stepX = () => { while (x !== b.cx) { for (let k = -1; k <= 1; k++) carve(x, y + k); x += Math.sign(b.cx - x); } };
      const stepY = () => { while (y !== b.cy) { for (let k = -1; k <= 1; k++) carve(x + k, y); y += Math.sign(b.cy - y); } };
      if (horizFirst) { stepX(); stepY(); } else { stepY(); stepX(); } for (let k = -1; k <= 1; k++) carve(x + k, y);
    };
    // spanning tree by random walk, then a few extra links so there are several routes
    const seen = new Set([0]), stack = [rooms[0]], edges = new Set();
    while (stack.length) {
      const r = stack[stack.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [r.i + dx, r.j + dy]).filter(([i, j]) => i >= 0 && j >= 0 && i < CX && j < CY && !seen.has(j * CX + i));
      if (!nb.length) { stack.pop(); continue; }
      const [i, j] = pick(nb), n = R(i, j); seen.add(j * CX + i); link(r, n); edges.add([r.j * CX + r.i, j * CX + i].sort().join()); stack.push(n);
    }
    for (let j = 0; j < CY; j++) for (let i = 0; i < CX; i++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const i2 = i + dx, j2 = j + dy; if (i2 >= CX || j2 >= CY) continue; const k = [j * CX + i, j2 * CX + i2].sort().join();
      if (!edges.has(k) && rand() < 0.38) { link(R(i, j), R(i2, j2)); edges.add(k); }
    }
    const startR = R(0, irand(0, CY - 1)); s.start = { x: (startR.cx + 0.5) * TS, y: (startR.cy + 0.5) * TS };
    const d = bfs(s, startR.cx, startR.cy), lastCol = rooms.filter((r) => r.i === CX - 1);
    const exitR = lastCol.reduce((a, b) => (d[b.cy * W + b.cx] > d[a.cy * W + a.cx] ? b : a)); s.exit = { x: (exitR.cx + 0.5) * TS, y: (exitR.cy + 0.5) * TS };
    // pillars inside the bigger rooms, kept only if the way through stays open
    for (const r of rooms) {
      if (r === startR || r === exitR || r.w * r.h < 64) continue;
      for (let n = 0; n < irand(1, 2); n++) {
        const px = irand(r.x + 2, r.x + r.w - 4), py = irand(r.y + 2, r.y + r.h - 4), cells = [[px, py], [px + 1, py], [px, py + 1], [px + 1, py + 1]];
        cells.forEach(([x, y]) => (s.tiles[y * W + x] = 1));
        const d2 = bfs(s, startR.cx, startR.cy); if (d2[exitR.cy * W + exitR.cx] < 0) cells.forEach(([x, y]) => (s.tiles[y * W + x] = 0));
      }
      if (s.B.hazard && rand() < 0.55) { const hx = irand(r.x + 1, r.x + r.w - 2), hy = irand(r.y + 1, r.y + r.h - 2), rad = irand(1, 2); for (let y = hy - rad; y <= hy + rad; y++) for (let x = hx - rad - 1; x <= hx + rad + 1; x++) if (s.tiles[y * W + x] === 0 && rand() < 0.8) s.tiles[y * W + x] = 2; }
    }
    for (const r of rooms) if (r !== startR && rand() < 0.75) s.vents.push({ x: (r.x + irand(1, r.w - 2) + 0.5) * TS, y: (r.y + irand(1, r.h - 2) + 0.5) * TS, t: rand() * 3 });
    s.rooms = rooms;
    // gimmicks: crates to break, barrels that blow up (and set each other off), maybe a shrine, maybe a sealed vault far away
    const others = rooms.filter((r) => r !== startR), free = (p) => s.tiles[Math.floor(p.y / TS) * W + Math.floor(p.x / TS)] === 0;
    const spot = (r, m = 1) => ({ x: (r.x + irand(m, r.w - 1 - m) + 0.5) * TS, y: (r.y + irand(m, r.h - 1 - m) + 0.5) * TS });
    for (let i = irand(5, 9) * (mod === 'rich' ? 2 : 1); i > 0; i--) { const p = spot(pick(others)); if (free(p)) s.crates.push(p); }
    for (let i = irand(2, 4); i > 0; i--) { const p = spot(pick(others)); if (!free(p)) continue; s.barrels.push(p); const q = { x: p.x + TS, y: p.y }; if (rand() < 0.6 && free(q)) s.barrels.push(q); }
    const mid = others.filter((r) => r !== exitR);
    if (rand() < 0.6 && mid.length) { const p = spot(pick(mid), 2); if (free(p)) s.shrines.push({ ...p, k: pick(['might', 'haste', 'magnet', 'mend']), charge: 0, used: false }); }
    if (mod === 'rich' || (kind === 'fight' && rand() < 0.35)) {
      const far = mid.slice().sort((a, b) => d[b.cy * W + b.cx] - d[a.cy * W + a.cx])[0], p = far && { x: (far.cx + 0.5) * TS, y: (far.cy + 0.5) * TS };
      if (p && free(p)) s.vault = { ...p, open: false };
    }
    placeGimmicks(s, rooms, startR, exitR, d); // each region's own gimmicks (63-gimmicks.js)
  }
  s.floor = []; for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) if (s.tiles[y * s.W + x] !== 1) s.floor.push(y * s.W + x);
  // props sit on floor tiles that touch a wall: purely decorative
  for (const i of s.floor) { const x = i % s.W, y = (i / s.W) | 0; if (s.tiles[(y - 1) * s.W + x] === 1 && rand() < 0.09) s.props.push({ x, y, k: irand(0, 3) }); }
  s.need = kind === 'fight' ? gateNeed(depth) : kind === 'elite' ? Math.round(gateNeed(depth) * 0.6) : 0;
  return s;
}
function bfs(s, sx, sy) { // 8-way step distance from a tile; -1 where unreachable
  const W = s.W, H = s.H, d = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H); let h = 0, t = 0;
  if (sx < 0 || sy < 0 || sx >= W || sy >= H || s.tiles[sy * W + sx] === 1) return d;
  d[sy * W + sx] = 0; q[t++] = sy * W + sx;
  while (h < t) {
    const c = q[h++], x = c % W, y = (c / W) | 0, dc = d[c] + 1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx; if (s.tiles[n] === 1 || d[n] >= 0) continue;
      if (dx && dy && (s.tiles[y * W + nx] === 1 || s.tiles[ny * W + x] === 1)) continue; // no corner cutting
      d[n] = dc; q[t++] = n;
    }
  }
  return d;
}
const tileAt = (px, py) => { const x = Math.floor(px / TS), y = Math.floor(py / TS); return x < 0 || y < 0 || x >= st.W || y >= st.H ? 1 : st.tiles[y * st.W + x]; };
const solid = (px, py) => tileAt(px, py) === 1;
function pushOut(o, r) { // slide circles along walls
  const x0 = Math.floor((o.x - r) / TS), x1 = Math.floor((o.x + r) / TS), y0 = Math.floor((o.y - r) / TS), y1 = Math.floor((o.y + r) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!(tx < 0 || ty < 0 || tx >= st.W || ty >= st.H || st.tiles[ty * st.W + tx] === 1)) continue;
    const cx = clamp(o.x, tx * TS, tx * TS + TS), cy = clamp(o.y, ty * TS, ty * TS + TS), dx = o.x - cx, dy = o.y - cy, d2 = dx * dx + dy * dy;
    if (d2 < r * r) { const d = Math.sqrt(d2); if (d > 0.001) { o.x += dx / d * (r - d); o.y += dy / d * (r - d); } else o.y -= r; }
  }
}
// flow field toward the curator, rebuilt a few times a second, so slop walks around walls
let flow = null, flowT = 0;
function updFlow(dt) { flowT -= dt; if (flowT > 0 && flow) return; flowT = 0.2; flow = bfs(st, Math.floor(pl.x / TS), Math.floor(pl.y / TS)); }
function flowDir(e) {
  const W = st.W, x = Math.floor(e.x / TS), y = Math.floor(e.y / TS), here = flow ? flow[y * W + x] : -1;
  const dx = pl.x - e.x, dy = pl.y - e.y, dd = Math.hypot(dx, dy) || 1;
  if (here < 0 || here <= 1) return [dx / dd, dy / dd];
  let best = here, bx = 0, by = 0;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const v = flow[(y + oy) * W + x + ox]; if (v >= 0 && v < best) { best = v; bx = ox; by = oy; } }
  if (!bx && !by) return [dx / dd, dy / dd];
  const tx = (x + bx + 0.5) * TS - e.x, ty = (y + by + 0.5) * TS - e.y, td = Math.hypot(tx, ty) || 1; return [tx / td, ty / td];
}

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
  for (const e of foes) { if (e.dead || e.spawnIn > 0 || e.prop) continue; const d = dist2(x, y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}
const onScreen = (e, m = 0) => Math.abs(e.x - cam.x) < LW / 2 + m && Math.abs(e.y - cam.y) < LH / 2 + m;

// ---------- slop ----------
// how far ahead of the expected level for this depth the curator is: slop catches up, so farming never snowballs
const overLv = () => (pl ? Math.max(0, pl.lv - (10 + run.depth)) : 0); // a normal run sits near depth + 8 to 10
function spawnFoe(type, x, y, o = {}) {
  const d = FOES[type], over = d.prop ? 0 : overLv(), k = d.prop ? 1 + run.depth * 0.08 : hpScale(run.depth) * (o.elite ? 12 : 1) * (o.mini ? 0.35 : 1) * (st?.mod === 'danger' ? 1.15 : 1) * (1 + (st?.flood || 0) * 0.5) * (1 + over * 0.08);
  const e = { type, x, y, hp: d.hp * k, maxHp: d.hp * k, spd: d.spd * (o.elite ? 0.9 : 1) * (o.mini ? 1.25 : 1), dmg: d.dmg * (o.elite ? 1.5 : 1) * (0.8 + run.depth * 0.035) * (1 + (st?.flood || 0) * 0.25) * (1 + over * 0.04), r: d.r * (o.elite ? 1.7 : o.mini ? 0.7 : 1),
    xp: d.xp * (o.elite ? 0 : 1) * Math.max(0.15, 1 - (st?.flood || 0) * 0.4) /* the flood is barely worth farming */, elite: !!o.elite, mini: !!o.mini, scale: o.elite ? 1.7 : o.mini ? 0.7 : 1, flash: 0, kx: 0, ky: 0, stun: 0, anim: rand() * 2, t: rand() * 2, spawnIn: 0.3,
    lastScis: -9, dashing: 0, vx: 0, vy: 0, guard: !!o.guard, prop: !!d.prop, noLoot: !!o.noLoot };
  foes.push(e); return e;
}
function weighted(mix) { let s = 0; for (const [, w] of mix) s += w; let r = rand() * s; for (const [t, w] of mix) { if ((r -= w) <= 0) return t; } return mix[0][0]; }
function spawnSpot(minD = 190, maxD = 430) { // a floor tile out of sight but not too far
  for (let i = 0; i < 16; i++) {
    const t = st.floor[Math.floor(rand() * st.floor.length)], x = (t % st.W + 0.5) * TS, y = (((t / st.W) | 0) + 0.5) * TS, d = Math.hypot(x - pl.x, y - pl.y);
    if (d > minD && d < maxD && !onScreen({ x, y }, -10)) return [x, y];
  }
  return null;
}
function spawning(dt) {
  if (st.kind === 'boss' || st.cleared) { if (st.kind === 'boss' && boss && boss.kind !== 'snake') bossAdds(dt); return; }
  if (st.t < 4) return; // a breath at the start of every area
  // linger in one area and the flood rises: it starts 30s after the gate opens (or at 100s at the latest),
  // then more slop, tougher, and waves that close in from every side
  const flood = st.kind === 'fight' || st.kind === 'elite' ? Math.max(0, st.open ? st.t - (st.openT ?? st.t) - 30 : st.t - 100) / 30 : 0; st.flood = flood;
  if (flood > 0.5) { st.waveT = (st.waveT ?? 0) - dt; if (st.waveT <= 0) { st.waveT = Math.max(5, 14 - flood * 2.5); floodWave(flood); } }
  const mul = (run.flags.praise ? 1.4 : 1) * (run.flags.unplug ? 0.8 : 1) * (st.open ? 0.6 : 1) * (st.mod === 'danger' ? 1.35 : 1) * (1 + flood);
  spawnAcc += spawnRate(run.depth) * mul * dt;
  while (spawnAcc >= 1) { spawnAcc--; if (foes.length < Math.min(280, aliveCap(run.depth) * (1 + flood * 0.6))) { const p = spawnSpot(); if (p) spawnFoe(weighted(st.B.mix), p[0], p[1]); } }
  for (const v of st.vents) { // vents near you breathe out small swarms
    v.t -= dt; if (v.t > 0) continue; v.t = rnd(9, 14);
    const d = Math.hypot(v.x - pl.x, v.y - pl.y); if (d > 520 || d < 90 || foes.length > aliveCap(run.depth)) continue;
    const n = 4 + Math.floor(run.depth / 3); for (let i = 0; i < n; i++) spawnFoe(weighted(st.B.mix), v.x + rnd(-10, 10), v.y + rnd(-10, 10));
    burst(v.x, v.y, 10, st.B.accent); sfx('warn');
  }
}
function bossAdds(dt) { spawnAcc += (0.6 + run.depth * 0.05) * dt; while (spawnAcc >= 1) { spawnAcc--; if (foes.length < 60) { const p = spawnSpot(120, 300); if (p) spawnFoe(weighted(st.B.mix), p[0], p[1]); } } }
function recycle(e) {
  if (e.boss || e.seg || e.guard || e.prop) return;
  if (Math.abs(e.x - pl.x) > 640 || Math.abs(e.y - pl.y) > 480) { const p = spawnSpot(); if (p) { e.x = p[0]; e.y = p[1]; } }
}

// ---------- damage ----------
let curSrc = null; // the weapon dealing damage right now: kills count toward its skill tree
function hurt(e, dmg, kx = 0, ky = 0, kb = 1) {
  if (e.dead) return;
  const tgt = e.seg ? e.parent : e; if (tgt.dead) return;
  const crit = !!WEAPONS[curSrc] && rand() < critChance();
  // tail segments share the head's health: a wide hit across the tail shouldn't count 16 times
  dmg = Math.round(dmg * dmgMul() * rnd(0.9, 1.1) * (e.seg ? 0.2 : 1) * (crit ? 2.2 : 1) * (tgt.vuln > 0 ? 1.3 : 1)); tgt.hp -= dmg; e.flash = 0.1; if (e.seg) tgt.flash = 0.1;
  if (!tgt.boss) { const k = kb * (FOES[tgt.type]?.heavy ? 0.4 : 1) * (tgt.elite ? 0.3 : 1); e.kx += kx * 70 * k; e.ky += ky * 70 * k; }
  if (nums.length < 120 && !e.seg && !e.prop) nums.push({ x: e.x + rnd(-3, 3), y: e.y - e.r - 2, v: dmg, t: 0, big: dmg >= 60 || crit, crit });
  sfx('hit');
  if (tgt.hp <= 0) kill(tgt);
}
function kill(e) {
  if (e.dead) return; e.dead = true;
  if (e.prop) { breakProp(e); return; }
  pl.kills++; pl.score += Math.round(e.maxHp); pl.combo++;
  if (CHARS[pl.ci].bloodHeal && pl.kills % CHARS[pl.ci].bloodHeal === 0) pl.hp = Math.min(pl.maxHp, pl.hp + 1); /* Mina: every 15 kills heal 1 */ pl.bestCombo = Math.max(pl.bestCombo, pl.combo);
  if (WEAPONS[curSrc]) pl.wk[curSrc] = (pl.wk[curSrc] || 0) + 1;
  burst(e.x, e.y, e.boss ? 40 : e.elite ? 18 : 7, e.boss ? '#f6d55c' : e.elite ? '#fb7185' : '#e9e4ff');
  sfx(e.boss ? 'boom' : 'kill');
  if (e.boss) { bossDown(e); return; }
  if (e.noLoot) { if (FOES[e.type].splits && !e.mini) for (let i = 0; i < 2; i++) { const m = spawnFoe(e.type, e.x + rnd(-5, 5), e.y + rnd(-5, 5), { mini: true }); m.spawnIn = 0; m.noLoot = true; m.xp = 0; } return; } // flood slop: nothing to farm
  if (e.elite) {
    items.push({ k: 'chest', x: e.x, y: e.y, t: 0 }, { k: 'kimbap', x: e.x + 12, y: e.y, t: 0 }); shake = Math.max(shake, 4);
    if (e.guard) { st.eliteDead = true; if (st.kind === 'ambush') stageWon(); }
    return;
  }
  const clean = curSrc === 'eraser' && weaponOf('eraser')?.m.clean; // the heavy eraser's last tier erases copies for good
  if (FOES[e.type].splits && !e.mini && !clean) for (let i = 0; i < 2; i++) spawnFoe(e.type, e.x + rnd(-5, 5), e.y + rnd(-5, 5), { mini: true }).spawnIn = 0;
  dropGem(e.x, e.y, e.xp + (clean ? 1 : 0));
  const r = rand(); if (r < 0.012) items.push({ k: 'kimbap', x: e.x, y: e.y, t: 0 }); else if (r < 0.016) items.push({ k: 'clip', x: e.x, y: e.y, t: 0 }); else if (r < 0.026) items.push({ k: 'gold', x: e.x, y: e.y, t: 0 });
}
function breakProp(e) {
  burst(e.x, e.y, 10, e.type === 'barrel' ? '#fb923c' : '#c08a52'); sfx('kill');
  if (e.type === 'barrel') { st.gims.push({ k: 'fuse', x: e.x, y: e.y, t: 0.55 }); sfx('hit'); return; } // lit: it blows a moment later (63-gimmicks.js)
  if (e.type === 'shard') { breakShard(e); return; }
  const r = rand();
  if (r < 0.45) dropGem(e.x, e.y, 3 + Math.floor(run.depth / 4)); else if (r < 0.7) items.push({ k: 'gold', x: e.x, y: e.y, t: 0 });
  else if (r < 0.82) items.push({ k: 'kimbap', x: e.x, y: e.y, t: 0 }); else if (r < 0.88) items.push({ k: 'clip', x: e.x, y: e.y, t: 0 });
}
function floorNear(x, y) { // the closest walkable spot, so nothing ever lands inside a wall
  if (!solid(x, y)) return [x, y]; const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
  for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const nx = tx + dx, ny = ty + dy; if (nx >= 0 && ny >= 0 && nx < st.W && ny < st.H && st.tiles[ny * st.W + nx] !== 1) return [(nx + 0.5) * TS, (ny + 0.5) * TS]; }
  return [pl.x, pl.y];
}
function dropGem(x, y, v) {
  if (v <= 0) return; [x, y] = floorNear(x, y);
  if (gems.length > 300) { let far = 0, fd = -1; for (let i = 0; i < gems.length; i++) { const d = dist2(gems[i].x, gems[i].y, pl.x, pl.y); if (d > fd) { fd = d; far = i; } } gems[far].v += v; gems[far].tier = 3; return; }
  gems.push({ x, y, v, tier: v >= 25 ? 3 : v >= 10 ? 2 : v >= 3 ? 1 : 0, mag: false, vx: 0, vy: 0 });
}
function burst(x, y, n, col) { for (let i = 0; i < n && fx.length < 600; i++) { const a = rand() * 7, s = rnd(20, 80); fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, max: rnd(0.25, 0.55), col }); } }
function hurtPlayer(d, from) {
  if (pl.inv > 0 || pl.dashT > 0 || state !== 'play') return;
  const c = CHARS[pl.ci]; d *= 1 - c.armor;
  pl.hp -= d; pl.inv = 0.55; pl.hurtFlash = 0.25; shake = Math.max(shake, 3); sfx('hurt'); pl.combo = 0;
  if (c.thorns && from && from.maxHp && !from.dead && !from.prop) { const prev = curSrc; curSrc = 'thorns'; hurt(from, pl.maxHp * c.thorns, 0, 0, 2); curSrc = prev; }
  if (from && Number.isFinite(from.x) && Number.isFinite(from.y)) { const a = Math.atan2(pl.y - from.y, pl.x - from.x); pl.vx += Math.cos(a) * 60; pl.vy += Math.sin(a) * 60; } // only with a real position
  if (pl.hp <= 0) { pl.hp = 0; endRun('over'); }
}
function gainXp(v) {
  pl.xp += v; pl.gems += v; pl.score += v * 5;
  if (st && st.need && !st.open) { st.charge = Math.min(st.need, st.charge + v * (run.choice === 'A' ? 1.2 : 1)); if (st.charge >= st.need && st.eliteDead) openGate(); }
  while (pl.xp >= pl.need) { pl.xp -= pl.need; pl.lv++; pl.need = xpNeed(pl.lv); pendingLv++; const ph = CHARS[pl.ci].perLv.hp; if (ph) { pl.maxHp += ph; pl.hp += ph; } }
}
function openGate() { if (st.open) return; st.open = true; st.openT = st.t; banner = { text: T.gateOpen, t: 0 }; sfx('chest'); burst(st.exit.x, st.exit.y, 30, '#2dd4bf'); }

// ---------- level-up choices and chests ----------
function upgradePool() {
  const pool = [], kills = (id) => pl.wk[id] || 0;
  // weapons that have erased more slop come up more, and so do their skill tree tiers
  for (const w of pl.weapons) if (!w.evo && w.lv < MAX_LV) pool.push({ k: 'w', id: w.id, lv: w.lv + 1, wt: 3 * Math.min(2, 1 + kills(w.id) / 150) });
  for (const w of pl.weapons) for (let b = 0; b < 2; b++) {
    const t = w.tr[b]; if (t < 3 && (t > 0 || w.lv >= 2) && kills(w.id) >= TREE_NEED[t] && !(t === 2 && w.tr[1 - b] >= 3)) pool.push({ k: 't', id: w.id, b, t, wt: 1.3 * Math.min(6, 1 + kills(w.id) / 40) });
  }
  if (pl.weapons.length < MAX_W) for (const id of CHARS[pl.ci].pool) if (!weaponOf(id)) pool.push({ k: 'w', id, lv: 1, wt: 2.4 });
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
  else if (o.k === 't') { const w = weaponOf(o.id); if (w && w.tr[o.b] === o.t) { w.tr[o.b]++; w.m = treeMods(w); } }
  else if (o.k === 'heal') { pl.hp = Math.min(pl.maxHp, pl.hp + 30); sfx('heal'); }
  else if (o.k === 'gold') run.gold += 40;
}
function canEvolve() { return pl.weapons.find((w) => !w.evo && w.lv >= MAX_LV && pasLv(WEAPONS[w.id].evoWith) > 0); }
let chestShow = null, chestBack = 'play';
function openChest(big, back = 'play') {
  sfx('chest'); const got = [], ev = canEvolve();
  if (ev) { ev.evo = true; got.push({ k: 'evo', id: ev.id }); }
  else for (let i = 0; i < (big ? 3 : 1); i++) { const p = upgradePool(); if (!p.length) { got.push({ k: 'gold' }); applyChoice({ k: 'gold' }); continue; } const o = pick(p); applyChoice(o); got.push(o); }
  chestShow = { got, t: 0 }; chestBack = back; setState('chest');
}
