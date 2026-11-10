// ---------- slop behaviour, bosses, enemy bullets ----------
function updFoes(dt) {
  const kd = Math.exp(-9 * dt);
  for (const e of foes) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt); e.t += dt;
    if (e.seg) continue; // snake segments follow their head (updBoss)
    if (e.spawnIn > 0) { e.spawnIn -= dt; continue; }
    if (e.boss) { updBoss(e, dt); continue; }
    const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    let vx = 0, vy = 0;
    if (e.stun > 0) e.stun -= dt;
    else if (FOES[e.type].dasher) {
      if (e.dashing > 0) { e.dashing -= dt; vx = e.vx; vy = e.vy; if (rand() < 0.5) fx.push({ k: 'p', x: e.x, y: e.y, vx: 0, vy: 0, t: 0, max: 0.3, col: '#8fd66b' }); }
      else if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { e.dashing = 0.45; e.vx = ux * 150; e.vy = uy * 150; } }
      else { vx = ux * e.spd; vy = uy * e.spd; if (e.t > 2.6 && d < 130) { e.t = 0; e.wind = 0.35; } }
    } else if (FOES[e.type].shooter) {
      const want = d < 75 ? -1 : d > 110 ? 1 : 0; vx = (ux * want - uy * 0.6) * e.spd; vy = (uy * want + ux * 0.6) * e.spd;
      if (e.t > 2.4 && onScreen(e, -8)) { e.t = rnd(-0.4, 0); ebul.push({ x: e.x, y: e.y, vx: ux * 72, vy: uy * 72, t: 0, max: 4, r: 3, dmg: e.dmg + 2, col: '#e0524a' }); sfx('shot'); }
    } else { vx = ux * e.spd; vy = uy * e.spd; }
    e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt; e.kx *= kd; e.ky *= kd;
    e.anim += dt * (2 + e.spd / 25); if (vx) e.face = vx < 0 ? -1 : 1;
    if (d < e.r + 5) hurtPlayer(e.dmg, e);
    recycle(e);
  }
  // keep slop from piling into one point
  for (const e of foes) {
    if (e.dead || e.boss || e.seg) continue;
    let n = 0;
    near(e.x, e.y, e.r * 2, (o) => {
      if (o === e || o.boss || o.seg) return; const dx = e.x - o.x, dy = e.y - o.y, d2 = dx * dx + dy * dy, m = e.r + o.r;
      if (d2 > 0.01 && d2 < m * m) { const d = Math.sqrt(d2), p = (m - d) * 0.25; e.x += dx / d * p; e.y += dy / d * p; }
      if (++n > 6) return false;
    });
  }
}

