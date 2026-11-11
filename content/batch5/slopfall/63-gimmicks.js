// ---------- area gimmicks: every region has its own ----------
// Shared everywhere: crates, barrels (lit fuse, then a blast that sets off its neighbours), shrines, sealed vaults.
// Outskirts: billboards that topple onto whatever is under them.   Gallery: framed portals in pairs; paint slows slop too.
// Arcade: neon lasers sweeping rooms, slot machines that take gold.   Newsroom: printing-press conveyor belts.
// Mirror Valley: mirror shards that free echoes to fight for you.     Filter Tower: firewall gates that switch on and off.
Object.assign(FOES, { shard: { hp: 14, spd: 0, dmg: 0, r: 6, xp: 0, prop: 1 } });
const GIM_COL = { board: '#f0a03c', frame: '#e9c46a', laser: '#ff4fd8', slot: '#f6d55c', belt: '#d6c7a8', shard: '#7fe3d6', wall: '#fb7185' };

// called from genStage once the rooms exist (never in boss arenas)
function placeGimmicks(s, rooms, startR, exitR, d) {
  const W = s.W, others = rooms.filter((r) => r !== startR), mid = others.filter((r) => r !== exitR);
  const free = (x, y) => s.tiles[Math.floor(y / TS) * W + Math.floor(x / TS)] === 0;
  const spot = (r, m = 1) => ({ x: (r.x + irand(m, r.w - 1 - m) + 0.5) * TS, y: (r.y + irand(m, r.h - 1 - m) + 0.5) * TS });
  const big = (r) => r.w >= 9 && r.h >= 7, G = s.gims;
  const shuffled = (a) => a.map((r) => [rand(), r]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  if (s.biome === 'out') { // billboards: lean one way; the strip they would land on is their danger zone
    for (const r of shuffled(others).slice(0, irand(3, 5))) {
      const p = spot(r, 1); if (!free(p.x, p.y)) continue;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { for (let k = 1; k <= 4; k++) if (!free(p.x + dx * k * TS, p.y + dy * k * TS)) return false; return true; });
      if (dirs.length) G.push({ k: 'board', x: p.x, y: p.y, dir: pick(dirs), st: 'stand', t: 0, len: 4 * TS });
    }
  } else if (s.biome === 'gal') { // two pairs of frames, each pair in two different rooms
    const rs = shuffled(others).slice(0, 4);
    for (let i = 0; i + 1 < rs.length; i += 2) {
      const a = spot(rs[i], 2), b = spot(rs[i + 1], 2); if (!free(a.x, a.y) || !free(b.x, b.y)) continue;
      const col = PAINT[(i / 2) % 4], A = { k: 'frame', ...a, col, cd: 0 }, B = { k: 'frame', ...b, col, cd: 0 }; A.to = B; B.to = A; G.push(A, B);
    }
  } else if (s.biome === 'arc') { // sweeping lasers in the bigger rooms, a slot machine somewhere
    for (const r of shuffled(mid.filter(big)).slice(0, 2)) G.push({ k: 'laser', x: (r.cx + 0.5) * TS, y: (r.cy + 0.5) * TS, a: rand() * 7, spd: (rand() < 0.5 ? -1 : 1) * rnd(0.9, 1.3), len: Math.min(r.w, r.h) * 0.5 * TS + 6, tick: 0 });
    const r = pick(mid.length ? mid : others), p = spot(r, 1); if (free(p.x, p.y)) G.push({ k: 'slot', ...p, charge: 0, uses: 3, t: 0, show: null });
  } else if (s.biome === 'news') { // conveyor belts across rooms: they carry you, the slop and the gems
    for (const r of shuffled(others).slice(0, irand(2, 4))) {
      if (rand() < 0.5) { const ty = r.y + irand(1, r.h - 2); G.push({ k: 'belt', x0: r.x * TS, y0: ty * TS, x1: (r.x + r.w) * TS, y1: (ty + 1) * TS, dx: rand() < 0.5 ? -1 : 1, dy: 0 }); }
      else { const tx = r.x + irand(1, r.w - 2); G.push({ k: 'belt', x0: tx * TS, y0: r.y * TS, x1: (tx + 1) * TS, y1: (r.y + r.h) * TS, dx: 0, dy: rand() < 0.5 ? -1 : 1 }); }
    }
  } else if (s.biome === 'mir') { // mirror shards to break (they are props, see 75-scenes.js)
    for (let i = irand(4, 6); i > 0; i--) { const p = spot(pick(others), 1); if (free(p.x, p.y)) s.shards.push(p); }
  } else if (s.biome === 'tow') { // firewall gates: a line across a room that switches on for a while, with warning
    for (const r of shuffled(mid).slice(0, irand(2, 3))) {
      const horiz = rand() < 0.5, t0 = rand() * 6;
      if (horiz) { const ty = r.y + irand(1, r.h - 2); G.push({ k: 'wall', x0: r.x * TS, x1: (r.x + r.w) * TS, y0: (ty + 0.5) * TS, y1: (ty + 0.5) * TS, ph: t0, tick: 0 }); }
      else { const tx = r.x + irand(1, r.w - 2); G.push({ k: 'wall', x0: (tx + 0.5) * TS, x1: (tx + 0.5) * TS, y0: r.y * TS, y1: (r.y + r.h) * TS, ph: t0, tick: 0 }); }
    }
  }
}
// a firewall gate cycle: 3s off, 0.9s warning, 2.2s on
const wallState = (gm) => { const c = (st.t + gm.ph) % 6.1; return c < 3 ? 'off' : c < 3.9 ? 'warn' : 'on'; };
const segDist = (px, py, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1, t = clamp(((px - x0) * dx + (py - y0) * dy) / L, 0, 1); return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t)); };
function envHurt(e, dmg, kx = 0, ky = 0) { const prev = curSrc; curSrc = 'boom'; hurt(e, dmg, kx, ky, 1); curSrc = prev; }

