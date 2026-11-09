import { api, S, $, app, CAT, KINDS, voteBox, who, sandboxFrame, savePrefs, loadMyVotes, canWrite, isMod } from '../core.js';
import { esc, safeUrl, domain, ago } from '../text.js';

const PAGE = 30;
let feedToken = 0;

const filtersKey = () => JSON.stringify([S.view.cat, S.view.special, S.view.authorId, S.prefs.sort, S.prefs.win, S.q, S.filters?.tool, S.filters?.tag]);

export async function renderFeed() {
  const v = S.view, c = v.cat ? CAT[v.cat] : null, my = ++feedToken;
  const title = v.special === 'gems' ? '보석함' : v.special === 'saved' ? '저장함' : c ? c.l : '전체 게시판';
  const sub = v.special === 'gems' ? '커뮤니티가 보석으로 판정한 글이에요. 보석 3표 이상, 보석 비율 75% 이상이면 여기에 모여요.'
    : v.special === 'saved' ? '내가 저장한 글이에요. 나에게만 보여요.' : c ? c.d : 'AI가 만든 모든 것. 직접 보고 ▲보석 / ▼슬롭으로 판정하고, 이유를 댓글로 남겨 주세요.';
  const sorts = [['hot', '인기'], ['new', '최신'], ['top', '최고'], ['contro', '논쟁 중'], ['pending', '판정 대기']];
  const F = S.filters || {};
  app.innerHTML = `<div class="layout"><div style="min-width:0">
    <div class="fhead"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${v.special !== 'saved' ? `<a class="btn pri" href="#/submit${v.cat ? '/' + v.cat : ''}">${c ? esc(c.l) + '에 ' : ''}글쓰기</a>` : ''}</div>
    ${v.special === 'gems' ? '' : `<div class="sortbar"><div class="seg" role="group" aria-label="정렬">${sorts.map(([k, l]) => `<button data-sort="${k}" aria-pressed="${S.prefs.sort === k}">${l}</button>`).join('')}</div>
      ${S.prefs.sort === 'top' ? `<select class="inline" id="win" aria-label="기간">${[['day', '오늘'], ['week', '이번 주'], ['month', '이번 달'], ['all', '전체 기간']].map(([k, l]) => `<option value="${k}"${S.prefs.win === k ? ' selected' : ''}>${l}</option>`).join('')}</select>` : ''}
      <span class="sp"></span><div class="seg" role="group" aria-label="보기">${[['card', '카드'], ['compact', '목록']].map(([k, l]) => `<button data-layout="${k}" aria-pressed="${S.prefs.layout === k}">${l}</button>`).join('')}</div></div>`}
    ${S.q || F.tool || F.tag ? `<div class="filters">${S.q ? `<button class="fchip" data-clear="q">검색: ${esc(S.q)} ✕</button>` : ''}${F.tool ? `<button class="fchip" data-clear="tool">도구: ${esc(F.tool)} ✕</button>` : ''}${F.tag ? `<button class="fchip" data-clear="tag">#${esc(F.tag)} ✕</button>` : ''}</div>` : ''}
    <div id="feedBody"><div class="list">${'<div class="skel"></div>'.repeat(3)}</div></div></div><aside class="side" id="side"></aside></div>`;
  app.querySelectorAll('[data-sort]').forEach((b) => (b.onclick = () => { S.prefs.sort = b.dataset.sort; savePrefs(); renderFeed(); }));
  app.querySelectorAll('[data-layout]').forEach((b) => (b.onclick = () => { S.prefs.layout = b.dataset.layout; savePrefs(); drawList(); }));
  app.querySelectorAll('[data-clear]').forEach((b) => (b.onclick = () => { const k = b.dataset.clear; if (k === 'q') { S.q = ''; $('#gq').value = ''; } else S.filters = { ...S.filters, [k]: null }; renderFeed(); }));
  const w = $('#win'); if (w) w.onchange = () => { S.prefs.win = w.value; savePrefs(); renderFeed(); };
  renderSide();
  S.feed = { key: filtersKey(), posts: [], hasMore: false, loading: true };
  await loadPage(my);
}

async function loadPage(my) {
  const v = S.view, F = S.filters || {};
  try {
    const r = await api.listPosts({ cat: v.cat, special: v.special, sort: S.prefs.sort, win: S.prefs.win, q: S.q, tool: F.tool, tag: F.tag, offset: S.feed.posts.length, limit: PAGE });
    if (my !== feedToken) return;
    r.posts.forEach((p) => S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)));
    await loadMyVotes(r.posts.map((p) => p.id));
    if (my !== feedToken) return;
    S.feed.posts.push(...r.posts.map((p) => S.cache.get(p.id))); S.feed.hasMore = r.hasMore; S.feed.loading = false; S.feed.error = null;
  } catch (e) { console.error(e); if (my !== feedToken) return; S.feed.loading = false; S.feed.error = e; }
  drawList();
}

