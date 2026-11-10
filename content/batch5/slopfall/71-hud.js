// ---------- HUD and menus, drawn at full resolution on top of the pixel layer ----------
const GOLD = '#d9b45a', INKC = '#120e1a';
let ui = []; // clickable rects from the last frame: { x, y, w, h, fn }
const button = (x, y, w, h, fn) => { ui.push({ x, y, w, h, fn }); return { x, y, w, h }; };
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function panel(x, y, w, h, sel, fill) { rr(x, y, w, h, 8); ctx.fillStyle = fill || 'rgba(20,16,32,.92)'; ctx.fill(); ctx.lineWidth = sel ? 2.5 : 1.2; ctx.strokeStyle = sel ? '#f6d55c' : 'rgba(217,180,90,.55)'; ctx.stroke(); }
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
function bar(x, y, w, h, k, col, back = 'rgba(0,0,0,.55)') { ctx.fillStyle = back; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(k, 0, 1), h); }

function drawHud() {
  const t = runT;
  // xp
  bar(0, 0, CW, 7, pl.xp / pl.need, '#5aa7e0'); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(0, 0, CW * clamp(pl.xp / pl.need, 0, 1), 2);
  txt(`Lv ${pl.lv}`, CW - 10, 18, 13, '#cfe8ff', 'right');
  // timer
  const left = Math.max(0, RUN_LEN - t);
  txt(fmtTime(Math.min(t, RUN_LEN)), CW / 2, 26, 22, '#f4f0e8', 'center', 800);
  if (left > 0) txt(T.filterIn(fmtTime(left)), CW / 2, 45, 11, '#a29db0', 'center', 600);
  // hp
  txt('HP', 12, 20, 11, '#ff9a90'); bar(32, 15, 110, 10, pl.hp / pl.maxHp, pl.hp / pl.maxHp < 0.3 ? '#ff5a4f' : '#e0524a'); txt(`${Math.ceil(pl.hp)}/${pl.maxHp}`, 87, 20.5, 9, '#fff', 'center', 700);
  // slots
  pl.weapons.forEach((w, i) => slot(12 + i * 26, 32, w.id, w.lv, MAX_LV, w.evo));
  P_ORDER.filter((id) => pl.pas[id]).forEach((id, i) => slot(12 + i * 26, 60, id, pl.pas[id], PASSIVES[id], false, true));
  // kills, gems, pause
  txt(`✕ ${pl.kills}   ◆ ${pl.gems}`, CW - 10, 36, 12, '#e9e4ff', 'right', 700);
  const pb = button(CW - 44, 50, 34, 30, () => pauseGame()); panel(pb.x, pb.y, pb.w, pb.h); ctx.fillStyle = '#f4f0e8'; ctx.fillRect(pb.x + 12, pb.y + 9, 3, 12); ctx.fillRect(pb.x + 19, pb.y + 9, 3, 12);
  // boss bar
  if (boss) {
    const w = Math.min(380, CW - 120), x = (CW - w) / 2, y = 62; txt(T.boss[boss.i][0], CW / 2, y - 2, 12, '#ffd9e8', 'center', 800);
    bar(x, y + 6, w, 7, boss.hp / boss.maxHp, '#ff7ab8'); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y + 6, w, 7);
  }
  if (banner) { const a = banner.t < 0.3 ? banner.t / 0.3 : banner.t > 2.2 ? Math.max(0, (2.6 - banner.t) / 0.4) : 1; ctx.globalAlpha = a; txt(banner.text, CW / 2, CH * 0.3, 18, '#ffd36b', 'center', 800); ctx.globalAlpha = 1; }
  if (bossBanner) {
    const b = bossBanner, a = b.t < 0.3 ? b.t / 0.3 : b.t > 3.3 ? Math.max(0, (3.8 - b.t) / 0.5) : 1, [n, q] = T.boss[b.i]; ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(156,47,61,.55)'; ctx.fillRect(0, CH * 0.3 - 34, CW, 74);
    txt(T.warn, CW / 2, CH * 0.3 - 18, 12, '#ffb0a8', 'center', 800); txt(n, CW / 2, CH * 0.3 + 4, 24, '#fff', 'center', 900); txt(q, CW / 2, CH * 0.3 + 28, 12, '#ffd9e8', 'center', 600); ctx.globalAlpha = 1;
  }
  if (pl.hp / pl.maxHp < 0.3) { const a = 0.18 + Math.sin(performance.now() / 160) * 0.08, gr = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.7); gr.addColorStop(0, 'rgba(224,82,74,0)'); gr.addColorStop(1, `rgba(224,82,74,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH); }
  if (usingTouch) {
    if (joy.id !== null) { ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 40, 0, 7); ctx.stroke(); const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.min(40, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(joy.ox + Math.cos(a) * d, joy.oy + Math.sin(a) * d, 16, 0, 7); ctx.fill(); }
    const b = dashBtn(); ctx.fillStyle = pl.dashCd > 0 ? 'rgba(255,255,255,.08)' : 'rgba(127,227,214,.25)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(127,227,214,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - pl.dashCd / 1.1)); ctx.stroke(); txt(T.dash, b.x, b.y, 13, '#e9fffb', 'center', 800);
  }
}
function slot(x, y, id, lv, max, evo, pas) {
  panel(x, y, 23, 23, evo, evo ? 'rgba(80,56,10,.9)' : undefined); icon(id, x + 3.5, y + 3, 16);
  for (let i = 0; i < max; i++) { ctx.fillStyle = i < lv ? (evo ? '#f6d55c' : pas ? '#8fd66b' : '#7fe3d6') : 'rgba(255,255,255,.15)'; ctx.fillRect(x + 2 + i * (19 / max), y + 25, 19 / max - 1, 2.5); }
}
// damage numbers, drawn crisp
function drawNums() {
  for (const n of nums) {
    const sx = (n.x - cam.x + LW / 2) * S / DPR, sy = (n.y - cam.y + LH / 2 - n.t * 18) * S / DPR, a = n.t > 0.4 ? Math.max(0, 1 - (n.t - 0.4) / 0.3) : 1;
    ctx.globalAlpha = a; txt(String(n.v), sx, sy, n.big ? 15 : 11, n.heal ? '#8fd66b' : n.big ? '#ffd36b' : '#fff', 'center', 800); ctx.globalAlpha = 1;
  }
}
// ---------- level-up, chest ----------
let offerSel = 0;
function optionInfo(o) {
  if (o.k === 'w') { const [n, d] = T.w[o.id], p = WEAPONS[o.id].evoWith; return { icon: o.id, name: n, tag: o.lv === 1 ? T.newItem : T.lvl(o.lv), desc: d, hint: T.evoNeed(n, T.p[p][0]), color: '#7fe3d6' }; }
  if (o.k === 'p') { const [n, d] = T.p[o.id]; return { icon: o.id, name: n, tag: o.lv === 1 ? T.newItem : T.lvl(o.lv), desc: d, color: '#8fd66b' }; }
  if (o.k === 'evo') { const [n, d] = T.evo[o.id]; return { icon: o.id, name: n, tag: T.evolve, desc: d, color: '#f6d55c' }; }
  if (o.k === 'heal') return { icon: null, name: T.kimbap[0], tag: '', desc: T.kimbap[1], color: '#8fd66b', pic: 'kimbap' };
  return { icon: null, name: T.gold[0], tag: '', desc: T.gold[1], color: '#f6d55c', pic: 'gold' };
}
function drawCards(list, sel, onPick, title, sub) {
  ctx.fillStyle = 'rgba(8,6,14,.72)'; ctx.fillRect(0, 0, CW, CH);
  const wide = CW >= 700, n = list.length, cw = wide ? Math.min(220, (CW - 80) / n) : Math.min(CW - 32, 400), ch = wide ? 250 : Math.min(108, (CH - 200) / n);
  const total = wide ? n * cw + (n - 1) * 14 : n * ch + (n - 1) * 10, x0 = wide ? (CW - total) / 2 : (CW - cw) / 2, y0 = wide ? CH / 2 - ch / 2 + 10 : Math.max(96, CH / 2 - total / 2 + 10);
  txt(title, CW / 2, y0 - 50, 26, '#f6d55c', 'center', 900); if (sub) txt(sub, CW / 2, y0 - 24, 12, '#a29db0', 'center', 600);
  list.forEach((o, i) => {
    const x = wide ? x0 + i * (cw + 14) : x0, y = wide ? y0 : y0 + i * (ch + 10), info = optionInfo(o), on = i === sel;
    if (onPick) button(x, y, cw, ch, () => onPick(i));
    panel(x, y, cw, ch, on, on ? 'rgba(40,30,62,.96)' : undefined);
    const is = wide ? 44 : 36, ix = wide ? x + cw / 2 - is / 2 : x + 14, iy = wide ? y + 18 : y + (ch - is) / 2;
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(ix - 4, iy - 4, is + 8, is + 8);
    if (info.icon) icon(info.icon, ix, iy, is); else if (info.pic === 'kimbap') { ctx.imageSmoothingEnabled = false; ctx.drawImage(PICK.kimbap.c, ix, iy, is, is); } else { ctx.fillStyle = '#f6d55c'; ctx.fillRect(ix + 6, iy + 6, is - 12, is - 12); }
    const tx = wide ? x + cw / 2 : x + 14 + is + 14, al = wide ? 'center' : 'left', ty = wide ? y + 92 : y + 22, tw = wide ? cw - 24 : cw - is - 44;
    txt(info.name, tx, ty, 16, '#fff', al, 800);
    if (info.tag) txt(info.tag, wide ? tx : x + cw - 12, wide ? ty + 22 : ty, 11, info.color, wide ? 'center' : 'right', 800);
    wrapLines(info.desc, tw, 12.5).slice(0, 3).forEach((ln, k) => txt(ln, tx, (wide ? ty + 48 : ty + 22) + k * 16, 12.5, '#d8d3e8', al, 500, false));
    if (info.hint && (wide || ch > 90)) wrapLines(info.hint, tw, 10.5).slice(0, 2).forEach((ln, k) => txt(ln, tx, (wide ? y + ch - 30 : y + ch - 14) + k * 13, 10.5, '#8f88a6', al, 500, false));
    if (!usingTouch && onPick) txt(String(i + 1), x + 12, y + 14, 11, '#6f6888', 'center', 800, false);
  });
  return { y: wide ? y0 + ch : y0 + total };
}
function drawLevelUp() {
  const r = drawCards(offer, offerSel, (i) => chooseOffer(i), T.levelUp, T.chooseOne);
  if (pl.rerolls > 0 && offer.some((o) => o.k === 'w' || o.k === 'p')) {
    const w = 150, x = CW / 2 - w / 2, y = Math.min(CH - 50, r.y + 18), b = button(x, y, w, 36, () => doReroll());
    panel(b.x, b.y, b.w, b.h); txt(T.reroll(pl.rerolls) + (usingTouch ? '' : '  R'), CW / 2, y + 18, 13, '#e9e4ff', 'center', 700);
  }
}
function drawChest() {
  const c = chestShow, a = Math.min(1, c.t / 0.4);
  ctx.globalAlpha = a; drawCards(c.got, c.got[0]?.k === 'evo' ? 0 : -1, null, c.got[0]?.k === 'evo' ? T.evolve : T.chest, '');
  if (c.t > 0.8) txt(usingTouch ? '▼' : '▼  Enter', CW / 2, CH - 40, 13, '#f6d55c', 'center', 700);
  ctx.globalAlpha = 1;
  if (c.got[0]?.k === 'evo' && c.t < 0.6) { ctx.fillStyle = `rgba(255,240,180,${0.6 * (1 - c.t / 0.6)})`; ctx.fillRect(0, 0, CW, CH); }
}
