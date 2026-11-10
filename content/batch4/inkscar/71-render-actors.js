// ---------- drawing: the scribe, her paper crane, the Nameless ----------
const NAMELESS = '#45413d', FLASH = '#fff6e0';
function blob(x, y, r, t, seed = 0, n = 10, wob = 0.16) { // an uneven, breathing ink blot
  g.beginPath();
  for (let i = 0; i <= n; i++) { const a = (i / n) * 6.283, rr = r * (1 + wob * Math.sin(a * 3 + t * 3 + seed) + wob * 0.5 * Math.sin(a * 5 - t * 2 + seed)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.fill();
}
function crescent(ox, oy, r, a0, a1, wd) { // a tapered brush stroke along an arc
  const ccw = a1 < a0; g.beginPath(); g.arc(ox, oy, r, a0, a1, ccw); g.arc(ox - 2, oy, r - wd, a1, a0, !ccw); g.closePath(); g.fill();
}
const crane = { x: 0, y: 0, f: 1 };
function drawCrane(t) {
  const flap = Math.sin(t * 9) * 3.5; g.save(); g.translate(crane.x, crane.y); g.scale(crane.f, 1);
  g.fillStyle = '#fbf6e8'; g.strokeStyle = INK; g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(-5, 1); g.lineTo(0, -1); g.lineTo(5.5, -2.5); g.lineTo(1, 2); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-1, 0); g.lineTo(0.5, -6 - flap); g.lineTo(2, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = RED; g.fillRect(4.6, -2.9, 1.3, 1.1); g.restore();
}
function drawPlayer(t) {
  const p = pl; if (!p || p.dead) return; drawCrane(t);
  if (p.inv > 0 && p.dashT <= 0 && Math.floor(p.t * 22) % 2) return;
  const x = cx(p), f = p.face, air = !p.onGround, run = !air && Math.abs(p.vx) > 20, sw = Math.sin(p.t * 18), bob = run ? Math.abs(sw) * 1.2 : Math.sin(p.t * 2.5) * 0.5;
  g.lineCap = g.lineJoin = 'round'; g.strokeStyle = RED; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x - f * 2, p.y + 6 + bob); for (const s of p.scarf) g.lineTo(s.x, s.y); g.stroke();
  g.save(); g.translate(x, p.y + bob); g.scale(f, 1); if (p.dashT > 0) g.transform(1, 0, -0.45, 1, 5, 0);
  g.strokeStyle = g.fillStyle = INK; g.lineWidth = 2.2; const lg = run ? sw * 4 : 0;
  g.beginPath(); g.moveTo(-1.5, 15); g.lineTo(-2 + (air ? -2.5 : lg), 22 - bob); g.moveTo(1.5, 15); g.lineTo(2 + (air ? 3 : -lg), 22 - bob - (air ? 2.5 : 0)); g.stroke();
  g.beginPath(); g.moveTo(-3, 5); g.lineTo(3.5, 5); g.lineTo(5.5, 17); g.quadraticCurveTo(0, 19.5, -6.5 - (run ? 1.5 : 0), 16.5); g.closePath(); g.fill(); // robe
  g.beginPath(); g.arc(0.5, 2.4, 3.1, 0, 7); g.fill(); g.fillStyle = PAPER; g.fillRect(1.9, 1.7, 1.3, 1.4);                                              // head
  g.fillStyle = INK; g.beginPath(); g.ellipse(0.3, -0.2, 7.2, 1.5, 0, 0, 7); g.fill(); g.fillRect(-2.3, -4.4, 5.2, 4.4);                                 // wide-brimmed hat
  // the brush-sword: resting on the shoulder, or mid-stroke
  if (p.atkT > 0) {
    const k = 1 - p.atkT / 0.2, e = 1 - (1 - k) * (1 - k), c = p.combo, r = c === 3 ? 34 : 27, a0 = c === 2 ? 1.25 : c === 3 ? -2.7 : -2.2, a1 = c === 2 ? -1.9 : c === 3 ? 1.45 : 1.0, a = lerp(a0, a1, e);
    g.globalAlpha = 1 - k * k; g.fillStyle = INK; crescent(3, 9, r, lerp(a0, a, k * 0.6), a, c === 3 ? 9 : 6); g.globalAlpha = 1;
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(3, 9); g.lineTo(3 + Math.cos(a) * 15, 9 + Math.sin(a) * 15); g.stroke();
    if (c === 3) { g.fillStyle = RED; g.beginPath(); g.arc(3 + Math.cos(a) * r, 9 + Math.sin(a) * r, 2.2 * (1 - k), 0, 7); g.fill(); }
  } else { g.lineWidth = 1.5; g.beginPath(); g.moveTo(2, 11); g.lineTo(-7, -3); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(-7, -3); g.lineTo(-8.6, -5.6); g.stroke(); }
  g.restore();
}
function drawEnts(t) {
  for (const e of ents) {
    if (e.x > cam.x + VW + 60 || e.x + e.w < cam.x - 60) continue;
    const x = cx(e), y = e.y + e.h, col = e.flash > 0 ? FLASH : NAMELESS, f = e.face; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
    if (e.type === 'b') { // blot: something small that forgot what it was
      const sq = e.onGround ? 1 + Math.sin(e.t * 6) * 0.08 : 0.84; g.save(); g.translate(x, y); g.scale(sq, 2 - sq); blob(0, -6, 7.4, e.t); g.beginPath(); g.arc(-5, -1, 2, 0, 7); g.arc(4.5, -0.6, 1.6, 0, 7); g.fill();
      g.fillStyle = PAPER; g.fillRect(f * 2 - 2.6, -8.5, 1.6, 2.8); g.fillRect(f * 2 + 1.4, -8.5, 1.6, 2.8); g.restore();
    } else if (e.type === 's') { // ink bloom: swells, then spits
      const up = e.mode === 1 ? 1.4 : 1 + Math.sin(e.t * 3) * 0.05, hx = x + f * 2 + Math.sin(e.t * 2) * 1.2, hy = e.y + 5;
      g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - f * 5, y - 9, hx, hy); g.stroke(); g.beginPath(); g.ellipse(x + 4, y - 5, 4, 1.6, -0.5, 0, 7); g.ellipse(x - 4, y - 8, 4, 1.6, 0.5, 0, 7); g.fill();
      for (let i = 0; i < 5; i++) { const a = i * 1.257 + e.t * 0.6; g.beginPath(); g.arc(hx + Math.cos(a) * 4 * up, hy + Math.sin(a) * 4 * up, 3 * up, 0, 7); g.fill(); }
      g.fillStyle = e.mode === 1 ? RED : PAPER; g.beginPath(); g.arc(hx, hy, e.mode === 1 ? 2.6 : 1.6, 0, 7); g.fill();
    } else if (e.type === 'c') { // crow-letter: a stroke that flew off its page
      const dive = e.mode === 2, sh = e.mode === 1 ? Math.sin(e.t * 60) * 1.2 : 0, flap = dive ? -0.9 : Math.sin(e.t * 14) * 0.8;
      g.save(); g.translate(x + sh, cy(e)); if (dive) g.rotate(Math.atan2(e.vy, e.vx)); else g.scale(f, 1);
      g.beginPath(); g.ellipse(0, 0, 6.5, 3.2, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(6, -1.2); g.lineTo(11, 0.4); g.lineTo(6, 1.6); g.fill();
      g.lineWidth = 2.6; g.beginPath(); g.moveTo(-1, -1); g.quadraticCurveTo(-4, -7 - flap * 6, -11, -4 - flap * 9); g.moveTo(1, -1); g.quadraticCurveTo(0, -8 - flap * 6, -5, -9 - flap * 9); g.stroke();
      g.fillStyle = e.mode === 1 || dive ? RED : PAPER; g.fillRect(3, -1.6, 1.6, 1.6); g.restore();
    } else if (e.type === 'k') { // gatekeeper: still guarding, no longer knows what
      const m = e.mode, slump = m === 3 ? 4 : 0; g.save(); g.translate(x, y); g.scale(f, 1);
      g.beginPath(); g.moveTo(-6, 0); g.lineTo(-7, -17 + slump); g.quadraticCurveTo(0, -23 + slump, 6, -17 + slump); g.lineTo(7, 0); g.closePath(); g.fill(); g.beginPath(); g.arc(1 + slump * 0.5, -22 + slump * 1.4, 4.2, 0, 7); g.fill();
      g.fillStyle = m === 1 ? RED : PAPER; g.fillRect(2.4 + slump * 0.5, -23 + slump * 1.4, 2, 1.3);
      g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); // the club
      if (m === 1) { g.moveTo(-2, -15); g.lineTo(-9, -31); } else if (m === 2) { g.moveTo(2, -13); g.lineTo(22, -9); } else { g.moveTo(-3, -13); g.lineTo(-9, -3); } g.stroke();
      if (m === 2) { g.globalAlpha = 0.55; crescent(2, -12, 34, -1.7, 0.5, 8); g.globalAlpha = 1; }
      const sy = m === 3 ? -13 : -25; g.fillStyle = e.flashB > 0 ? FLASH : GRAY; g.fillRect(7, sy, 4.5, 23 + (m === 3 ? -10 : 0)); g.fillStyle = INK; g.fillRect(8.5, sy + 3, 1.5, m === 3 ? 7 : 17); // the shield: a door plank
      g.restore(); if (m === 1) { g.fillStyle = RED; g.font = '700 12px ' + FONT; g.textAlign = 'center'; g.fillText('!', x, e.y - 8); }
    } else if (e.type === 'B') { if (!husk) drawBoss(e, t); } else drawItem(e, t);
  }
}
