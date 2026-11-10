// ---------- drawing the pixel layer ----------
const GROUND = ['#1c1730', '#1f1a35', '#1a152c'];
function drawGround(cx, cy, t) {
  const x0 = Math.floor((cx - LW / 2) / 16) - 1, y0 = Math.floor((cy - LH / 2) / 16) - 1, ox = Math.round(cx - LW / 2), oy = Math.round(cy - LH / 2);
  for (let ty = y0; ty < y0 + LH / 16 + 3; ty++) for (let tx = x0; tx < x0 + LW / 16 + 3; tx++) {
    const h = hash2(tx, ty), sx = tx * 16 - ox, sy = ty * 16 - oy;
    g.fillStyle = GROUND[(tx + ty & 1) + (h < 0.1 ? 1 : 0)]; g.fillRect(sx, sy, 16, 16);
    if (h > 0.93) { g.fillStyle = '#2a2342'; g.fillRect(sx + 3, sy + 5, 7, 5); g.fillStyle = '#3a3157'; g.fillRect(sx + 4, sy + 6, 5, 1); g.fillRect(sx + 4, sy + 8, 3, 1); } // a dropped page
    else if (h > 0.9) { g.fillStyle = '#2c2446'; g.fillRect(sx + 8, sy + 2, 1, 6); g.fillRect(sx + 9, sy + 7, 3, 1); } // crack
    else if (h > 0.885 && Math.sin(t * 3 + tx * 7) > 0.6) { g.fillStyle = '#7fe3d6'; g.fillRect(sx + 6, sy + 9, 1, 1); } // a glint
    else if (h < 0.025) { g.fillStyle = '#2b2040'; g.beginPath(); g.ellipse(sx + 8, sy + 8, 7, 4, 0, 0, 7); g.fill(); g.fillStyle = '#3b2c58'; g.fillRect(sx + 5, sy + 7, 3, 1); } // slop puddle
  }
}
// slopfall: streaks drifting down in screen space
const RAIN = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), l: 2 + Math.random() * 4 }));
function drawRain(t, k = 1) {
  g.fillStyle = 'rgba(176,124,232,.35)';
  for (const r of RAIN) { const x = ((r.x * LW + t * 14 * r.s) % LW + LW) % LW, y = ((r.y * LH + t * 60 * r.s) % LH + LH) % LH; g.globalAlpha = 0.25 * r.s * k; g.fillRect(Math.round(x), Math.round(y), 1, Math.round(r.l)); }
  g.globalAlpha = 1;
}
const W2S = (x, y) => [Math.round(x - cam.x + LW / 2), Math.round(y - cam.y + LH / 2)];
function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y, w, w * 0.38, 0, 0, 7); g.fill(); }

