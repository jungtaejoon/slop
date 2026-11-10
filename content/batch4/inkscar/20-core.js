// ---------- core: canvas, input, sound, helpers ----------
const cv = document.getElementById('c'), g = cv.getContext('2d');
const TS = 16, VH = 270; let VW = 480, SC = 1, DPR = 1;
const INK = '#1a1613', PAPER = '#efe6d2', RED = '#c43728', GRAY = '#8d8a84';
const FONT = '"Nanum Myeongjo","Apple SD Gothic Neo","Noto Serif KR",Georgia,serif';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const sign = (v) => (v < 0 ? -1 : 1);

function resize() {
  const w = innerWidth, h = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2);
  let cw = w, ch = h; if (h > w * 0.8) ch = Math.round(w * 0.72);
  if (cw / ch > 2.2) cw = Math.round(ch * 2.2);
  SC = ch / VH; VW = cw / SC;
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
}
addEventListener('resize', resize); resize();

// input: K = held, P = pressed this frame
const K = {}, P = {};
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyZ: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyX: 'atk', KeyJ: 'atk', KeyC: 'dash', KeyK: 'dash', ShiftLeft: 'dash', KeyV: 'skill', KeyL: 'skill', Enter: 'ok', Escape: 'esc', KeyM: 'mute' };
function press(k) { if (!K[k]) P[k] = 1; K[k] = 1; P.any = 1; audioInit(); }
addEventListener('keydown', (e) => { const k = KEYMAP[e.code]; if (k) { e.preventDefault(); if (!e.repeat) press(k); } });
addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) K[k] = 0; });
addEventListener('blur', () => { for (const k in K) K[k] = 0; });
const pad = document.getElementById('pad');
for (const [id, k] of [['bJ', 'J'], ['bA', 'A'], ['bD', 'D'], ['bS', 'S']]) document.getElementById(id).textContent = T.btn[k];
pad.querySelectorAll('b').forEach((b) => {
  const k = b.dataset.k, up = (e) => { e.preventDefault(); K[k] = 0; b.classList.remove('dn'); };
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* */ } press(k); b.classList.add('dn'); });
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
});
addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') pad.classList.add('on'); if (!e.target.dataset?.k || state !== 'play') { P.any = 1; P.tap = 1; audioInit(); } });
addEventListener('contextmenu', (e) => e.preventDefault());

// sound: tiny synth, no assets
let ac = null, master = null, muted = false;
function audioInit() { if (ac) { if (ac.state === 'suspended') ac.resume(); return; } try { ac = new AudioContext(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination); } catch { ac = null; } }
function tone(f, t = 0.1, type = 'triangle', vol = 0.2, slide = 0, delay = 0) {
  if (!ac || muted) return; const t0 = ac.currentTime + delay, o = ac.createOscillator(), v = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + t);
  v.gain.setValueAtTime(vol, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + t); o.connect(v).connect(master); o.start(t0); o.stop(t0 + t + 0.02);
}
let noiseBuf = null;
function noise(t = 0.1, vol = 0.2, freq = 1800, delay = 0) {
  if (!ac || muted) return; const t0 = ac.currentTime + delay;
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  v.gain.setValueAtTime(vol, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + t); s.connect(f).connect(v).connect(master); s.start(t0); s.stop(t0 + t + 0.02);
}
const SFX = {
  slash: () => noise(0.09, 0.22, 3200), hit: () => { noise(0.08, 0.3, 900); tone(160, 0.08, 'square', 0.12, -80); },
  jump: () => tone(300, 0.1, 'sine', 0.12, 220), dash: () => noise(0.16, 0.18, 1400), hurt: () => { tone(200, 0.25, 'sawtooth', 0.18, -140); noise(0.2, 0.2, 500); },
  wave: () => { noise(0.25, 0.25, 2400); tone(520, 0.2, 'sine', 0.1, -300); }, clang: () => { tone(900, 0.12, 'square', 0.1, -200); tone(1340, 0.15, 'triangle', 0.1); },
  die: () => { tone(420, 0.3, 'sine', 0.12, 300); noise(0.2, 0.15, 2600); }, glyph: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.12, 0, i * 0.09)),
  save: () => [392, 523].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, 0, i * 0.12)), heal: () => tone(440, 0.3, 'sine', 0.12, 440),
  text: () => tone(700 + rnd(200), 0.02, 'square', 0.02), boom: () => { noise(0.5, 0.4, 200); tone(70, 0.5, 'sawtooth', 0.25, -40); },
  spit: () => tone(240, 0.12, 'square', 0.06, -120), warn: () => tone(880, 0.08, 'square', 0.05),
};
const sfx = (n) => { try { SFX[n]?.(); } catch { /* */ } };
// music: sparse plucked notes on a pentatonic scale; the mood shifts per stage
const SCALES = [[220, 261.6, 293.7, 329.6, 392, 440, 523.3], [196, 233.1, 261.6, 293.7, 349.2, 392, 466.2], [164.8, 196, 220, 246.9, 293.7, 329.6, 392], [146.8, 174.6, 196, 220, 261.6, 293.7]];
let musT = 0, musI = 0;
function music(dt, mood) {
  musT -= dt; if (musT > 0 || !ac || muted) return; const fast = mood === 3; musT = fast ? 0.28 : rnd(0.55, 1.3);
  const sc = SCALES[mood] || SCALES[0]; musI = clamp(musI + Math.round(rnd(-2.4, 2.4)), 0, sc.length - 1); const f = sc[musI];
  tone(f, fast ? 0.5 : 1.6, 'triangle', 0.07); tone(f * 2, fast ? 0.2 : 0.5, 'sine', 0.025); if (Math.random() < 0.25) tone(sc[0] / 2, 2, 'sine', 0.06);
}
const store = { get() { try { return JSON.parse(localStorage.getItem('inkscar-save')) || null; } catch { return store.mem || null; } }, set(v) { store.mem = v; try { localStorage.setItem('inkscar-save', JSON.stringify(v)); } catch { /* */ } }, clear() { store.mem = null; try { localStorage.removeItem('inkscar-save'); } catch { /* */ } } };

// text wrapping on the canvas (call with the font already set)
function wrap(text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (line && g.measureText(t).width > maxW) { out.push(line); line = word; } else line = t; }
    out.push(line);
  }
  return out;
}
