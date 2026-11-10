// ---------- game flow: title, intro, stages, dialog, the two endings ----------
let state = 'title', stT = 0, introI = 0, titleSel = 0, tapX = 0.5, endTrue = false, finT = 0;
addEventListener('pointerdown', (e) => { tapX = e.clientX / innerWidth; });
function persist() { store.set({ stage: save.stage, glyphs: save.glyphs, dj: save.dj, deaths: save.deaths, time: save.time }); }
const AFTER = { s1d: () => { if (!save.dj) { save.dj = true; persist(); sfx('glyph'); floatText(cx(pl), pl.y - 14, T.dj, RED, true); } } };
function say(key, after) { for (const e of ents) e.flash = e.flashB = 0; dlg = { key, lines: T.d[key], i: 0, n: 0, after: after || AFTER[key] }; state = 'dialog'; }
function sayOnce(key) { if (seen[key]) return; seen[key] = 1; say(key); }
function closeDialog() { const d = dlg; dlg = null; state = 'play'; if (d.after) d.after(); }
function updDialog(dt) {
  const d = dlg, text = d.lines[d.i][1], before = Math.floor(d.n);
  if (d.key === 'endT' && d.i >= 5) colorT = Math.min(1, colorT + dt * 0.3); // colour comes back while they read together
  if (P.esc) { if (d.key === 'endT') colorT = 1; return closeDialog(); }
  d.n = Math.min(text.length, d.n + dt * 42); if (Math.floor(d.n) > before && Math.floor(d.n) % 3 === 0) sfx('text');
  if (P.atk || P.jump || P.ok || P.tap) { if (d.n < text.length) d.n = text.length; else if (++d.i >= d.lines.length) closeDialog(); else d.n = 0; }
}
function loadStage(i, fromCp) {
  stageI = i; lvl = LEVELS[i](); if (!fromCp) cp = null; husk = null; colorT = 0; glyphNote = null; spawnEnts();
  const s = lvl.E.find((e) => e.ch === 'P'); let x = s.x * TS + 3, y = (s.y + 1) * TS - 22.01;
  if (cp) { x = cp.x + 3; y = cp.y + 26 - 22.01; }
  pl = newPlayer(x, y); parts = []; floats = []; hitstop = 0; cam.shake = 0; updCam(0, true);
}
function respawn() { loadStage(stageI, true); state = 'play'; }
function startStage(i, fade) { card = { t: fade ? 0 : 0.6, to: i, loaded: !fade }; if (!fade) loadStage(i); state = 'card'; }
function nextStage() { if (card) return; save.stage = stageI + 1; persist(); sfx('save'); startStage(stageI + 1, true); }
function updCard(dt) {
  const c = card; c.t += dt;
  if (!c.loaded && c.t >= 0.6) { c.loaded = true; loadStage(c.to); }
  if (c.loaded && c.t > 1.2 && c.t < 2.3 && state === 'card' && (P.atk || P.jump || P.ok || P.tap)) c.t = 2.3;
  if (c.t >= 2.3 && state === 'card') state = 'play';
  if (c.t > 3) card = null;
}
function finale(e) { // the Engine stops. Which ending depends on whether its name was found.
  husk = { x: cx(e), y: cy(e) }; state = 'finale'; finT = 0; endTrue = save.glyphs.length === 9; cam.shake = 14; sfx('boom'); puff(husk.x, husk.y, 80, { s1: 300, max: 1.6, col: GRAY });
}
function toEnding() {
  state = 'ending'; stT = 0; stageI = endTrue ? 1 : 0; colorT = endTrue ? 1 : 0; husk = null; card = null;
  if (endTrue) store.clear(); else { save.stage = 0; persist(); } // after the plain ending, the words found so far are kept
}
function newGame() { Object.assign(save, { stage: 0, glyphs: [], dj: false, deaths: 0, time: 0 }); seen = {}; cp = null; store.clear(); state = 'intro'; introI = 0; stT = 0; }
function contGame(sv) { Object.assign(save, { stage: sv.stage || 0, glyphs: sv.glyphs || [], dj: !!sv.dj, deaths: sv.deaths || 0, time: sv.time || 0 }); seen = {}; cp = null; startStage(Math.min(save.stage, 2), false); }
const savedGame = () => { const sv = store.get(); return sv && (sv.stage > 0 || (sv.glyphs && sv.glyphs.length)) ? sv : null; };
function updTitle() {
  const sv = savedGame(), go = P.atk || P.jump || P.ok;
  if (!sv) { if (P.any && !P.mute && stT > 0.4) newGame(); return; }
  if (P.left) titleSel = 0; if (P.right) titleSel = 1; if (P.tap) titleSel = tapX < 0.5 ? 0 : 1;
  if ((go || P.tap) && stT > 0.4) { if (titleSel === 0) contGame(sv); else newGame(); }
}
function update(dt) {
  gt += dt; stT += dt; if (P.mute) muted = !muted;
  if (card) updCard(dt);
  if (state === 'title') { cam.x = gt * 8; music(dt, 0); updTitle(); }
  else if (state === 'intro') {
    cam.x = gt * 8; music(dt, 0);
    if (P.esc) startStage(0, false);
    else if (P.any && !P.mute && stT > 0.35) { stT = 0; if (++introI >= T.intro.length) startStage(0, false); }
  } else if (state === 'dialog') { updDialog(dt); updFx(dt); }
  else if (state === 'play') {
    if (hitstop > 0) { hitstop -= dt; return; } // frozen frame: keep this frame's presses for the next live one
    save.time += dt; updPlayer(dt); if (state === 'play') updEnts(dt); updFx(dt); updCam(dt); music(dt, bossOn ? 3 : stageI);
  } else if (state === 'finale') {
    finT += dt; husk.y = approach(husk.y, GY - 34, 70 * dt); updFx(dt); updCam(dt);
    if (Math.random() < 0.3) puff(husk.x + rnd(-24, 24), husk.y + rnd(-24, 24), 1, { col: GRAY, s1: 40, g: -40, max: 1.2 });
    if (finT > 2.2) say(endTrue ? 'endT' : 'endN', toEnding);
  } else if (state === 'ending') { cam.x = gt * 10; music(dt, endTrue ? 0 : 2); if (stT > 2.5 && P.any && !P.mute) { state = 'title'; stT = 0; colorT = 0; stageI = 0; } }
  for (const k in P) P[k] = 0;
}
