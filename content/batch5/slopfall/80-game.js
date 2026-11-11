// ---------- flow: title → intro → curator → act card → map ⇄ areas / scenes → ending ----------
let state = 'title', stT = 0, gt = 0, introI = 0, selI = 0, seenIntro = false, endKind = null, resultT = 0, dlgBg = 'map';
function setState(s) { cv.style.cursor = ''; if (s === 'dialog') dlgBg = state === 'play' || state === 'lvl' ? 'world' : state === 'title' || state === 'select' ? 'menu' : 'map'; state = s; stT = 0; ui = []; }
function pauseGame() { if (state === 'play') setState('pause'); }
function startRun() { startJourney(selI); sfx('lvl'); }
function endRun(kind) { endKind = kind; resultT = 0; setState('result'); music(-1); }
function chooseOffer(i) { const o = offer[i]; if (!o) return; applyChoice(o); sfx('pick'); pendingLv--; offer = null; setState('play'); }
function doReroll() { if (pl.rerolls <= 0) return; pl.rerolls--; offer = rollOffer(); offerSel = 0; sfx('ui'); }
const ok = () => hit.ok || hit.dash;
function menuNav(n, horiz) {
  const prev = horiz ? hit.l : hit.u, next = horiz ? hit.r : hit.d;
  if (prev) { offerSel = (offerSel + n - 1) % n; sfx('ui'); } if (next) { offerSel = (offerSel + 1) % n; sfx('ui'); }
}
function handleTaps() { for (const t of taps) for (const r of ui) if (t.x >= r.x && t.x <= r.x + r.w && t.y >= r.y && t.y <= r.y + r.h) { sfx('ui'); r.fn(); return true; } return false; }

function update(dt) {
  gt += dt; stT += dt;
  if (hit.mute) muted = !muted;
  const tapped = taps.length && state !== 'dialog' ? handleTaps() : false;
  if (state === 'title') { music(0); if (!tapped && (ok() || (taps.length && stT > 0.3))) { setState(seenIntro ? 'select' : 'intro'); introI = 0; } }
  else if (state === 'intro') {
    music(0);
    if (hit.esc) { seenIntro = true; setState('select'); }
    else if ((hit.any || taps.length) && stT > 0.35) { stT = 0; if (++introI >= T.intro.length) { seenIntro = true; setState('select'); } }
  } else if (state === 'select') {
    music(0);
    if (hit.l || hit.u) { selI = (selI + 2) % 3; sfx('ui'); } if (hit.r || hit.d) { selI = (selI + 1) % 3; sfx('ui'); }
    for (const k of ['1', '2', '3']) if (hit[k]) { selI = +k - 1; startRun(); return; }
    if (ok() && stT > 0.2) startRun(); else if (hit.esc) setState('title');
  } else if (state === 'actcard') { actCard.t += dt; music(-1); if (actCard.t > 3.1 || ((ok() || taps.length) && actCard.t > 0.8)) afterActCard(); }
  else if (state === 'dialog') updDialog(dt);
  else if (state === 'map') { music(0); updMap(); }
  else if (state === 'play') {
    if (hit.esc) { pauseGame(); return; }
    if (hitstop > 0) { hitstop -= dt; return; }
    runT += dt; st.t += dt; run.time += dt; music(boss ? (boss.kind === 'snake' || boss.kind === 'mirror' ? 2 : 1) : st.B.music);
    updPlayer(dt); if (state !== 'play') return;
    updFlow(dt); buildGrid(); spawning(dt); updFoes(dt); updWeapons(dt); updShots(dt); updBullets(dt); updFx(dt);
    foes = foes.filter((e) => !e.dead);
    shake = Math.max(0, shake - 30 * dt);
    cam.x = lerp(cam.x, pl.x, Math.min(1, dt * 8)); cam.y = lerp(cam.y, pl.y, Math.min(1, dt * 8));
    if (bossBanner && (bossBanner.t += dt) > 3.8) bossBanner = null;
    if (banner && (banner.t += dt) > (banner.long ? 4.6 : 2.6)) banner = null;
    if (st.kind === 'gen' && st.t > 25 && !st.cleared) { stageWon(); return; }
    if (winT > 0 && (winT += dt) > 2.4) { winT = 0; const k = run.choice === 'B' ? 'b' : 'a'; say(T.story[k === 'a' ? 'endA' : 'endB'], () => endRun(k)); return; }
    if (state === 'play' && pendingLv > 0) { offer = rollOffer(); offerSel = 0; setState('lvl'); sfx('lvl'); }
  } else if (state === 'lvl') {
    menuNav(offer.length, CW >= 700);
    for (let k = 0; k < offer.length; k++) if (hit[String(k + 1)]) { chooseOffer(k); return; }
    if (hit.reroll) doReroll(); else if (hit.ok && stT > 0.25) chooseOffer(offerSel);
  } else if (state === 'chest') {
    chestShow.t += dt; if (chestShow.t > 0.8 && (ok() || taps.length)) { chestShow = null; if (chestBack === 'map') toMap(); else setState('play'); }
  } else if (state === 'pause') { if (hit.esc && stT > 0.1) setState('play'); }
  else if (state === 'camp') updCamp();
  else if (state === 'shop') updShop();
  else if (state === 'event') updEvent();
  else if (state === 'clear') { clearInfo.t += dt; if (clearInfo.t > 0.6 && ok()) afterClear(); }
  else if (state === 'result') { resultT += dt; if (resultT > 1 && hit.ok) setState('select'); else if (resultT > 1 && hit.esc) setState('title'); }
}
function updFx(dt) {
  for (const f of fx) { f.t += dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } }
  fx = fx.filter((f) => f.t < f.max);
  for (const n of nums) n.t += dt; nums = nums.filter((n) => n.t < 0.7);
}

