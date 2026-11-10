// ---------- the curator: movement, dash, pickups ----------
function updPlayer(dt) {
  const m = moveInput(), sp = speed();
  pl.inv = Math.max(0, pl.inv - dt); pl.dashCd = Math.max(0, pl.dashCd - dt); pl.hurtFlash = Math.max(0, pl.hurtFlash - dt);
  if (hit.dash && pl.dashCd <= 0) {
    const dx = m.x || pl.dx, dy = m.y || pl.dy, d = Math.hypot(dx, dy) || 1;
    pl.dashT = 0.16; pl.dashCd = 1.1; pl.dvx = dx / d * 250; pl.dvy = dy / d * 250; sfx('dash');
  }
  if (pl.dashT > 0) {
    pl.dashT -= dt; pl.x += pl.dvx * dt; pl.y += pl.dvy * dt;
    if (fx.length < 500) fx.push({ k: 'ghost', x: pl.x, y: pl.y, t: 0, max: 0.22, f: pl.face, fr: Math.floor(pl.anim) % 2 });
  } else {
    pl.x += (m.x * sp + pl.vx) * dt; pl.y += (m.y * sp + pl.vy) * dt;
  }
  const kd = Math.exp(-10 * dt); pl.vx *= kd; pl.vy *= kd;
  pl.moving = Math.abs(m.x) + Math.abs(m.y) > 0.1;
  if (pl.moving) { pl.dx = m.x; pl.dy = m.y; pl.anim += dt * 7; if (Math.abs(m.x) > 0.15) pl.face = m.x < 0 ? -1 : 1; }
  const v = pasLv('vita'); if (v && pl.hp < pl.maxHp) { pl.regenAcc += dt * v * 0.3; if (pl.regenAcc >= 1) { pl.hp = Math.min(pl.maxHp, pl.hp + 1); pl.regenAcc -= 1; } }
  // gems fly in once they are within reach
  const mr = magnetR(), mr2 = mr * mr;
  for (const gm of gems) {
    const dx = pl.x - gm.x, dy = pl.y - gm.y, d2 = dx * dx + dy * dy;
    if (!gm.mag && d2 < mr2) { gm.mag = true; gm.vx = -dx * 2; gm.vy = -dy * 2; }
    if (gm.mag) { const d = Math.sqrt(d2) || 1, a = 520 * dt; gm.vx = gm.vx * 0.9 + dx / d * a * 10; gm.vy = gm.vy * 0.9 + dy / d * a * 10; gm.x += gm.vx * dt; gm.y += gm.vy * dt; if (d < 7) { gm.got = true; gainXp(gm.v); sfx('gem'); } }
  }
  gems = gems.filter((x) => !x.got);
  for (const it of items) {
    it.t += dt;
    if (dist2(it.x, it.y, pl.x, pl.y) < 12 * 12) {
      it.got = true;
      if (it.k === 'kimbap') { pl.hp = Math.min(pl.maxHp, pl.hp + 30); sfx('heal'); nums.push({ x: pl.x, y: pl.y - 12, v: '+30', t: 0, heal: 1 }); }
      if (it.k === 'clip') { for (const gm of gems) gm.mag = true; sfx('pick'); }
      if (it.k === 'chest' || it.k === 'bigchest') { items = items.filter((x) => x !== it); openChest(it.k === 'bigchest'); return; }
    }
  }
  items = items.filter((x) => !x.got);
}

