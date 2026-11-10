// ---------- world state, tile physics, the player ----------
let lvl = null, stageI = 0, ents = [], shots = [], parts = [], floats = [], pl = null, hitstop = 0;
const cam = { x: 0, y: 0, shake: 0, lock: null };
const save = { stage: 0, glyphs: [], dj: false, deaths: 0, time: 0 };
const RUN = 125, ACC = 1500, GRAV = 950, JUMP = 335, DJUMP = 290, DASH = 310, DASH_T = 0.17;

const tile = (tx, ty) => (tx < 0 || tx >= lvl.w ? '#' : ty < 0 || ty >= ROWS ? ' ' : lvl.G[ty][tx]);
function collide(e) {
  const x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w) / TS), y0 = Math.floor(e.y / TS), y1 = Math.floor((e.y + e.h) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tile(tx, ty) === '#') return true;
  return false;
}
function move(e, dt) {
  e.x += e.vx * dt; e.hitWall = 0;
  if (collide(e)) { e.hitWall = sign(e.vx); e.x = e.vx > 0 ? Math.floor((e.x + e.w) / TS) * TS - e.w - 0.01 : (Math.floor(e.x / TS) + 1) * TS + 0.01; e.vx = 0; }
  const prevFoot = e.y + e.h; e.y += e.vy * dt; e.onGround = false;
  if (collide(e)) { if (e.vy > 0) { e.y = Math.floor((e.y + e.h) / TS) * TS - e.h - 0.01; e.onGround = true; } else e.y = (Math.floor(e.y / TS) + 1) * TS + 0.01; e.vy = 0; }
  else if (e.vy >= 0) { // one-way ledges: land only when coming down from above
    const foot = e.y + e.h, ty = Math.floor(foot / TS), top = ty * TS;
    if (prevFoot <= top + 0.05) for (let tx = Math.floor(e.x / TS); tx <= Math.floor((e.x + e.w) / TS); tx++) if (tile(tx, ty) === '=') { e.y = top - e.h - 0.01; e.vy = 0; e.onGround = true; break; }
  }
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const approach = (v, to, by) => (v < to ? Math.min(v + by, to) : Math.max(v - by, to));
const cx = (e) => e.x + e.w / 2, cy = (e) => e.y + e.h / 2;

function puff(x, y, n, o = {}) {
  for (let i = 0; i < n; i++) { const a = o.dir !== undefined ? o.dir + rnd(-0.7, 0.7) : rnd(6.283), s = rnd(o.s0 ?? 20, o.s1 ?? 110); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), g: o.g ?? 300, r: rnd(o.r0 ?? 1, o.r1 ?? 3.2), life: 0, max: rnd(0.25, o.max ?? 0.7), col: o.col || INK }); }
}
function floatText(x, y, text, col = INK, big = false) { floats.push({ x, y, text, col, big, life: 0, max: big ? 2.6 : 1.3 }); }

