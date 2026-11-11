// ---------- the curators' own skills ----------
// Each curator learns six skills and no two share any. The first six (brush, highlighter, stamp, scissors,
// paper plane, eraser) live in 40-data.js and 60-weapons.js; these are the other twelve.
// Mina (close and reckless): brush, scissors, cutter knife, ink trail, red-pen circle, tape.
// Doyun (aim and rhythm): highlighter, paper plane, strikethrough, stapler, comma mines, sticky-note turrets.
// Granny Ok (hold the ground): seal stamp, eraser, sunlight loupe, abacus beads, teapot, bell.
Object.assign(WEAPONS, {
  knife: { evoWith: 'coffee', st: (lv) => ({ dmg: 9 + lv * 3, cd: 0.95 - lv * 0.05, amt: 3 + (lv >= 3) + (lv >= 5), range: 95 + lv * 6 }) },
  ink: { evoWith: 'clip', st: (lv) => ({ dmg: 8 + lv * 3, cd: 0.32 - lv * 0.02, r: 13 + lv, dur: 2.2 + lv * 0.3 }) },
  aura: { evoWith: 'vita', st: (lv) => ({ dmg: 7 + lv * 3, r: 34 + lv * 3, tick: 0.4 }) },
  tape: { evoWith: 'copier', st: (lv) => ({ dmg: 12 + lv * 4, cd: 1.7 - lv * 0.08, amt: 1 + (lv >= 3) + (lv >= 5), range: 105 + lv * 8 }) },
  strike: { evoWith: 'loupe', st: (lv) => ({ dmg: 40 + lv * 14, cd: 2.3 - lv * 0.12, amt: 1 + (lv >= 3) + (lv >= 5), r: 14 }) },
  stapler: { evoWith: 'vita', st: (lv) => ({ dmg: 5 + lv * 2, cd: 0.34 - lv * 0.02, amt: 1 + (lv >= 4) }) },
  mine: { evoWith: 'clip', st: (lv) => ({ dmg: 36 + lv * 12, cd: 1.6 - lv * 0.08, r: 34 + lv * 3, max: 6 + lv }) },
  postit: { evoWith: 'shoes', st: (lv) => ({ dmg: 6 + lv * 2, cd: 6 - lv * 0.3, dur: 6 + lv * 0.5, max: 2 + (lv >= 4) }) },
  sun: { evoWith: 'loupe', st: (lv) => ({ dmg: 3 + lv * 1.6, range: 110 + lv * 6 }) },
  abacus: { evoWith: 'copier', st: (lv) => ({ dmg: 9 + lv * 3, cd: 1.9 - lv * 0.08, amt: 4 + (lv >= 3) * 2 + (lv >= 5) * 2, bounce: 2 + (lv >> 1) }) },
  tea: { evoWith: 'shoes', st: (lv) => ({ dmg: 18 + lv * 6, cd: 2.4 - lv * 0.1, amt: 1 + (lv >= 3) + (lv >= 5), r: 22 + lv * 2 }) },
  bell: { evoWith: 'coffee', st: (lv) => ({ dmg: 15 + lv * 6, cd: 4 - lv * 0.25, r: 70 + lv * 8 }) },
});
// two branches x three tiers. Shared keys: dmg/area/cd/dur/speed are fractions, amt/pierce/chain are counts.
// Switches: twin (fire again 0.2s later), boom (small blast on hit), slow, stunHit, bleed, exec, pull, leech, rate, seal, double
Object.assign(TREES, {
  knife: [[{ amt: 2 }, { pierce: 1 }, { boom: 1 }], [{ dmg: 0.25 }, { cd: 0.15 }, { bleed: 1 }]],
  ink: [[{ area: 0.25 }, { dur: 0.5 }, { slow: 1 }], [{ dmg: 0.3 }, { cd: 0.2 }, { boom: 1 }]],
  aura: [[{ area: 0.2 }, { area: 0.2 }, { pull: 1 }], [{ dmg: 0.3 }, { rate: 1 }, { leech: 1 }]],
  tape: [[{ amt: 1 }, { area: 0.3 }, { twin: 1 }], [{ dmg: 0.3 }, { speed: 0.3 }, { stunHit: 1 }]],
  strike: [[{ amt: 1 }, { area: 0.5 }, { chain: 2 }], [{ dmg: 0.3 }, { cd: 0.15 }, { exec: 0.25 }]],
  stapler: [[{ amt: 1 }, { pierce: 1 }, { twin: 1 }], [{ dmg: 0.25 }, { cd: 0.15 }, { slow: 1 }]],
  mine: [[{ amt: 2 }, { area: 0.3 }, { twin: 1 }], [{ dmg: 0.3 }, { cd: 0.2 }, { stunHit: 1 }]],
  postit: [[{ amt: 1 }, { dur: 0.5 }, { double: 1 }], [{ dmg: 0.3 }, { rate: 1 }, { slow: 1 }]],
  sun: [[{ amt: 1 }, { area: 0.3 }, { boom: 1 }], [{ dmg: 0.3 }, { rate: 1 }, { slow: 1 }]],
  abacus: [[{ amt: 2 }, { chain: 2 }, { twin: 1 }], [{ dmg: 0.3 }, { speed: 0.3 }, { boom: 1 }]],
  tea: [[{ area: 0.25 }, { dur: 0.5 }, { slow: 1 }], [{ dmg: 0.3 }, { cd: 0.15 }, { twin: 1 }]],
  bell: [[{ area: 0.2 }, { stunHit: 1 }, { twin: 1 }], [{ dmg: 0.3 }, { cd: 0.2 }, { seal: 1 }]],
});
Object.assign(ICONS, {
  knife: bake(['.......g', '......gw', '.....gw.', '....gw..', '...gw...', '..nn....', '.nn.....', 'nn......']),
  ink: bake(['...B....', '..BBB...', '.BBbBB..', '.BBBBB..', '..BBB...', '........', 'BB..BBB.', 'BBBBBBBB']),
  aura: bake(['..rrrr..', '.r....r.', 'r..rr..r', 'r.r..r.r', 'r.r..r.r', 'r..rr..r', '.r....r.', '..rrrr..']),
  tape: bake(['..gggg..', '.gGGGGg.', 'gGg..gGg', 'gG.kk.Gg', 'gG.kk.Gg', 'gGg..gGg', '.gGGGGg.', '..gggg..']),
  strike: bake(['r......r', '.r....r.', '..r..r..', 'wwwwwwww', '..r..r..', '.r....r.', 'r......r', '........']),
  stapler: bake(['........', '.GGGGGG.', 'GggggggG', 'GGGGGGGG', '.....kk.', '.GGGGGGG', 'Gggggggg', '........']),
  mine: bake(['..kk....', '.kkkk...', 'kkrrkk..', 'kkrrkk..', '.kkkk...', '..kk.k..', '.....k..', '....k...']),
  postit: bake(['yyyyyyy.', 'yvvvvvy.', 'yyyyyyy.', 'yvvvvy..', 'yyyyyy..', 'yvvvy...', 'yyyyy...', '........']),
  sun: bake(['...y....', '.y.y.y..', '..yyy...', 'yyyvyyy.', '..yyy...', '.y.y.y..', '...y....', '........']),
  abacus: bake(['nnnnnnnn', 'n.ro.r.n', 'nnnnnnnn', 'n.o.ro.n', 'nnnnnnnn', 'n.r.o.rn', 'nnnnnnnn', '........']),
  tea: bake(['..ll....', '.llll.l.', 'lllllll.', 'lLlllll.', 'lllllll.', '.LLLLL..', '........', '........']),
  bell: bake(['...y....', '..yyy...', '.yyyyy..', '.yyyyy..', 'yyyyyyy.', 'yyyyyyy.', '...n....', '........']),
});

