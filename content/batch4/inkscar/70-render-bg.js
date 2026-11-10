// ---------- drawing: paper, ink-wash mountains, stage scenery, tiles ----------
let colorT = 0; // 0 = ink only; rises toward 1 in the true ending, when colour comes back
const PAPERS = ['#efe6d2', '#e7e8d2', '#d6cfbf'];
const grain = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '60,45,30' : '255,250,235'},${rnd(0.03, 0.1)})`; x.fillRect(rnd(128), rnd(128), rnd(0.5, 2.2), rnd(0.5, 1.2)); } return c; })();
let grainPat = null;
function ridge(par, base, amp, f, seed, alpha, col = '26,22,19') {
  const ox = cam.x * par; g.fillStyle = `rgba(${col},${alpha})`; g.beginPath(); g.moveTo(0, VH);
  for (let x = 0; x <= VW + 8; x += 8) { const wx = (x + ox) * f + seed; g.lineTo(x, base - amp * (Math.sin(wx) * 0.6 + Math.sin(wx * 2.3 + seed) * 0.3 + Math.sin(wx * 5.1) * 0.1)); }
  g.lineTo(VW + 8, VH); g.fill();
}
function drawBg(t) {
  const st = stageI, dark = st === 2;
  g.fillStyle = PAPERS[st]; g.fillRect(0, 0, VW, VH);
  if (colorT > 0) { const sky = g.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, `rgba(120,170,215,${0.55 * colorT})`); sky.addColorStop(0.7, `rgba(250,205,170,${0.45 * colorT})`); sky.addColorStop(1, `rgba(140,180,120,${0.4 * colorT})`); g.fillStyle = sky; g.fillRect(0, 0, VW, VH); }
  // the sun is a red seal
  const sx = VW * 0.78 - cam.x * 0.02, sy = dark ? 62 : 48; g.fillStyle = dark ? 'rgba(196,55,40,.5)' : 'rgba(196,55,40,.85)'; g.beginPath(); g.arc(sx, sy, 15, 0, 7); g.fill();
  const mc = colorT > 0 ? `${Math.round(lerp(26, 60, colorT))},${Math.round(lerp(22, 110, colorT))},${Math.round(lerp(19, 90, colorT))}` : '26,22,19';
  ridge(0.06, 150, 46, 0.006, 1.7 + st, 0.07, mc); ridge(0.12, 172, 38, 0.011, 4.1 + st * 2, 0.1, mc); ridge(0.22, 196, 30, 0.017, 9.3 + st, 0.14, mc);
  if (st === 0) { // roofs of the village, half washed out
    for (let i = Math.floor((cam.x * 0.4) / 130) - 1; i < (cam.x * 0.4 + VW) / 130 + 1; i++) { const h = hash(i * 3.1); if (h < 0.3) continue; const x = i * 130 - cam.x * 0.4 + h * 40, y = 196 - h * 14, w = 54 + h * 22; g.fillStyle = 'rgba(26,22,19,.2)'; g.fillRect(x + 8, y, w - 16, 40); g.beginPath(); g.moveTo(x - 6, y + 2); g.quadraticCurveTo(x + w / 2, y - 22 - h * 8, x + w + 6, y + 2); g.quadraticCurveTo(x + w / 2, y - 8, x - 6, y + 2); g.fill(); }
  } else if (st === 1) { // bamboo, two depths
    for (const [par, a, gap] of [[0.35, 0.12, 46], [0.6, 0.22, 74]]) for (let i = Math.floor((cam.x * par) / gap) - 1; i < (cam.x * par + VW) / gap + 1; i++) {
      const h = hash(i * 7.7 + par), x = i * gap - cam.x * par + h * 30, lean = (h - 0.5) * 16, wd = 2 + h * 3;
      g.strokeStyle = colorT > 0 ? `rgba(${Math.round(lerp(26, 50, colorT))},${Math.round(lerp(22, 120, colorT))},60,${a + 0.1 * colorT})` : `rgba(26,22,19,${a})`; g.lineWidth = wd; g.beginPath(); g.moveTo(x, VH); g.lineTo(x + lean, -10); g.stroke();
      g.lineWidth = 1; g.strokeStyle = PAPERS[1]; for (let k = 0; k < 6; k++) { const yy = 30 + k * 42 + h * 20, xx = x + lean * (1 - yy / VH); g.beginPath(); g.moveTo(xx - wd, yy); g.lineTo(xx + wd, yy); g.stroke(); }
      g.fillStyle = `rgba(26,22,19,${a})`; for (let k = 0; k < 3; k++) { const yy = 40 + hash(i + k * 1.3) * 120, xx = x + lean * (1 - yy / VH), d = k % 2 ? 1 : -1, sw = Math.sin(t * 0.8 + i) * 2; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + d * 12, yy - 2 + sw, xx + d * 22, yy + 6 + sw); g.quadraticCurveTo(xx + d * 10, yy + 3, xx, yy); g.fill(); }
    }
  } else { // inside the tower: pillars, hanging pages full of gray writing, falling gray ink
    for (let i = Math.floor((cam.x * 0.5) / 96) - 1; i < (cam.x * 0.5 + VW) / 96 + 1; i++) {
      const h = hash(i * 5.3), x = i * 96 - cam.x * 0.5; g.fillStyle = 'rgba(26,22,19,.16)'; g.fillRect(x, 0, 14, VH);
      const px = x + 34 + h * 20, ph = 70 + h * 90, sway = Math.sin(t * 0.7 + i) * 2; g.fillStyle = 'rgba(239,230,210,.5)'; g.fillRect(px + sway, 0, 26, ph);
      g.fillStyle = 'rgba(120,116,110,.5)'; for (let k = 0; k < 4; k++) for (let y = 6; y < ph - 6; y += 5) if (hash(i * 31 + k * 7 + y) > 0.25) g.fillRect(px + sway + 3 + k * 6, y, 3, 3);
      if (h > 0.55) { const fx = x + 70; g.fillStyle = 'rgba(120,116,110,.28)'; g.fillRect(fx, 0, 5, VH); g.fillStyle = 'rgba(120,116,110,.4)'; g.fillRect(fx + 1, ((t * 90 + h * 300) % (VH + 40)) - 40, 3, 40); }
    }
  }
  const mist = g.createLinearGradient(0, 150, 0, VH); mist.addColorStop(0, 'rgba(239,230,210,0)'); mist.addColorStop(1, `rgba(239,230,210,${dark ? 0.25 : 0.55})`); g.fillStyle = mist; g.fillRect(0, 150, VW, VH - 150);
}
function drawTiles(t) {
  const x0 = Math.max(0, Math.floor(cam.x / TS)), x1 = Math.min(lvl.w - 1, Math.floor((cam.x + VW) / TS) + 1);
  for (let ty = 0; ty < ROWS; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = lvl.G[ty][tx]; if (c === ' ') continue; const x = tx * TS, y = ty * TS, h = hash(tx * 13.7 + ty * 91.3);
    if (c === '#') {
      g.fillStyle = INK; g.fillRect(x, y, TS + 0.5, TS + 0.5);
      if (h > 0.6) { g.fillStyle = 'rgba(239,230,210,.05)'; g.fillRect(x + h * 8, y + 3, 6, 2); }
      if (tile(tx, ty - 1) !== '#') { // dry-brush top edge, and grass outside the tower
        g.fillStyle = 'rgba(239,230,210,.16)'; g.fillRect(x, y + 1.5, TS + 0.5, 1);
        g.fillStyle = INK; g.beginPath(); g.moveTo(x, y + 1); g.quadraticCurveTo(x + 8, y - 2 - h * 2, x + TS, y + 1); g.fill();
        if (stageI < 2 && h > 0.35) { g.strokeStyle = colorT > 0.5 ? '#3c7a46' : INK; g.lineWidth = 1; const sw = Math.sin(t * 2 + tx) * 1.5; g.beginPath(); for (let k = 0; k < 3; k++) { const gx = x + 2 + k * 5 + h * 3; g.moveTo(gx, y); g.lineTo(gx + sw + k - 1, y - 3 - h * 5); } g.stroke(); }
      }
    } else if (c === '=') { g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(x, y + 2.5); g.lineTo(x + TS, y + 2.5); g.stroke(); g.lineWidth = 1; g.strokeStyle = 'rgba(26,22,19,.5)'; g.beginPath(); g.moveTo(x + 3, y + 5); g.lineTo(x + 3 + h * 4, y + 9 + h * 4); g.stroke(); g.lineCap = 'butt'; }
    else if (c === '^') { g.fillStyle = INK; for (let k = 0; k < 3; k++) { const bx = x + k * 5.3, hh = 9 + hash(tx * 3 + k) * 6; g.beginPath(); g.moveTo(bx, y + TS); g.lineTo(bx + 2.7 + Math.sin(t * 3 + tx + k) * 0.6, y + TS - hh); g.lineTo(bx + 5.3, y + TS); g.fill(); } g.fillStyle = RED; g.fillRect(x + 7.4, y + 4, 1.2, 1.2); }
  }
}
function drawOverlay() {
  if (!grainPat) grainPat = g.createPattern(grain, 'repeat');
  g.fillStyle = grainPat; g.fillRect(0, 0, VW, VH);
  const v = g.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VW * 0.75); v.addColorStop(0, 'rgba(40,28,16,0)'); v.addColorStop(1, 'rgba(40,28,16,.32)'); g.fillStyle = v; g.fillRect(0, 0, VW, VH);
}
