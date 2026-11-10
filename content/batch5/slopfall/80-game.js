// ---------- flow: title → intro → curator select → play ⇄ level-up / chest / pause → result ----------
let state = 'title', stT = 0, gt = 0, introI = 0, selI = 0, seenIntro = false, endWin = false, resultT = 0;
function setState(s) { state = s; stT = 0; ui = []; }
function pauseGame() { if (state === 'play') setState('pause'); }
function startRun() { newRun(selI); setState('play'); sfx('lvl'); }
function endRun(win) { endWin = win; resultT = 0; setState('result'); music(-1); }
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
  const tapped = taps.length ? handleTaps() : false;
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
  } else if (state === 'play') {
    if (hit.esc) { pauseGame(); return; }
    if (hitstop > 0) { hitstop -= dt; return; }
    runT += dt; music(boss ? (boss.kind === 'snake' ? 2 : 1) : runT > RUN_LEN - 1 ? 2 : 0);
    updPlayer(dt); if (state !== 'play') return;
    buildGrid(); spawning(dt); updFoes(dt); updWeapons(dt); updShots(dt); updBullets(dt); updFx(dt);
    foes = foes.filter((e) => !e.dead);
    shake = Math.max(0, shake - 30 * dt);
    cam.x = lerp(cam.x, pl.x, Math.min(1, dt * 8)); cam.y = lerp(cam.y, pl.y, Math.min(1, dt * 8));
    if (bossBanner && (bossBanner.t += dt) > 3.8) bossBanner = null;
    if (banner && (banner.t += dt) > 2.6) banner = null;
    if (winT > 0 && (winT += dt) > 2.4) { endRun(true); return; }
    if (state === 'play' && pendingLv > 0) { offer = rollOffer(); offerSel = 0; setState('lvl'); sfx('lvl'); }
  } else if (state === 'lvl') {
    menuNav(offer.length, CW >= 700);
    for (let k = 0; k < offer.length; k++) if (hit[String(k + 1)]) { chooseOffer(k); return; }
    if (hit.reroll) doReroll(); else if (hit.ok && stT > 0.25) chooseOffer(offerSel);
  } else if (state === 'chest') {
    chestShow.t += dt; if (chestShow.t > 0.8 && (ok() || taps.length)) { chestShow = null; setState('play'); }
  } else if (state === 'pause') {
    if (hit.esc && stT > 0.1) setState('play');
  } else if (state === 'result') {
    resultT += dt; if (resultT > 1 && hit.ok) startRun(); else if (resultT > 1 && hit.esc) setState('title');
  }
}
function updFx(dt) {
  for (const f of fx) { f.t += dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } }
  fx = fx.filter((f) => f.t < f.max);
  for (const n of nums) n.t += dt; nums = nums.filter((n) => n.t < 0.7);
}