function newPlayer(x, y) {
  return { x, y, w: 10, h: 22, vx: 0, vy: 0, face: 1, hp: 5, maxHp: 5, ink: 30, t: 0, onGround: false, coy: 0, jbuf: 0, jumps: 0, airDash: false, dashT: 0, dashCd: 0, atkT: 0, atkCd: 0, abuf: 0, combo: 0, comboT: 0, skillCd: 0, inv: 0, hurtT: 0, dead: false, deadT: 0, safe: { x, y }, safeT: 0, hitSet: new Set(), scarf: Array.from({ length: 7 }, () => ({ x, y })) };
}
function hurtPlayer(d, dir) {
  const p = pl; if (p.inv > 0 || p.dead || state !== 'play') return;
  p.hp -= d; p.inv = 1.1; p.hurtT = 0.25; p.vx = dir * 150; p.vy = -190; p.dashT = 0; cam.shake = 6; hitstop = 0.08; sfx('hurt'); puff(cx(p), cy(p), 10, { col: RED });
  if (p.hp <= 0) { p.dead = true; p.deadT = 0; save.deaths++; puff(cx(p), cy(p), 40, { s1: 200, max: 1.1 }); sfx('boom'); }
}
function updPlayer(dt) {
  const p = pl; p.t += dt;
  if (p.dead) { p.deadT += dt; if (p.deadT > 1.3) respawn(); return; }
  for (const k of ['inv', 'atkCd', 'dashCd', 'comboT', 'hurtT', 'coy', 'jbuf', 'skillCd', 'abuf']) if (p[k] > 0) p[k] -= dt;
  const ax = (K.right ? 1 : 0) - (K.left ? 1 : 0);
  if (p.dashT > 0) {
    p.dashT -= dt; p.vx = p.face * DASH; p.vy = 0; if (p.dashT <= 0) p.vx = p.face * RUN;
    parts.push({ x: cx(p), y: cy(p), vx: 0, vy: 0, g: 0, r: 7, life: 0, max: 0.22, col: 'rgba(26,22,19,.35)' });
  } else {
    if (p.hurtT <= 0) { if (ax) { if (p.atkT <= 0) p.face = ax; p.vx = approach(p.vx, ax * RUN, ACC * dt); } else p.vx = approach(p.vx, 0, ACC * dt * (p.onGround ? 1 : 0.4)); }
    p.vy = Math.min(p.vy + GRAV * dt, 430);
    if (P.jump) p.jbuf = 0.12;
    if (p.onGround) { p.coy = 0.1; p.jumps = 0; p.airDash = false; }
    if (p.jbuf > 0 && p.hurtT <= 0) {
      if (p.coy > 0) { p.vy = -JUMP; p.coy = 0; p.jbuf = 0; sfx('jump'); puff(cx(p), p.y + p.h, 5, { dir: -1.57, s1: 50, g: 60, col: 'rgba(26,22,19,.4)' }); }
      else if (save.dj && p.jumps < 1) { p.jumps = 1; p.vy = -DJUMP; p.jbuf = 0; sfx('jump'); floats.push({ x: cx(p), y: p.y + p.h, ring: true, life: 0, max: 0.35 }); }
    }
    if (!K.jump && p.vy < -130) p.vy = -130;
    if (P.dash && p.dashCd <= 0 && !p.airDash && p.hurtT <= 0) { if (ax) p.face = ax; p.dashT = DASH_T; p.dashCd = 0.45; p.airDash = !p.onGround; p.inv = Math.max(p.inv, 0.24); p.atkT = 0; sfx('dash'); }
  }
  if (P.atk) p.abuf = 0.16; /* a press slightly early still counts */
  if (p.abuf > 0 && p.atkCd <= 0 && p.hurtT <= 0 && p.dashT <= 0) {
    p.abuf = 0;
    p.combo = p.comboT > 0 ? (p.combo % 3) + 1 : 1; p.atkT = 0.2; p.atkCd = p.combo === 3 ? 0.34 : 0.2; p.comboT = 0.6; p.hitSet = new Set(); sfx('slash');
    if (p.onGround) p.vx = p.face * (p.combo === 3 ? 150 : 70);
  }
  if (P.skill && p.ink >= 30 && p.skillCd <= 0 && p.hurtT <= 0) { p.ink -= 30; p.skillCd = 0.4; sfx('wave'); shots.push({ x: cx(p) + p.face * 8, y: p.y - 4, w: 14, h: 30, vx: p.face * 270, vy: 0, life: 0.65, friendly: true, wave: true, dmg: 2, hit: new Set() }); }
  if (p.atkT > 0) { p.atkT -= dt; if (p.atkT > 0.07) slashHit(p); }
  move(p, dt);
  // thorns and pits
  const fx0 = Math.floor((p.x + 2) / TS), fx1 = Math.floor((p.x + p.w - 2) / TS), fy = Math.floor((p.y + p.h - 3) / TS);
  if (tile(fx0, fy) === '^' || tile(fx1, fy) === '^') { hurtPlayer(1, -p.face); if (!p.dead) p.vy = -260; }
  if (p.y > ROWS * TS + 30) { p.inv = 0; hurtPlayer(1, 0); if (!p.dead) { p.x = p.safe.x; p.y = p.safe.y; p.vx = p.vy = 0; } }
  p.safeT -= dt;
  if (p.onGround && p.safeT <= 0 && tile(Math.floor((p.x - 6) / TS), Math.floor((p.y + p.h + 2) / TS)) === '#' && tile(Math.floor((p.x + p.w + 6) / TS), Math.floor((p.y + p.h + 2) / TS)) === '#') { p.safe = { x: p.x, y: p.y }; p.safeT = 0.2; }
  // the scarf trails behind as a short chain
  let ax0 = cx(p) - p.face * 2, ay0 = p.y + 6; for (const s of p.scarf) { const dx = s.x - ax0, dy = s.y - ay0 + 0.6, d = Math.hypot(dx, dy) || 1, L = 3.2; if (d > L) { s.x = ax0 + (dx / d) * L; s.y = ay0 + (dy / d) * L; } s.y += 14 * dt; s.x -= p.face * 6 * dt; ax0 = s.x; ay0 = s.y; }
}
function slashHit(p) {
  const r = p.combo === 3 ? 38 : 30, box = { x: p.face > 0 ? p.x + p.w - 4 : p.x - r + 4, y: p.y - 8, w: r, h: p.h + 14 }, dmg = p.combo === 3 ? 2 : 1;
  for (const e of ents) if (e.hp > 0 && e.hurtable && !p.hitSet.has(e) && overlap(box, e)) { p.hitSet.add(e); if (damage(e, dmg, p.face, 'slash')) p.ink = Math.min(100, p.ink + 8); }
  for (const s of shots) if (!s.friendly && !s.noReflect && overlap(box, s)) { s.friendly = true; s.vx = p.face * Math.max(220, Math.abs(s.vx) * 1.5); s.vy = -Math.abs(s.vy) * 0.2; s.dmg = 2; s.hit = new Set(); sfx('clang'); hitstop = 0.04; puff(s.x, s.y, 6); }
}