// ---------- weapons ----------
const angTo = (e) => Math.atan2(e.y - pl.y, e.x - pl.x);
const facing = () => Math.atan2(pl.dy, pl.dx);
function segHit(x1, y1, x2, y2, w, dmg, kb) { // everything along a line segment
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  near(mx, my, len / 2 + 12, (e) => { const px = e.x - x1, py = e.y - y1, t = clamp(px * ux + py * uy, 0, len), qx = x1 + ux * t - e.x, qy = y1 + uy * t - e.y; if (qx * qx + qy * qy < (w + e.r) ** 2) hurt(e, dmg, ux, uy, kb); });
}
function updWeapons(dt) {
  const am = areaMul(), cm = cdMul(), extra = amtAdd();
  for (const w of pl.weapons) {
    const st = WEAPONS[w.id].st(w.lv), evoK = w.evo ? 1.4 : 1;
    w.t -= dt;
    if (w.id === 'brush') {
      if (w.q?.length) { w.qt -= dt; if (w.qt <= 0) { const a = w.q.shift(); w.qt = 0.11; slash(a, st, am, w.evo); } }
      if (w.t <= 0) {
        const tg = nearest(pl.x, pl.y, st.r * am + 16); // swing at the closest slop in reach, else where you face
        w.t = (w.evo ? 0.85 : st.cd) * cm; const a = tg ? angTo(tg) : facing(), n = st.amt + (st.back ? 1 : 0) + extra;
        w.q = []; for (let k = 0; k < n; k++) w.q.push(a + (k % 2) * Math.PI + Math.floor(k / 2) * 0.5); w.qt = 0;
      }
    } else if (w.id === 'hl') {
      if (w.evo) { // three beams that keep sweeping around
        w.ang += 2.1 * dt; w.ph -= dt; const n = 3 + extra, L = st.len * 1.1 * am;
        for (let k = 0; k < n; k++) { const a = w.ang + k / n * Math.PI * 2, x2 = pl.x + Math.cos(a) * L, y2 = pl.y + Math.sin(a) * L; fx.push({ k: 'beam', x1: pl.x, y1: pl.y, x2, y2, t: 0, max: dt * 1.5, w: 4 * am, evo: 1 }); if (w.ph <= 0) segHit(pl.x, pl.y, x2, y2, 4 * am, st.dmg * 0.55 * evoK, 0.3); }
        if (w.ph <= 0) w.ph = 0.16;
      } else if (w.t <= 0) {
        w.t = st.cd * cm; const tg = nearest(pl.x, pl.y, st.len * am), base = tg ? angTo(tg) : facing(), n = st.amt + extra, L = st.len * am;
        for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.22, x2 = pl.x + Math.cos(a) * L, y2 = pl.y + Math.sin(a) * L; segHit(pl.x, pl.y, x2, y2, 3.5 * am, st.dmg, 0.6); fx.push({ k: 'beam', x1: pl.x, y1: pl.y, x2, y2, t: 0, max: 0.22, w: 3.5 * am }); }
        sfx('shot');
      }
    } else if (w.id === 'stamp') {
      if (w.t <= 0) {
        w.t = st.cd * cm * (w.evo ? 0.85 : 1); const n = st.amt + extra, vis = foes.filter((e) => !e.dead && !e.seg && onScreen(e, -10));
        for (let k = 0; k < n; k++) { const e = vis.length ? pick(vis) : null, x = e ? e.x : pl.x + rnd(-60, 60), y = e ? e.y : pl.y + rnd(-50, 50); shots.push({ k: 'stamp', x, y, t: -k * 0.12, delay: 0.42, r: st.r * am * (w.evo ? 1.7 : 1), dmg: st.dmg * evoK, evo: w.evo }); }
      }
    } else if (w.id === 'scis') {
      w.ang += st.spin * (w.evo ? 1.3 : 1) * dt; const n = (w.evo ? 6 : st.amt) + extra, R = st.r * am * (w.evo ? 1.25 + 0.55 * Math.sin(runT * 2.2) : 1);
      w.blades = [];
      for (let k = 0; k < n; k++) {
        const a = w.ang + k / n * Math.PI * 2, x = pl.x + Math.cos(a) * R, y = pl.y + Math.sin(a) * R; w.blades.push({ x, y, a });
        near(x, y, 8 * am, (e) => { if (runT - e.lastScis > 0.33 && dist2(x, y, e.x, e.y) < (6 * am + e.r) ** 2) { e.lastScis = runT; hurt(e, st.dmg * evoK, Math.cos(a + 1.57), Math.sin(a + 1.57), 0.8); } });
      }
    } else if (w.id === 'plane') {
      if (w.t <= 0) {
        w.t = st.cd * cm; const tg = nearest(pl.x, pl.y, 200), base = tg ? angTo(tg) : facing();
        const n = w.evo ? 8 + extra * 2 : st.amt + extra;
        for (let k = 0; k < n; k++) { const a = w.evo ? base + k / n * Math.PI * 2 : base + (k - (n - 1) / 2) * 0.35; shots.push({ k: 'plane', x: pl.x, y: pl.y, a, t: 0, max: 3, dmg: st.dmg * evoK, pierce: w.evo ? 3 : st.pierce, hitSet: new Set(), tgt: null, rt: 0 }); }
        sfx('shot');
      }
    } else if (w.id === 'eraser') {
      if (w.t <= 0) {
        w.t = st.cd * cm; const n = st.amt + extra;
        for (let k = 0; k < n; k++) { const tg = nearest(pl.x, pl.y, 170), a = (tg ? angTo(tg) : facing()) + k * 0.4; shots.push({ k: 'eraser', x: pl.x, y: pl.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, t: 0, max: 1.6, dmg: st.dmg * evoK, chain: st.chain, hitSet: new Set(), evo: w.evo, spin: 0 }); }
      }
    }
  }
}
function slash(a, st, am, evo) {
  const R = st.r * am * (evo ? 1.45 : 1), arc = evo ? Math.PI * 2 : 2.1, dmg = st.dmg * (evo ? 1.4 : 1);
  near(pl.x, pl.y, R + 10, (e) => {
    const d = Math.hypot(e.x - pl.x, e.y - pl.y); if (d > R + e.r) return;
    const da = Math.atan2(Math.sin(Math.atan2(e.y - pl.y, e.x - pl.x) - a), Math.cos(Math.atan2(e.y - pl.y, e.x - pl.x) - a));
    if (evo || Math.abs(da) < arc / 2 + 0.2) hurt(e, dmg, (e.x - pl.x) / (d || 1), (e.y - pl.y) / (d || 1), 1.2);
  });
  fx.push({ k: 'slash', a, r: R, arc, t: 0, max: 0.2, evo }); sfx('slash');
}
function updShots(dt) {
  for (const s of shots) {
    s.t += dt;
    if (s.k === 'stamp') {
      if (s.t >= s.delay && !s.done) {
        s.done = true; shake = Math.max(shake, s.evo ? 4 : 2); sfx('stamp');
        near(s.x, s.y, s.r + 10, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (s.r + e.r) ** 2) { hurt(e, s.dmg, 0, 0, 0); if (!e.boss && !e.seg) e.stun = 0.7; } });
        fx.push({ k: 'mark', x: s.x, y: s.y, r: s.r, t: 0, max: s.evo ? 2.5 : 0.7, evo: s.evo });
        burst(s.x, s.y, 8, '#e0524a');
        if (s.evo) { s.burn = 2.5; s.bt = 0; }
      }
      if (s.burn > 0) { s.burn -= dt; s.bt -= dt; if (s.bt <= 0) { s.bt = 0.3; near(s.x, s.y, s.r + 10, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (s.r + e.r) ** 2) hurt(e, s.dmg * 0.18, 0, 0, 0); }); } }
      if (s.done && !(s.burn > 0)) s.dead = true;
    } else if (s.k === 'plane') {
      s.rt -= dt; if (s.rt <= 0 || !s.tgt || s.tgt.dead) { s.rt = 0.2; s.tgt = null; let bd = 160 * 160; for (const e of foes) { if (e.dead || s.hitSet.has(e)) continue; const d = dist2(s.x, s.y, e.x, e.y); if (d < bd) { bd = d; s.tgt = e; } } }
      if (s.tgt) { const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x), df = Math.atan2(Math.sin(want - s.a), Math.cos(want - s.a)); s.a += clamp(df, -4.5 * dt, 4.5 * dt); }
      s.x += Math.cos(s.a) * 135 * dt; s.y += Math.sin(s.a) * 135 * dt;
      near(s.x, s.y, 10, (e) => { if (s.dead || s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + 4) ** 2) return; s.hitSet.add(e); hurt(e, s.dmg, Math.cos(s.a), Math.sin(s.a), 0.6); if (--s.pierce < 0) s.dead = true; });
      if (s.t > s.max) s.dead = true;
    } else if (s.k === 'eraser') {
      s.x += s.vx * dt; s.y += s.vy * dt; s.spin += dt * 14;
      near(s.x, s.y, 10, (e) => {
        if (s.dead || s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + 4) ** 2) return;
        s.hitSet.add(e); hurt(e, s.dmg, s.vx / 160, s.vy / 160, 0.7);
        if (s.evo) { s.dead = true; shots.push({ k: 'hole', x: s.x, y: s.y, t: 0, max: 1.7, dmg: s.dmg, tick: 0 }); return false; }
        if (--s.chain < 0) { s.dead = true; return false; }
        let nx = null, bd = 80 * 80; for (const o of foes) { if (o.dead || s.hitSet.has(o)) continue; const d = dist2(s.x, s.y, o.x, o.y); if (d < bd) { bd = d; nx = o; } }
        if (!nx) { s.dead = true; return false; } const a = Math.atan2(nx.y - s.y, nx.x - s.x); s.vx = Math.cos(a) * 170; s.vy = Math.sin(a) * 170; s.t = 0; return false;
      });
      if (s.t > s.max) s.dead = true;
    } else if (s.k === 'hole') {
      const R = 48 * areaMul(); s.tick -= dt;
      near(s.x, s.y, R, (e) => { if (e.boss || e.seg) return; const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < R) { e.x += dx / d * 55 * dt; e.y += dy / d * 55 * dt; } });
      if (s.tick <= 0) { s.tick = 0.25; near(s.x, s.y, 20, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (16 + e.r) ** 2) hurt(e, s.dmg * 0.35, 0, 0, 0); }); }
      if (s.t > s.max) { s.dead = true; near(s.x, s.y, 30, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (26 + e.r) ** 2) hurt(e, s.dmg * 1.2, 0, 0, 0); }); burst(s.x, s.y, 14, '#b07ce8'); sfx('stamp'); }
    }
  }
  shots = shots.filter((s) => !s.dead);
}