// ---------- drawing ----------
function present() { // the pixel layer, scaled up crisp
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(L, 0, 0, LW * S, LH * S);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const gr = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.35, CW / 2, CH / 2, Math.hypot(CW, CH) * 0.62);
  gr.addColorStop(0, 'rgba(8,6,14,0)'); gr.addColorStop(1, 'rgba(8,6,14,.55)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH);
}
function render() {
  ui = [];
  if (state === 'title' || state === 'intro' || state === 'select') { cam.x = gt * 12; cam.y = gt * 4; drawGround(cam.x, cam.y, gt); drawMenuSlop(gt); drawRain(gt); present(); }
  else { drawWorld(gt); drawRain(gt, 0.6); present(); drawNums(); if (pl && state !== 'result') drawHud(); }
  if (state === 'title') drawTitle(); else if (state === 'intro') drawIntro(); else if (state === 'select') drawSelect();
  else if (state === 'lvl') drawLevelUp(); else if (state === 'chest') drawChest(); else if (state === 'pause') drawPause(); else if (state === 'result') drawResult();
}
const DRIFT = Array.from({ length: 14 }, (_, i) => ({ k: ['hand', 'glyph', 'clock', 'eye', 'jelly', 'worm'][i % 6], x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.8 }));
function drawMenuSlop(t) {
  for (const d of DRIFT) { const x = ((d.x * LW - t * 10 * d.s) % (LW + 40) + LW + 40) % (LW + 40) - 20, y = d.y * LH + Math.sin(t * d.s * 2 + d.x * 9) * 6; g.globalAlpha = 0.35; spr(ART[d.k][Math.floor(t * 3 * d.s) % 2], x, y); g.globalAlpha = 1; }
}
function drawTitle() {
  const cy = CH * 0.36, big = Math.min(84, CW / 5.5);
  ctx.save(); ctx.translate(CW / 2, cy - big * 0.95); ctx.rotate(Math.PI / 4); const s = big * 0.32, pulse = 1 + Math.sin(gt * 3) * 0.04;
  ctx.fillStyle = '#5aa7e0'; ctx.fillRect(-s * pulse, -s * pulse, s * 2 * pulse, s * 2 * pulse); ctx.fillStyle = '#9fd2f5'; ctx.fillRect(-s * pulse, -s * pulse, s * pulse, s * pulse); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(-s * pulse, -s * pulse, s * 2 * pulse, s * 2 * pulse); ctx.restore();
  txt(T.title, CW / 2, cy, big, '#f4f0e8', 'center', 900);
  txt(T.sub, CW / 2, cy + big * 0.62, Math.min(16, CW / 26), '#cbb8f0', 'center', 600);
  const w = 200, b = button(CW / 2 - w / 2, CH * 0.62, w, 50, () => { setState(seenIntro ? 'select' : 'intro'); introI = 0; });
  panel(b.x, b.y, b.w, b.h, Math.floor(gt * 2) % 2 === 0, 'rgba(60,42,96,.95)'); txt(T.start, CW / 2, b.y + 25, 18, '#f6d55c', 'center', 800);
  txt(usingTouch ? T.touchKeys : T.keys, CW / 2, CH - 46, 11.5, '#8f88a6', 'center', 500, false);
  txt('Slop · made with Claude', CW / 2, CH - 24, 10, '#5d5676', 'center', 500, false);
}
function drawIntro() {
  ctx.fillStyle = 'rgba(8,6,14,.6)'; ctx.fillRect(0, 0, CW, CH);
  const lines = T.intro[introI].split('\n'), a = Math.min(1, stT / 0.6), sz = Math.min(20, CW / 22);
  ctx.globalAlpha = a; lines.forEach((ln, i) => txt(ln, CW / 2, CH / 2 + (i - (lines.length - 1) / 2) * sz * 1.7, sz, '#f4f0e8', 'center', 600)); ctx.globalAlpha = 1;
  for (let i = 0; i < T.intro.length; i++) { ctx.fillStyle = i === introI ? '#f6d55c' : 'rgba(255,255,255,.2)'; ctx.fillRect(CW / 2 - T.intro.length * 9 + i * 18, CH - 60, 10, 4); }
  if (!usingTouch) txt('Esc', CW - 20, CH - 20, 11, '#6f6888', 'right', 600, false);
}
function drawSelect() {
  ctx.fillStyle = 'rgba(8,6,14,.55)'; ctx.fillRect(0, 0, CW, CH);
  const wide = CW >= 640, cw = wide ? Math.min(220, (CW - 80) / 3) : Math.min(CW - 32, 380), ch = wide ? 280 : Math.min(150, (CH - 150) / 3);
  const total = wide ? cw * 3 + 28 : ch * 3 + 20, x0 = wide ? (CW - total) / 2 : (CW - cw) / 2, y0 = wide ? CH / 2 - ch / 2 + 16 : Math.max(80, CH / 2 - total / 2 + 16);
  txt(T.pick, CW / 2, y0 - 34, 22, '#f6d55c', 'center', 800);
  T.chars.forEach(([name, role, desc], i) => {
    const x = wide ? x0 + i * (cw + 14) : x0, y = wide ? y0 : y0 + i * (ch + 10), on = i === selI;
    button(x, y, cw, ch, () => { if (selI === i) startRun(); else selI = i; });
    panel(x, y, cw, ch, on, on ? 'rgba(40,30,62,.96)' : undefined);
    const art = CHAR_ART[i][on ? Math.floor(gt * 6) % 2 : 0], sz = wide ? 96 : Math.min(84, ch - 20), ax = wide ? x + cw / 2 - sz / 2 : x + 14, ay = wide ? y + 18 : y + (ch - sz) / 2;
    ctx.imageSmoothingEnabled = false; ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(ax, ay, sz, sz); ctx.drawImage(art.c, ax, ay, sz, sz);
    const tx = wide ? x + cw / 2 : ax + sz + 16, al = wide ? 'center' : 'left', ty = wide ? y + sz + 40 : y + ch / 2 - 22, tw = wide ? cw - 24 : x + cw - tx - 12;
    txt(name, tx, ty, 18, '#fff', al, 800); txt(role, tx, ty + 22, 12, '#cbb8f0', al, 600);
    wrapLines(desc, tw, 12).slice(0, 3).forEach((ln, k) => txt(ln, tx, ty + 44 + k * 16, 12, '#d8d3e8', al, 500, false));
    icon(CHARS[i].start, wide ? x + cw / 2 - 10 : x + cw - 34, wide ? y + ch - 36 : y + 10, 20);
  });
  txt(usingTouch ? '' : '← →  Enter', CW / 2, CH - 28, 11, '#6f6888', 'center', 600, false);
}
function drawPause() {
  ctx.fillStyle = 'rgba(8,6,14,.7)'; ctx.fillRect(0, 0, CW, CH); txt(T.paused, CW / 2, CH / 2 - 90, 28, '#f4f0e8', 'center', 900);
  const items = [[T.resume, () => setState('play')], [T.sound(!muted), () => { muted = !muted; }], [T.quit, () => { music(-1); setState('title'); }]];
  items.forEach(([l, fn], i) => { const b = button(CW / 2 - 110, CH / 2 - 50 + i * 56, 220, 46, fn); panel(b.x, b.y, b.w, b.h, i === 0); txt(l, CW / 2, b.y + 23, 15, '#f4f0e8', 'center', 700); });
  // what you carry
  const evos = pl.weapons.filter((w) => !w.evo).map((w) => `${T.w[w.id][0]} → ${T.evo[w.id][0]} (${T.p[WEAPONS[w.id].evoWith][0]})`);
  evos.slice(0, 4).forEach((s, i) => txt(s, CW / 2, CH / 2 + 128 + i * 17, 11, '#8f88a6', 'center', 500, false));
}
function drawResult() {
  const a = Math.min(1, resultT / 0.8); ctx.fillStyle = `rgba(8,6,14,${0.78 * a})`; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = a;
  const top = CH * 0.2; txt(endWin ? T.win : T.over, CW / 2, top, Math.min(32, CW / 12), endWin ? '#f6d55c' : '#ff9a90', 'center', 900);
  const lines = endWin ? T.winLines : [T.overSub]; lines.forEach((ln, i) => txt(ln, CW / 2, top + 40 + i * 22, 13, '#d8d3e8', 'center', 500, false));
  const st = T.stats(fmtTime(Math.min(runT, RUN_LEN + 999)), pl.kills, pl.gems, pl.lv), y0 = top + 60 + lines.length * 22;
  st.forEach((s, i) => txt(s, CW / 2, y0 + i * 22, 14, '#f4f0e8', 'center', 600));
  txt(`${T.score} ${pl.score.toLocaleString()}`, CW / 2, y0 + st.length * 22 + 14, 20, '#f6d55c', 'center', 800);
  pl.weapons.forEach((w, i) => { const x = CW / 2 - pl.weapons.length * 15 + i * 30; slot(x, y0 + st.length * 22 + 36, w.id, w.lv, MAX_LV, w.evo); });
  if (resultT > 1) {
    const by = Math.min(CH - 70, y0 + st.length * 22 + 84);
    const b1 = button(CW / 2 - 160, by, 150, 46, () => startRun()), b2 = button(CW / 2 + 10, by, 150, 46, () => setState('title'));
    panel(b1.x, b1.y, b1.w, b1.h, true, 'rgba(60,42,96,.95)'); txt(T.again, b1.x + 75, by + 23, 15, '#f6d55c', 'center', 800);
    panel(b2.x, b2.y, b2.w, b2.h); txt(T.toTitle, b2.x + 75, by + 23, 15, '#f4f0e8', 'center', 700);
  }
  ctx.globalAlpha = 1;
}

// ---------- main loop: fixed 60 Hz steps ----------
let lastT = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0); lastT = now; acc += dt; let n = 0;
  while (acc >= 1 / 60 && n < 4) { update(1 / 60); acc -= 1 / 60; n++; for (const k in hit) hit[k] = 0; taps.length = 0; }
  if (n >= 4) acc = 0;
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
