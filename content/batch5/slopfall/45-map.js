// ---------- the journey: four acts of branching roads to the Filter Tower ----------
let run = null; // { act, map, at, depth, gold, choice, flags, areas, time, seen }
const NODE_W = { fight: 5, elite: 2, event: 2.2, camp: 1.2, shop: 1.2 };
const BIOME_W = { arc: { elite: 2 }, news: { event: 1.6, shop: 1.5 }, gal: { camp: 1.3, fight: 1.1 }, tow: { elite: 1.4 }, mir: { event: 1.2 } };
function genAct(a) {
  const A = ACTS[a], lanes = A.biomes.length, nodes = [];
  for (let c = 0; c < A.cols; c++) for (let r = 0; r < lanes; r++) {
    let type = 'fight';
    if (c > 0) {
      const w = {}, mod = BIOME_W[A.biomes[r]] || {};
      for (const k in NODE_W) w[k] = NODE_W[k] * (mod[k] || 1);
      if (c < 2) w.camp = 0; if (c === A.cols - 1) w.shop *= 0.5;
      let s = 0; for (const k in w) s += w[k]; let x = rand() * s; for (const k in w) { if ((x -= w[k]) <= 0) { type = k; break; } }
    }
    // some fights carry a twist you can see on the map: a treasure road or a dangerous one
    const mod = (type === 'fight' || type === 'elite') && c > 0 && rand() < 0.28 ? (rand() < 0.5 ? 'rich' : 'danger') : null;
    nodes.push({ id: `${c}-${r}`, col: c, row: r, type, mod, biome: A.biomes[r], next: [], jx: rnd(-0.25, 0.25), jy: rnd(-0.18, 0.18) });
  }
  const at = (c, r) => nodes.find((n) => n.col === c && n.row === r);
  // the last column before the boss always offers a camp somewhere
  const last = nodes.filter((n) => n.col === A.cols - 1); if (!last.some((n) => n.type === 'camp')) pick(last).type = 'camp';
  for (let c = 0; c < A.cols - 1; c++) for (let r = 0; r < lanes; r++) {
    const n = at(c, r); n.next.push(at(c + 1, r).id);
    if (r + 1 < lanes && rand() < 0.45 && !at(c, r + 1).next.includes(`${c + 1}-${r}`)) n.next.push(at(c + 1, r + 1).id);
    if (r > 0 && rand() < 0.45 && !at(c, r - 1).next.includes(`${c + 1}-${r}`)) n.next.push(at(c + 1, r - 1).id);
  }
  const boss = { id: 'boss', col: A.cols, row: (lanes - 1) / 2, type: 'boss', biome: A.biomes[Math.floor(lanes / 2)], next: [], jx: 0, jy: 0 };
  for (const n of last) n.next.push('boss');
  nodes.push(boss);
  return nodes;
}
const nodeById = (id) => run.map.find((n) => n.id === id);
const available = () => (run.at ? nodeById(run.at).next.map(nodeById) : run.map.filter((n) => n.col === 0));