function drawWorld(t) {
  drawGround(cam.x, cam.y, t);
  g.save(); g.translate(-Math.round(cam.x - LW / 2) + (shake ? Math.round(rnd(-shake, shake) * 0.5) : 0), -Math.round(cam.y - LH / 2) + (shake ? Math.round(rnd(-shake, shake) * 0.5) : 0));
  // floor marks
  for (const f of fx) if (f.k === 'mark') {
    const k = f.t / f.max; g.globalAlpha = 1 - k * k; g.strokeStyle = f.evo ? '#f6d55c' : '#e0524a'; g.lineWidth = 2;
    g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(f.x, f.y, f.r * 0.7, 0, 7); g.stroke();
    if (f.evo) { g.fillStyle = 'rgba(240,160,60,.18)'; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); }
    g.fillStyle = g.strokeStyle; g.fillRect(f.x - 3, f.y - 1, 7, 2); g.fillRect(f.x - 1, f.y - 3, 2, 7); g.globalAlpha = 1;
  }
  for (const s of shots) if (s.k === 'stamp' && !s.done && s.t > 0) { const k = clamp(s.t / s.delay, 0, 1); g.strokeStyle = 'rgba(224,82,74,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(s.x, s.y, s.r * k, 0, 7); g.stroke(); }
  for (const s of shots) if (s.k === 'hole') { const k = s.t / s.max; for (let i = 0; i < 4; i++) { g.strokeStyle = i % 2 ? '#6a3fa0' : '#b07ce8'; g.lineWidth = 1.5; g.beginPath(); g.arc(s.x, s.y, 4 + i * 6 * (1 - k * 0.5), t * 6 + i, t * 6 + i + 3.5); g.stroke(); } g.fillStyle = '#120e1a'; g.beginPath(); g.arc(s.x, s.y, 5, 0, 7); g.fill(); }
  // pickups
  for (const gm of gems) { const b = gm.mag ? 0 : Math.round(Math.sin(t * 4 + gm.x) * 1); spr(GEMS[gm.tier], gm.x, gm.y + b); }
  for (const it of items) {
    const b = Math.round(Math.sin(t * 3 + it.x) * 1.5), big = it.k === 'bigchest';
    if (it.k.includes('chest')) { g.fillStyle = `rgba(246,213,92,${0.15 + Math.sin(t * 5) * 0.08})`; g.beginPath(); g.arc(it.x, it.y, big ? 16 : 11, 0, 7); g.fill(); }
    shadow(it.x, it.y + 6, 5); spr(PICK[it.k === 'bigchest' ? 'chest' : it.k], it.x, it.y - 2 + b, false, false, big ? 2 : 1);
  }
  // actors, back to front
  const list = [];
  for (const e of foes) if (!e.dead && onScreen(e, 40)) list.push(e);
  list.push(pl); list.sort((a, b) => a.y - b.y);
  for (const e of list) { if (e === pl) drawPlayer(t); else if (e.boss) drawBoss(e, t); else if (e.seg) drawSeg(e, t); else drawFoe(e, t); }
  // weapon effects over actors
  for (const f of fx) {
    if (f.k === 'slash') {
      const k = f.t / f.max, R = f.r * (0.75 + k * 0.25), a0 = f.evo ? f.a + k * 3 : f.a - f.arc / 2, a1 = f.evo ? a0 + Math.PI * 2 : f.a + f.arc / 2;
      g.globalAlpha = 1 - k; g.strokeStyle = '#f4f0e8'; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(pl.x, pl.y - 3, R, a0, a1); g.stroke();
      g.strokeStyle = f.evo ? '#f6d55c' : '#1a1423'; g.lineWidth = 1; g.beginPath(); g.arc(pl.x, pl.y - 3, R - 3, a0 + 0.2, a1 - 0.2); g.stroke(); g.globalAlpha = 1;
    } else if (f.k === 'beam') {
      const k = f.t / f.max; g.globalAlpha = f.evo ? 0.85 : 1 - k; g.lineCap = 'round';
      g.strokeStyle = f.evo ? 'rgba(127,227,214,.55)' : 'rgba(246,213,92,.55)'; g.lineWidth = f.w * 2.2; g.beginPath(); g.moveTo(f.x1, f.y1 - 3); g.lineTo(f.x2, f.y2 - 3); g.stroke();
      g.strokeStyle = f.evo ? '#e9fffb' : '#fff6c2'; g.lineWidth = Math.max(1, f.w * 0.7); g.beginPath(); g.moveTo(f.x1, f.y1 - 3); g.lineTo(f.x2, f.y2 - 3); g.stroke(); g.globalAlpha = 1; g.lineCap = 'butt';
    }
  }
  const sc = weaponOf('scis');
  if (sc?.blades) for (const b of sc.blades) { g.save(); g.translate(b.x, b.y - 3); g.rotate(b.a + runT * 9); g.fillStyle = sc.evo ? '#f6d55c' : '#d9d4e8'; g.fillRect(-5, -1, 10, 2); g.fillRect(-1, -5, 2, 10); g.fillStyle = '#e0524a'; g.fillRect(-1, -1, 2, 2); g.restore(); }
  for (const s of shots) {
    if (s.k === 'plane') { g.save(); g.translate(s.x, s.y - 3); g.rotate(s.a); g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-2, 0); g.lineTo(-4, 4); g.closePath(); g.fill(); g.fillStyle = '#a29db0'; g.fillRect(-3, 0, 6, 1); g.restore(); }
    if (s.k === 'eraser') { g.save(); g.translate(s.x, s.y - 3); g.rotate(s.spin); g.fillStyle = s.evo ? '#6a3fa0' : '#ff7ab8'; g.fillRect(-4, -3, 5, 6); g.fillStyle = s.evo ? '#b07ce8' : '#5aa7e0'; g.fillRect(1, -3, 3, 6); g.restore(); }
    if (s.k === 'stamp' && !s.done && s.t > 0) { const k = clamp(s.t / s.delay, 0, 1), h = (1 - k) * 40, sz = s.evo ? 2 : 1; g.fillStyle = '#4b2c22'; g.fillRect(s.x - 2 * sz, s.y - h - 12 * sz, 4 * sz, 7 * sz); g.fillStyle = '#e0524a'; g.fillRect(s.x - 6 * sz, s.y - h - 5 * sz, 12 * sz, 5 * sz); g.fillStyle = '#9c2f3d'; g.fillRect(s.x - 6 * sz, s.y - h - 1 * sz, 12 * sz, 1 * sz); }
  }
  for (const b of ebul) {
    if (b.mail) { g.fillStyle = '#f4f0e8'; g.fillRect(b.x - 4, b.y - 3, 8, 6); g.fillStyle = '#e0524a'; g.fillRect(b.x - 4, b.y - 3, 8, 1); g.fillRect(b.x - 1, b.y - 1, 2, 2); continue; }
    g.fillStyle = b.col; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
  }
  for (const f of fx) if (f.k === 'p') { const k = 1 - f.t / f.max; g.globalAlpha = k; g.fillStyle = f.col; g.fillRect(Math.round(f.x), Math.round(f.y), k > 0.5 ? 2 : 1, k > 0.5 ? 2 : 1); g.globalAlpha = 1; }
  g.restore();
}
function drawPlayer(t) {
  for (const f of fx) if (f.k === 'ghost') { g.globalAlpha = 0.35 * (1 - f.t / f.max); spr(CHAR_ART[pl.ci][f.fr], f.x, f.y - 8, f.f < 0, true); g.globalAlpha = 1; }
  shadow(pl.x, pl.y, 6);
  if (pl.inv > 0 && Math.floor(t * 20) % 2 && pl.hurtFlash <= 0) return;
  const fr = pl.moving ? Math.floor(pl.anim) % 2 : 0, bob = pl.moving ? 0 : Math.round(Math.sin(t * 3) * 0.6);
  spr(CHAR_ART[pl.ci][fr], pl.x, pl.y - 8 + bob, pl.face < 0, pl.hurtFlash > 0.15);
  // tiny lantern glow
  g.fillStyle = 'rgba(246,213,92,.9)'; g.fillRect(Math.round(pl.x + pl.face * 6), Math.round(pl.y - 6 + bob), 2, 2);
}
function drawFoe(e, t) {
  const a = ART[e.type][Math.floor(e.anim) % 2], sc = e.scale;
  shadow(e.x, e.y + 1, e.r * 0.9);
  if (e.spawnIn > 0) g.globalAlpha = 1 - e.spawnIn / 0.25;
  const wob = e.wind > 0 ? rnd(-1, 1) : 0, sq = e.stun > 0 ? 1 : 0;
  if (e.elite) { g.fillStyle = `rgba(224,82,74,${0.25 + Math.sin(t * 6) * 0.1})`; g.beginPath(); g.arc(e.x, e.y - 8 * sc, 12 * sc, 0, 7); g.fill(); }
  spr(a, e.x + wob, e.y - 7 * sc + sq, e.face < 0, e.flash > 0, sc);
  if (e.stun > 0) { g.fillStyle = '#f6d55c'; const s = t * 8; g.fillRect(Math.round(e.x + Math.cos(s) * 5), Math.round(e.y - 16 * sc), 1, 1); g.fillRect(Math.round(e.x - Math.cos(s) * 5), Math.round(e.y - 16 * sc + 1), 1, 1); }
  g.globalAlpha = 1;
  if (e.elite && e.hp < e.maxHp) { g.fillStyle = '#120e1a'; g.fillRect(e.x - 10, e.y + 4, 20, 3); g.fillStyle = '#e0524a'; g.fillRect(e.x - 9, e.y + 5, 18 * e.hp / e.maxHp, 1); }
}
// --- bosses, drawn with shapes ---
function drawBoss(e, t) {
  const fl = e.flash > 0, bob = Math.sin(t * 2.5) * 1.5;
  if (e.kind === 'face') {
    shadow(e.x, e.y + 4, 16);
    const y = e.y - 18 + bob; g.fillStyle = fl ? '#fff' : '#f2c39b'; g.beginPath(); g.arc(e.x, y, 17, 0, 7); g.fill();
    g.strokeStyle = '#120e1a'; g.lineWidth = 1; g.stroke();
    if (!fl) {
      g.fillStyle = 'rgba(255,122,184,.45)'; g.fillRect(e.x - 13, y + 2, 5, 3); g.fillRect(e.x + 8, y + 2, 5, 3);
      const blink = Math.sin(t * 0.7) > 0.97; g.fillStyle = '#f4f0e8';
      g.beginPath(); g.ellipse(e.x - 6, y - 5, 4.5, blink ? 0.5 : 3.5, 0, 0, 7); g.ellipse(e.x + 6, y - 5, 4.5, blink ? 0.5 : 3.5, 0, 0, 7); g.fill();
      const px = clamp((pl.x - e.x) * 0.03, -2, 2), py = clamp((pl.y - e.y) * 0.03, -1, 1); g.fillStyle = '#120e1a'; g.fillRect(Math.round(e.x - 6 + px), Math.round(y - 5 + py), 1, 1); g.fillRect(Math.round(e.x + 6 + px), Math.round(y - 5 + py), 1, 1);
      g.fillStyle = '#9c2f3d'; g.beginPath(); g.ellipse(e.x, y + 6, 10, 4.5, 0, 0, Math.PI); g.fill(); g.fillStyle = '#f4f0e8'; for (let i = -9; i <= 8; i += 2) g.fillRect(e.x + i, y + 6, 1.4, 2);
      g.fillStyle = '#c98b6b'; g.fillRect(e.x - 1, y - 1, 2, 4);
    }
  } else if (e.kind === 'box') {
    shadow(e.x, e.y + 3, 15);
    const legs = e.mode === 'charge' ? Math.sin(t * 40) * 3 : Math.sin(e.anim * 8) * 2, y = e.y - 22 + (e.mode === 'wind' ? rnd(-1, 1) : bob * 0.5);
    g.fillStyle = '#4a4458'; g.fillRect(e.x - 6, e.y - 6, 3, 6 + legs); g.fillRect(e.x + 3, e.y - 6, 3, 6 - legs);
    g.fillStyle = fl ? '#fff' : '#e0524a'; g.fillRect(e.x - 14, y, 28, 18); g.beginPath(); g.arc(e.x, y, 14, Math.PI, 0); g.fill();
    if (!fl) { g.fillStyle = '#9c2f3d'; g.fillRect(e.x - 14, y + 14, 28, 4); g.fillStyle = '#120e1a'; g.fillRect(e.x - 8, y + 2, 16, 3); g.fillStyle = '#f4f0e8'; g.fillRect(e.x - 6, y - (e.mode === 'wind' ? 6 : 1), 12, 4); }
    g.fillStyle = '#f6d55c'; g.fillRect(e.x + 14, y - 8, 2, 14); g.fillStyle = e.mode === 'wind' ? '#f4f0e8' : '#e0524a'; g.fillRect(e.x + 16, y - 8, 7, 5);
    g.fillStyle = '#ff7ab8'; g.beginPath(); g.arc(e.x - 12, y - 10, 5, 0, 7); g.fill();
  } else if (e.kind === 'snake') {
    const y = e.y - 10; g.save(); g.translate(e.x, y); g.rotate(e.a);
    g.fillStyle = 'rgba(255,122,184,.5)'; g.beginPath(); g.ellipse(-1, 1.5, 13, 9, 0, 0, 7); g.fill();
    g.fillStyle = fl ? '#fff' : '#7fe3d6'; g.beginPath(); g.ellipse(0, 0, 13, 9, 0, 0, 7); g.fill(); g.strokeStyle = '#120e1a'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#120e1a'; g.beginPath(); g.moveTo(13, 0); g.lineTo(5, -3); g.lineTo(5, 3); g.fill();
    g.fillStyle = '#f4f0e8'; g.fillRect(2, -6, 3, 3); g.fillRect(2, 3, 3, 3); g.fillStyle = '#e0524a'; g.fillRect(3, -5, 1, 1); g.fillRect(3, 4, 1, 1);
    g.restore();
  }
}
function drawSeg(s, t) {
  const b = s.parent, k = s.idx / b.segs.length, y = s.y - 10, off = 1 + k * 3, fl = s.flash > 0 || b.flash > 0;
  shadow(s.x, s.y, s.r * 0.8);
  // a copy of a copy: colour channels drift apart toward the tail
  g.globalAlpha = 0.55; g.fillStyle = '#ff7ab8'; g.beginPath(); g.arc(s.x - off, y, s.r, 0, 7); g.fill(); g.fillStyle = '#5aa7e0'; g.beginPath(); g.arc(s.x + off, y + off * 0.5, s.r, 0, 7); g.fill();
  g.globalAlpha = 1 - k * 0.45; g.fillStyle = fl ? '#fff' : s.idx % 2 ? '#2f8f8a' : '#7fe3d6'; g.beginPath(); g.arc(s.x, y, s.r, 0, 7); g.fill();
  g.fillStyle = '#120e1a'; g.fillRect(Math.round(s.x - 2), Math.round(y - 1), 4, 1); g.globalAlpha = 1;
}
