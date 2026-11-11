// ---------- the curator: movement, dash, pickups ----------
function updPlayer(dt) {
  const m = moveInput(), sp = speed();
  pl.inv = Math.max(0, pl.inv - dt); pl.dashCd = Math.max(0, pl.dashCd - dt); pl.hurtFlash = Math.max(0, pl.hurtFlash - dt);
  if (hit.dash && pl.dashCd <= 0) {
    const dx = m.x || pl.dx, dy = m.y || pl.dy, d = Math.hypot(dx, dy) || 1;
    pl.dashT = 0.16; pl.dashCd = CHARS[pl.ci].dash; pl.dvx = dx / d * 250; pl.dvy = dy / d * 250; sfx('dash');
  }
  if (pl.dashT > 0) {
    pl.dashT -= dt; pl.x += pl.dvx * dt; pl.y += pl.dvy * dt;
    if (fx.length < 500) fx.push({ k: 'ghost', x: pl.x, y: pl.y, t: 0, max: 0.22, f: pl.face, fr: Math.floor(pl.anim) % 2 });
  } else {
    pl.x += (m.x * sp + pl.vx) * dt; pl.y += (m.y * sp + pl.vy) * dt;
  }
  pushOut(pl, 5);
  const kd = Math.exp(-10 * dt); pl.vx *= kd; pl.vy *= kd;
  if (st.B.hazard === 'glitch' && tileAt(pl.x, pl.y) === 2) { pl.glitchT = (pl.glitchT || 0) - dt; if (pl.glitchT <= 0) { pl.glitchT = 0.6; const iv = pl.inv; pl.inv = 0; hurtPlayer(3 + run.depth * 0.2); if (pl.hp > 0) pl.inv = Math.max(iv, 0.15); } }
  if (st.open && !st.cleared && dist2(pl.x, pl.y, st.exit.x, st.exit.y) < 18 * 18) { stageWon(); return; }
  pl.moving = Math.abs(m.x) + Math.abs(m.y) > 0.1;
  if (pl.moving) { pl.dx = m.x; pl.dy = m.y; pl.anim += dt * 7; if (Math.abs(m.x) > 0.15) pl.face = m.x < 0 ? -1 : 1; }
  if (pl.buff && (pl.buff.t -= dt) <= 0) pl.buff = null;
  updGimmicks(dt);
  const v = pasLv('vita'), rg = v * 0.3 + (CHARS[pl.ci].regen || 0); if (rg && pl.hp < pl.maxHp) { pl.regenAcc += dt * rg; if (pl.regenAcc >= 1) { pl.hp = Math.min(pl.maxHp, pl.hp + 1); pl.regenAcc -= 1; } }
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
      if (it.k === 'gold') { run.gold += 15; sfx('pick'); nums.push({ x: pl.x, y: pl.y - 12, v: '+15', t: 0, gold: 1 }); }
      if (it.k === 'chest' || it.k === 'bigchest') { items = items.filter((x) => x !== it); openChest(it.k === 'bigchest'); return; }
    }
  }
  items = items.filter((x) => !x.got);
}

