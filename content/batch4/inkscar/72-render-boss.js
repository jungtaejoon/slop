// ---------- drawing: the Engine, items, shots ----------
let husk = null; // what is left of the Engine once it stops
function drawEngine(x, y, t, o) { // o: {tired, flash, phase, still, named}
  const col = o.flash ? FLASH : o.named ? '#3a4a5c' : NAMELESS, spin = o.still ? 0.4 : t * (0.8 + o.phase * 0.5), n = 12;
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { // a ring of brushes that never stops writing
    const a = (i / n) * 6.283 + spin, droop = o.tired || o.still ? 0.75 : 0, ax = x + Math.cos(a) * 24, ay = y + Math.sin(a) * 24, len = 17 + Math.sin(t * 9 + i * 2.1) * (o.still ? 0 : 4);
    const bx = ax + Math.cos(a) * len * (1 - droop), by = ay + Math.sin(a) * len * (1 - droop) + len * droop;
    g.lineWidth = 2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); g.lineWidth = 4.5; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (bx - ax) * 0.22, by + (by - ay) * 0.22); g.stroke();
  }
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 25, 0, 7); g.fill();
  g.strokeStyle = 'rgba(239,230,210,.35)'; g.lineWidth = 1; for (const r of [20, 14]) { g.beginPath(); g.arc(x, y, r, spin * (r > 15 ? -1 : 1.6), spin * (r > 15 ? -1 : 1.6) + 4.6); g.stroke(); }
  g.fillStyle = 'rgba(239,230,210,.8)'; for (let i = 0; i < 4; i++) { const px = x - 15 + i * 9, sw = Math.sin(t * 2 + i) * 2, h = 18 + hash(i * 3.3) * 14; g.fillRect(px + sw, y + 22, 5, h); g.fillStyle = 'rgba(120,116,110,.7)'; for (let k = 3; k < h - 3; k += 4) g.fillRect(px + sw + 1.5, y + 22 + k, 2, 2); g.fillStyle = 'rgba(239,230,210,.8)'; }
  // the eye: a gray slit while it writes, a red seal when it can be reached
  if (o.tired || o.named) { const s = 7 + Math.sin(t * 8) * (o.named ? 0 : 1.2); g.fillStyle = RED; g.fillRect(x - s, y - s, s * 2, s * 2); g.fillStyle = PAPER; g.fillRect(x - s + 2.5, y - 1.2, s * 2 - 5, 2.4); if (o.named) g.fillRect(x - 1.2, y - s + 2.5, 2.4, s * 2 - 5); }
  else { g.fillStyle = PAPER; g.beginPath(); g.ellipse(x, y, 8, o.still ? 1 : 3.5 + Math.sin(t * 5) * 1.5, 0, 0, 7); g.fill(); if (!o.still) { g.fillStyle = INK; g.beginPath(); g.arc(x + Math.sin(t * 3) * 3, y, 2, 0, 7); g.fill(); } }
}
function drawBoss(e, t) {
  const L = cam.lock;
  if (L && e.mode === 'sweep' && e.sw) { // the ground brush
    const s = e.sw;
    if (!s.go) { g.fillStyle = `rgba(196,55,40,${0.16 + 0.12 * Math.sin(t * 30)})`; g.fillRect(L.a0, GY - 26, L.a1 - L.a0, 26); g.fillStyle = RED; g.font = '700 14px ' + FONT; g.textAlign = 'center'; for (let i = 1; i < 6; i++) g.fillText(s.dir > 0 ? '›' : '‹', lerp(L.a0, L.a1, i / 6), GY - 9); }
    g.strokeStyle = NAMELESS; g.lineWidth = 5; g.beginPath(); g.moveTo(s.x - s.dir * 26, GY - 130); g.lineTo(s.x, GY - 28); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.moveTo(s.x - 11, GY - 30); g.quadraticCurveTo(s.x - 14, GY - 10, s.x - s.dir * 12, GY); g.quadraticCurveTo(s.x + 14, GY - 10, s.x + 11, GY - 30); g.fill();
  }
  if (e.mode === 'rain') for (const x of e.cols) { g.fillStyle = `rgba(196,55,40,${0.14 + 0.1 * Math.sin(t * 30)})`; g.fillRect(x - 5, 0, 10, GY); g.fillStyle = RED; g.fillRect(x - 5, GY - 2, 10, 2); }
  if (e.mode === 'scroll' && L) { const right = cx(pl) < (L.a0 + L.a1) / 2; g.fillStyle = `rgba(196,55,40,${0.2 + 0.15 * Math.sin(t * 30)})`; g.fillRect(right ? L.a1 - 5 : L.a0, GY - 62, 5, 62); }
  drawEngine(cx(e), cy(e), e.t, { tired: e.mode === 'tired', flash: e.flash > 0, phase: e.phase });
}
function drawItem(e, t) {
  const x = cx(e), y = e.y + e.h, ty = e.type;
  if (ty === 'C') { // seal stone
    g.fillStyle = INK; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x - 6, y - 20); g.quadraticCurveTo(x, y - 28, x + 6, y - 20); g.lineTo(x + 7, y); g.fill();
    if (e.on) { g.fillStyle = `rgba(196,55,40,${0.18 + 0.08 * Math.sin(t * 3)})`; g.beginPath(); g.arc(x, y - 16, 15, 0, 7); g.fill(); g.fillStyle = RED; g.fillRect(x - 3.5, y - 19.5, 7, 7); } else { g.strokeStyle = 'rgba(239,230,210,.6)'; g.lineWidth = 1; g.strokeRect(x - 3.5, y - 19.5, 7, 7); }
  } else if (ty === 'G') { // a lost word, still warm
    const by = cy(e) + Math.sin(t * 2.4 + e.x) * 3, h = g.createRadialGradient(x, by, 2, x, by, 22); h.addColorStop(0, 'rgba(196,55,40,.4)'); h.addColorStop(1, 'rgba(196,55,40,0)'); g.fillStyle = h; g.fillRect(x - 22, by - 22, 44, 44);
    g.save(); g.translate(x, by); g.rotate(Math.sin(t * 1.3 + e.x) * 0.12); g.fillStyle = '#fbf6e8'; g.fillRect(-7, -9, 14, 18); g.strokeStyle = INK; g.lineWidth = 0.8; g.strokeRect(-7, -9, 14, 18);
    g.fillStyle = RED; g.font = '700 11px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T.glyph[e.arg][0][0], 0, 0.5); g.textBaseline = 'alphabetic'; g.restore();
  } else if (ty === 'H') { g.fillStyle = INK; g.beginPath(); g.ellipse(x, y - 5.5, 6, 5.5, 0, 0, 7); g.fill(); g.fillRect(x - 3, y - 13, 6, 4); g.fillStyle = RED; g.fillRect(x - 3.5, y - 10.5, 7, 1.6); g.fillStyle = 'rgba(239,230,210,.5)'; g.fillRect(x - 3.4, y - 7, 1.4, 3); }
  else if (ty === 'S') { // the master's shrine
    g.fillStyle = INK; g.fillRect(x - 7, y - 27, 14, 27); g.beginPath(); g.moveTo(x - 13, y - 26); g.quadraticCurveTo(x, y - 40, x + 13, y - 26); g.quadraticCurveTo(x, y - 30, x - 13, y - 26); g.fill(); g.fillRect(x - 10, y - 2, 20, 2);
    g.fillStyle = 'rgba(239,230,210,.75)'; for (let k = 0; k < 4; k++) g.fillRect(x - 1, y - 22 + k * 5, 2, 3); g.fillStyle = RED; g.fillRect(x - 2, y - 5.5, 4, 4);
  } else if (ty === 'E') { // the way onward: a red gate
    g.strokeStyle = RED; g.lineCap = 'butt'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 8, y - 42); g.moveTo(x + 9, y); g.lineTo(x + 8, y - 42); g.stroke();
    g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 15, y - 41); g.quadraticCurveTo(x, y - 45, x + 15, y - 41); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(x - 11, y - 33); g.lineTo(x + 11, y - 33); g.stroke();
    g.fillStyle = `rgba(196,55,40,${0.1 + 0.06 * Math.sin(t * 3)})`; g.fillRect(x - 7, y - 32, 14, 32);
  } else if (ty === 'D') { g.fillStyle = INK; g.fillRect(x - 12, GY - 78, 5, 78); g.fillRect(x + 7, GY - 78, 5, 78); g.fillRect(x - 16, GY - 84, 32, 7); g.fillStyle = '#fbf6e8'; g.fillRect(x - 3, GY - 76, 6, 15); g.fillStyle = GRAY; g.fillRect(x - 1, GY - 73, 2, 9); }
}
function drawShots(t) {
  for (const s of shots) {
    const x = s.x + s.w / 2, y = s.y + s.h / 2, d = sign(s.vx);
    if (s.wave) { g.fillStyle = INK; g.globalAlpha = Math.min(1, s.life * 4); g.save(); g.translate(x, y); g.scale(d, 1); crescent(-14, 0, 22, -1.0, 1.0, 9); g.restore(); g.globalAlpha = 1; }
    else if (s.scroll) { g.fillStyle = '#fbf6e8'; g.fillRect(s.x, s.y, s.w, s.h); g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(s.x, s.y, s.w, s.h); g.fillStyle = GRAY; for (let k = 3; k < s.w - 3; k += 4) g.fillRect(s.x + k, s.y + 2, 2, 4); g.fillStyle = s.friendly ? RED : NAMELESS; g.fillRect(d > 0 ? s.x + s.w - 2 : s.x, s.y, 2, s.h); }
    else if (s.drop) { g.fillStyle = NAMELESS; g.beginPath(); g.moveTo(x, s.y - 8); g.quadraticCurveTo(x + 6, s.y + 8, x, s.y + s.h); g.quadraticCurveTo(x - 6, s.y + 8, x, s.y - 8); g.fill(); }
    else { g.fillStyle = s.friendly ? INK : '#5d5a56'; blob(x, y, s.friendly ? 5 : 4.5, t * 2, s.x * 0.1, 8, 0.2); if (s.friendly) { g.fillStyle = RED; g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); } }
  }
}
