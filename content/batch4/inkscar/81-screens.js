// ---------- title, intro, ending screens; the main loop ----------
function veil(a) { g.fillStyle = `rgba(239,230,210,${a})`; g.fillRect(0, 0, VW, VH); }
function seal(x, y, s, ch) { g.fillStyle = RED; g.fillRect(x, y, s, s); g.fillStyle = PAPER; g.font = `700 ${s * 0.68}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x + s / 2, y + s / 2 + 0.5); g.textBaseline = 'alphabetic'; }
function drawTitle() {
  const sv = savedGame(), cxm = VW / 2; stageI = 0; drawBg(gt);
  g.globalAlpha = 0.16; drawEngine(VW * 0.78, 118, gt, { phase: 1 }); g.globalAlpha = 1; veil(0.25);
  g.textAlign = 'center'; g.fillStyle = INK; g.font = `700 ${LANG === 'ko' ? 62 : 50}px ${FONT}`; g.fillText(T.title, cxm, 112);
  const tw = g.measureText(T.title).width; seal(cxm + tw / 2 + 8, 66, 18, LANG === 'ko' ? '筆' : 'i');
  g.fillStyle = INK; g.beginPath(); g.moveTo(cxm - tw / 2 - 6, 124); g.quadraticCurveTo(cxm, 131, cxm + tw / 2 + 12, 123); g.quadraticCurveTo(cxm, 126, cxm - tw / 2 - 6, 124); g.fill();
  g.font = '700 13px ' + FONT; g.textAlign = 'center'; g.fillText(T.sub, cxm, 146);
  if (sv) {
    [T.cont, T.fresh].forEach((s, i) => { const x = cxm + (i ? 62 : -62), on = titleSel === i; g.font = `${on ? 700 : 400} 13px ${FONT}`; g.fillStyle = on ? RED : 'rgba(26,22,19,.6)'; g.fillText(s, x, 196); if (on) g.fillRect(x - 22, 201, 44, 1.5); });
    g.font = '8.5px ' + FONT; g.fillStyle = 'rgba(26,22,19,.55)'; g.fillText(`${T.stage[Math.min(sv.stage || 0, 2)][1]} · ${(sv.glyphs || []).length}/9`, cxm - 62, 213);
  } else if (Math.floor(gt * 1.6) % 2) { g.font = '11px ' + FONT; g.fillStyle = INK; g.fillText(T.start, cxm, 198); }
  g.font = '8.5px ' + FONT; g.fillStyle = 'rgba(26,22,19,.6)'; if (!pad.classList.contains('on')) g.fillText(T.keys, cxm, VH - 14);
  drawOverlay();
}
function drawIntro() {
  stageI = 0; drawBg(gt); veil(0.62); const lines = T.intro[introI].split('\n'), a = Math.min(1, stT / 0.7), y0 = VH / 2 - (lines.length - 1) * 10;
  g.globalAlpha = a; g.textAlign = 'center'; g.fillStyle = INK; g.font = '12.5px ' + FONT; lines.forEach((ln, i) => g.fillText(ln, VW / 2, y0 + i * 20, VW - 30)); g.globalAlpha = 1;
  for (let i = 0; i < T.intro.length; i++) { g.fillStyle = i === introI ? RED : 'rgba(26,22,19,.25)'; g.fillRect(VW / 2 - T.intro.length * 5 + i * 10, VH - 26, 5, 5); }
  g.font = '8px ' + FONT; g.textAlign = 'right'; g.fillStyle = 'rgba(26,22,19,.5)'; if (!pad.classList.contains('on')) g.fillText(T.skip, VW - 12, VH - 12);
  if (stT > 1 && Math.floor(gt * 2.5) % 2) { g.textAlign = 'center'; g.fillStyle = RED; g.font = '9px ' + FONT; g.fillText(T.next, VW / 2, VH - 36); }
  drawOverlay();
}
function drawEnding() {
  drawBg(gt); veil(endTrue ? 0.3 : 0.5); const a = Math.min(1, stT / 1.2), m = Math.floor(save.time / 60), s = Math.floor(save.time % 60);
  g.globalAlpha = a; g.textAlign = 'center'; g.fillStyle = INK; g.font = '700 24px ' + FONT; g.fillText(endTrue ? T.endT : T.endN, VW / 2, 96, VW - 30);
  seal(VW / 2 - 9, 112, 18, endTrue ? (LANG === 'ko' ? '讀' : 'A') : (LANG === 'ko' ? '止' : '—'));
  g.fillStyle = INK; g.font = '10.5px ' + FONT; g.textAlign = 'center'; g.fillText(T.stat(`${m}:${String(s).padStart(2, '0')}`, save.deaths, save.glyphs.length), VW / 2, 158, VW - 24);
  if (!endTrue) { g.fillStyle = RED; g.font = '10px ' + FONT; g.fillText(T.hintN, VW / 2, 180, VW - 24); }
  if (stT > 2.5 && Math.floor(gt * 1.6) % 2) { g.fillStyle = 'rgba(26,22,19,.7)'; g.font = '10px ' + FONT; g.fillText(T.again, VW / 2, 222); }
  g.globalAlpha = 1; drawOverlay();
}
let lastT = 0, acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0); lastT = now; acc += dt; let n = 0;
  while (acc >= 1 / 60 && n < 5) { update(1 / 60); acc -= 1 / 60; n++; } if (n >= 5) acc = 0;
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