// ---------- the map screen ----------
let mapSel = 0, mapT = 0;
function mapLayout() {
  const A = ACTS[run.act], lanes = A.biomes.length, cols = A.cols + 1, vert = CH > CW * 1.05;
  const top = vert ? 150 : 160, bottom = CH - (vert ? 245 : 175), left = vert ? 58 : 90, right = CW - (vert ? 58 : 70);
  return (n) => {
    const u = cols === 1 ? 0.5 : (n.col + n.jx * 0.35) / (cols - 1), v = lanes === 1 ? 0.5 : (n.row + n.jy * (vert ? 0.4 : 1)) / (lanes - 1);
    return vert ? { x: left + v * (right - left), y: bottom - u * (bottom - top) } : { x: left + u * (right - left), y: top + v * (bottom - top) };
  };
}
const NODE_COL = { fight: '#d9dde4', elite: '#fb7185', camp: '#fb923c', event: '#a78bfa', shop: '#f6d55c', boss: '#2dd4bf' };
function nodeIcon(type, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(2, s * 0.16); ctx.lineCap = 'round';
  if (type === 'fight') { for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-s * 0.5 * d, -s * 0.5); ctx.lineTo(s * 0.45 * d, s * 0.45); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.18 * d, s * 0.5); ctx.lineTo(s * 0.55 * d, s * 0.15); ctx.stroke(); } }
  else if (type === 'elite') { ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.35); ctx.lineTo(-s * 0.25, -s * 0.05); ctx.lineTo(0, -s * 0.55); ctx.lineTo(s * 0.25, -s * 0.05); ctx.lineTo(s * 0.55, -s * 0.35); ctx.lineTo(s * 0.4, s * 0.45); ctx.lineTo(-s * 0.4, s * 0.45); ctx.closePath(); ctx.fill(); }
  else if (type === 'camp') { ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.quadraticCurveTo(s * 0.55, 0, s * 0.3, s * 0.4); ctx.quadraticCurveTo(0, s * 0.6, -s * 0.3, s * 0.4); ctx.quadraticCurveTo(-s * 0.55, 0, 0, -s * 0.6); ctx.fill(); ctx.fillStyle = '#121418'; ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.14, s * 0.22, 0, 0, 7); ctx.fill(); }
  else if (type === 'event') { ctx.font = `900 ${s * 1.25}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, s * 0.05); }
  else if (type === 'shop') { ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#121418'; ctx.lineWidth = s * 0.1; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, 7); ctx.stroke(); }
  else if (type === 'boss') { ctx.beginPath(); ctx.moveTo(0, -s * 0.75); ctx.lineTo(s * 0.55, -s * 0.1); ctx.lineTo(0, s * 0.75); ctx.lineTo(-s * 0.55, -s * 0.1); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(0, -s * 0.75); ctx.lineTo(s * 0.22, -s * 0.1); ctx.lineTo(-s * 0.22, -s * 0.1); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawMap() {
  mapT += 1 / 60; const A = ACTS[run.act], pos = mapLayout(), av = available(), avIds = new Set(av.map((n) => n.id)), vert = CH > CW * 1.05;
  const B = BIOMES[A.biomes[Math.floor(A.biomes.length / 2)]];
  // backdrop: deep ink, a glow in the act's colour, faint contour lines
  ctx.fillStyle = '#0a0b0d'; ctx.fillRect(0, 0, CW, CH);
  const gr = ctx.createRadialGradient(CW * 0.8, CH * 0.15, 0, CW * 0.8, CH * 0.15, Math.max(CW, CH) * 0.8); gr.addColorStop(0, hexA(B.accent, 0.16)); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH);
  ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); for (let x = 0; x <= CW; x += 24) { const y = CH * (i + 0.5) / 9 + Math.sin(x / 140 + i * 1.7) * 18 + Math.sin(x / 57 + i) * 6; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  // header: act, name, the four acts as progress toward the tower
  const [an, aname] = T.acts[run.act];
  txt(T.mapTitle(an, aname), 24, 40, vert ? 22 : 26, '#f1f2f4', 'left', 850);
  txt(T.destination, 24, 66, 12.5, '#9aa0aa', 'left', 600, false);
  for (let i = 0; i < 4; i++) { const x = 24 + i * 30, y = 86; ctx.fillStyle = i < run.act ? '#2dd4bf' : i === run.act ? '#f1f2f4' : '#2a2e36'; ctx.save(); ctx.translate(x + 6, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore(); if (i < 3) { ctx.fillStyle = '#2a2e36'; ctx.fillRect(x + 14, y - 1, 14, 2); } }
  mapStatus(vert);
  const live = state === 'map', sel = live ? av[clamp(mapSel, 0, av.length - 1)] : null;
  // hovering a stop (or the selected one) previews where that road can lead
  const radius = (n) => (n.type === 'boss' ? 26 : 19);
  const hov = live && mouse.on ? run.map.find((n) => { const q = pos(n); return dist2(q.x, q.y, mouse.x, mouse.y) < (radius(n) + 8) ** 2; }) : null;
  const focus = hov || sel, reach = focus ? reachFrom(focus) : null;
  cv.style.cursor = hov && avIds.has(hov.id) ? 'pointer' : '';
  // roads
  for (const n of run.map) for (const id of n.next) {
    const m = nodeById(id), a = pos(n), b = pos(m), walked = run.path.includes(n.id) && run.path.includes(m.id), open = n.id === run.at && avIds.has(m.id) || (!run.at && false);
    const ahead = reach && reach.has(n.id) && reach.has(m.id) && !walked;
    ctx.strokeStyle = walked ? '#2dd4bf' : ahead ? 'rgba(246,213,92,.9)' : open ? 'rgba(241,242,244,.7)' : reach ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.14)';
    ctx.lineWidth = walked ? 3 : ahead ? 2.5 : 2; ctx.setLineDash(walked ? [] : [5, 7]); ctx.lineDashOffset = open || ahead ? -mapT * 18 : 0;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; vert ? ctx.bezierCurveTo(a.x, my, b.x, my, b.x, b.y) : ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y); ctx.stroke();
  }
  ctx.setLineDash([]);
  // district labels on act II
  if (run.act === 1) for (let r = 0; r < 3; r++) { const n0 = run.map.find((n) => n.col === 0 && n.row === r), p = pos(n0); txt(T.biome[A.biomes[r]][0], p.x, vert || p.y - 34 < 110 ? p.y + 36 : p.y - 34, 11, hexA(BIOMES[A.biomes[r]].accent, 0.95), 'center', 700, false); }
  for (const n of run.map) {
    const p = pos(n), isAv = avIds.has(n.id), done = run.path.includes(n.id), cur = n.id === run.at, R = n.type === 'boss' ? 26 : 19, col = NODE_COL[n.type];
    if (isAv && live) { const k = 0.5 + Math.sin(mapT * 4) * 0.5; ctx.strokeStyle = hexA(col, 0.35 + k * 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, R + 5 + k * 3, 0, 7); ctx.stroke(); button(p.x - R - 6, p.y - R - 6, R * 2 + 12, R * 2 + 12, () => { if (sel === n) enterNode(n); else mapSel = av.indexOf(n); }); }
    ctx.fillStyle = done ? '#10302c' : '#15181d'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill();
    ctx.lineWidth = sel === n ? 3 : 1.5; ctx.strokeStyle = sel === n ? '#f1f2f4' : done ? '#2dd4bf' : isAv ? hexA(col, 0.9) : 'rgba(255,255,255,.12)'; ctx.stroke();
    if (n.mod) { const bx = p.x - R * 0.72, by = p.y - R * 0.72; ctx.fillStyle = n.mod === 'rich' ? '#f6d55c' : '#fb7185'; ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#121418'; ctx.font = `900 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.mod === 'rich' ? '★' : '!', bx, by + 0.5); }
    if (n.biome !== 'out' && run.act === 1) { ctx.fillStyle = BIOMES[n.biome].accent; ctx.beginPath(); ctx.arc(p.x + R * 0.7, p.y - R * 0.7, 3.5, 0, 7); ctx.fill(); }
    ctx.globalAlpha = reach && !reach.has(n.id) && !done && !cur ? 0.18 : isAv || done || n.type === 'boss' || (reach && reach.has(n.id)) ? 1 : 0.4; nodeIcon(n.type, p.x, p.y, R * 0.75, done && !cur ? '#5eead4' : col); ctx.globalAlpha = 1;
    if (cur) { ctx.fillStyle = '#f1f2f4'; ctx.beginPath(); const by = p.y - R - 10 + Math.sin(mapT * 3) * 2; ctx.moveTo(p.x, by); ctx.lineTo(p.x - 6, by - 9); ctx.lineTo(p.x + 6, by - 9); ctx.fill(); }
  }
  // info panel for the selected road
  if (sel) {
    const w = Math.min(CW - 32, 460), x = (CW - w) / 2, y = CH - (vert ? 172 : 128), h = vert ? 150 : 108; panel(x, y, w, h, false, 'rgba(18,20,24,.94)');
    nodeIcon(sel.type, x + 34, y + 34, 16, NODE_COL[sel.type]);
    txt(T.node[sel.type][0], x + 62, y + 28, 17, '#f1f2f4', 'left', 800); txt(T.biome[sel.biome][0], x + 62, y + 48, 12, hexA(BIOMES[sel.biome].accent, 1), 'left', 700, false);
    const nx = nextText(sel); if (nx) txt(nx, x + 20, y + 74, 12.5, '#f6d55c', 'left', 700, false);
    wrapLines((sel.mod ? `${T.mod[sel.mod][0]}: ${T.mod[sel.mod][1]} ` : '') + T.node[sel.type][1] + ' ' + (sel.type === 'boss' ? '' : T.biome[sel.biome][1]), w - 40, 12.5).slice(0, vert ? 3 : 2).forEach((l, i) => txt(l, x + 20, y + 74 + (nx ? 17 : 0) + i * 17, 12.5, '#b8bdc6', 'left', 500, false));
    const b = button(x + w - 150, y + 18, 132, 40, () => enterNode(sel)); ctx.fillStyle = '#f1f2f4'; rr(b.x, b.y, b.w, b.h, 10); ctx.fill(); txt(T.mapGo, b.x + b.w / 2, b.y + 20, 14, '#0a0b0d', 'center', 800, false);
  }
  if (live) txt(T.mapPick, 150, 86, 12, '#6f7580', 'left', 600, false);
  if (hov) mapTip(hov, pos(hov), radius(hov), avIds.has(hov.id), reach);
}
// every stop you can still reach from n (n included), following the roads forward
function reachFrom(n) { const seen = new Set([n.id]), q = [n]; while (q.length) for (const id of q.shift().next) if (!seen.has(id)) { seen.add(id); q.push(nodeById(id)); } return seen; }
// "Leads to: Camp, Elite" for one stop
function nextText(n) {
  if (!n.next.length) return '';
  if (n.next.includes('boss')) return T.mapEnd;
  const names = [...new Set(n.next.map((id) => T.node[nodeById(id).type][0]))];
  return `${T.mapNext}: ${names.join(', ')}`;
}
// the hover card: what this stop is, whether you can go, and where it leads
function mapTip(n, p, R, canGo, reach) {
  const done = run.path.includes(n.id), here = n.id === run.at;
  const status = here ? T.mapHere : done ? T.mapDone : canGo ? '' : !available().some((a) => reachFrom(a).has(n.id)) ? T.mapCant : '';
  const later = reach ? [...reach].filter((id) => id !== n.id && id !== 'boss').length : 0;
  const w = Math.min(280, CW - 24), body = wrapLines(T.node[n.type][1] + (n.type === 'boss' ? '' : ' ' + T.biome[n.biome][1]), w - 28, 12.5);
  const extra = [nextText(n), n.mod ? `${T.mod[n.mod][0]}: ${T.mod[n.mod][1]}` : '', canGo && later ? T.mapLater(later) : '', status].filter(Boolean);
  const extraLines = extra.flatMap((e) => wrapLines(e, w - 28, 12, 600));
  const h = 46 + body.length * 17 + extraLines.length * 16 + (extraLines.length ? 8 : 0);
  let x = p.x + R + 14, y = p.y - h / 2;
  if (x + w > CW - 12) x = p.x - R - 14 - w; x = clamp(x, 12, CW - w - 12); y = clamp(y, 12, CH - h - 12);
  panel(x, y, w, h, false, 'rgba(10,11,13,.97)'); ctx.strokeStyle = hexA(NODE_COL[n.type], 0.6); ctx.lineWidth = 1; rr(x, y, w, h, 12); ctx.stroke();
  nodeIcon(n.type, x + 22, y + 23, 10, NODE_COL[n.type]);
  txt(T.node[n.type][0], x + 40, y + 23, 14.5, '#f1f2f4', 'left', 800, false);
  if (n.type !== 'boss') { ctx.font = `800 14.5px ${FONT}`; const tw = ctx.measureText(T.node[n.type][0]).width; txt(T.biome[n.biome][0], x + 48 + tw, y + 23.5, 11.5, hexA(BIOMES[n.biome].accent, 1), 'left', 700, false); }
  body.forEach((l, i) => txt(l, x + 14, y + 48 + i * 17, 12.5, '#c9cdd3', 'left', 500, false));
  let yy = y + 48 + body.length * 17 + 6;
  extra.forEach((e, k) => { const col = e === status ? (here || done ? '#5eead4' : '#fb7185') : k === 0 ? '#f6d55c' : n.mod && e.startsWith(T.mod[n.mod][0]) ? (n.mod === 'rich' ? '#fde68a' : '#fda4af') : '#9aa0aa'; for (const l of wrapLines(e, w - 28, 12, 600)) { txt(l, x + 14, yy, 12, col, 'left', 600, false); yy += 16; } });
}
function mapStatus(vert) { // HP, level, gold, weapons, top right
  const x = CW - 24, w = vert ? 150 : 200;
  txt(`Lv ${pl.lv}`, x, 32, 14, '#cfe8ff', 'right', 800);
  bar(x - w, 44, w, 8, pl.hp / pl.maxHp, '#e0524a'); txt(`${Math.ceil(pl.hp)}/${pl.maxHp}`, x - w - 8, 48, 11, '#ff9a90', 'right', 700, false);
  txt(`◆ ${run.gold} ${T.gold}`, x, 70, 12.5, '#f6d55c', 'right', 700, false);
  if (!vert) pl.weapons.forEach((wp, i) => slot(x - 26 * pl.weapons.length + i * 26, 84, wp.id, wp.lv, MAX_LV, wp.evo));
}
function updMap() {
  const av = available(), n = av.length; if (!n) return;
  const horizKeys = !(CH > CW * 1.05);
  if (hit.u || (horizKeys ? false : hit.l)) { mapSel = (mapSel + n - 1) % n; sfx('ui'); } if (hit.d || (horizKeys ? false : hit.r)) { mapSel = (mapSel + 1) % n; sfx('ui'); }
  if (horizKeys && hit.l) { mapSel = (mapSel + n - 1) % n; sfx('ui'); } if (horizKeys && hit.r) { mapSel = (mapSel + 1) % n; sfx('ui'); }
  if (hit.ok && stT > 0.3) enterNode(av[clamp(mapSel, 0, n - 1)]);
}
function hexA(hex, a) { const h = hex.replace('#', ''), v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return `rgba(${v >> 16 & 255},${v >> 8 & 255},${v & 255},${a})`; }
