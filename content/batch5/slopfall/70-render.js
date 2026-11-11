// ---------- drawing the pixel layer: the area (pre-drawn), actors, effects, light ----------
const DK = document.createElement('canvas'), dk = DK.getContext('2d'); // darkness layer
const PAINT = ['#e76f51', '#2a9d8f', '#e9c46a', '#7b5ea7'];
function buildStageArt(s) {
  const c = document.createElement('canvas'); c.width = s.W * TS; c.height = s.H * TS; const a = c.getContext('2d'), B = s.B, W = s.W;
  const isW = (x, y) => x < 0 || y < 0 || x >= s.W || y >= s.H || s.tiles[y * W + x] === 1;
  a.fillStyle = '#07080a'; a.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
    if (isW(x, y)) continue; const h = hash2(x * 7 + 3, y * 13 + 1), px = x * TS, py = y * TS;
    a.fillStyle = B.floor[h < 0.5 ? 0 : h < 0.85 ? 1 : 2]; a.fillRect(px, py, TS, TS);
    if (s.biome === 'gal') { a.fillStyle = (x + y) & 1 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.08)'; a.fillRect(px, py, TS, TS); if (h > 0.8) { a.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 8; i++) a.fillRect(px + i * 2, py + i, 1, 1); } }
    else if (s.biome === 'arc') { a.fillStyle = hexA(B.trim, 0.12); a.fillRect(px, py, TS, 1); a.fillRect(px, py, 1, TS); if (h > 0.93) { a.fillStyle = hexA(B.accent, 0.5); a.fillRect(px + 7, py + 7, 2, 2); } }
    else if (s.biome === 'news') { a.fillStyle = 'rgba(0,0,0,.18)'; a.fillRect(px, py + 7, TS, 1); a.fillRect(px + ((x * 5 + y * 3) % 12) + 2, py, 1, 7); a.fillRect(px + ((x * 3 + y * 7) % 12) + 2, py + 8, 1, 8); }
    else if (s.biome === 'mir') { if (h > 0.7) { a.fillStyle = 'rgba(127,227,214,.07)'; for (let i = 0; i < 10; i++) a.fillRect(px + i, py + 15 - i, 2, 1); } a.fillStyle = 'rgba(255,255,255,.02)'; a.fillRect(px, py, TS, 1); }
    else if (s.biome === 'tow') { a.fillStyle = 'rgba(0,0,0,.25)'; a.fillRect(px, py, TS, 1); a.fillRect(px, py, 1, TS); a.fillStyle = 'rgba(255,255,255,.05)'; a.fillRect(px + 2, py + 2, 1, 1); a.fillRect(px + 13, py + 13, 1, 1); }
    else { if (h > 0.86) { a.fillStyle = 'rgba(0,0,0,.25)'; a.fillRect(px + 3, py + 6, 6, 1); a.fillRect(px + 8, py + 6, 1, 5); } if (h < 0.12) { a.fillStyle = 'rgba(255,255,255,.03)'; a.fillRect(px + 4, py + 4, 8, 8); } }
    if (s.tiles[y * W + x] === 2) { // hazards
      if (B.hazard === 'paint') { a.fillStyle = hexA(PAINT[(x * 3 + y) % 4], 0.55); a.beginPath(); a.ellipse(px + 8, py + 8, 8 + h * 2, 6 + h * 2, h * 3, 0, 7); a.fill(); }
      else { for (let i = 0; i < 10; i++) { a.fillStyle = i % 2 ? '#fb7185' : '#22d3ee'; a.globalAlpha = 0.35; a.fillRect(px + Math.floor(hash2(x + i, y) * 15), py + Math.floor(hash2(x, y + i) * 15), 2, 1); } a.globalAlpha = 1; }
    }
    if (isW(x, y - 1)) { const gr = a.createLinearGradient(0, py, 0, py + 9); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); a.fillStyle = gr; a.fillRect(px, py, TS, 9); }
    if (isW(x - 1, y)) { a.fillStyle = 'rgba(0,0,0,.18)'; a.fillRect(px, py, 3, TS); }
  }
  for (const p of s.props) drawProp(a, s, p);
  // walls: a lit top face, and a front face where the floor below can see it
  for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) {
    if (!isW(x, y)) continue; const px = x * TS, py = y * TS;
    let edge = false; for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) if (!isW(x + dx, y + dy)) { edge = true; break; }
    if (!edge) continue;
    const front = !isW(x, y + 1), h = hash2(x * 5, y * 11);
    a.fillStyle = B.top; a.fillRect(px, py - 6, TS, TS);
    a.fillStyle = shadeHex(B.top, 0.18); if (!isW(x, y - 1)) a.fillRect(px, py - 6, TS, 1);
    a.fillStyle = shadeHex(B.top, -0.12); if (!isW(x - 1, y)) a.fillRect(px, py - 6, 1, TS); if (!isW(x + 1, y)) a.fillRect(px + TS - 1, py - 6, 1, TS);
    if (!front) continue;
    a.fillStyle = B.face; a.fillRect(px, py + 10, TS, 6);
    if (s.biome === 'news') { for (let i = 0; i < 7; i++) { a.fillStyle = ['#8a5636', '#4b2c22', '#d6c7a8', '#9c2f3d', '#2f5a9c'][(x * 3 + i) % 5]; a.fillRect(px + 1 + i * 2, py + 10 + (i % 2), 1, 6 - (i % 2)); } }
    else if (s.biome === 'gal') { if (h > 0.45) { a.fillStyle = B.trim; a.fillRect(px + 3, py + 1, 10, 9); a.fillStyle = PAINT[(x + y) % 4]; a.fillRect(px + 4, py + 2, 8, 7); a.fillStyle = 'rgba(255,255,255,.25)'; a.fillRect(px + 4, py + 2, 3, 1); } }
    else if (s.biome === 'arc') { if (h > 0.4) { a.fillStyle = '#0b0618'; a.fillRect(px + 3, py, 10, 8); a.fillStyle = hexA(h > 0.7 ? B.trim : B.accent, 0.85); a.fillRect(px + 4, py + 1, 8, 6); a.fillStyle = 'rgba(255,255,255,.3)'; a.fillRect(px + 4, py + 1, 8, 1); } }
    else if (s.biome === 'mir') { a.fillStyle = 'rgba(127,227,214,.35)'; a.fillRect(px + (h * 12 | 0), py + 10, 1, 6); a.fillStyle = 'rgba(255,255,255,.12)'; a.fillRect(px, py + 10, TS, 1); }
    else if (s.biome === 'tow') { a.fillStyle = '#0e1013'; a.fillRect(px + 2, py + 11, 12, 4); a.fillStyle = h > 0.5 ? '#2dd4bf' : '#fb7185'; a.fillRect(px + 3 + (h * 8 | 0), py + 12, 1, 1); }
    else { if (h > 0.6) { a.fillStyle = B.trim; a.globalAlpha = 0.5; a.fillRect(px + 2, py + 12, 12, 1); a.globalAlpha = 1; } }
    a.fillStyle = 'rgba(0,0,0,.35)'; a.fillRect(px, py + 15, TS, 1);
  }
  s.art = c;
}
function drawProp(a, s, p) {
  const x = p.x * TS, y = p.y * TS + 2, k = p.k;
  if (s.biome === 'out') { if (k < 2) { a.fillStyle = '#8a5636'; a.fillRect(x + 3, y + 4, 9, 7); a.fillStyle = '#b07548'; a.fillRect(x + 3, y + 4, 9, 2); a.fillStyle = '#4b2c22'; a.fillRect(x + 7, y + 4, 1, 7); } else { a.fillStyle = '#f0a03c'; a.beginPath(); a.moveTo(x + 8, y + 1); a.lineTo(x + 12, y + 11); a.lineTo(x + 4, y + 11); a.fill(); a.fillStyle = '#f4f0e8'; a.fillRect(x + 6, y + 6, 4, 1); } }
  else if (s.biome === 'gal') { a.fillStyle = PAINT[k]; a.fillRect(x + 5, y + 5, 6, 6); a.fillStyle = '#d9d4e8'; a.fillRect(x + 5, y + 4, 6, 1); a.fillStyle = hexA(PAINT[k], 0.5); a.fillRect(x + 10, y + 10, 4, 2); }
  else if (s.biome === 'arc') { a.fillStyle = '#f6d55c'; for (let i = 0; i < 4; i++) a.fillRect(x + 4 + i * 2, y + 9 - (i % 2), 3, 2); a.fillStyle = '#c99a2e'; a.fillRect(x + 4, y + 11, 9, 1); }
  else if (s.biome === 'news') { for (let i = 0; i < 3; i++) { a.fillStyle = i % 2 ? '#d6c7a8' : '#efe6d2'; a.fillRect(x + 3 + i, y + 8 - i * 2, 10, 2); } a.fillStyle = '#4a4458'; a.fillRect(x + 5, y + 7, 6, 1); }
  else if (s.biome === 'mir') { a.fillStyle = '#7fe3d6'; a.beginPath(); a.moveTo(x + 8, y); a.lineTo(x + 11, y + 10); a.lineTo(x + 5, y + 10); a.fill(); a.fillStyle = 'rgba(255,255,255,.5)'; a.fillRect(x + 7, y + 3, 1, 5); }
  else { a.strokeStyle = '#3a4150'; a.lineWidth = 1.5; a.beginPath(); a.ellipse(x + 8, y + 8, 5, 3, 0, 0, 7); a.stroke(); a.fillStyle = '#2dd4bf'; a.fillRect(x + 12, y + 7, 2, 2); }
}
// slopfall: streaks drifting down in screen space
const RAIN = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), l: 2 + Math.random() * 4 }));
function drawRain(t, k = 1, col = 'rgba(176,124,232,.35)') {
  g.fillStyle = col;
  for (const r of RAIN) { const x = ((r.x * LW + t * 14 * r.s) % LW + LW) % LW, y = ((r.y * LH + t * 60 * r.s) % LH + LH) % LH; g.globalAlpha = 0.25 * r.s * k; g.fillRect(Math.round(x), Math.round(y), 1, Math.round(r.l)); }
  g.globalAlpha = 1;
}
function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x, y, w, w * 0.38, 0, 0, 7); g.fill(); }
const camOX = () => Math.round(cam.x - LW / 2) - (shake ? Math.round(rnd(-shake, shake) * 0.5) : 0), camOY = () => Math.round(cam.y - LH / 2) - (shake ? Math.round(rnd(-shake, shake) * 0.5) : 0);

