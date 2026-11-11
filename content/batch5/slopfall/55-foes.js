// ---------- slop behaviour, bosses, enemy bullets ----------
function updFoes(dt) {
  const kd = Math.exp(-9 * dt);
  for (const e of foes) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt); e.t += dt;
    if (e.seg) continue; // snake segments follow their head (updBoss)
    if (e.spawnIn > 0) { e.spawnIn -= dt; continue; }
    if (e.vuln > 0) e.vuln -= dt; // sealed by a stamp: takes more damage
    if (e.bleed > 0) { e.bleed -= dt; e.bleedT = (e.bleedT || 0) - dt; if (e.bleedT <= 0) { e.bleedT = 0.5; curSrc = e.bleedSrc || 'scis'; hurt(e, e.bleedDmg); curSrc = null; if (e.dead) continue; } }
    if (e.prop) continue; // crates and barrels just stand there
    if (e.boss) { updBoss(e, dt); continue; }
    const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (e.guard && !e.woke) { if (d < 150 || st.charge >= st.need * 0.5) { e.woke = true; sfx('warn'); banner = { text: T.node.elite[1], t: 0 }; } else continue; } // elites wait at the gate until you come close or the gate is half charged
    const [ux, uy] = flowDir(e);
    let vx = 0, vy = 0;
    if (e.stun > 0) e.stun -= dt;
    else if (FOES[e.type].dasher) {
      if (e.dashing > 0) { e.dashing -= dt; vx = e.vx; vy = e.vy; if (rand() < 0.5) fx.push({ k: 'p', x: e.x, y: e.y, vx: 0, vy: 0, t: 0, max: 0.3, col: '#8fd66b' }); }
      else if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { e.dashing = 0.45; e.vx = dx / d * 150; e.vy = dy / d * 150; } }
      else { vx = ux * e.spd; vy = uy * e.spd; if (e.t > 2.6 && d < 130) { e.t = 0; e.wind = 0.35; } }
    } else if (FOES[e.type].shooter) {
      const want = d < 75 ? -1 : d > 110 ? 1 : 0; vx = (ux * want - uy * 0.6) * e.spd; vy = (uy * want + ux * 0.6) * e.spd;
      if (e.t > 2.4 && onScreen(e, -8)) { e.t = rnd(-0.4, 0); ebul.push({ x: e.x, y: e.y, vx: dx / d * 72, vy: dy / d * 72, t: 0, max: 4, r: 3, dmg: e.dmg + 2, col: '#e0524a' }); sfx('shot'); }
    } else { vx = ux * e.spd; vy = uy * e.spd; }
    if (e.slowT > 0) { e.slowT -= dt; vx *= 0.5; vy *= 0.5; } // slowed by ink, tea or staples
    if (st.B.hazard === 'paint' && tileAt(e.x, e.y) === 2) { vx *= 0.55; vy *= 0.55; } // gallery paint holds slop too
    e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt; e.kx *= kd; e.ky *= kd; pushOut(e, e.r * 0.8);
    e.anim += dt * (2 + e.spd / 25); if (vx) e.face = vx < 0 ? -1 : 1;
    if (d < e.r + 5) hurtPlayer(e.dmg, e);
    recycle(e);
  }
  // keep slop from piling into one point
  for (const e of foes) {
    if (e.dead || e.boss || e.seg || e.prop) continue;
    let n = 0;
    near(e.x, e.y, e.r * 2, (o) => {
      if (o === e || o.boss || o.seg) return; const dx = e.x - o.x, dy = e.y - o.y, d2 = dx * dx + dy * dy, m = e.r + o.r;
      if (d2 > 0.01 && d2 < m * m) { const d = Math.sqrt(d2), p = (m - d) * 0.25; e.x += dx / d * p; e.y += dy / d * p; }
      if (++n > 6) return false;
    });
  }
}

