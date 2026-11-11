// ---------- canvas, scaling, input, math, sound ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const L = document.createElement('canvas'), g = L.getContext('2d'); // the pixel layer, drawn at logical resolution
let DPR = 1, CW = 0, CH = 0, S = 3, LW = 400, LH = 250;
const FONT = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif';
// A frame can start before it has a size (0 x 0). Keep every canvas at least 1 px so drawing never throws,
// and let the main loop re-measure until the real size arrives.
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 3); CW = Math.max(1, innerWidth || document.documentElement.clientWidth || 0); CH = Math.max(1, innerHeight || document.documentElement.clientHeight || 0);
  cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR); cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
  S = Math.max(1, Math.round(Math.min(cv.width, cv.height) / 270)); // device pixels per game pixel
  LW = Math.max(1, Math.ceil(cv.width / S)); LH = Math.max(1, Math.ceil(cv.height / S)); L.width = LW; L.height = LH;
  g.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
let seed = (Date.now() ^ 0x9e3779b9) >>> 0;
function rand() { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const rnd = (a, b) => a + rand() * (b - a);
const pick = (a) => a[Math.floor(rand() * a.length)];
const hash2 = (x, y) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- input ----------
const keys = {}, hit = {}; // held, and pressed this frame
const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
  Space: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', Enter: 'ok', NumpadEnter: 'ok', KeyZ: 'ok', Escape: 'esc', KeyP: 'esc',
  Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', KeyR: 'reroll', KeyM: 'mute' };
addEventListener('keydown', (e) => { const k = KEYMAP[e.code]; if (!k) return; e.preventDefault(); if (!keys[k]) hit[k] = 1; keys[k] = 1; hit.any = 1; usingTouch = false; audioInit(); });
addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys[k] = 0; });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; joy.id = null; if (state === 'play') pauseGame(); });
let usingTouch = matchMedia('(pointer:coarse)').matches;
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 }; // virtual stick, CSS px
const taps = []; // UI taps this frame, CSS px
const dashBtn = () => ({ x: CW - 62, y: CH - 70, r: 34 });
cv.addEventListener('pointerdown', (e) => {
  e.preventDefault(); audioInit(); hit.any = 1;
  if (e.pointerType === 'touch') usingTouch = true;
  taps.push({ x: e.clientX, y: e.clientY });
  if (state !== 'play') return;
  const b = dashBtn();
  if (usingTouch && dist2(e.clientX, e.clientY, b.x, b.y) < (b.r + 10) ** 2) { hit.dash = 1; return; }
  if (joy.id === null) { joy.id = e.pointerId; joy.ox = joy.x = e.clientX; joy.oy = joy.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } }
});
const mouse = { x: -1, y: -1, on: false }; // hover position for tooltips (mouse and pen only)
cv.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) { joy.x = e.clientX; joy.y = e.clientY; } if (e.pointerType !== 'touch') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; } });
cv.addEventListener('pointerleave', () => { mouse.on = false; });
const joyEnd = (e) => { if (e.pointerId === joy.id) joy.id = null; };
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);
function moveInput() {
  let x = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), y = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  if (joy.id !== null) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy); if (d > 6) { const k = Math.min(1, d / 40); x = dx / d * k; y = dy / d * k; } }
  const d = Math.hypot(x, y); return d > 1 ? { x: x / d, y: y / d } : { x, y };
}
const tapIn = (r) => taps.some((t) => t.x >= r.x && t.x <= r.x + r.w && t.y >= r.y && t.y <= r.y + r.h);