function drawList() {
  const el = $('#feedBody'); if (!el) return; const f = S.feed, v = S.view;
  app.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(S.prefs.layout === b.dataset.layout)));
  if (f.error) { el.innerHTML = `<div class="banner warnb">글을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</div>`; return; }
  if (!f.posts.length) {
    el.innerHTML = S.q || S.filters?.tool || S.filters?.tag ? '<div class="banner">조건에 맞는 글이 없어요.</div>'
      : v.special === 'gems' ? '<div class="empty"><h2>아직 보석으로 판정된 글이 없어요</h2><p class="muted">"판정 대기" 탭에서 아직 아무도 판정하지 않은 글을 골라 ▲/▼를 눌러 주세요.</p><a class="btn" href="#/">판정하러 가기</a></div>'
      : v.special === 'saved' ? '<div class="banner">저장한 글이 없어요. 글 아래의 "저장"을 누르면 여기에 모여요.</div>'
      : S.prefs.sort === 'contro' ? '<div class="banner">의견이 갈리는 글이 아직 없어요.</div>'
      : S.prefs.sort === 'pending' ? '<div class="banner">판정을 기다리는 글이 없어요. 모두 5표 이상 받았어요.</div>'
      : `<div class="empty"><h2>이 게시판은 아직 비어 있어요</h2><p class="muted">첫 글을 올려 보세요. 사용한 도구와 프롬프트를 함께 적으면 다른 사람이 재현하고 판정하기 쉬워요.</p>${canWrite() ? `<a class="btn pri" href="#/submit${v.cat ? '/' + v.cat : ''}">첫 글 올리기</a>` : ''}</div>`;
    return;
  }
  el.innerHTML = `<div class="list ${S.prefs.layout === 'compact' ? 'compact' : ''}">${f.posts.map(postRow).join('')}</div>
    ${f.hasMore ? '<div class="more"><button class="btn" id="moreBtn">더 보기</button></div>' : ''}`;
  const mb = $('#moreBtn'); if (mb) mb.onclick = () => { mb.disabled = true; mb.textContent = '불러오는 중…'; loadPage(feedToken); };
  setupPreviews(el);
}

export function postRow(p) {
  const compact = S.prefs.layout === 'compact', c = CAT[p.cat], fresh = Date.now() - p.createdAt < 864e5;
  const showExcerpt = !compact && p.excerpt && (p.kind === 'text' || p.kind === 'link' || p.kind === 'code');
  return `<article class="post">${voteBox('p', p.id)}<div style="min-width:0">
    <div class="pmeta">${p.pinned ? '<span class="pill pin">고정</span>' : ''}${p.hidden ? '<span class="pill warn">숨김</span>' : ''}${p.locked ? '<span class="pill">잠김</span>' : ''}
      <a class="cat" href="#/c/${p.cat}">${esc(c?.l || '기타')}</a><span class="pill">${esc(KINDS[p.kind]?.[0] || '')}</span>
      ${p.tool ? `<button class="pill tool" data-act="tool" data-v="${esc(p.tool)}">${esc(p.tool)}</button>` : ''}
      <span class="pill gem" data-gembadge="${p.id}"${p.isGem ? '' : ' hidden'}>보석</span>${p.isExample ? '<span class="pill ex">예시</span>' : ''}${fresh && !p.isExample ? '<span class="pill new">NEW</span>' : ''}${p.remixOf ? '<span class="pill">리믹스</span>' : ''}
      ${who(p.author, p.isExample)}<span>${ago(p.createdAt)}</span>${p.version > 1 ? `<span>수정 v${p.version}</span>` : ''}</div>
    <a class="ptitle" href="#/p/${p.id}">${esc(p.title)}</a>
    ${compact ? '' : previewHtml(p)}${showExcerpt ? `<div class="excerpt">${esc(p.excerpt)}</div>` : ''}
    <div class="pact"><a class="btn ghost" href="#/p/${p.id}">의견 ${p.comments}</a><button class="btn ghost" data-act="save" data-id="${p.id}">${S.saves.has(p.id) ? '저장됨' : '저장'}</button>
      <button class="btn ghost" data-act="share" data-id="${p.id}" data-title="${esc(p.title)}">공유</button>
      ${(p.tags || []).slice(0, 4).map((t) => `<button class="btn ghost" data-act="tag" data-v="${esc(t)}">#${esc(t)}</button>`).join('')}</div></div>
    ${compact ? thumbHtml(p) : ''}</article>`;
}

function previewHtml(p) {
  if (p.kind === 'image' && p.images.length > 1) return `<a class="prev gallery3" href="#/p/${p.id}">${p.images.slice(0, 3).map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</a>`;
  if (p.kind === 'image' && p.images.length) return `<a class="prev" href="#/p/${p.id}"><img src="${esc(p.images[0])}" alt="" loading="lazy"></a>`;
  if (p.kind === 'html') return `<a class="prev frame" href="#/p/${p.id}" data-frame="${p.id}"><span class="ph">미리보기 준비 중…</span><span class="playhint">눌러서 실행</span></a>`;
  if (p.kind === 'link' && safeUrl(p.url)) return `<a class="prev linkp" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><span class="d">${esc(domain(p.url))}</span><span class="muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.url)}</span><span>↗</span></a>`;
  if (p.kind === 'code' && p.codeHead) return `<a class="prev codep" href="#/p/${p.id}"><pre>${esc(p.codeHead)}</pre></a>`;
  return '';
}
function thumbHtml(p) {
  if (p.kind === 'image' && p.images.length) return `<a class="thumb" href="#/p/${p.id}"><img src="${esc(p.images[0])}" alt="" loading="lazy"></a>`;
  return `<a class="thumb" href="#/p/${p.id}">${{ text: '글', link: esc(domain(p.url).slice(0, 10)) || '링크', html: '실행', code: '&lt;/&gt;' }[p.kind] || ''}</a>`;
}

const codeCache = new Map();
export const getCode = (id) => { if (!codeCache.has(id)) codeCache.set(id, api.getPostCode(id).catch(() => { codeCache.delete(id); return ''; })); return codeCache.get(id); };
let io;
function setupPreviews(root) {
  io?.disconnect();
  io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); loadPreview(e.target); } }), { rootMargin: '200px' });
  root.querySelectorAll('[data-frame]').forEach((el) => io.observe(el));
}
async function loadPreview(el) {
  const code = await getCode(el.dataset.frame), ph = el.querySelector('.ph');
  if (!code) { if (ph) ph.textContent = '미리보기를 불러오지 못했어요'; return; }
  const f = sandboxFrame(code, '미리보기'); f.tabIndex = -1; f.setAttribute('aria-hidden', 'true'); el.prepend(f); ph?.remove();
}