// ---------- drawing ----------
function present() { // the pixel layer, scaled up crisp, with a soft vignette
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(L, 0, 0, LW * S, LH * S);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const gr = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.35, CW / 2, CH / 2, Math.hypot(CW, CH) * 0.62);
  gr.addColorStop(0, 'rgba(4,5,8,0)'); gr.addColorStop(1, 'rgba(4,5,8,.6)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH);
}
const inWorld = () => ['play', 'lvl', 'chest', 'pause', 'clear'].includes(state) && st || (state === 'dialog' && dlgBg === 'world') || (state === 'result' && st);
function render() {
  ui = []; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (state === 'title' || state === 'intro' || state === 'select' || (state === 'dialog' && dlgBg === 'menu')) { drawMenuScene(gt); present(); }
  else if (inWorld()) { drawWorld(gt); drawRain(gt, 0.5, hexA(st.B.accent, 0.35)); present(); drawNums(); if (state !== 'clear') drawHud(); }
  else if (state === 'map' || (state === 'dialog' && dlgBg === 'map') || state === 'result') { if (run) drawMap(); else { drawMenuScene(gt); present(); } ui = ui.filter(() => state === 'map'); }
  if (state === 'title') drawTitle(); else if (state === 'intro') drawIntro(); else if (state === 'select') drawSelect();
  else if (state === 'actcard') drawActCard(); else if (state === 'dialog') drawDialog(); else if (state === 'camp') drawCamp(); else if (state === 'shop') drawShop(); else if (state === 'event') drawEvent();
  else if (state === 'lvl') drawLevelUp(); else if (state === 'chest') drawChest(); else if (state === 'pause') drawPause(); else if (state === 'clear') drawClear(); else if (state === 'result') drawResult();
}
// the menu backdrop: a night city with the Filter Tower far away, slop drifting down
const DRIFT = Array.from({ length: 14 }, (_, i) => ({ k: ['hand', 'glyph', 'clock', 'eye', 'jelly', 'worm', 'echo'][i % 7], x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.8 }));
const SKYLINE = Array.from({ length: 40 }, (_, i) => ({ w: 10 + Math.random() * 22, h: 20 + Math.random() * 60, l: Math.random() }));
function drawMenuScene(t) {
  const sky = g.createLinearGradient(0, 0, 0, LH); sky.addColorStop(0, '#07080c'); sky.addColorStop(0.7, '#12101c'); sky.addColorStop(1, '#1a1426'); g.fillStyle = sky; g.fillRect(0, 0, LW, LH);
  for (let i = 0; i < 60; i++) { const x = hash2(i, 1) * LW, y = hash2(i, 2) * LH * 0.6; g.fillStyle = `rgba(255,255,255,${0.15 + 0.25 * Math.abs(Math.sin(t * 0.7 + i))})`; g.fillRect(x | 0, y | 0, 1, 1); }
  // the tower
  const tx = LW * 0.72, base = LH * 0.82;
  // a far, lighter skyline behind the tower
  for (let i = 0; i < 26; i++) { const w = 14 + hash2(i, 9) * 26, h = (30 + hash2(i, 7) * 70) * (LH / 250), x = i * LW / 22 - 10; g.fillStyle = '#16141f'; g.fillRect(x, base - h - 12, w, h + 12); }
  g.fillStyle = '#1d1b2a'; g.fillRect(tx - 9, base - LH * 0.55, 18, LH * 0.55); g.fillRect(tx - 15, base - LH * 0.3, 30, LH * 0.3); g.fillRect(tx - 3, base - LH * 0.62, 6, 10);
  const pulse = 0.5 + Math.sin(t * 1.6) * 0.5; g.fillStyle = `rgba(45,212,191,${0.5 + pulse * 0.5})`; g.fillRect(tx - 2, base - LH * 0.6, 4, 4);
  const gl = g.createRadialGradient(tx, base - LH * 0.58, 0, tx, base - LH * 0.58, 50); gl.addColorStop(0, `rgba(45,212,191,${0.25 + pulse * 0.15})`); gl.addColorStop(1, 'rgba(45,212,191,0)'); g.fillStyle = gl; g.fillRect(tx - 50, base - LH * 0.58 - 50, 100, 100);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(45,212,191,.35)'; g.fillRect(tx - 6 + (i % 2) * 8, base - LH * (0.48 - i * 0.07), 2, 2); }
  // skyline
  let x = -10; for (const b of SKYLINE) { const h = b.h * (LH / 250); g.fillStyle = '#0a0a10'; g.fillRect(x, base - h, b.w, h + LH); if (b.l > 0.4) { g.fillStyle = 'rgba(246,213,92,.25)'; for (let k = 0; k < 4; k++) if (hash2(x | 0, k) > 0.5) g.fillRect(x + 3 + (k % 2) * 6, base - h + 5 + (k >> 1) * 7, 2, 2); } x += b.w + 1; if (x > LW) break; }
  g.fillStyle = '#08080c'; g.fillRect(0, base, LW, LH - base);
  for (const d of DRIFT) { const dx = ((d.x * LW - t * 6 * d.s) % (LW + 40) + LW + 40) % (LW + 40) - 20, dy = ((d.y * LH * 0.8 + t * 9 * d.s) % (LH * 0.85)); g.globalAlpha = 0.28; spr(ART[d.k][Math.floor(t * 3 * d.s) % 2], dx, dy); g.globalAlpha = 1; }
  drawRain(t, 1);
}
function drawTitle() {
  const cy = CH * 0.34, big = Math.min(92, CW / 5.2);
  ctx.save(); ctx.translate(CW / 2, cy - big * 1.0); ctx.rotate(Math.PI / 4); const s = big * 0.26, p = 1 + Math.sin(gt * 3) * 0.04;
  ctx.fillStyle = '#2dd4bf'; ctx.fillRect(-s * p, -s * p, s * 2 * p, s * 2 * p); ctx.fillStyle = '#99f6e4'; ctx.fillRect(-s * p, -s * p, s * p, s * p); ctx.restore();
  txt(T.title, CW / 2, cy, big, '#f1f2f4', 'center', 900, false);
  txt(T.sub, CW / 2, cy + big * 0.66, Math.min(16, CW / 26), '#9aa0aa', 'center', 600, false);
  const w = 220, b = button(CW / 2 - w / 2, CH * 0.62, w, 52, () => { setState(seenIntro ? 'select' : 'intro'); introI = 0; });
  rr(b.x, b.y, b.w, b.h, 14); ctx.fillStyle = '#f1f2f4'; ctx.fill(); txt(T.start, CW / 2, b.y + 26, 17, '#0a0b0d', 'center', 800, false);
  txt(usingTouch ? T.touchKeys : T.keys, CW / 2, CH - 46, 11.5, '#7c828c', 'center', 500, false);
  txt('Slop · made with Claude', CW / 2, CH - 24, 10, '#4b5058', 'center', 500, false);
}
function drawIntro() {
  ctx.fillStyle = 'rgba(6,7,9,.66)'; ctx.fillRect(0, 0, CW, CH);
  const lines = T.intro[introI].split('\n'), a = Math.min(1, stT / 0.6), sz = Math.min(20, CW / 22);
  ctx.globalAlpha = a; lines.forEach((ln, i) => txt(ln, CW / 2, CH / 2 + (i - (lines.length - 1) / 2) * sz * 1.7, sz, '#f1f2f4', 'center', 600, false)); ctx.globalAlpha = 1;
  for (let i = 0; i < T.intro.length; i++) { ctx.fillStyle = i === introI ? '#2dd4bf' : 'rgba(255,255,255,.2)'; ctx.fillRect(CW / 2 - T.intro.length * 9 + i * 18, CH - 60, 10, 3); }
  if (!usingTouch) txt('Esc', CW - 20, CH - 20, 11, '#5c626c', 'right', 600, false);
}
function drawSelect() {
  ctx.fillStyle = 'rgba(6,7,9,.6)'; ctx.fillRect(0, 0, CW, CH);
  const wide = CW >= 640, cw = wide ? Math.min(220, (CW - 80) / 3) : Math.min(CW - 32, 380), ch = wide ? 340 : Math.min(160, (CH - 150) / 3);
  const total = wide ? cw * 3 + 28 : ch * 3 + 20, x0 = wide ? (CW - total) / 2 : (CW - cw) / 2, y0 = wide ? CH / 2 - ch / 2 + 16 : Math.max(80, CH / 2 - total / 2 + 16);
  txt(T.pick, CW / 2, y0 - 34, 22, '#f1f2f4', 'center', 800, false);
  T.chars.forEach(([name, role, desc, short], i) => {
    const x = wide ? x0 + i * (cw + 14) : x0, y = wide ? y0 : y0 + i * (ch + 10), on = i === selI;
    button(x, y, cw, ch, () => { if (selI === i) startRun(); else selI = i; });
    panel(x, y, cw, ch, on, on ? 'rgba(26,30,36,.98)' : undefined); if (on) { ctx.fillStyle = '#2dd4bf'; rr(x, y, 4, ch, 2); ctx.fill(); }
    const art = CHAR_ART[i][on ? Math.floor(gt * 6) % 2 : 0], sz = wide ? 100 : Math.min(84, ch - 20), ax = wide ? x + cw / 2 - sz / 2 : x + 16, ay = wide ? y + 18 : y + (ch - sz) / 2;
    ctx.imageSmoothingEnabled = false; const gl = ctx.createRadialGradient(ax + sz / 2, ay + sz * 0.6, 0, ax + sz / 2, ay + sz * 0.6, sz * 0.6); gl.addColorStop(0, on ? 'rgba(45,212,191,.18)' : 'rgba(255,255,255,.05)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.fillRect(ax - 10, ay - 10, sz + 20, sz + 20); ctx.drawImage(art.c, ax, ay, sz, sz);
    const tx = wide ? x + cw / 2 : ax + sz + 16, al = wide ? 'center' : 'left', ty = wide ? y + sz + 46 : y + ch / 2 - 22, tw = wide ? cw - 24 : x + cw - tx - 12;
    txt(name, tx, ty, 18, '#f1f2f4', al, 800, false); txt(role, tx, ty + 22, 12, '#5eead4', al, 600, false);
    wrapLines(wide ? desc : short, tw, 11.5).slice(0, wide ? 7 : 4).forEach((ln, k) => txt(ln, tx, ty + 42 + k * 15, 11.5, '#c9cdd3', al, 500, false));
    icon(CHARS[i].start, x + cw - 32, y + 12, 20);
  });
  txt(usingTouch ? '' : '← →  Enter', CW / 2, CH - 28, 11, '#5c626c', 'center', 600, false);
}
function drawPause() {
  ctx.fillStyle = 'rgba(6,7,9,.75)'; ctx.fillRect(0, 0, CW, CH); txt(T.paused, CW / 2, CH / 2 - 90, 28, '#f1f2f4', 'center', 900, false);
  const items = [[T.resume, () => setState('play')], [T.sound(!muted), () => { muted = !muted; }], [T.quit, () => { music(-1); setState('title'); }]];
  items.forEach(([l, fn], i) => { const b = button(CW / 2 - 110, CH / 2 - 50 + i * 56, 220, 46, fn); panel(b.x, b.y, b.w, b.h, i === 0); txt(l, CW / 2, b.y + 23, 15, '#f1f2f4', 'center', 700, false); });
  // what each weapon has done so far and how far its skill tree has grown
  pl.weapons.forEach((w, i) => txt(`${(w.evo ? T.evo : T.w)[w.id][0]} Lv${w.lv} · ${T.treeKills('', pl.wk[w.id] || 0).trim()} · ${T.tree[w.id][0][0]} ${w.tr[0]}/3 · ${T.tree[w.id][1][0]} ${w.tr[1]}/3`, CW / 2, CH / 2 + 124 + i * 17, 11, '#9aa0aa', 'center', 500, false));
}
function drawResult() {
  const a = Math.min(1, resultT / 0.8), win = endKind === 'a' || endKind === 'b'; ctx.fillStyle = `rgba(6,7,9,${0.86 * a})`; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = a;
  const top = CH * 0.18, col = endKind === 'a' ? '#5eead4' : endKind === 'b' ? '#f6d55c' : '#ff9a90';
  if (win) txt(T.endTitle[endKind], CW / 2, top - 30, 13, col, 'center', 800, false);
  txt(win ? T.endSub[endKind] : T.over, CW / 2, top, Math.min(30, CW / 13), win ? '#f1f2f4' : col, 'center', 900, false);
  if (!win) wrapLines(T.overSub, Math.min(460, CW - 40), 13).forEach((ln, i) => txt(ln, CW / 2, top + 34 + i * 19, 13, '#c9cdd3', 'center', 500, false));
  const stt = T.stats(fmtTime(run.time), pl.kills, pl.gems, pl.lv, run.areas), y0 = top + 80;
  stt.forEach((s, i) => txt(s, CW / 2, y0 + i * 22, 14, '#e5e7eb', 'center', 600, false));
  txt(`${T.score} ${(pl.score + run.gold * 10).toLocaleString()}`, CW / 2, y0 + stt.length * 22 + 14, 20, '#f6d55c', 'center', 800, false);
  pl.weapons.forEach((w, i) => { const x = CW / 2 - pl.weapons.length * 15 + i * 30; slot(x, y0 + stt.length * 22 + 36, w.id, w.lv, MAX_LV, w.evo); });
  if (resultT > 1) {
    const by = Math.min(CH - 70, y0 + stt.length * 22 + 84);
    const b1 = button(CW / 2 - 160, by, 150, 46, () => setState('select')), b2 = button(CW / 2 + 10, by, 150, 46, () => setState('title'));
    rr(b1.x, b1.y, b1.w, b1.h, 12); ctx.fillStyle = '#f1f2f4'; ctx.fill(); txt(T.again, b1.x + 75, by + 23, 15, '#0a0b0d', 'center', 800, false);
    panel(b2.x, b2.y, b2.w, b2.h); txt(T.toTitle, b2.x + 75, by + 23, 15, '#f1f2f4', 'center', 700, false);
  }
  ctx.globalAlpha = 1;
}

// ---------- main loop: fixed 60 Hz steps ----------
let lastT = 0, acc = 0;
function frame(now) {
  requestAnimationFrame(frame); // schedule first: one bad frame must never stop the game
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0); lastT = now; acc += dt; let n = 0;
  while (acc >= 1 / 60 && n < 4) { update(1 / 60); acc -= 1 / 60; n++; for (const k in hit) hit[k] = 0; taps.length = 0; }
  if (n >= 4) acc = 0;
  if (innerWidth && innerHeight && (innerWidth !== CW || innerHeight !== CH)) resize(); // size arrived or changed without an event
  if (!innerWidth || !innerHeight) return; // nothing to draw into yet
  try { render(); } catch (e) { console.error(e); }
}
requestAnimationFrame(frame);