// a hit that carries the skill tree's switches along
function hitWith(e, dmg, m, kx = 0, ky = 0, kb = 0.6) {
  hurt(e, dmg, kx, ky, kb); if (e.dead || e.prop) return;
  const tgt = e.seg ? e.parent : e;
  if (m.slow) tgt.slowT = 1.5;
  if (m.stunHit && !tgt.boss) tgt.stun = Math.max(tgt.stun || 0, 0.45);
  if (m.seal) tgt.vuln = 3;
  if (m.bleed) { tgt.bleed = 2; tgt.bleedDmg = dmg * 0.12; tgt.bleedSrc = curSrc; }
}
const visibleFoes = () => foes.filter((e) => !e.dead && !e.prop && !e.seg && e.spawnIn <= 0 && onScreen(e, -10));
const CONT = { ink: 1, aura: 1, sun: 1 }; // these work every frame instead of on a cooldown
function fireNew(w, st, m, am, cm, extra, evoK, dt) {
  const f = FIRE[w.id]; if (!f) return;
  if (CONT[w.id]) return f(w, st, m, am, extra, evoK, dt, cm);
  if (w.t <= 0) { w.t = st.cd * cm * (w.evo ? 0.8 : 1); f(w, st, m, am, extra, evoK); if (m.twin) w.tw = 0.2; }
  if (w.tw > 0 && (w.tw -= dt) <= 0) f(w, st, m, am, extra, evoK);
}
const FIRE = {
  knife(w, st, m, am, extra, evoK) { // a fan of short blades, or a full circle once evolved
    const tg = nearest(pl.x, pl.y, 160), base = tg ? angTo(tg) : facing(), n = w.evo ? 12 + extra * 2 : st.amt + extra;
    for (let k = 0; k < n; k++) { const a = w.evo ? base + k / n * Math.PI * 2 : base + (k - (n - 1) / 2) * 0.16; shots.push({ k: 'knife', x: pl.x, y: pl.y - 3, a, v: 270, t: 0, max: st.range * am / 270, dmg: st.dmg * evoK, pierce: (w.evo ? 2 : 0) + (m.pierce || 0), hitSet: new Set(), m }); }
    sfx('slash');
  },
  ink(w, st, m, am, extra, evoK, dt, cm) { // puddles of ink behind you while you move (anywhere, once evolved)
    w.acc = (w.acc || 0) + dt; if (!(pl.moving || w.evo) || w.acc < st.cd * cm) return; w.acc = 0;
    if (shots.filter((s) => s.k === 'puddle').length > 44) return;
    shots.push({ k: 'puddle', col: 'ink', x: pl.x, y: pl.y + 2, r: st.r * am * (w.evo ? 1.8 : 1), t: 0, max: st.dur * (1 + (m.dur || 0)), dmg: st.dmg * evoK, tick: 0, m });
  },
  aura(w, st, m, am, extra, evoK, dt) { // a red circle that burns harder the more you bleed
    const R = st.r * am * (w.evo ? 1.5 : 1); w.R = R; w.tick = (w.tick || 0) - dt; if (w.tick > 0) return;
    w.tick = st.tick * (m.rate ? 0.7 : 1); const rk = 1 + 1.5 * (1 - pl.hp / pl.maxHp); let n = 0;
    near(pl.x, pl.y, R + 10, (e) => {
      if (dist2(e.x, e.y, pl.x, pl.y) > (R + e.r) ** 2) return; hitWith(e, st.dmg * evoK * rk, m, 0, 0, 0); if (!e.prop) n++;
      if (m.pull && !e.boss && !e.seg && !e.prop) { e.x += (pl.x - e.x) * 0.06; e.y += (pl.y - e.y) * 0.06; }
    });
    if ((w.evo || m.leech) && n >= 3) pl.hp = Math.min(pl.maxHp, pl.hp + 0.5);
  },
  tape(w, st, m, am, extra, evoK) { // a roll of tape that flies out and comes back
    const n = st.amt + extra + (w.evo ? 3 : 0), tg = nearest(pl.x, pl.y, 200), base = tg ? angTo(tg) : facing();
    for (let k = 0; k < n; k++) shots.push({ k: 'tape', x: pl.x, y: pl.y - 3, a: base + k / n * Math.PI * 2, out: st.range * am, d: 0, back: false, v: 170 * (1 + (m.speed || 0)), t: 0, dmg: st.dmg * evoK, hitSet: new Set(), m, size: w.evo ? 1.6 : 1, spin: 0 });
    sfx('dash');
  },
  strike(w, st, m, am, extra, evoK) { // marks the toughest slop on screen, then strikes it out
    const vis = visibleFoes().sort((a, b) => b.hp - a.hp); if (!vis.length) { w.t = 0.2; return; }
    const n = (w.evo ? 5 : st.amt) + extra;
    for (let k = 0; k < n; k++) { const e = vis[k % vis.length]; shots.push({ k: 'strike', tgt: e, x: e.x, y: e.y, t: 0, at: 0.7, dmg: st.dmg * evoK, r: st.r * am * (w.evo ? 2 : 1), m, hops: m.chain || 0 }); }
  },
  stapler(w, st, m, am, extra, evoK) { // quick staples at the nearest slop
    const tg = nearest(pl.x, pl.y, 210), base = tg ? angTo(tg) : facing(), n = (w.evo ? 3 : st.amt) + extra;
    for (let k = 0; k < n; k++) shots.push({ k: 'staple', x: pl.x, y: pl.y - 3, a: base + (k - (n - 1) / 2) * 0.12 + rnd(-0.04, 0.04), v: 300, t: 0, max: 0.75, dmg: st.dmg * evoK, pierce: (w.evo ? 1 : 0) + (m.pierce || 0), hitSet: new Set(), m });
    sfx('shot');
  },
  mine(w, st, m, am, extra, evoK) { // drops a comma; it goes off when slop steps near
    if (shots.filter((s) => s.k === 'mine').length >= st.max + extra + (m.amt || 0) * 2) return;
    shots.push({ k: 'mine', x: pl.x + rnd(-6, 6), y: pl.y + rnd(-4, 6), t: 0, arm: 0.5, r: st.r * am, dmg: st.dmg * evoK, m, evo: w.evo, max: 30 });
  },
  postit(w, st, m, am, extra, evoK) { // sticks a note that shoots for a while
    const mine = shots.filter((s) => s.k === 'turret'); if (mine.length >= st.max + extra + (m.amt || 0)) mine[0].dead = true;
    shots.push({ k: 'turret', x: pl.x, y: pl.y, t: 0, max: st.dur * (1 + (m.dur || 0)), fire: 0.2, dmg: st.dmg * evoK, m, evo: w.evo, rate: m.rate ? 0.35 : 0.5, reach: 140 * am });
  },
  sun(w, st, m, am, extra, evoK, dt) { // a beam of focused sunlight on the nearest slop; held long enough, it ignites
    const R = st.range * am, n = (w.evo ? 3 : 1) + (m.amt || 0);
    w.beams = visibleFoes().filter((e) => dist2(e.x, e.y, pl.x, pl.y) < R * R).sort((a, b) => dist2(a.x, a.y, pl.x, pl.y) - dist2(b.x, b.y, pl.x, pl.y)).slice(0, n);
    w.tick = (w.tick || 0) - dt; if (w.tick > 0) return; w.tick = m.rate ? 0.1 : 0.15;
    for (const e of w.beams) {
      hitWith(e, st.dmg * evoK, m, 0, 0, 0); e.heat = (e.heat || 0) + 0.15;
      if (e.heat > 1.2) { e.heat = 0; blast(e.x, e.y, m.boom ? 28 : 14, st.dmg * evoK * 3, '#fde047'); }
    }
  },
  abacus(w, st, m, am, extra, evoK) { // beads that fly out and bounce off walls
    const n = (w.evo ? 12 : st.amt) + extra * 2, off = rand() * Math.PI * 2, v = 180 * (1 + (m.speed || 0));
    for (let k = 0; k < n; k++) { const a = off + k / n * Math.PI * 2; shots.push({ k: 'bead', x: pl.x, y: pl.y - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, max: w.evo ? 3.5 : 2.5, dmg: st.dmg * evoK, bounce: st.bounce + (m.chain || 0) + (w.evo ? 99 : 0), hitSet: new Set(), m }); }
    sfx('pick');
  },
  tea(w, st, m, am, extra, evoK) { // a teapot lobbed at the slop: a scalding splash and a hot puddle
    const vis = visibleFoes(), n = st.amt + extra;
    for (let k = 0; k < n; k++) { const e = vis.length ? pick(vis) : null; shots.push({ k: 'tea', sx: pl.x, sy: pl.y, x: e ? e.x : pl.x + rnd(-70, 70), y: e ? e.y : pl.y + rnd(-60, 60), t: -k * 0.15, at: 0.6, r: st.r * am, dmg: st.dmg * evoK, m, evo: w.evo }); }
  },
  bell(w, st, m, am, extra, evoK) { // one ring: everything nearby is hit, pushed back and stunned
    shots.push({ k: 'ring', x: pl.x, y: pl.y, t: 0, max: 0.45, R: st.r * am * (w.evo ? 1.4 : 1), dmg: st.dmg * evoK, m, stun: (w.evo ? 1.2 : 0.6) + (m.stunHit ? 0.4 : 0) });
    if (w.evo && !w.tw) w.tw = 0.5; sfx('stamp'); shake = Math.max(shake, 2);
  },
};
function moveHit(s, dt, rad) { // straight shots: knives and staples
  s.x += Math.cos(s.a) * s.v * dt; s.y += Math.sin(s.a) * s.v * dt;
  if (solid(s.x, s.y)) { s.dead = true; return; }
  near(s.x, s.y, rad + 8, (e) => {
    if (s.dead || s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + rad) ** 2) return; s.hitSet.add(e);
    hitWith(e, s.dmg, s.m, Math.cos(s.a), Math.sin(s.a), 0.5); if (s.m.boom) blast(s.x, s.y, 14, s.dmg * 0.5, '#fca5a5');
    if (--s.pierce < 0) s.dead = true;
  });
  if (s.t > s.max) s.dead = true;
}
function updNewShot(s, dt) {
  const m = s.m || {};
  if (s.k === 'knife') moveHit(s, dt, 4);
  else if (s.k === 'staple') moveHit(s, dt, 3);
  else if (s.k === 'puddle') { // ink and tea puddles burn whatever stands in them
    s.tick -= dt;
    if (s.tick <= 0) { s.tick = m.rate ? 0.2 : 0.3; near(s.x, s.y, s.r + 8, (e) => { if (dist2(s.x, s.y, e.x, e.y) < (s.r + e.r * 0.5) ** 2) hitWith(e, s.dmg, m, 0, 0, 0); }); }
    if (s.t > s.max) { s.dead = true; if (m.boom && s.col === 'ink') blast(s.x, s.y, s.r * 1.4, s.dmg * 2, '#93c5fd'); }
  } else if (s.k === 'tape') {
    s.spin += dt * 12; const v = s.v * dt;
    if (!s.back) { s.x += Math.cos(s.a) * v; s.y += Math.sin(s.a) * v; s.d += v; if (s.d >= s.out || solid(s.x, s.y)) { s.back = true; s.hitSet.clear(); } }
    else { const dx = pl.x - s.x, dy = pl.y - 3 - s.y, d = Math.hypot(dx, dy) || 1; s.x += dx / d * v * 1.1; s.y += dy / d * v * 1.1; if (d < 10) s.dead = true; }
    near(s.x, s.y, 10 * s.size, (e) => { if (s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + 6 * s.size) ** 2) return; s.hitSet.add(e); hitWith(e, s.dmg, m, Math.cos(s.a), Math.sin(s.a), 0.8); });
    if (s.t > 4) s.dead = true;
  } else if (s.k === 'strike') {
    if (s.tgt && !s.tgt.dead) { s.x = s.tgt.x; s.y = s.tgt.y; }
    if (s.t >= s.at) {
      const e = s.tgt;
      if (e && !e.dead) { const fin = m.exec && !e.boss && e.hp < e.maxHp * m.exec; hitWith(e, fin ? e.hp * 3 + 10 : s.dmg, m, 0, 0, 0); }
      blast(s.x, s.y, s.r, s.dmg * 0.4, '#fb7185', m); fx.push({ k: 'strikeFx', x: s.x, y: s.y, t: 0, max: 0.3 }); sfx('slash'); shake = Math.max(shake, 2);
      if (s.hops > 0 && (!e || e.dead)) { const nx = visibleFoes().sort((a, b) => b.hp - a.hp)[0]; if (nx) { s.tgt = nx; s.t = 0.3; s.hops--; return; } }
      s.dead = true;
    }
  } else if (s.k === 'mine') {
    if (s.t < s.arm) return;
    let go = false; near(s.x, s.y, 30, (e) => { if (!e.prop && dist2(s.x, s.y, e.x, e.y) < (22 + e.r) ** 2) { go = true; return false; } });
    if (go || s.t > s.max) {
      s.dead = true; blast(s.x, s.y, s.r, s.dmg, '#fb923c', m); sfx('boom'); shake = Math.max(shake, 2);
      if (s.evo && !s.mini) for (let k = 0; k < 4; k++) shots.push({ k: 'mine', x: s.x + Math.cos(k * 1.57) * 22, y: s.y + Math.sin(k * 1.57) * 22, t: 0, arm: 0.3, r: s.r * 0.5, dmg: s.dmg * 0.4, m, mini: true, max: 6, src: s.src });
    }
  } else if (s.k === 'turret') {
    s.fire -= dt; if (s.t > s.max) { s.dead = true; return; }
    if (s.fire <= 0) {
      s.fire = s.rate; const tg = nearest(s.x, s.y, s.reach); if (!tg) return;
      const a = Math.atan2(tg.y - s.y, tg.x - s.x), n = (s.evo ? 3 : 1) * (m.double ? 2 : 1);
      for (let k = 0; k < n; k++) shots.push({ k: 'staple', x: s.x, y: s.y - 6, a: a + (k - (n - 1) / 2) * 0.14, v: 280, t: 0, max: 0.6, dmg: s.dmg, pierce: 0, hitSet: new Set(), m, src: s.src });
    }
  } else if (s.k === 'bead') {
    const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
    if (solid(nx, s.y)) { s.vx = -s.vx; s.bounce--; s.hitSet.clear(); } else s.x = nx;
    if (solid(s.x, ny)) { s.vy = -s.vy; s.bounce--; s.hitSet.clear(); } else s.y = ny;
    near(s.x, s.y, 10, (e) => { if (s.hitSet.has(e) || dist2(s.x, s.y, e.x, e.y) > (e.r + 3) ** 2) return; s.hitSet.add(e); hitWith(e, s.dmg, m, s.vx / 180, s.vy / 180, 0.5); if (m.boom) blast(s.x, s.y, 14, s.dmg * 0.5, '#fdba74'); });
    if (s.bounce < 0 || s.t > s.max) s.dead = true;
  } else if (s.k === 'tea') {
    if (s.t >= s.at) {
      s.dead = true; blast(s.x, s.y, s.r, s.dmg, '#86efac', m); sfx('stamp');
      shots.push({ k: 'puddle', col: 'tea', x: s.x, y: s.y, r: s.r * (s.evo ? 1.3 : 0.9), t: 0, max: 2.5 * (1 + (m.dur || 0)) * (s.evo ? 1.6 : 1), dmg: s.dmg * 0.18, tick: 0, m: s.evo ? { ...m, slow: 1 } : m, src: s.src });
    }
  } else if (GIM_SHOT[s.k]) GIM_SHOT[s.k](s, dt);
  else if (s.k === 'ring') {
    if (!s.done) {
      s.done = true;
      near(s.x, s.y, s.R + 10, (e) => {
        if (dist2(s.x, s.y, e.x, e.y) > (s.R + e.r) ** 2) return; const d = Math.hypot(e.x - s.x, e.y - s.y) || 1;
        hitWith(e, s.dmg, m, (e.x - s.x) / d, (e.y - s.y) / d, 2); if (!e.boss && !e.seg && !e.prop) e.stun = Math.max(e.stun || 0, s.stun);
      });
    }
    if (s.t > s.max) s.dead = true;
  }
}
// drawn under everyone: puddles, mines, sticky notes, the red circle
function drawGroundShots(t) {
  for (const s of shots) {
    if (s.k === 'puddle') { const k = 1 - Math.max(0, (s.t - s.max + 0.5) / 0.5); g.globalAlpha = (s.col === 'ink' ? 0.55 : 0.32) * k; g.fillStyle = s.col === 'ink' ? '#1e3a8a' : '#15803d'; g.beginPath(); g.ellipse(s.x, s.y, s.r, s.r * 0.6, 0, 0, 7); g.fill(); g.globalAlpha = 0.8 * k; g.fillStyle = s.col === 'ink' ? '#60a5fa' : '#86efac'; g.fillRect(s.x - s.r * 0.4, s.y - 1, 2, 1); g.fillRect(s.x + s.r * 0.2, s.y + 1, 1, 1); g.globalAlpha = 1; }
    else if (s.k === 'mine') { g.fillStyle = '#120e1a'; g.beginPath(); g.arc(s.x, s.y, s.mini ? 3 : 4.5, 0, 7); g.fill(); g.fillStyle = s.t > s.arm && Math.floor(t * 4) % 2 ? '#fb7185' : '#4a4458'; g.fillRect(s.x - 1, s.y - 1, 2, 2); g.fillStyle = '#120e1a'; g.fillRect(s.x + 1, s.y + 3, 1, 3); }
    else if (s.k === 'turret') { shadow(s.x, s.y + 4, 6); const fade = s.t > s.max - 1 && Math.floor(t * 8) % 2; if (fade) continue; g.fillStyle = s.evo ? '#fb923c' : '#f6d55c'; g.fillRect(s.x - 6, s.y - 14, 12, 12); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(s.x - 6, s.y - 4, 12, 2); g.fillStyle = '#a16207'; g.fillRect(s.x - 4, s.y - 11, 8, 1); g.fillRect(s.x - 4, s.y - 8, 6, 1); g.fillStyle = '#4a4458'; g.fillRect(s.x - 1, s.y - 2, 2, 4); }
  }
  const au = weaponOf('aura');
  if (au?.R) { const k = 0.5 + Math.sin(t * 4) * 0.2; g.strokeStyle = `rgba(239,68,68,${0.35 + 0.4 * (1 - pl.hp / pl.maxHp)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(pl.x, pl.y - 3, au.R, 0, 7); g.stroke(); g.fillStyle = `rgba(239,68,68,${0.05 + 0.08 * k})`; g.beginPath(); g.arc(pl.x, pl.y - 3, au.R, 0, 7); g.fill(); }
}
// drawn over everyone: blades, staples, tape, beads, teapots, strike marks, bell rings, sunlight
function drawAirShots(t) {
  drawAllies(t);
  const sw = weaponOf('sun');
  if (sw?.beams) for (const e of sw.beams) { if (e.dead) continue; g.strokeStyle = 'rgba(253,224,71,.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(pl.x, pl.y - 6); g.lineTo(e.x, e.y - 6); g.stroke(); g.strokeStyle = '#fef9c3'; g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(253,224,71,.6)'; g.beginPath(); g.arc(e.x, e.y - 6, 3 + (e.heat || 0) * 3, 0, 7); g.fill(); }
  for (const s of shots) {
    if (s.k === 'knife') { g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.fillStyle = '#e5e7eb'; g.fillRect(-4, -1, 8, 2); g.fillStyle = '#fff'; g.fillRect(2, -1, 3, 1); g.restore(); }
    else if (s.k === 'staple') { g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.fillStyle = '#cbd5e1'; g.fillRect(-2, -1, 4, 2); g.restore(); }
    else if (s.k === 'tape') { const r = 4 * s.size; g.strokeStyle = '#d6d3d1'; g.lineWidth = 2.5 * s.size; g.beginPath(); g.arc(s.x, s.y, r, s.spin, s.spin + 5.5); g.stroke(); g.fillStyle = '#78716c'; g.beginPath(); g.arc(s.x, s.y, r * 0.4, 0, 7); g.fill(); }
    else if (s.k === 'bead') { g.fillStyle = '#b45309'; g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); g.fillStyle = '#fbbf24'; g.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 2, 1, 1); }
    else if (s.k === 'tea' && s.t > 0) { const k = clamp(s.t / s.at, 0, 1), x = lerp(s.sx, s.x, k), y = lerp(s.sy, s.y, k) - Math.sin(k * Math.PI) * 40; g.fillStyle = '#16a34a'; g.beginPath(); g.arc(x, y - 4, 4, 0, 7); g.fill(); g.fillStyle = '#86efac'; g.fillRect(x - 2, y - 6, 2, 1); g.strokeStyle = 'rgba(134,239,172,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(s.x, s.y, s.r * k, 0, 7); g.stroke(); }
    else if (s.k === 'strike') { const k = clamp(s.t / s.at, 0, 1), r = 12 - k * 6; g.strokeStyle = `rgba(251,113,133,${0.5 + k * 0.5})`; g.lineWidth = 1.5; g.beginPath(); g.arc(s.x, s.y - 6, r, 0, 7); g.stroke(); g.beginPath(); g.moveTo(s.x - r - 3, s.y - 6); g.lineTo(s.x + r + 3, s.y - 6); g.stroke(); }
    else if (s.k === 'ring') { const k = s.t / s.max; g.globalAlpha = 1 - k; g.strokeStyle = '#fde68a'; g.lineWidth = 3 * (1 - k) + 1; g.beginPath(); g.arc(s.x, s.y - 3, s.R * (0.3 + k * 0.7), 0, 7); g.stroke(); g.globalAlpha = 1; }
  }
  for (const f of fx) if (f.k === 'strikeFx') { const k = f.t / f.max; g.globalAlpha = 1 - k; g.strokeStyle = '#fb7185'; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x - 14, f.y - 10); g.lineTo(f.x + 14, f.y - 2); g.stroke(); g.globalAlpha = 1; }
}
// the flood: a ring of slop closing in on someone who will not move on
function floodWave(p) {
  const n = Math.min(44, 10 + run.depth + Math.floor(p * 8));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, [x, y] = floorNear(pl.x + Math.cos(a) * 130, pl.y + Math.sin(a) * 105); spawnFoe(i % 3 === 0 ? 'eye' : weighted(st.B.mix), x, y, { noLoot: true }).spawnIn = 0.6; } // a third of every wave shoots from afar
  for (let k = 0; k < Math.min(4, Math.floor(p)); k++) { const a = rand() * 7, [x, y] = floorNear(pl.x + Math.cos(a) * 140, pl.y + Math.sin(a) * 110); const e = spawnFoe(weighted(st.B.mix), x, y, { elite: true, noLoot: true }); e.xp = 0; e.dmg *= 1 + p * 0.2; } // wave elites drop no chest
  banner = { text: T.flood, t: 0 }; sfx('warn');
}
