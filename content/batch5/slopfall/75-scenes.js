// ---------- the journey's flow: acts, nodes, areas, and the scenes between fights ----------
function startJourney(ci) {
  newRun(ci);
  run = { act: 0, map: null, at: null, path: [], depth: 0, gold: 0, choice: null, flags: {}, areas: 0, time: 0, seen: {}, events: [] };
  run.map = genAct(0); actIntro(0);
}
let actCard = null;
function actIntro(a) { actCard = { a, t: 0 }; setState('actcard'); sfx('chest'); }
function afterActCard() { const a = actCard.a; actCard = null; say(T.story['act' + a], () => (a === 2 ? showEvent('choice') : toMap())); }
function toMap() { mapSel = 0; setState('map'); }
function enterNode(n) {
  run.at = n.id; run.path.push(n.id); run.depth++; sfx('pick'); // every step along the road makes the slop a little tougher
  if (run.act === 1 && n.biome !== 'out' && !run.seen[n.biome] && n.type !== 'boss') { run.seen[n.biome] = 1; say(T.story[n.biome], () => doNode(n)); }
  else doNode(n);
}
function doNode(n) {
  if (n.type === 'fight' || n.type === 'elite') startStage(n.type, n.biome, 'node', n.mod);
  else if (n.type === 'camp') { campMode = 'pick'; offerSel = 0; setState('camp'); }
  else if (n.type === 'shop') { shopBought = []; offerSel = 0; setState('shop'); }
  else if (n.type === 'event') { const pool = Object.keys(T.events).filter((k) => !run.events.includes(k)); const k = pool.length ? pick(pool) : pick(Object.keys(T.events)); run.events.push(k); showEvent(k); }
  else if (n.type === 'boss') say(T.story[['boss0', 'boss1', 'mir0', 'boss3'][run.act]], () => startStage('boss', n.biome));
}
let stageFrom = 'node';
function startStage(kind, biome, from = 'node', mod = null) {
  stageFrom = from; st = genStage(kind, biome, run.depth, mod); buildStageArt(st);
  foes = []; gems = []; items = []; shots = []; ebul = []; fx = []; nums = []; boss = null; bossBanner = null; banner = null; winT = 0; spawnAcc = 0; flow = null;
  pl.x = st.start.x; pl.y = st.start.y; pl.vx = pl.vy = 0; pl.inv = 1; cam.x = pl.x; cam.y = pl.y;
  for (const c of st.crates) spawnFoe('crate', c.x, c.y).spawnIn = 0;
  for (const b of st.barrels) spawnFoe('barrel', b.x, b.y).spawnIn = 0;
  for (const m of st.shards) spawnFoe('shard', m.x, m.y).spawnIn = 0;
  if (kind === 'elite') { st.eliteDead = false; spawnFoe(weighted(st.B.mix), st.exit.x + 30, st.exit.y + 10, { elite: true, guard: true }).spawnIn = 0; }
  if (kind === 'ambush') { st.eliteDead = false; const e = spawnFoe(weighted(st.B.mix), st.W / 2 * TS, 6 * TS, { elite: true, guard: true }); e.spawnIn = 0; e.woke = true; }
  if (kind === 'boss') spawnBoss(ACTS[run.act].boss);
  banner = { text: kind === 'boss' ? T.bossGate : kind === 'gen' || kind === 'ambush' ? T.swarm : mod ? `${T.mod[mod][0]} · ${T.mod[mod][1]}` : T.node[kind][1], t: 0 };
  setState('play'); music(st.B.music);
}
let clearInfo = null;
function stageWon() {
  if (st.cleared) return; st.cleared = true;
  const kills = pl.kills - st.kills0, base = st.kind === 'boss' ? 100 : st.kind === 'elite' ? 70 : st.kind === 'gen' ? 70 : st.kind === 'ambush' ? 30 : 25;
  const gold = Math.round(base + run.depth * 3 + kills / 8) * (st.biome === 'news' ? 1.3 : 1) * (st.mod === 'danger' ? 2 : 1) | 0;
  run.gold += gold; run.flags.praise = false; if (stageFrom === 'node') run.areas++;
  // moving on pays: clearing a fight area on the road gives a chest (lingering for the flood does not)
  clearInfo = { t: 0, time: st.t, kills, gold, boss: st.kind === 'boss', chest: st.kind === 'fight' && stageFrom === 'node' }; sfx('lvl'); setState('clear');
}
function afterClear() {
  const c = clearInfo; clearInfo = null;
  if (c.boss) {
    if (run.act === 3) return; // the ending runs from the boss kill
    run.act++; run.map = genAct(run.act); run.at = null; run.path = []; run.flags.unplug = false; actIntro(run.act);
  } else if (c.chest) openChest(false, 'map');
  else toMap();
}
// ---------- camp ----------
let campMode = 'pick';
function campOptions() { return pl.weapons.filter((w) => !w.evo && w.lv < MAX_LV).map((w) => ({ k: 'w', id: w.id, lv: w.lv + 1 })); }
function updCamp() {
  if (campMode === 'pick') {
    if (hit.l || hit.u) offerSel = 0; if (hit.r || hit.d) offerSel = 1;
    if (hit['1']) campPick(0); else if (hit['2']) campPick(1); else if (hit.ok && stT > 0.3) campPick(offerSel);
  } else {
    const o = campOptions(); menuNav(o.length, CW >= 700);
    for (let k = 0; k < o.length; k++) if (hit[String(k + 1)]) return campSharpen(k);
    if (hit.ok && stT > 0.3) campSharpen(offerSel); if (hit.esc) { campMode = 'pick'; stT = 0; }
  }
}
function campPick(i) {
  if (i === 0) { const n = Math.round(pl.maxHp * 0.4); pl.hp = Math.min(pl.maxHp, pl.hp + n); sfx('heal'); toMap(); }
  else if (campOptions().length) { campMode = 'sharpen'; offerSel = 0; stT = 0; sfx('ui'); }
  else { pl.maxHp += 10; pl.hp += 10; sfx('heal'); toMap(); }
}
function campSharpen(k) { const o = campOptions()[k]; if (!o) return; applyChoice(o); sfx('pick'); toMap(); }
function drawFire(x, y, s) {
  const t = gt; for (let i = 0; i < 3; i++) { const h = s * (0.9 - i * 0.22) * (1 + Math.sin(t * 9 + i) * 0.08); ctx.fillStyle = ['#fb923c', '#f6d55c', '#fff3c4'][i]; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x + s * (0.42 - i * 0.1), y - h * 0.3, x, y); ctx.quadraticCurveTo(x - s * (0.42 - i * 0.1), y - h * 0.3, x, y - h); ctx.fill(); }
  ctx.fillStyle = '#4b2c22'; ctx.fillRect(x - s * 0.5, y - 3, s, 6);
}
function sceneBackdrop(col) {
  ctx.fillStyle = '#0a0b0d'; ctx.fillRect(0, 0, CW, CH);
  const gr = ctx.createRadialGradient(CW / 2, CH * 0.35, 0, CW / 2, CH * 0.35, Math.max(CW, CH) * 0.7); gr.addColorStop(0, hexA(col, 0.18)); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH);
}
function drawCamp() {
  sceneBackdrop('#fb923c');
  if (campMode === 'sharpen') return drawCards(campOptions(), offerSel, (i) => campSharpen(i), T.camp.study[0], T.camp.study[1]);
  drawFire(CW / 2, CH * 0.3, 54);
  txt(T.camp.title, CW / 2, CH * 0.3 + 40, 26, '#f1f2f4', 'center', 900); txt(T.camp.sub, CW / 2, CH * 0.3 + 68, 13, '#9aa0aa', 'center', 500, false);
  const opts = [[T.camp.rest[0], T.camp.rest[1](Math.round(pl.maxHp * 0.4)), '#8fd66b'], [T.camp.study[0], T.camp.study[1], '#5eead4']], w = Math.min(220, (CW - 48) / 2), x0 = CW / 2 - w - 8, y = CH * 0.3 + 100;
  opts.forEach(([n, d, c], i) => {
    const x = x0 + i * (w + 16), on = offerSel === i; button(x, y, w, 110, () => campPick(i)); panel(x, y, w, 110, on, on ? 'rgba(26,30,36,.98)' : undefined);
    txt(n, x + w / 2, y + 36, 17, c, 'center', 800, false); wrapLines(d, w - 24, 12.5).slice(0, 2).forEach((l, k) => txt(l, x + w / 2, y + 64 + k * 17, 12.5, '#c9cdd3', 'center', 500, false));
  });
  txt(`HP ${Math.ceil(pl.hp)}/${pl.maxHp}`, CW / 2, y + 140, 12, '#ff9a90', 'center', 700, false);
}
// ---------- the archive cache (shop) ----------
let shopBought = [];
const SHOP_PRICE = [40, 35, 70, 55];
function shopBuy(i) {
  if (i === 4) return toMap(); if (shopBought.includes(i)) return;
  if (run.gold < SHOP_PRICE[i]) { banner = { text: T.shop.poor, t: 0 }; sfx('hurt'); return; }
  run.gold -= SHOP_PRICE[i]; shopBought.push(i); sfx('pick');
  if (i === 0) pl.hp = Math.min(pl.maxHp, pl.hp + 45); else if (i === 1) pl.rerolls += 2; else if (i === 3) { pl.maxHp += 15; pl.hp += 15; }
  else { const p = upgradePool(); if (p.length) { const o = pick(p); applyChoice(o); banner = { text: `${optionInfo(o).name} ${optionInfo(o).tag}`, t: 0 }; } }
}
function updShop() { menuNav(5, false); for (let k = 0; k < 4; k++) if (hit[String(k + 1)]) shopBuy(k); if (hit.ok && stT > 0.3) shopBuy(offerSel); if (hit.esc) toMap(); if (banner && (banner.t += 1 / 60) > 2.6) banner = null; }
function drawShop() {
  sceneBackdrop('#f6d55c');
  txt(T.shop.title, CW / 2, 70, 26, '#f1f2f4', 'center', 900); txt(T.shop.sub, CW / 2, 98, 13, '#9aa0aa', 'center', 500, false); txt(`◆ ${run.gold} ${T.gold}`, CW / 2, 124, 14, '#f6d55c', 'center', 800, false);
  const w = Math.min(420, CW - 32), x = (CW - w) / 2;
  T.shop.items.forEach(([n, d], i) => {
    const y = 150 + i * 70, on = offerSel === i, sold = shopBought.includes(i); button(x, y, w, 60, () => shopBuy(i)); panel(x, y, w, 60, on, on ? 'rgba(26,30,36,.98)' : undefined);
    ctx.globalAlpha = sold ? 0.4 : 1; txt(n, x + 18, y + 22, 15, '#f1f2f4', 'left', 800, false); txt(d, x + 18, y + 42, 12, '#9aa0aa', 'left', 500, false);
    txt(sold ? T.shop.bought : `◆ ${SHOP_PRICE[i]}`, x + w - 18, y + 30, 14, run.gold >= SHOP_PRICE[i] || sold ? '#f6d55c' : '#7c828c', 'right', 800, false); ctx.globalAlpha = 1;
  });
  const y = 150 + 4 * 70 + 6, b = button(x + w / 2 - 80, y, 160, 42, () => toMap()); panel(b.x, b.y, b.w, b.h, offerSel === 4); txt(T.shop.leave, CW / 2, y + 21, 14, '#e5e7eb', 'center', 700, false);
  if (banner) txt(banner.text, CW / 2, CH - 40, 14, '#ffd36b', 'center', 800);
}
// ---------- events and the act III choice ----------
let ev = null;
function showEvent(k) { ev = { k, picked: -1, t: 0 }; offerSel = 0; setState('event'); }
function evData() { return ev.k === 'choice' ? T.story.choice : T.events[ev.k]; }
function evPick(i) {
  if (ev.picked >= 0) return evDone(); ev.picked = i; ev.t = 0; sfx('pick');
  const k = ev.k;
  if (k === 'choice') run.choice = i === 0 ? 'A' : 'B';
  else if (k === 'drafts' && i === 0) { pl.hp = Math.max(1, pl.hp - 15); const p = upgradePool(); if (p.length) applyChoice(pick(p)); }
  else if (k === 'maker') { if (i === 0) run.gold += 50; else { pl.hp = Math.min(pl.maxHp, pl.hp + 25); run.flags.praise = true; } }
  else if (k === 'box' && i === 0) ev.outcome = rand() < 0.5 ? 'chest' : 'ambush';
  else if (k === 'gen') { if (i === 0) ev.outcome = 'gen'; else { pl.hp = Math.max(1, pl.hp - 10); run.flags.unplug = true; } }
  else if (k === 'journal') { if (i === 0) { pl.maxHp += 10; pl.hp = Math.min(pl.maxHp, pl.hp + 10); } else run.gold += 20; }
}
function evDone() {
  const o = ev.outcome; ev = null;
  if (o === 'chest') openChest(false, 'map'); else if (o === 'ambush') startStage('ambush', nodeById(run.at)?.biome || 'out', 'event'); else if (o === 'gen') startStage('gen', nodeById(run.at)?.biome || 'out', 'event');
  else toMap();
}
function updEvent() { ev.t += 1 / 60; if (ev.picked < 0) { menuNav(2, false); if (hit['1']) evPick(0); else if (hit['2']) evPick(1); else if (hit.ok && ev.t > 0.4) evPick(offerSel); } else if ((hit.ok || hit.any) && ev.t > 0.4) evDone(); }
function drawEvent() {
  const d = evData(), isChoice = ev.k === 'choice'; sceneBackdrop(isChoice ? '#2dd4bf' : '#a78bfa');
  const w = Math.min(560, CW - 32), x = (CW - w) / 2; let y = Math.max(50, CH * 0.14);
  if (isChoice) { drawPortrait('dir', CW / 2 - 34, y, 68); y += 92; } else { ctx.fillStyle = '#a78bfa'; ctx.font = `900 46px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('?', CW / 2, y + 30); y += 70; }
  txt(d[0], CW / 2, y, 22, '#f1f2f4', 'center', 900); y += 34;
  wrapLines(d[1], w - 20, 14.5).forEach((l) => { txt(l, CW / 2, y, 14.5, '#c9cdd3', 'center', 500, false); y += 22; }); y += 16;
  [d[2], d[3]].forEach(([label, res], i) => {
    const on = ev.picked < 0 ? offerSel === i : ev.picked === i, h = 70; button(x, y, w, h, () => evPick(i));
    ctx.globalAlpha = ev.picked >= 0 && ev.picked !== i ? 0.35 : 1; panel(x, y, w, h, on, on ? 'rgba(26,30,36,.98)' : undefined);
    txt(label, x + 18, y + 24, 15.5, isChoice ? (i ? '#fb923c' : '#5eead4') : '#f1f2f4', 'left', 800, false);
    wrapLines(res, w - 36, 12).slice(0, 2).forEach((l, k) => txt(l, x + 18, y + 46 + k * 15, 12, '#9aa0aa', 'left', 500, false)); ctx.globalAlpha = 1; y += h + 10;
  });
  if (ev.picked >= 0) { const b = button(CW / 2 - 80, y + 6, 160, 42, () => evDone()); panel(b.x, b.y, b.w, b.h, true); txt(T.cont, CW / 2, y + 27, 14, '#f1f2f4', 'center', 800, false); }
}
// ---------- act card and area cleared ----------
function drawActCard() {
  const c = actCard, a = c.t < 0.5 ? c.t / 0.5 : c.t > 2.6 ? Math.max(0, (3.1 - c.t) / 0.5) : 1, B = BIOMES[ACTS[c.a].biomes[0]];
  sceneBackdrop(B.accent); ctx.globalAlpha = a;
  const [an, name] = T.acts[c.a]; txt(an, CW / 2, CH / 2 - 40, LANG === 'ko' ? 64 : 30, hexA(B.accent, 1), 'center', 900, false);
  txt(name, CW / 2, CH / 2 + 18, 30, '#f1f2f4', 'center', 900, false);
  const sw = 160 * Math.min(1, c.t / 0.8); ctx.fillStyle = hexA(B.accent, 0.8); ctx.fillRect(CW / 2 - sw / 2, CH / 2 + 46, sw, 2);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i < c.a ? '#2dd4bf' : i === c.a ? '#f1f2f4' : '#2a2e36'; ctx.save(); ctx.translate(CW / 2 - 45 + i * 30, CH / 2 + 74); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore(); }
  ctx.globalAlpha = 1;
}
function drawClear() {
  const c = clearInfo, a = Math.min(1, c.t / 0.4); ctx.fillStyle = `rgba(6,7,9,${0.7 * a})`; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = a;
  txt(T.clear, CW / 2, CH / 2 - 40, 30, '#5eead4', 'center', 900); txt(T.clearSub(fmtTime(c.time), c.kills, c.gold), CW / 2, CH / 2, 14, '#c9cdd3', 'center', 600, false);
  if (c.t > 0.6) { const b = button(CW / 2 - 80, CH / 2 + 30, 160, 44, () => afterClear()); panel(b.x, b.y, b.w, b.h, true, 'rgba(26,30,36,.98)'); txt(T.cont, CW / 2, CH / 2 + 52, 15, '#f1f2f4', 'center', 800, false); }
  ctx.globalAlpha = 1;
}
