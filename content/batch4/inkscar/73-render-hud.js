// ---------- particles, floating words, camera, HUD, dialog box, the frame ----------
let gt = 0, dlg = null, card = null;
function updFx(dt) {
  for (const p of parts) { p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  parts = parts.filter((p) => p.life < p.max); if (parts.length > 400) parts.splice(0, parts.length - 400);
  for (const f of floats) { f.life += dt; if (!f.ring) f.y -= (f.big ? 8 : 16) * dt; }
  floats = floats.filter((f) => f.life < f.max);
  if (glyphNote && (glyphNote.t += dt) > 4.5) glyphNote = null;
  if (pl) { const k = Math.min(1, dt * 5); crane.x += (cx(pl) - pl.face * 15 - crane.x) * k; crane.y += (pl.y - 7 + Math.sin(gt * 3) * 3 - crane.y) * k; crane.f = pl.face; }
  cam.shake = Math.max(0, cam.shake - 28 * dt);
}
function updCam(dt, snap) {
  let tx = cx(pl) - VW / 2 + pl.face * 34, lo = 0, hi = lvl.w * TS - VW;
  if (cam.lock) { lo = cam.lock.x0; hi = cam.lock.x1 - VW; if (hi < lo) lo = hi = (lo + hi) / 2; }
  tx = clamp(tx, lo, hi); cam.x = snap ? tx : cam.x + (tx - cam.x) * Math.min(1, dt * 5); cam.y = ROWS * TS - VH;
  if (snap) { crane.x = cx(pl) - 15; crane.y = pl.y - 7; }
}
function drawFx() {
  for (const p of parts) { const k = 1 - p.life / p.max; g.globalAlpha = k; g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.r * (0.5 + k * 0.5), 0, 7); g.fill(); }
  g.textAlign = 'center';
  for (const f of floats) {
    const k = f.life / f.max;
    if (f.ring) { g.globalAlpha = 1 - k; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.ellipse(f.x, f.y, 4 + k * 12, 1.5 + k * 3, 0, 0, 7); g.stroke(); continue; }
    g.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1; g.font = `700 ${f.big ? 15 : 11}px ${FONT}`; g.lineWidth = 3; g.strokeStyle = 'rgba(239,230,210,.85)'; g.strokeText(f.text, f.x, f.y); g.fillStyle = f.col; g.fillText(f.text, f.x, f.y);
  }
  g.globalAlpha = 1;
}
function drawHud() {
  const p = pl; if (!p) return;
  for (let i = 0; i < p.maxHp; i++) { const x = 12 + i * 13; if (i < p.hp) { g.fillStyle = RED; g.fillRect(x, 10, 10, 10); g.fillStyle = PAPER; g.fillRect(x + 2.5, 14.2, 5, 1.6); } else { g.strokeStyle = 'rgba(26,22,19,.45)'; g.lineWidth = 1; g.strokeRect(x + 0.5, 10.5, 9, 9); } }
  g.fillStyle = 'rgba(26,22,19,.18)'; g.fillRect(12, 25, 62, 4); g.fillStyle = p.ink >= 30 ? INK : GRAY; g.fillRect(12, 25, 62 * p.ink / 100, 4); g.fillStyle = PAPER; for (const k of [30, 60, 90]) g.fillRect(12 + 62 * k / 100, 25, 1, 4);
  for (let i = 0; i < 9; i++) { const x = VW - 20 - (8 - i) * 9 - (2 - Math.floor(i / 3)) * 5; if (save.glyphs.includes(i)) { g.fillStyle = RED; g.fillRect(x, 11, 7, 7); } else { g.strokeStyle = 'rgba(26,22,19,.4)'; g.lineWidth = 1; g.strokeRect(x + 0.5, 11.5, 6, 6); } }
  if (bossOn && boss && boss.hp > 0) {
    const w = Math.min(220, VW - 216), x = (VW - w) / 2; g.font = '700 9px ' + FONT; g.textAlign = 'center'; g.fillStyle = INK; g.fillText(T.boss, VW / 2, 14);
    g.fillStyle = 'rgba(26,22,19,.2)'; g.fillRect(x, 18, w, 5); g.fillStyle = boss.mode === 'tired' ? RED : NAMELESS; g.fillRect(x, 18, w * boss.hp / boss.maxHp, 5); g.fillStyle = PAPER; g.fillRect(x + w / 3, 18, 1, 5); g.fillRect(x + w * 2 / 3, 18, 1, 5);
  }
  if (glyphNote) { // a lost word found
    const n = glyphNote, a = n.t < 0.3 ? n.t / 0.3 : n.t > 3.9 ? Math.max(0, (4.5 - n.t) / 0.6) : 1, [word, line] = T.glyph[n.i], w = Math.min(VW - 30, 300), x = (VW - w) / 2;
    g.globalAlpha = a; g.fillStyle = 'rgba(251,246,232,.95)'; g.fillRect(x, 38, w, 62); g.fillStyle = RED; g.fillRect(x, 38, w, 1.5); g.fillRect(x, 98.5, w, 1.5); g.textAlign = 'center';
    g.font = '8px ' + FONT; g.fillStyle = GRAY; g.fillText(T.found, VW / 2, 51); g.font = '700 21px ' + FONT; g.fillStyle = RED; g.fillText(word, VW / 2, 74); g.font = '9.5px ' + FONT; g.fillStyle = INK; g.fillText(line, VW / 2, 90, w - 16); g.globalAlpha = 1;
  }
  if (stageI === 0 && p.x < 380 && state === 'play' && !pad.classList.contains('on')) { g.font = '9px ' + FONT; g.textAlign = 'center'; g.fillStyle = 'rgba(26,22,19,.7)'; g.fillText(T.keys, VW / 2, VH - 12); }
}
function drawDialog() {
  const d = dlg, [who, text] = d.lines[d.i], w = Math.min(VW - 24, 430), x = (VW - w) / 2, name = T.who[who];
  g.font = (who === 'm' || who === 'n' ? 'italic ' : '') + '10.5px ' + FONT; const lines = wrap(text, w - 28), h = Math.max(50, 22 + lines.length * 14), y = VH - h - 10;
  g.fillStyle = 'rgba(247,241,225,.97)'; g.fillRect(x, y, w, h); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x, y, w, h); g.lineWidth = 0.5; g.strokeRect(x + 3, y + 3, w - 6, h - 6);
  g.textAlign = 'left'; g.fillStyle = who === 'e' ? '#55514c' : INK; let left = Math.floor(d.n);
  lines.forEach((ln, i) => { if (left > 0) g.fillText(ln.slice(0, left), x + 14, y + 22 + i * 14); left -= ln.length + 1; });
  if (name) { g.font = '700 10px ' + FONT; const nw = g.measureText(name).width + 12; g.fillStyle = who === 'j' ? RED : who === 'e' ? NAMELESS : INK; g.fillRect(x + 10, y - 9, nw, 15); g.fillStyle = PAPER; g.fillText(name, x + 16, y + 2); }
  if (d.n >= text.length && Math.floor(gt * 2.5) % 2) { g.fillStyle = RED; g.font = '9px ' + FONT; g.fillText(T.next, x + w - 20, y + h - 7); }
  if (!pad.classList.contains('on')) { g.font = '7.5px ' + FONT; g.textAlign = 'right'; const sw = g.measureText(T.skip).width + 8; g.fillStyle = 'rgba(247,241,225,.9)'; g.fillRect(x + w - sw, y - 12, sw, 10.5); g.fillStyle = 'rgba(26,22,19,.7)'; g.fillText(T.skip, x + w - 4, y - 4); }
}
function drawCard() {
  const c = card, a = c.t < 0.6 ? c.t / 0.6 : c.t < 2.3 ? 1 : Math.max(0, 1 - (c.t - 2.3) / 0.7); g.fillStyle = `rgba(239,230,210,${a})`; g.fillRect(0, 0, VW, VH);
  if (c.t < 0.6) return; const ta = Math.min(1, (c.t - 0.6) / 0.4) * a, [ch, name] = T.stage[stageI]; g.globalAlpha = ta; g.textAlign = 'center';
  g.font = '700 10px ' + FONT; g.fillStyle = RED; g.fillText(ch, VW / 2, VH / 2 - 22); g.font = '700 26px ' + FONT; g.fillStyle = INK; g.fillText(name, VW / 2, VH / 2 + 8);
  g.fillStyle = INK; const sw = 120 * Math.min(1, (c.t - 0.6) / 0.7); g.beginPath(); g.moveTo(VW / 2 - 60, VH / 2 + 20); g.quadraticCurveTo(VW / 2 - 60 + sw / 2, VH / 2 + 24, VW / 2 - 60 + sw, VH / 2 + 20.5); g.quadraticCurveTo(VW / 2 - 60 + sw / 2, VH / 2 + 21, VW / 2 - 60, VH / 2 + 20); g.fill(); g.globalAlpha = 1;
}
function render() {
  g.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0); g.textBaseline = 'alphabetic'; g.globalAlpha = 1; pad.style.opacity = state === 'play' ? '' : '.12'; /* the touch pad steps back while reading */
  if (state === 'title') return drawTitle(); if (state === 'intro') return drawIntro(); if (state === 'ending') return drawEnding();
  drawBg(gt); const sh = cam.shake * 0.5; g.save(); g.translate(-cam.x + rnd(-sh, sh), -cam.y + rnd(-sh, sh));
  drawTiles(gt); drawEnts(gt); if (husk) drawEngine(husk.x, husk.y, gt, { still: true, named: colorT > 0.25, phase: 1 }); drawPlayer(gt); drawShots(gt); drawFx(); g.restore();
  drawOverlay(); drawHud(); if (state === 'dialog') drawDialog(); if (card) drawCard();
}