// runs every frame from updGimmicks (60-weapons.js)
function updGims(dt) {
  const D = run.depth;
  for (const gm of st.gims) {
    if (gm.k === 'fuse') { // a barrel that was hit: it flashes, then goes off
      gm.t -= dt; if (gm.t <= 0 && !gm.done) { gm.done = true; barrelBoom(gm.x, gm.y); }
    } else if (gm.k === 'board') {
      if (gm.st === 'stand' && dist2(gm.x, gm.y, pl.x, pl.y) < 50 * 50) { gm.st = 'wobble'; gm.t = 0; sfx('warn'); }
      else if (gm.st === 'wobble' && (gm.t += dt) > 1.2) {
        gm.st = 'down'; shake = Math.max(shake, 6); sfx('boom'); const [dx, dy] = gm.dir, x1 = gm.x + dx * gm.len, y1 = gm.y + dy * gm.len;
        burst((gm.x + x1) / 2, (gm.y + y1) / 2, 24, '#f0a03c');
        for (const e of foes) if (!e.dead && !e.prop && segDist(e.x, e.y, gm.x, gm.y, x1, y1) < 14 + e.r) envHurt(e, 120 + D * 30, dx, dy);
        if (segDist(pl.x, pl.y, gm.x, gm.y, x1, y1) < 14) hurtPlayer(9 + D * 0.5, gm);
      }
    } else if (gm.k === 'frame') {
      gm.cd = Math.max(0, gm.cd - dt);
      if (gm.cd <= 0 && dist2(gm.x, gm.y, pl.x, pl.y) < 11 * 11) { // step in, come out of the other frame
        pl.x = gm.to.x; pl.y = gm.to.y + 1; cam.x = pl.x; cam.y = pl.y; gm.cd = gm.to.cd = 1.6; flow = null; flowT = 0;
        burst(gm.x, gm.y, 14, gm.col); burst(gm.to.x, gm.to.y, 14, gm.col); sfx('dash');
      }
    } else if (gm.k === 'laser') {
      gm.a += gm.spd * dt; gm.tick -= dt; const x1 = gm.x + Math.cos(gm.a) * gm.len, y1 = gm.y + Math.sin(gm.a) * gm.len;
      if (gm.tick <= 0) { gm.tick = 0.25; for (const e of foes) if (!e.dead && !e.prop && segDist(e.x, e.y, gm.x, gm.y, x1, y1) < 4 + e.r) envHurt(e, 16 + D * 4); }
      if (segDist(pl.x, pl.y - 4, gm.x, gm.y, x1, y1) < 5) hurtPlayer(5 + D * 0.4, gm);
    } else if (gm.k === 'slot') {
      gm.t += dt; if (gm.show && (gm.show.t += dt) > 2) gm.show = null;
      if (gm.uses > 0 && dist2(gm.x, gm.y, pl.x, pl.y) < 16 * 16) {
        gm.charge += dt;
        if (gm.charge >= 1) {
          gm.charge = -0.6; // a short pause before the next spin
          if (run.gold < 15) { banner = { text: T.slot.poor, t: 0 }; sfx('hurt'); }
          else { run.gold -= 15; gm.uses--; spinSlot(gm); }
        }
      } else gm.charge = Math.max(0, gm.charge - dt);
    } else if (gm.k === 'belt') { // carries everything on it
      const v = 58 * dt, on = (o) => o.x > gm.x0 && o.x < gm.x1 && o.y > gm.y0 && o.y < gm.y1;
      if (on(pl) && pl.dashT <= 0) { pl.x += gm.dx * v; pl.y += gm.dy * v; pushOut(pl, 5); }
      for (const e of foes) if (!e.dead && !e.prop && !e.boss && !e.seg && on(e)) { e.x += gm.dx * v * 1.2; e.y += gm.dy * v * 1.2; }
      for (const gem of gems) if (!gem.mag && on(gem)) { gem.x += gm.dx * v; gem.y += gm.dy * v; if (solid(gem.x, gem.y)) { gem.x -= gm.dx * v; gem.y -= gm.dy * v; } }
    } else if (gm.k === 'wall') {
      gm.state = wallState(gm); gm.tick -= dt;
      if (gm.state === 'on') {
        if (gm.tick <= 0) { gm.tick = 0.3; for (const e of foes) if (!e.dead && !e.prop && segDist(e.x, e.y, gm.x0, gm.y0, gm.x1, gm.y1) < 4 + e.r) envHurt(e, 28 + D * 6); }
        if (segDist(pl.x, pl.y - 3, gm.x0, gm.y0, gm.x1, gm.y1) < 6) hurtPlayer(6 + D * 0.4, { x: gm.x0 === gm.x1 ? gm.x0 : pl.x, y: gm.y0 === gm.y1 ? gm.y0 : pl.y }); // knock back from the line itself
      }
    }
  }
  st.gims = st.gims.filter((gm) => !(gm.k === 'fuse' && gm.done));
  // the first time each kind of gimmick comes into view, say what it does
  const seen = (run.gseen ||= {}), q = (run.hintQ ||= []), say1 = (k, x, y) => { if (!seen[k] && Math.abs(x - pl.x) < LW / 2 - 10 && Math.abs(y - pl.y) < LH / 2 - 10) { seen[k] = 1; q.push(T.gim[k]); } };
  for (const gm of st.gims) if (T.gim[gm.k]) say1(gm.k, gm.x ?? (gm.x0 + gm.x1) / 2, gm.y ?? (gm.y0 + gm.y1) / 2);
  for (const e of foes) if (e.prop && !e.dead) say1(e.type, e.x, e.y);
  for (const sh of st.shrines) if (!sh.used) say1('shrine', sh.x, sh.y);
  if (st.vault && !st.vault.open) say1('vault', st.vault.x, st.vault.y);
  if (q.length && (!banner || (!banner.long && banner.t > 1.2))) banner = { text: q.shift(), t: 0, long: 1 }; // one hint at a time
}
function barrelBoom(x, y) { // bigger than before, and it sets off barrels nearby (each with its own short fuse)
  const prev = curSrc; curSrc = 'boom'; shake = Math.max(shake, 6); sfx('boom'); fx.push({ k: 'blast', x, y, r: 52, t: 0, max: 0.4 }); burst(x, y, 22, '#fb923c');
  const dmg = 40 + run.depth * 12;
  near(x, y, 64, (o) => { if (dist2(x, y, o.x, o.y) < (52 + o.r) ** 2) hurt(o, dmg, (o.x - x) / 52, (o.y - y) / 52, 1.8); });
  if (dist2(x, y, pl.x, pl.y) < 38 * 38) hurtPlayer(6 + run.depth * 0.5, { x, y });
  curSrc = prev;
}
function spinSlot(gm) {
  sfx('pick'); const r = rand(); let k;
  if (r < 0.28) { k = 'chest'; items.push({ k: 'chest', x: gm.x, y: gm.y + 16, t: 0 }); sfx('chest'); }
  else if (r < 0.5) { k = 'food'; items.push({ k: 'kimbap', x: gm.x - 10, y: gm.y + 16, t: 0 }, { k: 'gold', x: gm.x + 10, y: gm.y + 16, t: 0 }); }
  else if (r < 0.72) { k = 'jackpot'; for (let i = 0; i < 6; i++) items.push({ k: 'gold', x: gm.x + rnd(-20, 20), y: gm.y + 14 + rnd(0, 14), t: 0 }); sfx('chest'); }
  else { k = 'swarm'; for (let i = 0; i < 10; i++) { const a = i / 10 * 7, [x, y] = floorNear(gm.x + Math.cos(a) * 80, gm.y + Math.sin(a) * 70); spawnFoe(pick(['eye', 'worm', 'glyph']), x, y).spawnIn = 0.5; } sfx('warn'); }
  gm.show = { k, t: 0 }; banner = { text: T.slot[k], t: 0 };
}
// a mirror shard breaks into two echoes that hunt slop for you for a while
function breakShard(e) {
  burst(e.x, e.y, 16, '#7fe3d6'); sfx('chest');
  for (let i = 0; i < 2; i++) shots.push({ k: 'ally', x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), t: 0, max: 12, hit: 0, face: 1, anim: rand() * 2, src: 'ally' });
}
const GIM_SHOT = {
  ally(s, dt) {
    s.hit -= dt; s.anim += dt * 6; const tg = nearest(s.x, s.y, 220);
    if (tg) { const dx = tg.x - s.x, dy = tg.y - s.y, d = Math.hypot(dx, dy) || 1; s.face = dx < 0 ? -1 : 1; if (d > 8) { s.x += dx / d * 85 * dt; s.y += dy / d * 85 * dt; pushOut(s, 4); }
      if (d < tg.r + 8 && s.hit <= 0) { s.hit = 0.35; envHurt(tg, 14 + run.depth * 3, dx / d, dy / d); } }
    else { const dx = pl.x - s.x, dy = pl.y - s.y, d = Math.hypot(dx, dy) || 1; if (d > 30) { s.x += dx / d * 80 * dt; s.y += dy / d * 80 * dt; pushOut(s, 4); } }
    if (s.t > s.max) { s.dead = true; burst(s.x, s.y, 8, '#7fe3d6'); }
  },
};
// floor-level gimmicks, drawn before the actors
function drawGims(t) {
  for (const gm of st.gims) {
    if (gm.k === 'belt') {
      const hz = gm.dx !== 0; g.fillStyle = '#15110d'; g.fillRect(gm.x0, gm.y0 + (hz ? 2 : 0), gm.x1 - gm.x0, gm.y1 - gm.y0 - (hz ? 4 : 0));
      g.fillStyle = '#8a7a5c'; if (hz) { g.fillRect(gm.x0, gm.y0 + 2, gm.x1 - gm.x0, 1); g.fillRect(gm.x0, gm.y1 - 3, gm.x1 - gm.x0, 1); } else { g.fillRect(gm.x0 + 1, gm.y0, 1, gm.y1 - gm.y0); g.fillRect(gm.x1 - 2, gm.y0, 1, gm.y1 - gm.y0); }
      g.fillStyle = '#f4e9c8';
      const horiz = gm.dx !== 0, len = horiz ? gm.x1 - gm.x0 : gm.y1 - gm.y0, off = ((t * 58 * (gm.dx + gm.dy)) % 12 + 12) % 12;
      for (let p = off; p < len; p += 12) { // chevrons that move with the belt
        const x = horiz ? gm.x0 + p : (gm.x0 + gm.x1) / 2, y = horiz ? (gm.y0 + gm.y1) / 2 : gm.y0 + p, s = horiz ? gm.dx : gm.dy;
        g.globalAlpha = 0.9; if (horiz) { g.fillRect(x, y - 3, 1, 2); g.fillRect(x + s, y - 1, 1, 2); g.fillRect(x, y + 1, 1, 2); } else { g.fillRect(x - 3, y, 2, 1); g.fillRect(x - 1, y + s, 2, 1); g.fillRect(x + 1, y, 2, 1); } g.globalAlpha = 1;
      }
    } else if (gm.k === 'wall') {
      const s = gm.state || 'off'; g.fillStyle = '#434b58'; g.fillRect(gm.x0 - 3, gm.y0 - 3, 6, 6); g.fillRect(gm.x1 - 3, gm.y1 - 3, 6, 6); g.fillStyle = s === 'off' ? '#7f1d1d' : '#fb7185'; g.fillRect(gm.x0 - 1, gm.y0 - 1, 2, 2); g.fillRect(gm.x1 - 1, gm.y1 - 1, 2, 2);
      if (s === 'off') { g.strokeStyle = 'rgba(251,113,133,.32)'; g.lineWidth = 1; g.setLineDash([2, 4]); }
      else if (s === 'warn') { g.strokeStyle = Math.floor(t * 10) % 2 ? 'rgba(251,113,133,.9)' : 'rgba(251,113,133,.3)'; g.lineWidth = 1; g.setLineDash([4, 3]); }
      else { g.strokeStyle = '#fb7185'; g.lineWidth = 3; g.setLineDash([]); }
      g.beginPath(); g.moveTo(gm.x0, gm.y0); g.lineTo(gm.x1, gm.y1); g.stroke(); if (s === 'on') { g.strokeStyle = '#ffe4e6'; g.lineWidth = 1; g.stroke(); } g.setLineDash([]);
    } else if (gm.k === 'frame') {
      const ready = gm.cd <= 0, k = 0.5 + Math.sin(t * 3 + gm.x) * 0.5;
      g.fillStyle = '#0b0c10'; g.beginPath(); g.ellipse(gm.x, gm.y + 2, 10, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#5a4a3c'; g.fillRect(gm.x - 8, gm.y - 20, 16, 18); g.fillStyle = gm.col; g.globalAlpha = ready ? 0.65 + k * 0.35 : 0.25; g.fillRect(gm.x - 6, gm.y - 18, 12, 14); g.globalAlpha = 1;
      g.fillStyle = '#e9c46a'; g.fillRect(gm.x - 8, gm.y - 20, 16, 1); g.fillRect(gm.x - 8, gm.y - 3, 16, 1);
      if (ready) { g.strokeStyle = hexA(gm.col, 0.5 + k * 0.4); g.lineWidth = 1; g.beginPath(); g.ellipse(gm.x, gm.y + 2, 10 + k * 2, 5 + k, 0, 0, 7); g.stroke(); }
    } else if (gm.k === 'board') {
      const [dx, dy] = gm.dir;
      if (gm.st === 'wobble') { const k = gm.t / 1.2; g.fillStyle = `rgba(240,160,60,${0.15 + k * 0.3})`; const x1 = gm.x + dx * gm.len, y1 = gm.y + dy * gm.len; g.fillRect(Math.min(gm.x, x1) - (dy ? 12 : 0), Math.min(gm.y, y1) - (dx ? 12 : 0), Math.abs(x1 - gm.x) + (dy ? 24 : 0), Math.abs(y1 - gm.y) + (dx ? 24 : 0)); }
      if (gm.st === 'down') { // lying on the ground
        g.save(); g.translate(gm.x, gm.y); g.rotate(Math.atan2(dy, dx)); g.fillStyle = '#3b3550'; g.fillRect(0, -8, gm.len, 16); g.fillStyle = '#f0a03c'; g.fillRect(4, -6, gm.len - 8, 12); g.fillStyle = '#1d1a26'; g.fillRect(10, -2, gm.len - 24, 2); g.restore();
      } else { // standing, leaning (and shaking when about to fall)
        const wob = gm.st === 'wobble' ? Math.sin(gm.t * 30) * 2 : 0, lean = dx * 2 + wob;
        g.fillStyle = '#4a4458'; g.fillRect(gm.x - 1, gm.y - 14, 2, 14);
        g.fillStyle = '#3b3550'; g.fillRect(gm.x - 13 + lean, gm.y - 34, 26, 20); g.fillStyle = '#f0a03c'; g.fillRect(gm.x - 11 + lean, gm.y - 32, 22, 16);
        g.fillStyle = '#1d1a26'; g.fillRect(gm.x - 7 + lean, gm.y - 27, 14, 2); g.fillRect(gm.x - 7 + lean, gm.y - 23, 9, 2);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(gm.x + dx * 6 - 8, gm.y + dy * 6 - 2, 16, 4);
      }
    } else if (gm.k === 'laser') {
      const x1 = gm.x + Math.cos(gm.a) * gm.len, y1 = gm.y + Math.sin(gm.a) * gm.len;
      g.lineCap = 'round'; g.strokeStyle = 'rgba(255,79,216,.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(gm.x, gm.y - 4); g.lineTo(x1, y1 - 4); g.stroke();
      g.strokeStyle = '#ffd6f5'; g.lineWidth = 1.5; g.stroke(); g.lineCap = 'butt';
      g.fillStyle = '#25133f'; g.beginPath(); g.arc(gm.x, gm.y, 6, 0, 7); g.fill(); g.fillStyle = '#ff4fd8'; g.beginPath(); g.arc(gm.x, gm.y - 4, 3, 0, 7); g.fill();
    } else if (gm.k === 'slot') {
      shadow(gm.x, gm.y + 4, 9); const x = gm.x, y = gm.y;
      g.fillStyle = '#3a1f63'; g.fillRect(x - 9, y - 24, 18, 26); g.fillStyle = '#ff4fd8'; g.fillRect(x - 9, y - 24, 18, 2);
      g.fillStyle = '#0b0618'; g.fillRect(x - 7, y - 18, 14, 8);
      const roll = gm.charge > 0 ? Math.floor(t * 20) : 0, sym = ['#f6d55c', '#22d3ee', '#fb7185', '#8fd66b'];
      for (let i = 0; i < 3; i++) { g.fillStyle = gm.show ? (gm.show.k === 'swarm' ? '#fb7185' : '#f6d55c') : sym[(roll + i * 3 + (gm.uses * 7)) % 4]; g.fillRect(x - 6 + i * 4.5, y - 16, 3, 4); }
      g.fillStyle = '#f6d55c'; g.fillRect(x + 9, y - 20, 2, 8); g.fillStyle = '#e0524a'; g.fillRect(x + 8, y - 22, 4, 3);
      if (gm.charge > 0) { g.strokeStyle = '#f6d55c'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - 10, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * gm.charge); g.stroke(); }
      if (gm.uses <= 0) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x - 9, y - 24, 18, 26); }
    } else if (gm.k === 'fuse') { // the lit barrel, blinking faster before it blows
      const k = 1 - gm.t / 0.55, on = Math.floor(t * (8 + k * 20)) % 2;
      g.fillStyle = on ? '#fff' : '#c2410c'; g.fillRect(gm.x - 6, gm.y - 11, 12, 14); g.fillStyle = '#f6d55c'; g.fillRect(gm.x - 1, gm.y - 15, 2, 4);
      g.strokeStyle = `rgba(251,146,60,${0.3 + k * 0.5})`; g.lineWidth = 1; g.beginPath(); g.arc(gm.x, gm.y, 52 * k, 0, 7); g.stroke();
    }
  }
}
function drawShard(e, t) {
  shadow(e.x, e.y + 5, 8); const x = Math.round(e.x), y = Math.round(e.y) - 4, fl = e.flash > 0, k = 0.5 + Math.sin(t * 4 + x) * 0.5;
  g.fillStyle = `rgba(127,227,214,${0.12 + 0.18 * k})`; g.beginPath(); g.arc(x, y - 5, 13, 0, 7); g.fill();
  g.fillStyle = fl ? '#fff' : '#b8fff5'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 8, y + 5); g.lineTo(x - 7, y + 5); g.closePath(); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#2f8f8a'; g.beginPath(); g.moveTo(x + 1, y - 12); g.lineTo(x + 6, y + 4); g.lineTo(x + 1, y + 4); g.closePath(); g.fill();
  if (Math.floor(t * 3 + x) % 3 === 0) { g.fillStyle = '#fff'; g.fillRect(x - 3, y - 10, 1, 3); g.fillRect(x - 4, y - 9, 3, 1); }
}
function drawAllies(t) {
  for (const s of shots) if (s.k === 'ally') {
    const fade = s.t > s.max - 1.5 && Math.floor(t * 10) % 2; if (fade) continue;
    shadow(s.x, s.y + 1, 5); g.globalAlpha = 0.85; spr(ART.echo[Math.floor(s.anim) % 2], s.x, s.y - 7, s.face < 0, false); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(s.x, s.y - 7, 9, 0, 7); g.stroke();
  }
}
// light: gimmicks glow in the dark so you can see them coming
function gimLight(hole, glow) {
  hole = hole || (() => {}); glow = glow || (() => {});
  for (const gm of st.gims) {
    if (gm.k === 'laser') { hole(gm.x, gm.y, gm.len + 10, 0.6); glow(gm.x, gm.y, 18, 'rgba(255,79,216,.3)'); }
    else if (gm.k === 'frame') { hole(gm.x, gm.y - 10, 26, 0.6); glow(gm.x, gm.y - 10, 16, hexA(gm.col, 0.35)); }
    else if (gm.k === 'slot') { hole(gm.x, gm.y - 10, 30, 0.7); glow(gm.x, gm.y - 12, 18, 'rgba(255,79,216,.3)'); }
    else if (gm.k === 'wall' && gm.state !== 'off') { hole((gm.x0 + gm.x1) / 2, (gm.y0 + gm.y1) / 2, Math.hypot(gm.x1 - gm.x0, gm.y1 - gm.y0) / 2 + 10, 0.5); }
    else if (gm.k === 'board' && gm.st !== 'down') hole(gm.x, gm.y - 20, 28, 0.5);
    else if (gm.k === 'fuse') glow(gm.x, gm.y - 4, 22, 'rgba(251,146,60,.45)');
  }
  for (const s of shots) if (s.k === 'ally') glow(s.x, s.y - 7, 14, 'rgba(127,227,214,.35)');
}
Object.assign(TXT.ko, {
  gim: {
    board: '쓰러지는 광고판: 가까이 가면 흔들리다 쓰러진다. 슬롭을 그 아래로 끌어들이자',
    frame: '액자 통로: 들어가면 같은 색 액자로 나온다',
    laser: '네온 레이저: 방을 돌며 닿는 모든 것을 태운다. 슬롭도 탄다',
    slot: '슬롯머신: 1초 서 있으면 금박 15로 한 판. 상자, 김밥, 대박, 아니면 습격',
    belt: '윤전기 벨트: 위에 올라선 것은 무엇이든 실려 간다',
    shard: '거울 조각: 깨면 메아리 둘이 나와 잠시 함께 싸운다',
    wall: '방화벽: 켜졌다 꺼진다. 깜빡이면 곧 켜진다. 슬롭도 막는다',
    barrel: '폭발 통: 맞으면 불이 붙어 곧 터지고, 옆 통에 옮겨붙는다',
    crate: '상자: 부수면 보석, 금박, 김밥이 나온다',
    shrine: '제단: 1.5초 서 있으면 힘을 빌려준다',
    vault: '봉인된 보관함: 다가가면 지키는 슬롭이 깨어난다. 다 지우면 상자',
  },
  slot: { chest: '슬롯: 상자!', food: '슬롯: 김밥과 금박', jackpot: '슬롯: 대박! 금박이 쏟아진다', swarm: '슬롯: 꽝! 슬롭이 몰려온다', poor: '금박 15가 필요해요' },
});
Object.assign(TXT.en, {
  gim: {
    board: 'Toppling billboard: it wobbles when you come close, then falls. Lure slop under it',
    frame: 'Framed passage: step in, come out of the frame of the same colour',
    laser: 'Neon laser: sweeps the room and burns everything it touches, slop included',
    slot: 'Slot machine: stand for 1s to spin for 15 gold leaf. A chest, food, a jackpot, or an ambush',
    belt: 'Press belt: anything standing on it gets carried along',
    shard: 'Mirror shard: break it and two echoes fight beside you for a while',
    wall: 'Firewall: switches on and off. Blinking means it is about to light. It stops slop too',
    barrel: 'Barrel: hit it and the fuse lights; it blows and sets off its neighbours',
    crate: 'Crate: break it for gems, gold leaf and food',
    shrine: 'Shrine: stand on it for 1.5s to borrow its power',
    vault: 'Sealed vault: its guards wake as you approach. Clear them for a chest',
  },
  slot: { chest: 'Slots: a chest!', food: 'Slots: food and gold leaf', jackpot: 'Slots: jackpot! Gold leaf everywhere', swarm: 'Slots: bust! Here comes the slop', poor: 'You need 15 gold leaf' },
});