// ---------- bosses ----------
function spawnBoss(i) {
  const b = BOSSES[i], x = st.W / 2 * TS, y = 7 * TS;
  let hp = b.hp * hpScale(run.depth) / hpScale(5 + i * 5) * (1 + Math.max(0, pl.lv - 6 - i * 5) * 0.07);
  if (b.kind === 'snake' && run.choice === 'A') hp *= 1.3; if (b.kind === 'snake' && run.choice === 'B') hp *= 0.75;
  boss = { boss: true, kind: b.kind, i, x, y, hp, maxHp: hp, r: b.r, spd: b.spd, dmg: b.dmg, t: 0, a: Math.PI / 2, flash: 0, kx: 0, ky: 0, stun: 0, mode: 'walk', mt: 0, face: 1, anim: 0, spawnIn: 0, tele: [] };
  if (b.kind === 'mirror') boss.art = mirrorArt(pl.ci);
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
    if (e.t > 7) { e.t = 0; for (let k = 0; k < 6; k++) { const a = k / 6 * 7, x = e.x + Math.cos(a) * 30, y = e.y + Math.sin(a) * 30; if (!solid(x, y)) spawnFoe('hand', x, y); } }
  } else if (e.kind === 'box') {
    if (e.mode === 'walk') {
      e.x += ux * e.spd * dt; e.y += uy * e.spd * dt;
      if (e.mt > 2.2) { e.mt = 0; for (let k = -1; k <= 1; k++) { const a = Math.atan2(uy, ux) + k * 0.5; ebul.push({ x: e.x, y: e.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, t: 0, max: 4.5, r: 4, dmg: 11, col: '#f4f0e8', home: 1.6, mail: 1 }); } sfx('bossShot'); }
      if (e.t > 8) { e.t = 0; e.mode = 'wind'; e.mt = 0; }
      if (half && rand() < dt / 9) for (let k = 0; k < 8; k++) { const p = spawnSpot(40, 200); if (p) spawnFoe('glyph', p[0], p[1]); }
    } else if (e.mode === 'wind') { if (e.mt > 0.6) { e.mode = 'charge'; e.mt = 0; e.vx = ux * 165; e.vy = uy * 165; } }
    else if (e.mode === 'charge') { e.x += e.vx * dt; e.y += e.vy * dt; if (rand() < 0.6) burst(e.x, e.y, 1, '#e9e4ff'); if (e.mt > 0.75) { e.mode = 'walk'; e.mt = 0; bossShoot(e, 10, 45, rand() * 7, '#f4f0e8', 9); } }
  } else if (e.kind === 'mirror') { // a copy of you: telegraphed strokes, dashes, a rain of stamps
    e.face = ux < 0 ? -1 : 1;
    if (e.mode === 'walk') {
      const want = d > 70 ? 1 : d < 45 ? -1 : 0; e.x += (ux * want - uy * 0.5) * e.spd * dt; e.y += (uy * want + ux * 0.5) * e.spd * dt; pushOut(e, 6);
      if (e.mt > (half ? 1.6 : 2.2)) { e.mt = 0; const r = rand(); e.mode = r < 0.5 ? 'slash' : r < 0.78 ? 'dashw' : 'rain'; e.aim = Math.atan2(dy, dx);
        if (e.mode === 'rain') for (let k = 0; k < (half ? 5 : 3); k++) e.tele.push({ k: 'c', x: pl.x + rnd(-50, 50), y: pl.y + rnd(-40, 40), r: 22, t: 0, at: 0.95 + k * 0.14 });
        if (e.mode === 'slash') e.tele.push({ k: 'arc', a: e.aim, r: 52, t: 0, at: 0.65 }); }
      if (half && e.t > 7) { e.t = 0; for (let k = 0; k < 2; k++) { const p = spawnSpot(60, 200); if (p) spawnFoe('echo', p[0], p[1]); } }
    } else if (e.mode === 'slash' || e.mode === 'rain') { if (e.mt > (e.mode === 'rain' ? 1.6 : 0.7)) { e.mode = 'walk'; e.mt = 0; } }
    else if (e.mode === 'dashw') { if (e.mt > 0.5) { e.mode = 'dash'; e.mt = 0; e.vx = Math.cos(e.aim) * 230; e.vy = Math.sin(e.aim) * 230; sfx('dash'); } }
    else if (e.mode === 'dash') { e.x += e.vx * dt; e.y += e.vy * dt; pushOut(e, 6); fx.push({ k: 'ghostM', x: e.x, y: e.y, t: 0, max: 0.25, f: e.face }); if (e.mt > 0.5) { e.mode = 'walk'; e.mt = 0; } }
    for (const t of e.tele) {
      t.t += dt;
      if (!t.done && t.t >= t.at) {
        t.done = true; sfx(t.k === 'c' ? 'stamp' : 'slash'); shake = Math.max(shake, 3);
        if (t.k === 'c') { if (dist2(t.x, t.y, pl.x, pl.y) < t.r * t.r) hurtPlayer(e.dmg, t); burst(t.x, t.y, 8, '#7fe3d6'); }
        else { const ad = Math.atan2(Math.sin(Math.atan2(pl.y - e.y, pl.x - e.x) - t.a), Math.cos(Math.atan2(pl.y - e.y, pl.x - e.x) - t.a)); if (d < t.r && Math.abs(ad) < 1.15) hurtPlayer(e.dmg * 1.2, e); fx.push({ k: 'mslash', x: e.x, y: e.y, a: t.a, r: t.r, t: 0, max: 0.22 }); }
      }
    }
    e.tele = e.tele.filter((t) => t.t < t.at + 0.25);
  } else if (e.kind === 'snake') {
    const want = Math.atan2(dy, dx) + Math.sin(e.anim * 1.3) * 0.9, cur = e.a, diff = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
    e.a = cur + clamp(diff, -2.4 * dt, 2.4 * dt); const sp = e.spd * (half ? 1.45 : 1);
    e.x = clamp(e.x + Math.cos(e.a) * sp * dt, TS, (st.W - 1) * TS); e.y = clamp(e.y + Math.sin(e.a) * sp * dt, TS, (st.H - 1) * TS);
    e.trail.unshift({ x: e.x, y: e.y }); if (e.trail.length > 140) e.trail.length = 140;
    for (const s of e.segs) { const p = e.trail[Math.min(e.trail.length - 1, (s.idx + 1) * 7)]; s.x = p.x; s.y = p.y; if (dist2(s.x, s.y, pl.x, pl.y) < (s.r + 4) ** 2) hurtPlayer(e.dmg * 0.7, s); }
    if (e.mt > (half ? 3 : 4.2)) { e.mt = 0; e.spiral = 1.1; }
    if (e.spiral > 0) { e.spiral -= dt; if (rand() < dt * 22) { e.a2 = (e.a2 || 0) + 0.45; ebul.push({ x: e.x, y: e.y, vx: Math.cos(e.a2) * 58, vy: Math.sin(e.a2) * 58, t: 0, max: 5, r: 3.5, dmg: 11, col: '#7fe3d6' }); sfx('bossShot'); } }
    if (e.t > (half ? 5 : 7)) { e.t = 0; for (const s of e.segs) if (s.idx % 3 === 1) { const a = Math.atan2(pl.y - s.y, pl.x - s.x); ebul.push({ x: s.x, y: s.y, vx: Math.cos(a) * 48, vy: Math.sin(a) * 48, t: 0, max: 5, r: 3, dmg: 9, col: '#b07ce8' }); } }
  }
  if (e.kind !== 'mirror') e.face = ux < 0 ? -1 : 1;
  e.x = clamp(e.x, TS, (st.W - 1) * TS); e.y = clamp(e.y, TS, (st.H - 1) * TS);
  if (d < e.r + 5) hurtPlayer(e.dmg, e);
}
function bossDown(e) {
  if (e.segs) for (const s of e.segs) { s.dead = true; burst(s.x, s.y, 8, '#7fe3d6'); }
  boss = null; shake = 12; hitstop = 0.3; ebul = [];
  for (let k = 0; k < 14; k++) dropGem(e.x + rnd(-24, 24), e.y + rnd(-24, 24), 10 + e.i * 8);
  if (e.kind === 'snake') { winT = 0.01; return; }
  items.push({ k: 'bigchest', x: e.x, y: e.y, t: 0 });
  st.open = true; st.need = 0; banner = { text: T.gateOpen, t: 0 };
}
function updBullets(dt) {
  for (const b of ebul) {
    b.t += dt;
    if (b.home && b.t < b.home) { const a = Math.atan2(pl.y - b.y, pl.x - b.x), s = Math.hypot(b.vx, b.vy), c = Math.atan2(b.vy, b.vx), df = Math.atan2(Math.sin(a - c), Math.cos(a - c)), n = c + clamp(df, -2 * dt, 2 * dt); b.vx = Math.cos(n) * s; b.vy = Math.sin(n) * s; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (solid(b.x, b.y)) { b.t = b.max; if (fx.length < 600) fx.push({ k: 'p', x: b.x, y: b.y, vx: 0, vy: 0, t: 0, max: 0.2, col: b.col }); continue; } // walls block shots
    if (dist2(b.x, b.y, pl.x, pl.y) < (b.r + 3.5) ** 2) { hurtPlayer(b.dmg, b); b.t = b.max; }
  }
  ebul = ebul.filter((b) => b.t < b.max);
}
