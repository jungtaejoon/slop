// Swipe mode: one post per screen; swipe up (or ↑/↓, j/k) for the next one.
//
// Apps (games, tools) have their own touch and keyboard controls, which would fight
// the swipe gesture. So an app first runs as a live preview that can't be touched
// (inert iframe under a tap shield): swiping always moves on. Tapping it switches
// that card into play mode: the app gets every touch and key, swiping is locked and
// the side buttons step aside, until "Done". Only the card on screen keeps a live
// app; apps scrolled away are removed, which also stops their sound and CPU use.
import { api, S, $, app, KINDS, icon, gradFor, sandboxFrame, loadMyVotes, remember, voteBox, countView, go, toast, seenPosts, REC_SEED, REC_REASONS } from '../core.js';
import { esc, md, safeImgs, safeUrl, domain, ago } from '../text.js';
import { getCode, primeCodes } from './feed.js';

const PAGE = 20;
let io = null, dwell = null;

export function closeShorts() {
  document.body.classList.remove('sw-mode');
  io?.disconnect(); io = null; clearTimeout(dwell);
  document.removeEventListener('keydown', onKey);
}

export async function renderShorts(v) {
  document.body.classList.add('sw-mode');
  document.removeEventListener('keydown', onKey); document.addEventListener('keydown', onKey);
  const sh = (S.shorts ??= { queue: [], i: 0, offset: 0, done: false, clang: null });
  // the language filter changed since last time: start over
  if (sh.clang !== S.prefs.clang) Object.assign(sh, { queue: [], i: 0, offset: 0, done: false, clang: S.prefs.clang, seen: null });
  sh.seen ??= seenPosts(); // a snapshot, so pages don't reshuffle while you swipe
  app.innerHTML = `<div class="sw-top"><button class="sw-icon" id="swBack" aria-label="나가기" title="나가기">←</button><b>넘겨보기</b></div>
    <div class="sw" id="sw" role="feed" aria-label="넘겨보기" aria-busy="true"><div class="sw-card"><div class="sw-frame"><div class="sw-load">불러오는 중…</div></div></div></div>`;
  $('#swBack').onclick = () => go(S.lastHash && !S.lastHash.startsWith('#/shorts') ? S.lastHash.slice(1) : '/');
  try {
    if (v.id && !sh.queue.some((p) => p.id === v.id)) {
      const p = await api.getPost(v.id);
      if (p && !p.blockedAuthor) { S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)); sh.queue.unshift(S.cache.get(p.id)); sh.i = 0; }
    } else if (v.id) sh.i = sh.queue.findIndex((p) => p.id === v.id);
    if (sh.queue.length < 3) await loadMore();
  } catch (e) { console.error(e); }
  if (S.view !== v) return;
  if (!sh.queue.length) { $('#sw').innerHTML = '<div class="sw-card"><div class="sw-frame"><div class="sw-load">볼 글이 아직 없어요.</div></div></div>'; return; }
  drawCards(0);
  const start = Math.min(sh.i, sh.queue.length - 1);
  requestAnimationFrame(() => { $('#sw')?.children[start]?.scrollIntoView({ block: 'start' }); });
}

async function loadMore() {
  const sh = S.shorts; if (sh.done || sh.loading) return; sh.loading = true;
  try {
    const r = await api.listPosts({ sort: 'rec', clang: S.prefs.clang, offset: sh.offset, limit: PAGE, seen: sh.seen, seed: REC_SEED });
    sh.offset += r.posts.length; sh.done = !r.hasMore;
    const known = new Set(sh.queue.map((p) => p.id)), fresh = r.posts.filter((p) => !known.has(p.id));
    fresh.forEach((p) => { S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)); if (p.community) remember(p.community); });
    await loadMyVotes(fresh.map((p) => p.id));
    sh.queue.push(...fresh.map((p) => S.cache.get(p.id)));
    primeCodes(fresh.filter((p) => p.kind === 'html').map((p) => p.id)); // one request for the whole page's apps
  } finally { sh.loading = false; }
}

// renders cards from index `from` on (appending), and watches which one is on screen
function drawCards(from) {
  const sw = $('#sw'); if (!sw) return;
  if (from === 0) sw.innerHTML = '';
  sw.insertAdjacentHTML('beforeend', S.shorts.queue.slice(from).map((p, k) => card(p, from + k)).join(''));
  sw.removeAttribute('aria-busy');
  io ??= new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(+e.target.dataset.i); }), { root: sw, threshold: 0.5 });
  [...sw.children].slice(from).forEach((c) => io.observe(c));
  if (from === 0) { sw.onclick = onClick; sw.addEventListener('scroll', hideHint, { passive: true, once: true }); }
}

