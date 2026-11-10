// ---------- the Nameless: blots, ink blooms, crow-letters, gatekeepers; plus items ----------
const WASX = LANG === 'ko' ? { s: '꽃', k: '문지기', c: ['ㄱ', 'ㅁ', 'ㅅ', 'ㅎ'] } : { s: 'flower', k: 'gatekeeper', c: ['a', 'k', 's', 'h'] };
const mkEnt = (o) => Object.assign({ vx: 0, vy: 0, face: -1, t: rnd(10), flash: 0, hurtable: true, contact: true, onGround: false, kb: 1, mode: 0, mt: 0, cd: rnd(0.5, 1.5) }, o);
let seen = {}, cp = null, bossOn = false, boss = null, glyphNote = null;
function spawnEnts() {
  ents = []; shots = []; boss = null; bossOn = false; cam.lock = null;
  for (const s of lvl.E) {
    const X = s.x * TS, Y = (s.y + 1) * TS, it = (type, w, h, o) => ents.push(mkEnt({ type, x: X + (TS - w) / 2, y: Y - h, w, h, hp: 1, hurtable: false, contact: false, arg: s.arg, ...o }));
    if (s.ch === 'b') ents.push(mkEnt({ type: 'b', x: X + 1, y: Y - 12, w: 14, h: 12, hp: 2 + (stageI > 1 ? 1 : 0), was: T.was[Math.floor(rnd(T.was.length))] }));
    else if (s.ch === 's') ents.push(mkEnt({ type: 's', x: X + 2, y: Y - 18, w: 12, h: 18, hp: 2, kb: 0, was: WASX.s }));
    else if (s.ch === 'c') ents.push(mkEnt({ type: 'c', x: X, y: s.y * TS, w: 14, h: 10, hp: 1, home: { x: X, y: s.y * TS }, was: WASX.c[Math.floor(rnd(4))] }));
    else if (s.ch === 'k') ents.push(mkEnt({ type: 'k', x: X, y: Y - 26, w: 16, h: 26, hp: 5, kb: 0.25, was: WASX.k }));
    else if (s.ch === 'B') { boss = mkBoss(X, s.y * TS); ents.push(boss); }
    else if (s.ch === 'T') { if (!seen[s.arg]) it('T', 4, 400); }
    else if (s.ch === 'G') { if (!save.glyphs.includes(s.arg)) it('G', 16, 16); }
    else if (s.ch === 'C') it('C', 16, 26, { on: cp && Math.abs(cp.x - X) < 20 });
    else if (s.ch === 'H') it('H', 12, 14);
    else if (s.ch === 'S') it('S', 20, 34);
    else if (s.ch === 'E') it('E', 22, 44);
    else if (s.ch === 'D') it('D', 8, 400);
  }
}
function damage(e, d, dir, kind) {
  if (e.type === 'k' && e.mode !== 3 && dir === -e.face) { sfx('clang'); puff(cx(e) + e.face * 10, cy(e), 5, { col: GRAY }); hitstop = 0.05; if (kind === 'slash') pl.vx = -dir * 120; e.flashB = 0.15; return false; }
  if (e.type === 'B' && !bossHurt(e, d, kind)) return false;
  e.hp -= d; e.flash = 0.12; e.vx = dir * 110 * e.kb; if (e.kb) e.vy = Math.min(e.vy, -60); hitstop = Math.max(hitstop, d > 1 ? 0.08 : 0.05); cam.shake = Math.max(cam.shake, 3 + d);
  puff(cx(e), cy(e), 8 + d * 4, { dir: dir > 0 ? 0 : 3.14, s1: 170, col: e.type === 'B' ? GRAY : INK }); sfx('hit');
  if (e.hp <= 0) kill(e);
  return true;
}
function kill(e) {
  if (e.type === 'B') return bossDown(e);
  puff(cx(e), cy(e), 26, { s1: 160, max: 0.9, col: GRAY }); sfx('die'); floatText(cx(e), e.y - 4, e.was, RED); pl.ink = Math.min(100, pl.ink + 6);
}
const floorAhead = (e) => { const t = tile(Math.floor((cx(e) + e.face * (e.w / 2 + 3)) / TS), Math.floor((e.y + e.h + 4) / TS)); return t === '#' || t === '='; };
function updEnts(dt) {
  const p = pl;
  for (const e of ents) {
    if (e.hp <= 0) continue; e.t += dt; if (e.flash > 0) e.flash -= dt; if (e.flashB > 0) e.flashB -= dt;
    const dx = cx(p) - cx(e), dy = cy(p) - cy(e), near = Math.abs(dx) < VW;
    if (e.type === 'b') {
      if (!near) continue;
      if (e.onGround) {
        if (e.hitWall || !floorAhead(e)) e.face *= -1;
        e.vx = e.face * 26; e.cd -= dt;
        if (Math.abs(dx) < 90 && Math.abs(dy) < 44 && !p.dead) { e.face = sign(dx); if (e.cd <= 0) { e.vy = -200; e.vx = e.face * 100; e.cd = 1.2; e.onGround = false; } }
      }
      e.vy = Math.min(e.vy + GRAV * dt, 400); move(e, dt); if (e.y > ROWS * TS + 40) e.hp = 0;
    } else if (e.type === 's') {
      if (!near) continue; e.face = sign(dx); e.cd -= dt;
      if (e.mode === 0 && e.cd <= 0 && Math.abs(dx) < 210 && Math.abs(dy) < 90 && !p.dead) { e.mode = 1; e.mt = 0.4; sfx('warn'); }
      if (e.mode === 1 && (e.mt -= dt) <= 0) { e.mode = 0; e.cd = 2.1; sfx('spit'); const far = clamp(Math.abs(dx) / 200, 0.3, 1); shots.push({ x: cx(e) + e.face * 6, y: e.y + 2, w: 7, h: 7, vx: e.face * (70 + 110 * far), vy: -120, g: 300, life: 3, dmg: 1 }); }
    } else if (e.type === 'c') {
      if (!near) continue; e.cd -= dt;
      if (e.mode === 0) { e.x = e.home.x + Math.sin(e.t * 1.3) * 22; e.y = e.home.y + Math.sin(e.t * 2.6) * 6; e.face = sign(dx); if (e.cd <= 0 && Math.abs(dx) < 120 && dy > 0 && dy < 170 && !p.dead) { e.mode = 1; e.mt = 0.4; sfx('warn'); } }
      else if (e.mode === 1) { if ((e.mt -= dt) <= 0) { const d = Math.hypot(dx, dy) || 1; e.vx = (dx / d) * 215; e.vy = (dy / d) * 215; e.mode = 2; e.mt = 0.85; } }
      else if (e.mode === 2) { e.x += e.vx * dt; e.y += e.vy * dt; if ((e.mt -= dt) <= 0 || collide(e)) { e.mode = 3; } }
      else { const hx = e.home.x - e.x, hy = e.home.y - e.y, d = Math.hypot(hx, hy); if (d < 4) { e.mode = 0; e.cd = 1.4; e.t = 0; e.home.x = e.x; } else { e.x += (hx / d) * 90 * dt; e.y += (hy / d) * 90 * dt; } }
    } else if (e.type === 'k') {
      if (!near) continue; e.mt -= dt;
      if (e.mode === 0) {
        if (Math.abs(dx) < 170 && Math.abs(dy) < 60) { if (Math.abs(dx) > 6) e.face = sign(dx); e.vx = floorAhead(e) && Math.abs(dx) > 26 ? e.face * 34 : 0; if (Math.abs(dx) < 36 && Math.abs(dy) < 30 && !p.dead) { e.mode = 1; e.mt = 0.55; e.vx = 0; sfx('warn'); } }
        else e.vx = 0;
      } else if (e.mode === 1) { e.vx = 0; if (e.mt <= 0) { e.mode = 2; e.mt = 0.16; sfx('slash'); cam.shake = 3; } }
      else if (e.mode === 2) { const box = { x: e.face > 0 ? e.x + e.w : e.x - 36, y: e.y - 6, w: 36, h: e.h + 6 }; if (overlap(box, p)) hurtPlayer(2, e.face); if (e.mt <= 0) { e.mode = 3; e.mt = 0.8; } }
      else if (e.mt <= 0) e.mode = 0;
      e.vy = Math.min(e.vy + GRAV * dt, 400); move(e, dt);
    } else if (e.type === 'B') updBoss(e, dt);
    else updItem(e, dt);
    if (e.contact && e.hp > 0 && overlap(e.type === 'B' ? { x: e.x + 10, y: e.y + 10, w: e.w - 20, h: e.h - 20 } : e, p)) hurtPlayer(1, sign(cx(p) - cx(e)) || 1);
  }
  ents = ents.filter((e) => e.hp > 0);
  for (const s of shots) {
    s.life -= dt; s.vy += (s.g || 0) * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (!s.ghost && tile(Math.floor((s.x + s.w / 2) / TS), Math.floor((s.y + s.h / 2) / TS)) === '#') { s.life = 0; puff(s.x, s.y, 5); }
    if (s.friendly) { for (const e of ents) if (e.hurtable && e.hp > 0 && !s.hit.has(e) && overlap(s, e)) { s.hit.add(e); damage(e, s.dmg, sign(s.vx), s.wave ? 'wave' : 'reflect'); if (!s.wave) s.life = 0; } }
    else if (overlap(s, p)) { hurtPlayer(s.dmg, sign(s.vx) || 1); if (p.inv > 0 && p.dashT <= 0) s.life = 0; }
  }
  shots = shots.filter((s) => s.life > 0);
}
function updItem(e) {
  const p = pl, hit = overlap(e, p);
  if (e.type === 'T') { if (hit) { e.hp = 0; seen[e.arg] = 1; say(e.arg); } }
  else if (e.type === 'C') { if (hit && !e.on) { for (const o of ents) if (o.type === 'C') o.on = false; e.on = true; cp = { x: e.x, y: e.y }; p.hp = p.maxHp; sfx('save'); floatText(cx(e), e.y - 8, T.saved); puff(cx(e), e.y, 14, { col: RED, up: 60 }); } }
  else if (e.type === 'G') { if (hit) { e.hp = 0; save.glyphs.push(e.arg); persist(); sfx('glyph'); glyphNote = { i: e.arg, t: 0 }; puff(cx(e), cy(e), 30, { col: RED, s1: 140, max: 1.2, g: -30 }); } }
  else if (e.type === 'H') { if (hit && (p.hp < p.maxHp || p.ink < 100)) { e.hp = 0; p.hp = Math.min(p.maxHp, p.hp + 2); p.ink = 100; sfx('heal'); floatText(cx(e), e.y - 6, T.heal); } }
  else if (e.type === 'E') { if (hit && p.onGround) nextStage(); }
  else if (e.type === 'D') { if (p.x > e.x + 30 && !bossOn) startBoss(e); }
}