function spawnBoss(i) {
  const b = BOSSES[i], [x, y] = ringPos(-30);
  const hp = b.hp * (1 + Math.max(0, pl.lv - 8) * 0.09); // stronger curators meet sturdier bosses
  boss = { boss: true, kind: b.kind, i, x, y, hp, maxHp: hp, r: b.r, spd: b.spd, dmg: b.dmg, t: 0, a: 0, flash: 0, kx: 0, ky: 0, stun: 0, mode: 'walk', mt: 0, face: 1, anim: 0, spawnIn: 0 };
  foes.push(boss); bossBanner = { i, t: 0 }; shake = 6; sfx('boom');
  if (b.kind === 'snake') {
    boss.trail = []; boss.segs = [];
    for (let k = 0; k < 16; k++) { const s = { seg: true, parent: boss, idx: k, x, y, r: 9 - k * 0.25, flash: 0, kx: 0, ky: 0, t: 0, lastScis: -9 }; boss.segs.push(s); foes.push(s); }
  }
}
function bossShoot(e, n, spd, off, col, dmg) { for (let k = 0; k < n; k++) { const a = off + k / n * Math.PI * 2; ebul.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, t: 0, max: 5, r: 3.5, dmg: dmg || 10, col: col || '#ff7ab8' }); } sfx('bossShot'); }
function updBoss(e, dt) {
  const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, half = e.hp < e.maxHp / 2;
  e.mt += dt; e.anim += dt;
  if (e.kind === 'face') {
    e.x += ux * e.spd * dt; e.y += uy * e.spd * dt;
    if (e.mt > (half ? 2.4 : 3.2)) { e.mt = 0; e.a += 0.3; bossShoot(e, half ? 20 : 14, 50, e.a, '#ff7ab8', 8); }
    if (e.t > 7) { e.t = 0; for (let k = 0; k < 6; k++) { const a = k / 6 * 7; spawnFoe('hand', e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30); } }
  } else if (e.kind === 'box') {
    if (e.mode === 'walk') {
      e.x += ux * e.spd * dt; e.y += uy * e.spd * dt;
      if (e.mt > 2.2) { e.mt = 0; for (let k = -1; k <= 1; k++) { const a = Math.atan2(uy, ux) + k * 0.5; ebul.push({ x: e.x, y: e.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, t: 0, max: 4.5, r: 4, dmg: 11, col: '#f4f0e8', home: 1.6, mail: 1 }); } sfx('bossShot'); }
      if (e.t > 8) { e.t = 0; e.mode = 'wind'; e.mt = 0; }
      if (half && rand() < dt / 9) for (let k = 0; k < 8; k++) spawnFoe('glyph', e.x + rnd(-30, 30), e.y + rnd(-30, 30));
    } else if (e.mode === 'wind') { if (e.mt > 0.6) { e.mode = 'charge'; e.mt = 0; e.vx = ux * 165; e.vy = uy * 165; } }
    else if (e.mode === 'charge') { e.x += e.vx * dt; e.y += e.vy * dt; if (rand() < 0.6) burst(e.x, e.y, 1, '#e9e4ff'); if (e.mt > 0.75) { e.mode = 'walk'; e.mt = 0; bossShoot(e, 10, 45, rand() * 7, '#f4f0e8', 9); } }
    if (e.t > 4 && e.t < 4 + dt && !half) for (let k = 0; k < 6; k++) spawnFoe('glyph', e.x + rnd(-30, 30), e.y + rnd(-30, 30));
  } else if (e.kind === 'snake') {
    // the head steers toward the player along a weaving path; segments follow the trail
    const want = Math.atan2(dy, dx) + Math.sin(e.anim * 1.3) * 0.9, cur = e.a, diff = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
    e.a = cur + clamp(diff, -2.4 * dt, 2.4 * dt); const sp = e.spd * (half ? 1.45 : 1);
    e.x += Math.cos(e.a) * sp * dt; e.y += Math.sin(e.a) * sp * dt;
    e.trail.unshift({ x: e.x, y: e.y }); if (e.trail.length > 140) e.trail.length = 140;
    for (const s of e.segs) { const p = e.trail[Math.min(e.trail.length - 1, (s.idx + 1) * 7)]; s.x = p.x; s.y = p.y; if (dist2(s.x, s.y, pl.x, pl.y) < (s.r + 4) ** 2) hurtPlayer(e.dmg * 0.7, s); }
    if (e.mt > (half ? 3 : 4.2)) { e.mt = 0; e.spiral = 1.1; }
    if (e.spiral > 0) { e.spiral -= dt; if (rand() < dt * 22) { e.a2 = (e.a2 || 0) + 0.45; ebul.push({ x: e.x, y: e.y, vx: Math.cos(e.a2) * 58, vy: Math.sin(e.a2) * 58, t: 0, max: 5, r: 3.5, dmg: 11, col: '#7fe3d6' }); sfx('bossShot'); } }
    if (e.t > (half ? 5 : 7)) { e.t = 0; for (const s of e.segs) if (s.idx % 3 === 1) { const a = Math.atan2(pl.y - s.y, pl.x - s.x); ebul.push({ x: s.x, y: s.y, vx: Math.cos(a) * 48, vy: Math.sin(a) * 48, t: 0, max: 5, r: 3, dmg: 9, col: '#b07ce8' }); } }
  }
  e.face = ux < 0 ? -1 : 1;
  if (d < e.r + 5) hurtPlayer(e.dmg, e);
  if (d > Math.hypot(LW, LH) * 0.9) { const [x, y] = ringPos(-20); e.x = x; e.y = y; if (e.trail) e.trail.length = 0; } // never lose the boss
}
function bossDown(e) {
  if (e.segs) for (const s of e.segs) { s.dead = true; burst(s.x, s.y, 8, '#7fe3d6'); }
  boss = null; shake = 12; hitstop = 0.25; ebul = [];
  for (let k = 0; k < 12; k++) dropGem(e.x + rnd(-20, 20), e.y + rnd(-20, 20), 10 + e.i * 10);
  if (e.kind === 'snake') { winT = 0.01; return; }
  items.push({ k: 'bigchest', x: e.x, y: e.y, t: 0 });
}
let winT = 0;
function updBullets(dt) {
  for (const b of ebul) {
    b.t += dt;
    if (b.home && b.t < b.home) { const a = Math.atan2(pl.y - b.y, pl.x - b.x), s = Math.hypot(b.vx, b.vy), c = Math.atan2(b.vy, b.vx), df = Math.atan2(Math.sin(a - c), Math.cos(a - c)), n = c + clamp(df, -2 * dt, 2 * dt); b.vx = Math.cos(n) * s; b.vy = Math.sin(n) * s; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (dist2(b.x, b.y, pl.x, pl.y) < (b.r + 3.5) ** 2) { hurtPlayer(b.dmg, b); b.t = b.max; }
  }
  ebul = ebul.filter((b) => b.t < b.max);
}