// shrines charge while you stand on them; a vault wakes its guards and pays out once they are gone
function updGimmicks(dt) {
  updGims(dt);
  for (const sh of st.shrines) {
    if (sh.used) continue;
    if (dist2(sh.x, sh.y, pl.x, pl.y) < 15 * 15) { sh.charge += dt; if (sh.charge >= 1.5) useShrine(sh); } else sh.charge = Math.max(0, sh.charge - dt * 2);
  }
  const vt = st.vault; if (!vt) return;
  if (!vt.open && dist2(vt.x, vt.y, pl.x, pl.y) < 26 * 26) {
    vt.open = true; vt.guards = []; banner = { text: T.vault, t: 0 }; sfx('warn'); shake = Math.max(shake, 4);
    const n = 8 + Math.floor(run.depth / 2);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, [x, y] = floorNear(vt.x + Math.cos(a) * 64, vt.y + Math.sin(a) * 64); const e = spawnFoe(weighted(st.B.mix), x, y); vt.guards.push(e); }
    const [x, y] = floorNear(vt.x, vt.y - 70); const el = spawnFoe(weighted(st.B.mix), x, y, { elite: true }); el.xp = 0; vt.guards.push(el);
  }
  if (vt.open && !vt.paid && vt.guards.every((e) => e.dead)) {
    vt.paid = true; items.push({ k: 'chest', x: vt.x, y: vt.y, t: 0 }, { k: 'gold', x: vt.x - 12, y: vt.y + 6, t: 0 }, { k: 'gold', x: vt.x + 12, y: vt.y + 6, t: 0 });
    burst(vt.x, vt.y, 24, '#f6d55c'); sfx('chest'); banner = { text: T.vaultDone, t: 0 };
  }
}
function useShrine(sh) {
  sh.used = true; sfx('chest'); burst(sh.x, sh.y, 20, SHRINE_COL[sh.k]); banner = { text: T.shrine[sh.k], t: 0 };
  if (sh.k === 'mend') { pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.5); sfx('heal'); }
  else { pl.buff = { k: sh.k, t: 20 }; if (sh.k === 'magnet') for (const gm of gems) gm.mag = true; }
}
const SHRINE_COL = { might: '#fb7185', haste: '#5eead4', magnet: '#a78bfa', mend: '#8fd66b' };