async function renderSide() {
  const el = $('#side'); if (!el) return; const v = S.view, c = v.cat ? CAT[v.cat] : null, F = S.filters || {};
  const draw = (st, ps) => {
    el.innerHTML = `<section class="panel"><h2>${esc(c ? c.l : 'Slop Lab')}</h2><p>${esc(c ? c.d : 'AI가 만든 결과물을 그냥 넘기지 말고, 써 보고, 판정하고, 이유를 남기는 커뮤니티예요.')}</p>
      <div class="statrow"><div><b>${st ? st.posts : '–'}</b><span>글</span></div><div><b>${st ? st.gems : '–'}</b><span>보석</span></div>${ps ? `<div><b>${ps.karma}</b><span>내 판정 점수</span></div>` : ''}</div>
      ${canWrite() ? `<a class="btn pri block" href="#/submit${v.cat ? '/' + v.cat : ''}">글쓰기</a>` : !api.me ? '<a class="btn block" href="#/login">로그인하고 참여하기</a>' : ''}</section>
    <section class="panel"><h2>판정 기준</h2><ul><li><b style="color:var(--gem)">▲ 보석</b>: 쓸모 있거나, 재미있거나, 영감을 줘요.</li><li><b style="color:var(--slop)">▼ 슬롭</b>: 시간이 아까웠어요.</li>
      <li>"가치 발견" 댓글로 어디가 좋은지 짚어 주면 다른 사람이 찾는 데 큰 도움이 돼요.</li><li>AI가 만들었다는 이유만으로 내리지 말아 주세요.</li><li>스팸, 악성 코드, 괴롭힘, 개인정보 노출은 "신고"해 주세요.</li></ul></section>
    ${st?.tools?.length ? `<section class="panel"><h2>만든 도구</h2><div class="chips">${st.tools.map((t) => `<button class="chip" data-act="tool" data-v="${esc(t.name)}" aria-pressed="${F.tool === t.name}">${esc(t.name)}<span class="mono">${t.n}</span></button>`).join('')}</div></section>` : ''}
    ${st?.tags?.length ? `<section class="panel"><h2>많이 쓰인 태그</h2><div class="chips">${st.tags.map((t) => `<button class="chip" data-act="tag" data-v="${esc(t.name)}" aria-pressed="${F.tag === t.name}">#${esc(t.name)}<span class="mono">${t.n}</span></button>`).join('')}</div></section>` : ''}
    ${isMod() ? '<section class="panel"><h2>운영</h2><p>신고 처리, 숨긴 항목, 작성 제한을 관리해요.</p><a class="btn block" href="#/mod">운영 화면 열기</a></section>' : ''}`;
  };
  draw(null, null);
  const [st, ps] = await Promise.all([api.boardStats(v.cat).catch(() => null), api.me ? api.profileStats(api.me.id).catch(() => null) : null]);
  if (S.view === v) draw(st, ps);
}