function card(p, i) {
  const grad = gradFor(p.community?.slug || p.id);
  let media;
  if (p.kind === 'html') media = `<div class="sw-media sw-app" style="--cv:${grad}"><div class="sw-ph">${icon('play')}</div></div>
      <div class="sw-shield" data-play="${i}" role="button" aria-label="플레이하기"></div><div class="sw-play" aria-hidden="true">${icon('play')}<span>탭해서 플레이</span></div>
      <button class="sw-done" data-stop="${i}">✕ 그만하기</button>`;
  else if (p.kind === 'image' && safeImgs(p.images).length) {
    const imgs = safeImgs(p.images);
    media = `<div class="sw-media sw-gal">${imgs.map((u) => `<img src="${esc(u)}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div>${imgs.length > 1 ? `<div class="sw-dots" aria-hidden="true">${imgs.map(() => '<i></i>').join('')}</div>` : ''}`;
  } else {
    const body = p.kind === 'code' ? p.codeHead || p.excerpt : p.excerpt;
    media = `<div class="sw-media sw-text${p.kind === 'code' ? ' code' : ''}" style="--cv:${grad}">${p.kind === 'link' && safeUrl(p.url) ? `<a class="sw-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${icon('link')}<span>${esc(domain(p.url))} ↗</span></a>` : ''}
      <div class="q" data-ugc>${esc((body || p.title).slice(0, 700))}</div></div>`;
  }
  return `<article class="sw-card k-${esc(p.kind)}" data-i="${i}" data-id="${p.id}" aria-label="${esc(p.title)}"><div class="sw-frame">
    ${media}
    ${i === 0 && !hintSeen() ? '<div class="sw-hint" aria-hidden="true">↑ 위로 넘기면 다음 글</div>' : ''}
    <div class="sw-cap"><div class="sw-meta">${p.community ? `<a class="sw-chip" href="#/c/${esc(p.community.slug)}">${esc(p.community.name)}</a>` : ''}<span class="sw-chip ghost">${esc(KINDS[p.kind]?.[0] || '')}</span>${p.tool ? `<span class="sw-chip ghost" data-ugc>${esc(p.tool)}</span>` : ''}<span class="sw-ago">${ago(p.createdAt)}</span>${p.recReason && REC_REASONS[p.recReason] && p.recReason !== 'explore' ? `<span class="sw-why">${REC_REASONS[p.recReason]}</span>` : ''}</div>
      <h2 data-ugc><a href="#/p/${p.id}">${esc(p.title)}</a></h2>${(p.kind === 'html' || p.kind === 'image') && p.excerpt ? `<p data-ugc>${esc(p.excerpt.slice(0, 160))}</p>` : ''}
      <button class="sw-read" data-read="${i}">전체 읽기</button></div>
    <div class="sw-rail">${voteBox('p', p.id)}
      <a class="sw-b" href="#/p/${p.id}" aria-label="의견 ${p.comments}">${icon('comment')}<small>${p.comments}</small></a>
      <button class="sw-b" data-act="save" data-id="${p.id}" aria-label="저장">${icon(S.saves.has(p.id) ? 'bookmarked' : 'bookmark')}<small data-save-label="${p.id}">${S.saves.has(p.id) ? '저장됨' : '저장'}</small></button>
      <button class="sw-b" data-act="share" data-id="${p.id}" data-title="${esc(p.title)}" aria-label="공유">${icon('share')}<small>공유</small></button></div>
  </div></article>`;
}

function setActive(i) {
  const sh = S.shorts, sw = $('#sw'); if (!sw || S.view.name !== 'shorts') return;
  if (sh.i === i && sw.children[i]?.querySelector('.sw-app iframe')) return; // already set up
  sh.i = i;
  // the card on screen and the next one keep a live app (the next one starts early, so
  // swiping to it is instant); every other app is removed to stop its sound and CPU use
  [...sw.children].forEach((c) => { const j = +c.dataset.i; if (j !== i) { if (c.classList.contains('playing')) stopPlay(c, true); if (j !== i + 1) unmountApp(c); } });
  const c = sw.children[i]; if (c?.classList.contains('k-html')) mountApp(c, i);
  const n1 = sw.children[i + 1]; if (n1?.classList.contains('k-html')) mountApp(n1, i + 1);
  // warm up what comes after: images of the next two cards, code of the app after that
  for (const p of sh.queue.slice(i + 1, i + 3)) if (p.kind === 'image') safeImgs(p.images).slice(0, 2).forEach((u) => { const im = new Image(); im.decoding = 'async'; im.src = u; });
  const n2 = sh.queue[i + 2]; if (n2?.kind === 'html') getCode(n2.id);
  clearTimeout(dwell); const id = sh.queue[i]?.id;
  dwell = setTimeout(() => { if (S.shorts?.queue[S.shorts.i]?.id === id) countView('p/' + id); }, 1200);
  if (i >= sh.queue.length - 8 && !sh.done) { const n = sh.queue.length; loadMore().then(() => { if (S.view.name === 'shorts' && sh.queue.length > n) drawCards(n); }); }
}

async function mountApp(c, i) {
  const box = c.querySelector('.sw-app'); if (!box || box.querySelector('iframe')) return;
  const id = c.dataset.id, code = await getCode(id);
  // still wanted? (the card on screen or the one right after it)
  if (!c.isConnected || (S.shorts.i !== i && S.shorts.i + 1 !== i) || box.querySelector('iframe')) return;
  if (!code) { box.querySelector('.sw-ph').textContent = '미리보기를 불러오지 못했어요'; return; }
  const f = sandboxFrame(code, S.cache.get(id)?.title || '실행물');
  f.inert = true; f.tabIndex = -1; // preview: watch only, so swipes and keys stay with the feed
  box.append(f);
}
function unmountApp(c) { c.querySelector('.sw-app iframe')?.remove(); }

function startPlay(c) {
  const f = c.querySelector('.sw-app iframe'); if (!f) { toast('불러오는 중이에요. 잠시 후 다시 눌러 주세요'); return; }
  c.classList.add('playing'); $('#sw').classList.add('locked');
  f.inert = false; f.tabIndex = 0; f.focus();
}
function stopPlay(c, quiet) {
  c.classList.remove('playing'); $('#sw')?.classList.remove('locked');
  const f = c.querySelector('.sw-app iframe'); if (f) { f.inert = true; f.tabIndex = -1; }
  if (!quiet && !(S.votes.p[c.dataset.id])) toast('어땠어요? 오른쪽 ▲보석 / ▼슬롭으로 판정해 주세요');
}

// "Read all": the full text (and code or prompt) in a panel over the card. The panel
// scrolls by itself and swiping waits until it is closed.
async function openSheet(c) {
  if (c.querySelector('.sw-sheet')) return;
  const id = c.dataset.id, p = S.cache.get(id) || {};
  c.querySelector('.sw-frame').insertAdjacentHTML('beforeend', `<div class="sw-sheet" role="dialog" aria-label="전체 읽기"><div class="sw-sheet-h"><b data-ugc>${esc(p.title || '')}</b><button class="sw-sheet-x" data-unread="1">✕ 닫기</button></div><div class="sw-sheet-b"><p class="muted">불러오는 중…</p></div></div>`);
  c.classList.add('reading'); $('#sw').classList.add('locked');
  const box = c.querySelector('.sw-sheet-b');
  try {
    const full = await api.getPost(id), code = full?.kind === 'code' ? await getCode(id) : '';
    if (!c.querySelector('.sw-sheet')) return;
    if (!full) { box.innerHTML = '<p class="muted">글을 불러오지 못했어요.</p>'; return; }
    box.innerHTML = `${full.kind === 'link' && safeUrl(full.url) ? `<a class="linkcard" href="${esc(full.url)}" target="_blank" rel="noopener noreferrer"><span class="d">${esc(domain(full.url))} ↗</span><span>${esc(full.url)}</span></a>` : ''}
      ${full.body ? `<div class="md" data-ugc>${md(full.body)}</div>` : ''}
      ${code ? `<pre class="code" data-ugc>${esc(code)}</pre>` : ''}
      ${full.prompt ? `<h3>사용한 프롬프트</h3><pre class="code" data-ugc>${esc(full.prompt)}</pre>` : ''}
      ${!full.body && !code && !full.prompt ? '<p class="muted">더 볼 내용이 없어요.</p>' : ''}
      <p><a class="btn sm" href="#/p/${id}">글 페이지에서 의견 보기</a></p>`;
  } catch { box.innerHTML = '<p class="muted">글을 불러오지 못했어요.</p>'; }
}
function closeSheet(c) {
  if (!c?.querySelector('.sw-sheet')) return;
  c.querySelector('.sw-sheet').remove(); c.classList.remove('reading'); $('#sw')?.classList.remove('locked');
}

function onClick(e) {
  const play = e.target.closest('[data-play]'), stop = e.target.closest('[data-stop]');
  const read = e.target.closest('[data-read]'), unread = e.target.closest('[data-unread]');
  if (read) { e.preventDefault(); openSheet(read.closest('.sw-card')); return; }
  if (unread) { e.preventDefault(); closeSheet(unread.closest('.sw-card')); return; }
  if (play) { e.preventDefault(); startPlay(play.closest('.sw-card')); }
  else if (stop) { e.preventDefault(); stopPlay(stop.closest('.sw-card')); }
}

function onKey(e) {
  if (S.view.name !== 'shorts' || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  const sw = $('#sw'); if (!sw) return; const c = sw.children[S.shorts.i];
  if (c?.classList.contains('playing')) { if (e.key === 'Escape') stopPlay(c); return; }
  if (c?.classList.contains('reading')) { if (e.key === 'Escape') closeSheet(c); return; }
  const step = { ArrowDown: 1, PageDown: 1, j: 1, ArrowUp: -1, PageUp: -1, k: -1 }[e.key];
  if (step) { e.preventDefault(); sw.children[Math.max(0, Math.min(sw.children.length - 1, S.shorts.i + step))]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if ((e.key === 'Enter' || e.key === ' ') && c?.classList.contains('k-html')) { e.preventDefault(); startPlay(c); }
  else if (e.key === 'Escape') $('#swBack')?.click();
}

const hintSeen = () => { try { return !!localStorage.getItem('slop-sw-hint'); } catch { return true; } };
function hideHint() { try { localStorage.setItem('slop-sw-hint', '1'); } catch { /* */ } document.querySelector('.sw-hint')?.remove(); }
