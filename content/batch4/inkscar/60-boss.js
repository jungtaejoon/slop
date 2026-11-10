// ---------- the Thousand-Brush Engine ----------
// It hovers and writes. Three phases; after a few patterns it tires and sinks, and that is the opening.
const GY = 13 * TS;
function mkBoss(X, Y) { return mkEnt({ type: 'B', x: X - 28, y: Y, w: 56, h: 56, hp: 150, maxHp: 150, kb: 0, phase: 1, mode: 'wait', mt: 0, n: 0, k: 0, homeY: Y, sw: null, cols: [], last: '' }); }
function startBoss(door) {
  bossOn = true; door.hp = 0; const tx = Math.floor(door.x / TS) - 1;
  for (let y = 0; y < 13; y++) { lvl.G[y][tx] = '#'; lvl.G[y][tx - 1] = '#'; }
  cam.lock = { x0: (tx - 1) * TS, x1: lvl.w * TS, a0: (tx + 1) * TS + 4, a1: (lvl.w - 2) * TS - 4 };
  boss.mode = 'idle'; boss.mt = 1.6; cam.shake = 8; sfx('boom'); sayOnce('b0');
}
function bossHurt(e, d) { if (!bossOn || e.mode === 'wait') return false; if (e.mode === 'tired') e.hp -= d; return true; }
function bossDown(e) { e.hp = 0; shots = []; for (const o of ents) if (o.type === 'b') o.hp = 0; finale(e); }
function updBoss(e, dt) {
  if (!bossOn) { e.y = e.homeY + Math.sin(e.t) * 4; return; }
  const p = pl, L = cam.lock, ph = e.phase, spd = 1 + (ph - 1) * 0.22; e.contact = e.mode !== 'tired' && e.y < e.homeY + 16; /* never while sunk or still rising */
  const want = e.hp <= 50 ? 3 : e.hp <= 100 ? 2 : 1;
  if (want > ph) {
    e.phase = want; shots = shots.filter((s) => s.friendly); e.mode = 'idle'; e.mt = 1.3; e.sw = null; e.cols = []; e.n = 0; cam.shake = 10; sfx('boom');
    puff(cx(e), cy(e), 50, { s1: 260, col: GRAY, max: 1.2 }); p.vx = sign(cx(p) - cx(e)) * 220; ents.push(mkEnt({ type: 'H', x: clamp(cx(p) - sign(cx(p) - cx(e) || 1) * 70, L.a0 + 20, L.a1 - 30), y: GY - 14.01, w: 12, h: 14, hp: 1, hurtable: false, contact: false })); /* a spilled ink pot: a breath between phases */
    sayOnce(want === 2 ? 'b1' : 'b2'); return;
  }
  e.mt -= dt;
  let tx = e.x, ty = e.homeY + Math.sin(e.t * 2) * 5;
  if (e.mode === 'tired') ty = GY - e.h - 2; else if (e.mode === 'idle') tx = clamp(cx(p) - e.w / 2 + Math.sin(e.t * 0.9) * 70, L.a0, L.a1 - e.w);
  e.x += clamp(tx - e.x, -75 * spd * dt, 75 * spd * dt); e.y += clamp(ty - e.y, -150 * dt, 150 * dt);
  if (e.mode === 'idle') {
    if (e.mt > 0) return;
    if (e.n >= (ph === 1 ? 2 : 3)) { e.mode = 'tired'; e.mt = 3; e.n = 0; sfx('die'); return; }
    const opts = ph === 1 ? ['sweep', 'rain'] : ['sweep', 'rain', 'scroll']; let m = opts[Math.floor(rnd(opts.length))]; if (m === e.last) m = opts[(opts.indexOf(m) + 1) % opts.length]; e.last = m; e.mode = m; sfx('warn');
    if (ph >= 2 && !ents.some((o) => o.type === 'b' && o.hp > 0) && Math.random() < 0.6) for (const s of [-1, 1]) ents.push(mkEnt({ type: 'b', x: cx(e) + s * 24, y: e.y + e.h, w: 14, h: 12, hp: 2, vx: s * 60, was: T.was[Math.floor(rnd(T.was.length))] }));
    if (m === 'sweep') { const dir = Math.random() < 0.5 ? 1 : -1; e.sw = { x: dir > 0 ? L.a0 - 30 : L.a1 + 30, dir, go: false, back: false }; e.mt = 0.8 / spd; }
    else if (m === 'rain') { const n = ph === 3 ? 7 : 5; e.cols = [cx(p)]; for (let i = 1; i < n; i++) e.cols.push(rnd(L.a0 + 10, L.a1 - 10)); e.mt = 0.9 / spd; }
    else { e.k = ph === 3 ? 5 : 3; e.mt = 0.6; }
  } else if (e.mode === 'sweep') {
    const s = e.sw; if (e.mt > 0) return;
    if (!s.go) { s.go = true; sfx('dash'); }
    s.x += s.dir * 330 * spd * dt; if (overlap({ x: s.x - 13, y: GY - 30, w: 26, h: 30 }, p)) hurtPlayer(1, s.dir);
    if (Math.random() < 0.5) puff(s.x, GY - 2, 1, { col: GRAY, dir: -1.57, s1: 60 });
    if (s.x < L.a0 - 40 || s.x > L.a1 + 40) { if (ph === 3 && !s.back) { s.back = true; s.dir *= -1; } else { e.sw = null; e.mode = 'idle'; e.mt = 0.9 / spd; e.n++; } }
  } else if (e.mode === 'rain') {
    if (e.mt > 0) return;
    for (const x of e.cols) shots.push({ x: x - 4, y: -12, w: 8, h: 14, vx: 0, vy: 240, g: 220, life: 3, dmg: 1, noReflect: true, drop: true });
    e.cols = []; e.mode = 'idle'; e.mt = 1.3 / spd; e.n++; sfx('spit');
  } else if (e.mode === 'scroll') {
    if (e.mt > 0) return;
    if (e.k > 0) { e.k--; e.mt = 0.62 / spd; const fromRight = cx(p) < (L.a0 + L.a1) / 2; shots.push({ x: fromRight ? L.a1 - 24 : L.a0 + 2, y: GY - (e.k % 2 ? 50 : 13), w: 22, h: 8, vx: (fromRight ? -1 : 1) * 165, vy: 0, life: 4, dmg: 1, scroll: true }); sfx('spit'); }
    else { e.mode = 'idle'; e.mt = 1 / spd; e.n++; }
  } else if (e.mode === 'tired' && e.mt <= 0) { e.mode = 'idle'; e.mt = 0.9; }
}