function drawWorld(t) {
  g.fillStyle = '#07080a'; g.fillRect(0, 0, LW, LH);
  const ox = camOX(), oy = camOY();
  g.drawImage(st.art, -ox, -oy);
  g.save(); g.translate(-ox, -oy);
  // vents and the exit gate
  for (const v of st.vents) { const k = 0.5 + Math.sin(t * 3 + v.x) * 0.5; g.fillStyle = '#0b0c10'; g.beginPath(); g.ellipse(v.x, v.y, 9, 5, 0, 0, 7); g.fill(); g.strokeStyle = hexA(st.B.accent, 0.35 + k * 0.4); g.lineWidth = 1.5; g.stroke(); g.fillStyle = hexA(st.B.accent, 0.25 * k); g.beginPath(); g.ellipse(v.x, v.y, 6, 3, 0, 0, 7); g.fill(); }
  drawGims(t);
  for (const sh of st.shrines) drawShrine(sh, t);
  if (st.vault) drawVault(st.vault, t);
  if (st.exit && (st.need || st.open)) drawGate(st.exit.x, st.exit.y, t);
  for (const f of fx) if (f.k === 'mark') {
    const k = f.t / f.max; g.globalAlpha = 1 - k * k; g.strokeStyle = f.evo ? '#f6d55c' : '#e0524a'; g.lineWidth = 2;
    g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(f.x, f.y, f.r * 0.7, 0, 7); g.stroke();
    if (f.evo) { g.fillStyle = 'rgba(240,160,60,.18)'; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); }
    g.fillStyle = g.strokeStyle; g.fillRect(f.x - 3, f.y - 1, 7, 2); g.fillRect(f.x - 1, f.y - 3, 2, 7); g.globalAlpha = 1;
  }
  if (boss && boss.tele) for (const tl of boss.tele) { // the mirror curator's warnings
    if (tl.done) continue; const k = clamp(tl.t / tl.at, 0, 1); g.fillStyle = `rgba(251,113,133,${0.12 + k * 0.22})`; g.strokeStyle = `rgba(251,113,133,${0.5 + k * 0.5})`; g.lineWidth = 1;
    if (tl.k === 'c') { g.beginPath(); g.arc(tl.x, tl.y, tl.r, 0, 7); g.fill(); g.beginPath(); g.arc(tl.x, tl.y, tl.r * k, 0, 7); g.stroke(); }
    else { g.beginPath(); g.moveTo(boss.x, boss.y); g.arc(boss.x, boss.y, tl.r, tl.a - 1.15, tl.a + 1.15); g.closePath(); g.fill(); g.stroke(); }
  }
  if (boss && boss.kind === 'mirror' && boss.mode === 'dashw') { g.strokeStyle = 'rgba(251,113,133,.6)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(boss.x, boss.y); g.lineTo(boss.x + Math.cos(boss.aim) * 115, boss.y + Math.sin(boss.aim) * 115); g.stroke(); g.setLineDash([]); }
  for (const s of shots) if (s.k === 'stamp' && !s.done && s.t > 0) { const k = clamp(s.t / s.delay, 0, 1); g.strokeStyle = 'rgba(224,82,74,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(s.x, s.y, s.r * k, 0, 7); g.stroke(); }
  drawGroundShots(t);
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
  drawEffects(t);
  g.restore();
  drawLight(t, ox, oy);
}
function drawShrine(sh, t) {
  const col = SHRINE_COL[sh.k], k = sh.used ? 0.25 : 0.6 + Math.sin(t * 3 + sh.x) * 0.25;
  g.fillStyle = '#0b0c10'; g.beginPath(); g.ellipse(sh.x, sh.y + 2, 13, 6, 0, 0, 7); g.fill();
  g.strokeStyle = hexA(col, k); g.lineWidth = 1.5; g.beginPath(); g.ellipse(sh.x, sh.y + 2, 13, 6, 0, 0, 7); g.stroke();
  if (!sh.used && sh.charge > 0) { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.ellipse(sh.x, sh.y + 2, 13, 6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sh.charge / 1.5); g.stroke(); }
  // a small stone with the shrine's sign floating over it
  g.fillStyle = sh.used ? '#2a2e36' : '#3a404b'; g.fillRect(sh.x - 4, sh.y - 9, 8, 10); g.fillStyle = sh.used ? '#3a404b' : '#4a5260'; g.fillRect(sh.x - 4, sh.y - 9, 8, 2);
  if (sh.used) return; const y = sh.y - 17 + Math.sin(t * 2.4 + sh.x) * 1.5; g.fillStyle = col;
  if (sh.k === 'might') { g.fillRect(sh.x - 1, y - 4, 2, 8); g.fillRect(sh.x - 3, y + 1, 6, 1); }
  else if (sh.k === 'haste') { g.beginPath(); g.moveTo(sh.x + 2, y - 4); g.lineTo(sh.x - 3, y + 1); g.lineTo(sh.x, y + 1); g.lineTo(sh.x - 2, y + 5); g.lineTo(sh.x + 3, y - 1); g.lineTo(sh.x, y - 1); g.fill(); }
  else if (sh.k === 'magnet') { g.fillRect(sh.x - 4, y - 3, 2, 6); g.fillRect(sh.x + 2, y - 3, 2, 6); g.fillRect(sh.x - 4, y + 2, 8, 2); }
  else { g.fillRect(sh.x - 1, y - 4, 2, 8); g.fillRect(sh.x - 4, y - 1, 8, 2); }
}
function drawVault(v, t) {
  shadow(v.x, v.y + 6, 10);
  const big = !v.open, y = v.y - 6;
  if (big) { g.fillStyle = `rgba(246,213,92,${0.12 + Math.sin(t * 4) * 0.06})`; g.beginPath(); g.arc(v.x, y, 18, 0, 7); g.fill(); }
  spr(PICK.chest, v.x, y, false, false, v.open ? 1 : 1.6);
  if (big) { g.strokeStyle = '#a29db0'; g.lineWidth = 1; g.beginPath(); g.moveTo(v.x - 11, y - 6); g.lineTo(v.x + 11, y + 6); g.moveTo(v.x + 11, y - 6); g.lineTo(v.x - 11, y + 6); g.stroke(); g.fillStyle = '#f6d55c'; g.fillRect(v.x - 2, y - 2, 4, 4); }
}
// crates and barrels: drawn with shapes
function drawProp2(e, t) {
  if (e.type === 'shard') return drawShard(e, t);
  shadow(e.x, e.y + 5, 7); const fl = e.flash > 0, x = Math.round(e.x), y = Math.round(e.y) - 4;
  if (e.type === 'crate') {
    g.fillStyle = fl ? '#fff' : '#8a5636'; g.fillRect(x - 7, y - 6, 14, 12); g.fillStyle = fl ? '#fff' : '#b07548'; g.fillRect(x - 7, y - 6, 14, 2);
    g.fillStyle = '#4b2c22'; g.fillRect(x - 7, y - 1, 14, 1); g.fillRect(x - 1, y - 6, 1, 12); g.strokeStyle = '#120e1a'; g.lineWidth = 1; g.strokeRect(x - 7.5, y - 6.5, 15, 13);
  } else {
    g.fillStyle = fl ? '#fff' : '#c2410c'; g.fillRect(x - 6, y - 7, 12, 14); g.fillStyle = fl ? '#fff' : '#ea580c'; g.fillRect(x - 6, y - 7, 12, 2);
    g.fillStyle = '#7c2d12'; g.fillRect(x - 6, y - 2, 12, 1); g.fillRect(x - 6, y + 3, 12, 1);
    g.fillStyle = '#f6d55c'; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3, y + 1); g.lineTo(x - 3, y + 1); g.fill(); g.fillStyle = '#120e1a'; g.fillRect(x, y - 2, 1, 2);
    g.strokeStyle = '#120e1a'; g.lineWidth = 1; g.strokeRect(x - 6.5, y - 7.5, 13, 15);
  }
}
function drawGate(x, y, t) {
  const k = st.need ? st.charge / st.need : 1, open = st.open;
  g.fillStyle = '#0b0c10'; g.beginPath(); g.ellipse(x, y + 4, 15, 7, 0, 0, 7); g.fill();
  g.strokeStyle = open ? '#5eead4' : 'rgba(45,212,191,.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 4, 15, 7, 0, 0, 7); g.stroke();
  if (!open) { g.strokeStyle = '#2dd4bf'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 4, 15, 7, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke(); }
  // two standing stones with the gem between them
  for (const s of [-1, 1]) { g.fillStyle = '#2a2e36'; g.fillRect(x + s * 14 - 3, y - 18, 6, 22); g.fillStyle = '#3a404b'; g.fillRect(x + s * 14 - 3, y - 18, 6, 2); g.fillStyle = open ? '#5eead4' : '#1f5c55'; g.fillRect(x + s * 14 - 1, y - 12, 2, 8); }
  const gy = y - 14 + Math.sin(t * 2.5) * 2; g.fillStyle = open ? '#5eead4' : '#2a6d66'; g.beginPath(); g.moveTo(x, gy - 6); g.lineTo(x + 5, gy); g.lineTo(x, gy + 7); g.lineTo(x - 5, gy); g.fill();
  if (open) { const gr = g.createLinearGradient(0, y - 60, 0, y + 4); gr.addColorStop(0, 'rgba(94,234,212,0)'); gr.addColorStop(1, `rgba(94,234,212,${0.35 + Math.sin(t * 4) * 0.1})`); g.fillStyle = gr; g.fillRect(x - 11, y - 60, 22, 64); }
}
function drawEffects(t) {
  for (const f of fx) {
    if (f.k === 'slash') {
      const k = f.t / f.max, R = f.r * (0.75 + k * 0.25), a0 = f.evo ? f.a + k * 3 : f.a - f.arc / 2, a1 = f.evo ? a0 + Math.PI * 2 : f.a + f.arc / 2;
      g.globalAlpha = 1 - k; g.strokeStyle = '#f4f0e8'; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(pl.x, pl.y - 3, R, a0, a1); g.stroke();
      g.strokeStyle = f.evo ? '#f6d55c' : '#5eead4'; g.lineWidth = 1; g.beginPath(); g.arc(pl.x, pl.y - 3, R - 3, a0 + 0.2, a1 - 0.2); g.stroke(); g.globalAlpha = 1;
    } else if (f.k === 'mslash') {
      const k = f.t / f.max; g.globalAlpha = 1 - k; g.strokeStyle = '#fb7185'; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(f.x, f.y - 3, f.r * (0.8 + k * 0.2), f.a - 1.15, f.a + 1.15); g.stroke(); g.globalAlpha = 1;
    } else if (f.k === 'beam') {
      const k = f.t / f.max; g.globalAlpha = f.evo ? 0.85 : 1 - k; g.lineCap = 'round';
      g.strokeStyle = f.ink ? 'rgba(90,120,224,.6)' : f.burn ? 'rgba(251,146,60,.6)' : f.evo ? 'rgba(127,227,214,.55)' : 'rgba(246,213,92,.55)'; g.lineWidth = f.w * 2.2; g.beginPath(); g.moveTo(f.x1, f.y1 - 3); g.lineTo(f.x2, f.y2 - 3); g.stroke();
      g.strokeStyle = f.ink ? '#dbe4ff' : f.burn ? '#ffedd5' : f.evo ? '#e9fffb' : '#fff6c2'; g.lineWidth = Math.max(1, f.w * 0.7); g.beginPath(); g.moveTo(f.x1, f.y1 - 3); g.lineTo(f.x2, f.y2 - 3); g.stroke(); g.globalAlpha = 1; g.lineCap = 'butt';
    } else if (f.k === 'blast') {
      const k = f.t / f.max; g.globalAlpha = 1 - k; g.fillStyle = hexA(f.col || '#fb923c', 0.35); g.beginPath(); g.arc(f.x, f.y, f.r * (0.4 + k * 0.6), 0, 7); g.fill();
      g.strokeStyle = f.col || '#f6d55c'; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y, f.r * (0.5 + k * 0.6), 0, 7); g.stroke(); g.globalAlpha = 1;
    } else if (f.k === 'ghostM' && boss) { g.globalAlpha = 0.3 * (1 - f.t / f.max); spr(boss.art[0], f.x, f.y - 8, f.f < 0, true); g.globalAlpha = 1; }
  }
  drawAirShots(t);
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
}
// darkness with holes of light around the curator, the gate, gems and shots; then soft coloured glows
function drawLight(t, ox, oy) {
  if (DK.width !== LW || DK.height !== LH) { DK.width = LW; DK.height = LH; }
  dk.globalCompositeOperation = 'source-over'; dk.clearRect(0, 0, LW, LH); dk.fillStyle = `rgba(4,5,8,${st.B.dark})`; dk.fillRect(0, 0, LW, LH);
  dk.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => { const sx = x - ox, sy = y - oy; if (sx < -r || sy < -r || sx > LW + r || sy > LH + r) return; const gr = dk.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); dk.fillStyle = gr; dk.fillRect(sx - r, sy - r, r * 2, r * 2); };
  hole(pl.x, pl.y - 4, 125 * (1 + pasLv('loupe') * 0.04), 1);
  if (st.exit && (st.need || st.open)) hole(st.exit.x, st.exit.y - 10, st.open ? 110 + Math.sin(t * 3) * 8 : 55, st.open ? 1 : 0.6);
  for (const v of st.vents) hole(v.x, v.y, 26, 0.5);
  for (const sh of st.shrines) if (!sh.used) hole(sh.x, sh.y - 6, 34, 0.7);
  gimLight(hole, null);
  if (st.vault && !st.vault.paid) hole(st.vault.x, st.vault.y - 6, 40, 0.7);
  for (const f of fx) if (f.k === 'blast') hole(f.x, f.y, f.r * 1.4, 0.8 * (1 - f.t / f.max));
  let n = 0; for (const gm of gems) { if (n++ > 50) break; hole(gm.x, gm.y, 16, 0.5); }
  for (const b of ebul) hole(b.x, b.y, 14, 0.6);
  for (const it of items) hole(it.x, it.y, 26, 0.6);
  if (boss) hole(boss.x, boss.y - 10, 70, 0.7);
  for (const f of fx) if (f.k === 'slash' || f.k === 'mark' || f.k === 'beam') { const x = f.k === 'beam' ? f.x2 : f.x || pl.x, y = f.k === 'beam' ? f.y2 : f.y || pl.y; hole(x, y, 40, 0.5 * (1 - f.t / f.max)); }
  g.drawImage(DK, 0, 0);
  // additive glows
  g.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, col) => { const sx = x - ox, sy = y - oy; if (sx < -r || sy < -r || sx > LW + r || sy > LH + r) return; const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(sx - r, sy - r, r * 2, r * 2); };
  if (st.exit && (st.need || st.open)) glow(st.exit.x, st.exit.y - 12, st.open ? 60 : 26, st.open ? 'rgba(94,234,212,.35)' : 'rgba(45,212,191,.15)');
  for (const v of st.vents) glow(v.x, v.y, 18, hexA(st.B.accent, 0.18));
  for (const sh of st.shrines) if (!sh.used) glow(sh.x, sh.y - 14, 22, hexA(SHRINE_COL[sh.k], 0.3));
  gimLight(null, glow);
  if (st.vault && !st.vault.open) glow(st.vault.x, st.vault.y - 6, 26, 'rgba(246,213,92,.25)');
  for (const b of ebul) glow(b.x, b.y, 9, hexA(b.col.length === 7 ? b.col : '#ff7ab8', 0.45));
  n = 0; for (const gm of gems) { if (n++ > 60) break; glow(gm.x, gm.y, 7, ['rgba(90,167,224,.35)', 'rgba(143,214,107,.35)', 'rgba(224,82,74,.35)', 'rgba(176,124,232,.4)'][gm.tier]); }
  glow(pl.x + pl.face * 6, pl.y - 6, 14, 'rgba(246,213,92,.25)');
  g.globalCompositeOperation = 'source-over';
}
function drawPlayer(t) {
  for (const f of fx) if (f.k === 'ghost') { g.globalAlpha = 0.35 * (1 - f.t / f.max); spr(CHAR_ART[pl.ci][f.fr], f.x, f.y - 8, f.f < 0, true); g.globalAlpha = 1; }
  shadow(pl.x, pl.y, 6);
  if (pl.inv > 0 && Math.floor(t * 20) % 2 && pl.hurtFlash <= 0) return;
  const fr = pl.moving ? Math.floor(pl.anim) % 2 : 0, bob = pl.moving ? -Math.abs(Math.round(Math.sin(pl.anim * Math.PI))) : Math.round(Math.sin(t * 3) * 0.6);
  spr(CHAR_ART[pl.ci][fr], pl.x, pl.y - 8 + bob, pl.face < 0, pl.hurtFlash > 0.15);
  g.fillStyle = 'rgba(246,213,92,.95)'; g.fillRect(Math.round(pl.x + pl.face * 6), Math.round(pl.y - 6 + bob), 2, 2); // lantern
}
function drawFoe(e, t) {
  if (e.prop) return drawProp2(e, t);
  const a = ART[e.type][Math.floor(e.anim) % 2], sc = e.scale;
  shadow(e.x, e.y + 1, e.r * 0.9);
  if (e.spawnIn > 0) g.globalAlpha = 1 - e.spawnIn / 0.3;
  const wob = e.wind > 0 ? rnd(-1, 1) : 0, sq = e.stun > 0 ? 1 : 0, hop = Math.round(Math.abs(Math.sin(e.anim * Math.PI)) * -1);
  if (e.elite) { g.fillStyle = `rgba(251,113,133,${0.22 + Math.sin(t * 6) * 0.1})`; g.beginPath(); g.arc(e.x, e.y - 8 * sc, 12 * sc, 0, 7); g.fill(); }
  spr(a, e.x + wob, e.y - 7 * sc + sq + hop, e.face < 0, e.flash > 0, sc);
  if (e.stun > 0) { g.fillStyle = '#f6d55c'; const s = t * 8; g.fillRect(Math.round(e.x + Math.cos(s) * 5), Math.round(e.y - 16 * sc), 1, 1); g.fillRect(Math.round(e.x - Math.cos(s) * 5), Math.round(e.y - 16 * sc + 1), 1, 1); }
  g.globalAlpha = 1;
  if (e.elite && e.hp < e.maxHp) { g.fillStyle = '#120e1a'; g.fillRect(e.x - 10, e.y + 4, 20, 3); g.fillStyle = '#fb7185'; g.fillRect(e.x - 9, e.y + 5, 18 * e.hp / e.maxHp, 1); }
}
// --- bosses, drawn with shapes (the mirror curator is your own sprite in glass) ---
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
  } else if (e.kind === 'mirror') {
    shadow(e.x, e.y, 7);
    g.globalAlpha = 0.5; spr(e.art[0], e.x + 2, e.y - 9, e.face > 0, false); g.globalAlpha = 1; // a faint double
    spr(e.art[Math.floor(e.anim * 6) % 2], e.x, e.y - 9 + Math.round(bob * 0.5), e.face < 0, fl);
    g.fillStyle = 'rgba(127,227,214,.9)'; g.fillRect(Math.round(e.x - e.face * 6), Math.round(e.y - 7), 2, 2);
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
  g.globalAlpha = 0.55; g.fillStyle = '#ff7ab8'; g.beginPath(); g.arc(s.x - off, y, s.r, 0, 7); g.fill(); g.fillStyle = '#5aa7e0'; g.beginPath(); g.arc(s.x + off, y + off * 0.5, s.r, 0, 7); g.fill();
  g.globalAlpha = 1 - k * 0.45; g.fillStyle = fl ? '#fff' : s.idx % 2 ? '#2f8f8a' : '#7fe3d6'; g.beginPath(); g.arc(s.x, y, s.r, 0, 7); g.fill();
  g.fillStyle = '#120e1a'; g.fillRect(Math.round(s.x - 2), Math.round(y - 1), 4, 1); g.globalAlpha = 1;
}