// ---------- sound: tiny synth, no files ----------
let AC = null, master = null, muted = false, musicGain = null;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); musicGain = AC.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master); } catch { AC = null; }
}
let noiseBuf = null;
function tone(type, f0, f1, dur, vol, when, dest) {
  if (!AC || muted) return; const t = when || AC.currentTime, o = AC.createOscillator(), gn = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(gn); gn.connect(dest || master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, hp, when) {
  if (!AC || muted) return; const t = when || AC.currentTime;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 800;
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(f); f.connect(gn); gn.connect(master); s.start(t); s.stop(t + dur + 0.02);
}
const sfxLast = {};
function sfx(n) {
  if (!AC || muted) return; const now = AC.currentTime, gap = { hit: 0.045, gem: 0.03, kill: 0.04, shot: 0.06 }[n] || 0;
  if (gap && now - (sfxLast[n] || 0) < gap) return; sfxLast[n] = now;
  switch (n) {
    case 'hit': tone('square', 220, 90, 0.06, 0.05); break;
    case 'kill': noise(0.08, 0.06, 1400); tone('square', 330, 120, 0.07, 0.03); break;
    case 'gem': tone('triangle', 900 + rand() * 300, 1500, 0.07, 0.05); break;
    case 'shot': tone('square', 660, 330, 0.06, 0.025); break;
    case 'slash': noise(0.09, 0.07, 2600); break;
    case 'stamp': tone('sine', 140, 40, 0.22, 0.25); noise(0.12, 0.12, 300); break;
    case 'hurt': tone('sawtooth', 200, 60, 0.2, 0.12); noise(0.1, 0.08, 500); break;
    case 'dash': noise(0.12, 0.06, 1800); tone('sine', 300, 700, 0.1, 0.05); break;
    case 'lvl': [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, 0.12, 0.06, now + i * 0.07)); break;
    case 'pick': tone('square', 784, 784, 0.06, 0.05); tone('square', 1047, 1047, 0.08, 0.05, now + 0.06); break;
    case 'chest': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, 0.16, 0.08, now + i * 0.08)); break;
    case 'heal': [523, 784].forEach((f, i) => tone('sine', f, f, 0.15, 0.08, now + i * 0.08)); break;
    case 'warn': [0, 0.35, 0.7].forEach((d) => tone('square', 220, 220, 0.22, 0.08, now + d)); break;
    case 'boom': noise(0.5, 0.25, 120); tone('sine', 90, 30, 0.5, 0.3); break;
    case 'ui': tone('square', 600, 600, 0.04, 0.04); break;
    case 'bossShot': tone('sawtooth', 300, 150, 0.12, 0.04); break;
  }
}
// music: a looping 16-step pattern, scheduled slightly ahead
const MUSIC = {
  0: { bpm: 112, bass: [45, 0, 45, 0, 48, 0, 45, 0, 43, 0, 43, 0, 47, 0, 43, 0], lead: [69, 0, 72, 0, 76, 0, 72, 69, 67, 0, 71, 0, 74, 0, 71, 0] },
  1: { bpm: 132, bass: [40, 40, 0, 40, 43, 0, 40, 0, 38, 38, 0, 38, 41, 0, 43, 0], lead: [64, 67, 71, 67, 64, 67, 72, 71, 62, 65, 69, 65, 62, 65, 71, 69] },
  2: { bpm: 146, bass: [38, 0, 38, 50, 38, 0, 41, 0, 36, 0, 36, 48, 36, 0, 40, 0], lead: [74, 0, 77, 74, 81, 0, 77, 0, 72, 0, 76, 72, 79, 0, 76, 0] },
};
let musT = 0, musStep = 0, musSong = -1;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
function music(song) {
  if (!AC || muted) return; if (song !== musSong) { musSong = song; musStep = 0; musT = AC.currentTime + 0.05; }
  if (song < 0) return; const m = MUSIC[song], step = 60 / m.bpm / 4;
  while (musT < AC.currentTime + 0.12) {
    const i = musStep % 16, b = m.bass[i], l = m.lead[i];
    if (b) tone('triangle', mtof(b), mtof(b), step * 1.8, 0.2, musT, musicGain);
    if (l && (musStep >> 4) % 2 === 1) tone('square', mtof(l), mtof(l), step * 0.9, 0.05, musT, musicGain);
    if (i % 4 === 0) { const t = musT; if (!muted) { const s = AC.createBufferSource(); if (noiseBuf) { s.buffer = noiseBuf; const gn = AC.createGain(); gn.gain.setValueAtTime(0.05, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(gn); gn.connect(musicGain); s.start(t); s.stop(t + 0.06); } } }
    musT += step; musStep++;
  }
}