// ---------- weapons ----------
const angTo = (e) => Math.atan2(e.y - pl.y, e.x - pl.x);
const facing = () => Math.atan2(pl.dy, pl.dx);
function segHit(x1, y1, x2, y2, w, dmg, kb) { // everything along a line segment
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  near(mx, my, len / 2 + 12, (e) => { const px = e.x - x1, py = e.y - y1, t = clamp(px * ux + py * uy, 0, len), qx = x1 + ux * t - e.x, qy = y1 + uy * t - e.y; if (qx * qx + qy * qy < (w + e.r) ** 2) hurt(e, dmg, ux, uy, kb); });
}
function updWeapons(dt) {
  const am0 = areaMul(), cm0 = cdMul(), extra0 = amtAdd();
  for (const w of pl.weapons) {
    // skill tree mods: dmg/area/cd are fractions, amt/chain/pierce are counts, the rest switch on special moves
    const m = w.m || {}, st = WEAPONS[w.id].st(w.lv), evoK = w.evo ? 1.4 : 1, am = am0 * (1 + (m.area || 0)), cm = cm0 * (1 - (m.cd || 0)), extra = extra0 + (m.amt || 0);
    st.dmg *= 1 + (m.dmg || 0); curSrc = w.id;
    w.t -= dt;
    if (w.id === 'brush') {
      if (w.q?.length) { w.qt -= dt; if (w.qt <= 0) { const a = w.q.shift(); w.qt = 0.11; slash(a, st, am, w.evo, m); } }
      if (w.t <= 0) {
        const tg = nearest(pl.x, pl.y, st.r * am + 16); // swing at the closest slop in reach, else where you face
        w.t = (w.evo ? 0.85 : st.cd) * cm; const a = tg ? angTo(tg) : facing(), n = st.amt + (st.back ? 1 : 0) + extra;
        w.q = []; for (let k = 0; k < n; k++) w.q.push(a + (k % 2) * Math.PI + Math.floor(k / 2) * 0.5); w.qt = 0;
      }
    } else if (w.id === 'hl') {
      const wid = 1 + (m.width || 0);
      if (w.evo) { // three beams that keep sweeping around
        w.ang += 2.1 * dt; w.ph -= dt; const n = 3 + extra, L = st.len * 1.1 * am;
        for (let k = 0; k < n; k++) { const a = w.ang + k / n * Math.PI * 2, x2 = pl.x + Math.cos(a) * L, y2 = pl.y + Math.sin(a) * L; fx.push({ k: 'beam', x1: pl.x, y1: pl.y, x2, y2, t: 0, max: dt * 1.5, w: 4 * am * wid, evo: 1 }); if (w.ph <= 0) segHit(pl.x, pl.y, x2, y2, 4 * am * wid, st.dmg * 0.55 * evoK, 0.3); }
        if (w.ph <= 0) w.ph = 0.16;
      } else if (w.t <= 0) {
        w.t = st.cd * cm; const tg = nearest(pl.x, pl.y, st.len * am), base = tg ? angTo(tg) : facing(), n = st.amt + extra, L = st.len * am;
        const dirs = m.cross ? [0, Math.PI / 2, -Math.PI / 2] : [0];
        for (const off of dirs) for (let k = 0; k < n; k++) {
          const a = base + off + (k - (n - 1) / 2) * 0.22, x2 = pl.x + Math.cos(a) * L, y2 = pl.y + Math.sin(a) * L;
          segHit(pl.x, pl.y, x2, y2, 3.5 * am * wid, st.dmg, 0.6); fx.push({ k: 'beam', x1: pl.x, y1: pl.y, x2, y2, t: 0, max: 0.22, w: 3.5 * am * wid });
          if (m.burn) shots.push({ k: 'line', x1: pl.x, y1: pl.y, x2, y2, t: 0, at: 0.45, w: 3.5 * am * wid, dmg: st.dmg * 0.5 });
        }
        sfx('shot');
      }
    } else if (w.id === 'stamp') {
      if (w.t <= 0) {
        w.t = st.cd * cm * (w.evo ? 0.85 : 1); const n = st.amt + extra, vis = foes.filter((e) => !e.dead && !e.seg && !e.prop && onScreen(e, -10));
        for (let k = 0; k < n; k++) { const e = vis.length ? pick(vis) : null, x = e ? e.x : pl.x + rnd(-60, 60), y = e ? e.y : pl.y + rnd(-50, 50); shots.push({ k: 'stamp', x, y, t: -k * 0.12, delay: 0.42, r: st.r * am * (w.evo ? 1.7 : 1), dmg: st.dmg * evoK, evo: w.evo, stun: 0.7 + (m.stun || 0), echo: m.echo, seal: m.seal }); }
      }
    } else if (w.id === 'scis') {
      w.ang += st.spin * (w.evo ? 1.3 : 1) * (1 + (m.spin || 0)) * dt; const n = (w.evo ? 6 : st.amt) + extra, R = st.r * am * (w.evo ? 1.25 + 0.55 * Math.sin(runT * 2.2) : 1), gap = m.rate ? 0.22 : 0.33;
      w.blades = [];
      for (let k = 0; k < n; k++) {
        const a = w.ang + k / n * Math.PI * 2, x = pl.x + Math.cos(a) * R, y = pl.y + Math.sin(a) * R; w.blades.push({ x, y, a });
        near(x, y, 8 * am, (e) => { if (runT - e.lastScis > gap && dist2(x, y, e.x, e.y) < (6 * am + e.r) ** 2) { e.lastScis = runT; hurt(e, st.dmg * evoK, Math.cos(a + 1.57), Math.sin(a + 1.57), 0.8); if (m.bleed && !e.prop) { e.bleed = 2; e.bleedDmg = st.dmg * evoK * 0.12; } } });
      }
    } else if (w.id === 'plane') {
      if (w.t <= 0) {
        w.t = st.cd * cm; const tg = nearest(pl.x, pl.y, 200), base = tg ? angTo(tg) : facing();
        const n = w.evo ? 8 + extra * 2 : st.amt + extra;
        for (let k = 0; k < n; k++) { const a = w.evo ? base + k / n * Math.PI * 2 : base + (k - (n - 1) / 2) * 0.35; shots.push({ k: 'plane', x: pl.x, y: pl.y, a, t: 0, max: m.long ? 6 : 3, dmg: st.dmg * evoK, pierce: (w.evo ? 3 : st.pierce) + (m.pierce || 0) + (m.long ? 2 : 0), hitSet: new Set(), tgt: null, rt: 0, spd: 1 + (m.speed || 0), bomb: m.bomb }); }
        sfx('shot');
      }
    } else if (w.id === 'eraser') {
      if (w.t <= 0) {
        w.t = st.cd * cm; const n = st.amt + extra, v = 160 * (1 + (m.speed || 0));
        for (let k = 0; k < n; k++) { const tg = nearest(pl.x, pl.y, 170), a = (tg ? angTo(tg) : facing()) + k * 0.4; shots.push({ k: 'eraser', x: pl.x, y: pl.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, v, t: 0, max: 1.6, dmg: st.dmg * evoK, chain: st.chain + (m.chain || 0), hitSet: new Set(), evo: w.evo, spin: 0, knock: m.knock, dust: m.dust }); }
      }
    } else fireNew(w, st, m, am, cm, extra, evoK, dt); // the twelve curator-only skills (62-skills.js)
    for (const s of shots) if (!s.src) s.src = w.id;
  }
  curSrc = null;
}
function slash(a, st, am, evo, m = {}) {
  const R = st.r * am * (evo ? 1.45 : 1), arc = evo ? Math.PI * 2 : 2.1, dmg = st.dmg * (evo ? 1.4 : 1); let hits = 0;
  near(pl.x, pl.y, R + 10, (e) => {
    const d = Math.hypot(e.x - pl.x, e.y - pl.y); if (d > R + e.r) return;
    const da = Math.atan2(Math.sin(Math.atan2(e.y - pl.y, e.x - pl.x) - a), Math.cos(Math.atan2(e.y - pl.y, e.x - pl.x) - a));
    if (!evo && Math.abs(da) >= arc / 2 + 0.2) return;
    const tgt = e.seg ? e.parent : e, finish = m.exec && !tgt.boss && !tgt.prop && tgt.hp < tgt.maxHp * m.exec; // execution: weak slop is gone in one stroke
    hurt(e, finish ? tgt.hp * 3 + 10 : dmg, (e.x - pl.x) / (d || 1), (e.y - pl.y) / (d || 1), 1.2); if (!e.prop) hits++;
  });
  if (m.leech && hits >= 3) { pl.hp = Math.min(pl.maxHp, pl.hp + 1); }
  if (m.wave) { const L = R * 2.6, x2 = pl.x + Math.cos(a) * L, y2 = pl.y + Math.sin(a) * L; segHit(pl.x, pl.y, x2, y2, 7 * am, dmg * 0.7, 1); fx.push({ k: 'beam', x1: pl.x, y1: pl.y, x2, y2, t: 0, max: 0.25, w: 7 * am, ink: 1 }); }
  fx.push({ k: 'slash', a, r: R, arc, t: 0, max: 0.2, evo }); sfx('slash');
}
function blast(x, y, r, dmg, col, m) { near(x, y, r + 10, (e) => { if (dist2(x, y, e.x, e.y) < (r + e.r) ** 2) (m ? hitWith(e, dmg, m, (e.x - x) / r, (e.y - y) / r, 0.8) : hurt(e, dmg, (e.x - x) / r, (e.y - y) / r, 0.8)); }); fx.push({ k: 'blast', x, y, r, t: 0, max: 0.3, col }); }
function updShots(dt) {
  for (const s of shots) {
    s.t += dt; curSrc = s.src || null;
    if (s.k === 'stamp') {
      if (s.t >= s.delay && !s.done) {
        s.done = true; shake = Math.max(shake, s.evo ? 4 : 2); sfx('stamp');
        near(s.x, s.y, s.r + 10, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (s.r + e.r) ** 2) { hurt(e, s.dmg, 0, 0, 0); if (!e.boss && !e.seg) e.stun = s.stun || 0.7; if (s.seal) e.vuln = 3; } });
        fx.push({ k: 'mark', x: s.x, y: s.y, r: s.r, t: 0, max: s.evo ? 2.5 : 0.7, evo: s.evo });
        burst(s.x, s.y, 8, '#e0524a');
        if (s.evo) { s.burn = 2.5; s.bt = 0; }
        if (s.echo && !s.small) for (let k = 0; k < 2; k++) shots.push({ k: 'stamp', x: s.x + rnd(-40, 40), y: s.y + rnd(-30, 30), t: 0, delay: 0.3 + k * 0.1, r: s.r * 0.6, dmg: s.dmg * 0.5, stun: s.stun, seal: s.seal, small: true, src: s.src });
      }
      if (s.burn > 0) { s.burn -= dt; s.bt -= dt; if (s.bt <= 0) { s.bt = 0.3; near(s.x, s.y, s.r + 10, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (s.r + e.r) ** 2) hurt(e, s.dmg * 0.18, 0, 0, 0); }); } }
      if (s.done && !(s.burn > 0)) s.dead = true;
    } else if (s.k === 'line') { // the highlighter's after-image burns once more
      if (s.t >= s.at) { s.dead = true; segHit(s.x1, s.y1, s.x2, s.y2, s.w, s.dmg, 0.2); fx.push({ k: 'beam', x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, t: 0, max: 0.18, w: s.w, burn: 1 }); }
    } else if (s.k === 'plane') {
      s.rt -= dt; if (s.rt <= 0 || !s.tgt || s.tgt.dead) { s.rt = 0.2; s.tgt = null; let bd = 160 * 160; for (const e of foes) { if (e.dead || e.prop || s.hitSet.has(e)) continue; const d = dist2(s.x, s.y, e.x, e.y); if (d < bd) { bd = d; s.tgt = e; } } }
      if (s.tgt) { const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x), df = Math.atan2(Math.sin(want - s.a), Math.cos(want - s.a)); s.a += clamp(df, -4.5 * s.spd * dt, 4.5 * s.spd * dt); }
      s.x += Math.cos(s.a) * 135 * s.spd * dt; s.y += Math.sin(s.a) * 135 * s.spd * dt;
      near(s.x, s.y, 10, (e) => { if (s.dead || s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + 4) ** 2) return; s.hitSet.add(e); hurt(e, s.dmg, Math.cos(s.a), Math.sin(s.a), 0.6); if (--s.pierce < 0) s.dead = true; });
      if (s.t > s.max) s.dead = true;
      if (s.dead && s.bomb) blast(s.x, s.y, 26, s.dmg * 0.8, '#f4f0e8');
    } else if (s.k === 'eraser') {
      s.x += s.vx * dt; s.y += s.vy * dt; s.spin += dt * 14;
      near(s.x, s.y, 10, (e) => {
        if (s.dead || s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + 4) ** 2) return;
        s.hitSet.add(e); hurt(e, s.dmg, s.vx / s.v, s.vy / s.v, s.knock ? 1.8 : 0.7); if (s.knock && !e.boss && !e.seg) e.stun = Math.max(e.stun, 0.3);
        if (s.dust) blast(s.x, s.y, 16, s.dmg * 0.4, '#ff7ab8');
        if (s.evo) { s.dead = true; shots.push({ k: 'hole', x: s.x, y: s.y, t: 0, max: 1.7, dmg: s.dmg, tick: 0, src: s.src }); return false; }
        if (--s.chain < 0) { s.dead = true; return false; }
        let nx = null, bd = 80 * 80; for (const o of foes) { if (o.dead || o.prop || s.hitSet.has(o)) continue; const d = dist2(s.x, s.y, o.x, o.y); if (d < bd) { bd = d; nx = o; } }
        if (!nx) { s.dead = true; return false; } const a = Math.atan2(nx.y - s.y, nx.x - s.x), v = s.v * 1.06; s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; s.t = 0; return false;
      });
      if (s.t > s.max) s.dead = true;
    } else if (s.k === 'hole') {
      const R = 48 * areaMul(); s.tick -= dt;
      near(s.x, s.y, R, (e) => { if (e.boss || e.seg || e.prop) return; const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < R) { e.x += dx / d * 55 * dt; e.y += dy / d * 55 * dt; } });
      if (s.tick <= 0) { s.tick = 0.25; near(s.x, s.y, 20, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (16 + e.r) ** 2) hurt(e, s.dmg * 0.35, 0, 0, 0); }); }
      if (s.t > s.max) { s.dead = true; near(s.x, s.y, 30, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (26 + e.r) ** 2) hurt(e, s.dmg * 1.2, 0, 0, 0); }); burst(s.x, s.y, 14, '#b07ce8'); sfx('stamp'); }
    } else updNewShot(s, dt);
  }
  curSrc = null;
  shots = shots.filter((s) => !s.dead);
}
