// ---------- HUD, cards and dialogue, drawn at full resolution on top of the pixel layer ----------
const INKC = '#0a0b0d';
let ui = []; // clickable rects from the last frame: { x, y, w, h, fn }
const button = (x, y, w, h, fn) => { ui.push({ x, y, w, h, fn }); return { x, y, w, h }; };
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function panel(x, y, w, h, sel, fill) { rr(x, y, w, h, 12); ctx.fillStyle = fill || 'rgba(18,20,24,.94)'; ctx.fill(); ctx.lineWidth = sel ? 2 : 1; ctx.strokeStyle = sel ? '#f1f2f4' : 'rgba(255,255,255,.09)'; ctx.stroke(); }
function txt(s, x, y, size, col, align = 'left', weight = 700, outline = true) {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (outline) { ctx.lineWidth = Math.max(2, size / 5); ctx.strokeStyle = INKC; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function wrapLines(s, w, size, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`; const out = [];
  for (const para of String(s).split('\n')) {
    const words = para.split(' ').map((wd, i, a) => (i < a.length - 1 ? wd + ' ' : wd)); let line = '';
    for (const wd of words) { if (ctx.measureText(line + wd).width > w && line) { out.push(line.trimEnd()); line = wd; } else line += wd; }
    out.push(line.trimEnd());
  }
  return out;
}
function icon(id, x, y, s) { const ic = ICONS[id]; if (!ic) return; ctx.imageSmoothingEnabled = false; ctx.drawImage(ic.c, x, y, s, s); }
function bar(x, y, w, h, k, col, back = 'rgba(255,255,255,.08)') { rr(x, y, w, h, h / 2); ctx.fillStyle = back; ctx.fill(); if (k > 0) { rr(x, y, Math.max(h, w * clamp(k, 0, 1)), h, h / 2); ctx.fillStyle = col; ctx.fill(); } }

function drawHud() {
  // xp along the very top
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, 0, CW, 4); ctx.fillStyle = st && st.dry ? '#4a4f58' : '#5aa7e0'; ctx.fillRect(0, 0, CW * clamp(pl.xp / pl.need, 0, 1), 4);
  if (st && st.budget && !st.dry) { ctx.fillStyle = 'rgba(94,234,212,.5)'; ctx.fillRect(0, 4, CW * (1 - st.xpGot / st.budget), 2); } // this area's growth left
  // left: hp, weapons, passives
  panel(10, 12, 158, 34, false, 'rgba(10,11,13,.72)');
  txt(`Lv ${pl.lv}`, 22, 29, 12.5, '#cfe8ff', 'left', 800, false); bar(62, 24, 96, 10, pl.hp / pl.maxHp, pl.hp / pl.maxHp < 0.3 ? '#ff5a4f' : '#e0524a');
  txt(`${Math.ceil(pl.hp)}`, 110, 29.5, 9, '#fff', 'center', 800);
  pl.weapons.forEach((w, i) => slot(10 + i * 26, 54, w.id, w.lv, MAX_LV, w.evo));
  P_ORDER.filter((id) => pl.pas[id]).forEach((id, i) => slot(10 + i * 26, 82, id, pl.pas[id], PASSIVES[id], false, true));
  // the curator's own trait, live, and a shrine blessing if one is running
  const ty = Object.keys(pl.pas).length ? 122 : 94;
  txt(traitText(), 12, ty, 11.5, ['#fb7185', '#5eead4', '#fde68a'][pl.ci], 'left', 800);
  if (pl.buff) txt(`${T.buffName[pl.buff.k]} ${Math.ceil(pl.buff.t)}`, 12, ty + 17, 11, SHRINE_COL[pl.buff.k], 'left', 800);
  // centre: the objective
  const ow = Math.min(300, CW - 220), ox = (CW - ow) / 2;
  if (st.kind === 'fight' || st.kind === 'elite') {
    panel(ox, 12, ow, 38, false, 'rgba(10,11,13,.72)');
    const k = st.charge / st.need; txt(st.open ? T.gateOpen : T.gate(Math.floor(st.charge), st.need), CW / 2, 24, 11.5, st.open ? '#5eead4' : '#d9dde4', 'center', 700, false);
    bar(ox + 12, 34, ow - 24, 6, st.open ? 1 : k, st.open ? '#5eead4' : '#2dd4bf');
    if (st.flood > 0) { const a = 0.75 + Math.sin(performance.now() / 180) * 0.25; ctx.globalAlpha = a; txt(T.floodHud(Math.round(Math.min(3, st.flood) / 3 * 100)), CW / 2, 62, 11.5, '#fb7185', 'center', 800); ctx.globalAlpha = 1; }
  } else if (boss) {
    panel(ox, 12, ow, 38, false, 'rgba(10,11,13,.72)'); txt(T.boss[boss.i], CW / 2, 24, 11.5, '#ffd9e8', 'center', 800, false); bar(ox + 12, 34, ow - 24, 6, boss.hp / boss.maxHp, '#fb7185');
  } else if (st.kind === 'gen') { panel(ox, 12, ow, 38, false, 'rgba(10,11,13,.72)'); txt(fmtTime(Math.max(0, 25 - st.t)), CW / 2, 31, 16, '#f1f2f4', 'center', 800, false); }
  // right: area, gold, pause
  txt(`${T.acts[run.act][0]} · ${T.biome[st.biome][0]}`, CW - 52, 24, 11.5, hexA(st.B.accent, 1), 'right', 700, false);
  txt(`◆ ${run.gold}  ✕ ${pl.kills}`, CW - 52, 41, 11, '#c9cdd3', 'right', 600, false);
  const pb = button(CW - 44, 14, 34, 32, () => pauseGame()); panel(pb.x, pb.y, pb.w, pb.h, false, 'rgba(10,11,13,.72)'); ctx.fillStyle = '#f1f2f4'; ctx.fillRect(pb.x + 12, pb.y + 10, 3, 12); ctx.fillRect(pb.x + 19, pb.y + 10, 3, 12);
  // gate direction when it's off screen
  if (st.exit && (st.open || st.need)) {
    const sx = (st.exit.x - cam.x + LW / 2) * S / DPR, sy = (st.exit.y - cam.y + LH / 2) * S / DPR;
    if (sx < 20 || sy < 60 || sx > CW - 20 || sy > CH - 20) {
      const a = Math.atan2(sy - CH / 2, sx - CW / 2), rx = CW / 2 - 40, ry = CH / 2 - 60, k = Math.min(Math.abs(rx / Math.cos(a)), Math.abs(ry / Math.sin(a))), px = CW / 2 + Math.cos(a) * k, py = CH / 2 + Math.sin(a) * k;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = st.open ? '#5eead4' : 'rgba(45,212,191,.5)'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  if (banner) { // long hints (a gimmick's first appearance) stay longer and wrap on narrow screens
    const L = banner.long ? 4.6 : 2.6, a = banner.t < 0.3 ? banner.t / 0.3 : banner.t > L - 0.4 ? Math.max(0, (L - banner.t) / 0.4) : 1, sz = banner.long ? 15 : 17;
    ctx.globalAlpha = a; wrapLines(banner.text, Math.min(CW - 40, 620), sz, 800).forEach((ln, i) => txt(ln, CW / 2, CH * 0.26 + i * (sz + 6), sz, banner.long ? '#fde68a' : '#ffd36b', 'center', 800)); ctx.globalAlpha = 1;
  }
  if (bossBanner) {
    const b = bossBanner, a = b.t < 0.3 ? b.t / 0.3 : b.t > 3.3 ? Math.max(0, (3.8 - b.t) / 0.5) : 1; ctx.globalAlpha = a;
    const gr = ctx.createLinearGradient(0, 0, CW, 0); gr.addColorStop(0, 'rgba(251,113,133,0)'); gr.addColorStop(0.5, 'rgba(251,113,133,.28)'); gr.addColorStop(1, 'rgba(251,113,133,0)'); ctx.fillStyle = gr; ctx.fillRect(0, CH * 0.3 - 30, CW, 62);
    txt(T.warn, CW / 2, CH * 0.3 - 13, 11, '#ffb0a8', 'center', 800, false); txt(T.boss[b.i], CW / 2, CH * 0.3 + 10, 24, '#fff', 'center', 900); ctx.globalAlpha = 1;
  }
  if (pl.hp / pl.maxHp < 0.3) { const a = 0.18 + Math.sin(performance.now() / 160) * 0.08, gr = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.7); gr.addColorStop(0, 'rgba(224,82,74,0)'); gr.addColorStop(1, `rgba(224,82,74,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH); }
  if (usingTouch) {
    if (joy.id !== null) { ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 40, 0, 7); ctx.stroke(); const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.min(40, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(joy.ox + Math.cos(a) * d, joy.oy + Math.sin(a) * d, 16, 0, 7); ctx.fill(); }
    const b = dashBtn(); ctx.fillStyle = pl.dashCd > 0 ? 'rgba(255,255,255,.08)' : 'rgba(45,212,191,.22)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(94,234,212,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - pl.dashCd / CHARS[pl.ci].dash)); ctx.stroke(); txt(T.dash, b.x, b.y, 13, '#e9fffb', 'center', 800);
  }
}
function traitText() {
  const pct = (k) => Math.round(k * 100);
  if (pl.ci === 0) return T.trait.rage(pct(charPower() - 1));
  if (pl.ci === 1) return T.trait.combo(pl.combo, pct(comboCd()), pct(critChance()));
  return T.trait.tank(pct(CHARS[2].armor), pct(Math.max(0, pl.maxHp - CHARS[2].hp) / 250));
}
function slot(x, y, id, lv, max, evo, pas) {
  rr(x, y, 23, 23, 6); ctx.fillStyle = evo ? 'rgba(90,64,12,.92)' : 'rgba(10,11,13,.72)'; ctx.fill(); ctx.strokeStyle = evo ? '#f6d55c' : 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.stroke(); icon(id, x + 3.5, y + 3, 16);
  for (let i = 0; i < max; i++) { ctx.fillStyle = i < lv ? (evo ? '#f6d55c' : pas ? '#8fd66b' : '#5eead4') : 'rgba(255,255,255,.15)'; ctx.fillRect(x + 2 + i * (19 / max), y + 25, 19 / max - 1, 2.5); }
}
function drawNums() {
  for (const n of nums) {
    const sx = (n.x - cam.x + LW / 2) * S / DPR, sy = (n.y - cam.y + LH / 2 - n.t * 18) * S / DPR, a = n.t > 0.4 ? Math.max(0, 1 - (n.t - 0.4) / 0.3) : 1;
    ctx.globalAlpha = a; txt(String(n.v), sx, sy, n.big ? 15 : 11, n.heal ? '#8fd66b' : n.gold ? '#f6d55c' : n.crit ? '#fb923c' : n.big ? '#ffd36b' : '#fff', 'center', 800); ctx.globalAlpha = 1;
  }
}
// ---------- dialogue with portraits ----------
let dlg = null; // { lines, i, n, then }
function say(lines, then) { dlg = { lines, i: 0, n: 0, then, prev: state }; setState('dialog'); }
function updDialog(dt) {
  const d = dlg, text = d.lines[d.i][1]; d.n = Math.min(text.length, d.n + dt * 45);
  if (Math.floor(d.n) % 3 === 0 && d.n < text.length) sfx('text');
  if (hit.esc) { const f = d.then; dlg = null; f(); return; }
  if (hit.ok || hit.dash || hit.any || taps.length) { if (d.n < text.length) d.n = text.length; else if (++d.i >= d.lines.length) { const f = d.then; dlg = null; f(); } else d.n = 0; }
}
function whoName(k) { return k === 'me' ? T.chars[pl.ci][0] : T.who[k]; }
function drawPortrait(k, x, y, s) {
  rr(x, y, s, s, 12); ctx.fillStyle = '#15181d'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); rr(x, y, s, s, 12); ctx.clip(); ctx.imageSmoothingEnabled = false;
  const img = k === 'me' ? CHAR_ART[pl.ci][0] : k === 'dir' ? DIRECTOR : k === 'mir' ? mirrorArt(pl.ci)[0] : null;
  if (img) ctx.drawImage(img.c, 0, 0, img.w, 12, x + s * 0.06, y + s * 0.12, s * 0.88, s * 0.88 * 12 / img.w);
  else if (k === 'face') { ctx.fillStyle = '#f2c39b'; ctx.beginPath(); ctx.arc(x + s / 2, y + s * 0.55, s * 0.38, 0, 7); ctx.fill(); ctx.fillStyle = '#f4f0e8'; ctx.fillRect(x + s * 0.3, y + s * 0.42, s * 0.14, s * 0.08); ctx.fillRect(x + s * 0.56, y + s * 0.42, s * 0.14, s * 0.08); ctx.fillStyle = '#9c2f3d'; ctx.fillRect(x + s * 0.32, y + s * 0.66, s * 0.36, s * 0.07); }
  else if (k === 'box') { ctx.fillStyle = '#e0524a'; ctx.fillRect(x + s * 0.22, y + s * 0.3, s * 0.56, s * 0.5); ctx.fillStyle = '#0a0b0d'; ctx.fillRect(x + s * 0.32, y + s * 0.4, s * 0.36, s * 0.06); ctx.fillStyle = '#ff7ab8'; ctx.beginPath(); ctx.arc(x + s * 0.74, y + s * 0.3, s * 0.1, 0, 7); ctx.fill(); }
  else if (k === 'snake') { ctx.fillStyle = '#7fe3d6'; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s / 2, s * 0.34, s * 0.24, -0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#ff7ab8'; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(x + s / 2 - 3, y + s / 2 + 2, s * 0.34, s * 0.24, -0.3, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  else { ctx.fillStyle = '#2dd4bf'; ctx.font = `800 ${s * 0.32}px ui-monospace,monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('>_', x + s / 2, y + s / 2); }
  ctx.restore();
}
function drawDialog() {
  const d = dlg, [who, text] = d.lines[d.i], w = Math.min(CW - 24, 640), ps = CW < 520 ? 58 : 76, x = (CW - w) / 2;
  const lines = wrapLines(text, w - ps - 52, 15, 500), h = Math.max(ps + 28, 54 + lines.length * 22), y = CH - h - 18;
  ctx.fillStyle = dlgBg === 'map' ? 'rgba(6,7,9,.55)' : 'rgba(0,0,0,.3)'; ctx.fillRect(0, 0, CW, CH);
  panel(x, y, w, h, false, 'rgba(14,16,20,.96)');
  drawPortrait(who, x + 14, y + 14, ps);
  const tx = x + ps + 30; txt(whoName(who), tx, y + 26, 13, who === 'me' ? '#5eead4' : who === 'dir' ? '#f6d55c' : who === 'log' ? '#2dd4bf' : '#fb7185', 'left', 800, false);
  let left = Math.floor(d.n);
  lines.forEach((ln, i) => { if (left > 0) txt(ln.slice(0, left), tx, y + 52 + i * 22, 15, who === 'log' ? '#99f6e4' : '#e5e7eb', 'left', 500, false); left -= ln.length + 1; });
  if (d.n >= text.length && Math.floor(gt * 2.5) % 2) txt(T.next, x + w - 22, y + h - 18, 11, '#5eead4', 'center', 800, false);
  if (!usingTouch) txt(`${T.skip}: Esc`, x + w - 12, y - 12, 10.5, 'rgba(255,255,255,.4)', 'right', 600, false);
}
// ---------- level-up and chest cards ----------
let offerSel = 0;
function optionInfo(o) {
  if (o.k === 'w') { const [n, d] = T.w[o.id], p = WEAPONS[o.id].evoWith; return { icon: o.id, name: n, tag: o.lv === 1 ? T.newItem : T.lvl(o.lv), desc: d, hint: T.evoNeed(n, T.p[p][0]), color: '#5eead4' }; }
  if (o.k === 't') { const [bn, tiers] = T.tree[o.id][o.b]; return { icon: o.id, name: `${T.w[o.id][0]} · ${bn}`, tag: T.treeTag(o.t + 1), desc: tiers[o.t], hint: T.treeKills(T.w[o.id][0], pl.wk[o.id] || 0) + (o.t < 2 ? ` · ${T.treeNext}: ${tiers[o.t + 1]}` : ''), color: '#a78bfa' }; }
  if (o.k === 'p') { const [n, d] = T.p[o.id]; return { icon: o.id, name: n, tag: o.lv === 1 ? T.newItem : T.lvl(o.lv), desc: d, color: '#8fd66b' }; }
  if (o.k === 'evo') { const [n, d] = T.evo[o.id]; return { icon: o.id, name: n, tag: T.evolve, desc: d, color: '#f6d55c' }; }
  if (o.k === 'heal') return { icon: null, name: T.kimbap[0], tag: '', desc: T.kimbap[1], color: '#8fd66b', pic: 'kimbap' };
  return { icon: null, name: T.goldItem[0], tag: '', desc: T.goldItem[1], color: '#f6d55c', pic: 'gold' };
}
function drawCards(list, sel, onPick, title, sub) {
  ctx.fillStyle = 'rgba(6,7,9,.78)'; ctx.fillRect(0, 0, CW, CH);
  const wide = CW >= 700, n = list.length, cw = wide ? Math.min(220, (CW - 80) / n) : Math.min(CW - 32, 400), ch = wide ? 250 : Math.min(108, (CH - 200) / n);
  const total = wide ? n * cw + (n - 1) * 14 : n * ch + (n - 1) * 10, x0 = wide ? (CW - total) / 2 : (CW - cw) / 2, y0 = wide ? CH / 2 - ch / 2 + 10 : Math.max(96, CH / 2 - total / 2 + 10);
  txt(title, CW / 2, y0 - 50, 26, '#f1f2f4', 'center', 900); if (sub) txt(sub, CW / 2, y0 - 24, 12, '#9aa0aa', 'center', 600, false);
  list.forEach((o, i) => {
    const x = wide ? x0 + i * (cw + 14) : x0, y = wide ? y0 : y0 + i * (ch + 10), info = optionInfo(o), on = i === sel;
    if (onPick) button(x, y, cw, ch, () => onPick(i));
    panel(x, y, cw, ch, on, on ? 'rgba(26,30,36,.98)' : undefined);
    if (on) { ctx.fillStyle = info.color; rr(x, y, 4, ch, 2); ctx.fill(); }
    const is = wide ? 44 : 36, ix = wide ? x + cw / 2 - is / 2 : x + 16, iy = wide ? y + 20 : y + (ch - is) / 2;
    rr(ix - 6, iy - 6, is + 12, is + 12, 10); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
    if (info.icon) icon(info.icon, ix, iy, is); else { ctx.imageSmoothingEnabled = false; ctx.drawImage(PICK[info.pic === 'kimbap' ? 'kimbap' : 'gold'].c, ix, iy, is, is); }
    const tx = wide ? x + cw / 2 : x + 16 + is + 16, al = wide ? 'center' : 'left', ty = wide ? y + 94 : y + 24, tw = wide ? cw - 24 : cw - is - 48;
    txt(info.name, tx, ty, 16, '#f1f2f4', al, 800, false);
    if (info.tag) txt(info.tag, wide ? tx : x + cw - 14, wide ? ty + 22 : ty, 11, info.color, wide ? 'center' : 'right', 800, false);
    wrapLines(info.desc, tw, 12.5).slice(0, 3).forEach((ln, k) => txt(ln, tx, (wide ? ty + 48 : ty + 22) + k * 16, 12.5, '#c9cdd3', al, 500, false));
    if (info.hint && (wide || ch > 90)) wrapLines(info.hint, tw, 10.5).slice(0, 2).forEach((ln, k) => txt(ln, tx, (wide ? y + ch - 30 : y + ch - 14) + k * 13, 10.5, '#7c828c', al, 500, false));
    if (!usingTouch && onPick) txt(String(i + 1), x + 14, y + 14, 11, '#5c626c', 'center', 800, false);
  });
  return { y: wide ? y0 + ch : y0 + total };
}
function drawLevelUp() {
  const r = drawCards(offer, offerSel, (i) => chooseOffer(i), T.levelUp, T.chooseOne);
  if (pl.rerolls > 0 && offer.some((o) => o.k === 'w' || o.k === 'p')) {
    const w = 160, x = CW / 2 - w / 2, y = Math.min(CH - 50, r.y + 18), b = button(x, y, w, 38, () => doReroll());
    panel(b.x, b.y, b.w, b.h); txt(T.reroll(pl.rerolls) + (usingTouch ? '' : '  R'), CW / 2, y + 19, 13, '#e5e7eb', 'center', 700, false);
  }
}
function drawChest() {
  const c = chestShow, a = Math.min(1, c.t / 0.4);
  ctx.globalAlpha = a; drawCards(c.got, c.got[0]?.k === 'evo' ? 0 : -1, null, c.got[0]?.k === 'evo' ? T.evolve : T.chest, '');
  if (c.t > 0.8) txt(usingTouch ? '▼' : '▼  Enter', CW / 2, CH - 40, 13, '#5eead4', 'center', 700, false);
  ctx.globalAlpha = 1;
  if (c.got[0]?.k === 'evo' && c.t < 0.6) { ctx.fillStyle = `rgba(255,240,180,${0.6 * (1 - c.t / 0.6)})`; ctx.fillRect(0, 0, CW, CH); }
}
