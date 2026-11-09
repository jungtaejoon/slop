import { api, S, $, app, KINDS, voteBox, who, sandboxFrame, savePrefs, loadMyVotes, canWrite, isCommunityMod, followIds, remember, commBySlug, commLink, followBtn } from '../core.js';
import { md } from '../text.js';
import { esc, safeUrl, domain, ago } from '../text.js';

const PAGE = 30;
let feedToken = 0;


export async function renderFeed() {
  const v = S.view, my = ++feedToken;
  let c = null;
  if (v.slug) {
    c = commBySlug(v.slug);
    if (!c) { app.innerHTML = '<div class="skel" style="height:140px"></div>'; try { c = remember(await api.getCommunity(v.slug)); } catch { /* shown below */ } if (my !== feedToken) return; }
    if (!c) { app.innerHTML = `<div class="empty"><h2>"${esc(v.slug)}" 커뮤니티가 없어요</h2><p class="muted">주소를 확인하거나, 직접 만들어 보세요.</p><a class="btn pri" href="#/communities/new">커뮤니티 만들기</a> <a class="btn" href="#/communities">커뮤니티 찾기</a></div>`; return; }
    v.communityId = c.id; document.title = `${c.name} · Slop Lab`;
  }
  // home falls back to popular for visitors and members who follow nothing
  const homeFallback = v.special === 'home' && (!api.me || !followIds().length);
  const title = c ? c.name : v.special === 'home' ? (homeFallback ? '인기 글' : '홈') : v.special === 'popular' ? '인기' : v.special === 'gems' ? '보석함' : '저장함';
  const sub = c ? `c/${c.slug}` : v.special === 'home' ? (homeFallback ? (api.me ? '아직 팔로우한 커뮤니티가 없어서 전체 인기 글을 보여 드려요. 마음에 드는 커뮤니티를 팔로우해 보세요.' : '로그인하고 커뮤니티를 팔로우하면 여기에 내 피드가 모여요.') : '내가 팔로우한 커뮤니티의 글이에요.')
    : v.special === 'popular' ? '모든 커뮤니티의 글이에요. 새 커뮤니티를 발견하는 곳이에요.'
    : v.special === 'gems' ? '커뮤니티가 보석으로 판정한 글이에요. 보석 3표 이상, 보석 비율 75% 이상이면 여기에 모여요.' : '내가 저장한 글이에요. 나에게만 보여요.';
  const sorts = [['hot', '인기'], ['new', '최신'], ['top', '최고'], ['contro', '논쟁 중'], ['pending', '판정 대기']];
  const F = S.filters || {};
  let welcomeOff = false; try { welcomeOff = !!localStorage.getItem('slop-welcome-off'); } catch { /* */ }
  const welcome = !api.me && !welcomeOff && !c ? `<section class="welcome" id="welcome"><div><h2>AI가 만든 것, 그냥 넘기지 마세요</h2>
      <p>사람들은 AI 결과물을 쉽게 "슬롭"이라고 부르지만, 그 안에도 쓸모 있고 재미있는 게 숨어 있어요. 여기서 같이 캐내요.</p>
      <ol><li><b>둘러보고 써 봐요.</b> 실행물은 그 자리에서 바로 돌아가요.</li><li><b>▲보석 / ▼슬롭으로 판정해요.</b> 이유를 댓글로 남기면 더 좋아요.</li><li><b>내가 만든 것도 올려요.</b> 판정과 의견을 받아 다음 버전으로 키워요.</li></ol>
      <div class="row"><a class="btn pri" href="#/judge">지금 하나 판정해 보기</a><a class="btn" href="#/login">가입하기</a><a class="btn" href="#/communities">커뮤니티 둘러보기</a><button class="btn ghost" id="welcomeOff">닫기</button></div></div></section>` : '';
  app.innerHTML = `${welcome}<div class="layout"><div style="min-width:0">
    <div class="fhead"><div><h1>${esc(title)}</h1><p${c ? ' class="mono"' : ''}>${esc(sub)}</p>${c?.description ? `<p>${esc(c.description)}</p>` : ''}</div>
      <div class="row">${c ? followBtn(c) : ''}${v.special === 'gems' ? '<button class="btn" data-act="sharebest">이번 주 보석 공유</button>' : ''}${v.special !== 'saved' ? `<a class="btn${c ? '' : ' pri'}" href="#/submit${c ? '/' + esc(c.slug) : ''}">글쓰기</a>` : ''}</div></div>
    ${v.special === 'gems' ? '' : `<div class="sortbar"><div class="seg" role="group" aria-label="정렬">${sorts.map(([k, l]) => `<button data-sort="${k}" aria-pressed="${S.prefs.sort === k}">${l}</button>`).join('')}</div>
      ${S.prefs.sort === 'top' ? `<select class="inline" id="win" aria-label="기간">${[['day', '오늘'], ['week', '이번 주'], ['month', '이번 달'], ['all', '전체 기간']].map(([k, l]) => `<option value="${k}"${S.prefs.win === k ? ' selected' : ''}>${l}</option>`).join('')}</select>` : ''}
      <span class="sp"></span><div class="seg" role="group" aria-label="보기">${[['card', '카드'], ['compact', '목록']].map(([k, l]) => `<button data-layout="${k}" aria-pressed="${S.prefs.layout === k}">${l}</button>`).join('')}</div></div>`}
    ${S.q || F.tool || F.tag ? `<div class="filters">${S.q ? `<button class="fchip" data-clear="q">검색: ${esc(S.q)} ✕</button>` : ''}${F.tool ? `<button class="fchip" data-clear="tool">도구: ${esc(F.tool)} ✕</button>` : ''}${F.tag ? `<button class="fchip" data-clear="tag">#${esc(F.tag)} ✕</button>` : ''}</div>` : ''}
    <div id="feedBody"><div class="list">${'<div class="skel"></div>'.repeat(3)}</div></div></div><aside class="side" id="side"></aside></div>`;
  const wo = $('#welcomeOff'); if (wo) wo.onclick = () => { try { localStorage.setItem('slop-welcome-off', '1'); } catch { /* */ } $('#welcome')?.remove(); };
  app.querySelectorAll('[data-sort]').forEach((b) => (b.onclick = () => { S.prefs.sort = b.dataset.sort; savePrefs(); renderFeed(); }));
  app.querySelectorAll('[data-layout]').forEach((b) => (b.onclick = () => { S.prefs.layout = b.dataset.layout; savePrefs(); drawList(); }));
  app.querySelectorAll('[data-clear]').forEach((b) => (b.onclick = () => { const k = b.dataset.clear; if (k === 'q') { S.q = ''; $('#gq').value = ''; } else S.filters = { ...S.filters, [k]: null }; renderFeed(); }));
  const w = $('#win'); if (w) w.onchange = () => { S.prefs.win = w.value; savePrefs(); renderFeed(); };
  renderSide(c);
  S.feed = { posts: [], hasMore: false, loading: true, homeFallback };
  await loadPage(my);
}

async function loadPage(my) {
  const v = S.view, F = S.filters || {};
  try {
    const special = S.feed.homeFallback ? null : v.special;
    const r = await api.listPosts({ communityId: v.communityId, special, followIds: followIds(), sort: S.prefs.sort, win: S.prefs.win, q: S.q, tool: F.tool, tag: F.tag, offset: S.feed.posts.length, limit: PAGE });
    if (my !== feedToken) return;
    r.posts.forEach((p) => { S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)); if (p.community) remember(p.community); });
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
      : v.special === 'home' ? '<div class="empty"><h2>팔로우한 커뮤니티에 아직 글이 없어요</h2><p class="muted">다른 커뮤니티도 둘러보세요.</p><a class="btn" href="#/communities">커뮤니티 찾기</a> <a class="btn" href="#/popular">인기 글 보기</a></div>'
      : `<div class="empty"><h2>아직 글이 없어요</h2><p class="muted">첫 글을 올려 보세요. 사용한 도구와 프롬프트를 함께 적으면 다른 사람이 재현하고 판정하기 쉬워요.</p>${canWrite() ? `<a class="btn pri" href="#/submit${v.slug ? '/' + esc(v.slug) : ''}">첫 글 올리기</a>` : ''}</div>`;
    return;
  }
  el.innerHTML = `<div class="list ${S.prefs.layout === 'compact' ? 'compact' : ''}">${f.posts.map(postRow).join('')}</div>
    ${f.hasMore ? '<div class="more"><button class="btn" id="moreBtn">더 보기</button></div>' : ''}`;
  const mb = $('#moreBtn'); if (mb) mb.onclick = () => { mb.disabled = true; mb.textContent = '불러오는 중…'; loadPage(feedToken); };
  setupPreviews(el);
}

export function postRow(p) {
  const compact = S.prefs.layout === 'compact', fresh = Date.now() - p.createdAt < 864e5;
  const showExcerpt = !compact && p.excerpt && (p.kind === 'text' || p.kind === 'link' || p.kind === 'code');
  return `<article class="post">${voteBox('p', p.id)}<div style="min-width:0">
    <div class="pmeta">${p.pinned ? '<span class="pill pin">고정</span>' : ''}${p.hidden ? '<span class="pill warn">숨김</span>' : ''}${p.locked ? '<span class="pill">잠김</span>' : ''}
      ${commLink(p.community)}<span class="pill">${esc(KINDS[p.kind]?.[0] || '')}</span>
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

async function renderSide(c) {
  const el = $('#side'); if (!el) return; const v = S.view, F = S.filters || {};
  const draw = (st, ps, mods) => {
    el.innerHTML = (c ? `<section class="panel"><h2>${esc(c.name)}</h2><p class="mono">c/${esc(c.slug)}</p>${c.description ? `<p>${esc(c.description)}</p>` : ''}
        <div class="statrow"><div><b data-members="${c.id}">${c.members}</b><span>팔로워</span></div><div><b>${st ? st.posts : c.posts}</b><span>글</span></div><div><b>${st ? st.gems : '–'}</b><span>보석</span></div></div>
        <div class="row">${followBtn(c, true)}${canWrite() ? `<a class="btn sm" href="#/submit/${esc(c.slug)}">글쓰기</a>` : ''}<button class="btn sm ghost" data-act="sharec" data-slug="${esc(c.slug)}" data-title="${esc(c.name)}">공유</button>${isCommunityMod(c.id) ? `<a class="btn sm ghost" href="#/c/${esc(c.slug)}/settings">커뮤니티 설정</a>` : ''}</div></section>
      ${c.rules ? `<section class="panel"><h2>규칙</h2><div class="md" style="font-size:13.5px">${md(c.rules)}</div></section>` : ''}
      ${mods?.length ? `<section class="panel"><h2>운영자</h2><div class="chips" style="flex-direction:column;align-items:flex-start;gap:6px">${mods.map((m) => who(m)).join('')}</div></section>` : ''}`
      : `<section class="panel"><h2>Slop Lab</h2><p>AI가 만든 결과물을 그냥 넘기지 말고, 써 보고, 판정하고, 이유를 남기는 커뮤니티예요. 주제별 커뮤니티를 팔로우하고, 없으면 직접 만들어요.</p>
        <div class="statrow"><div><b>${st ? st.posts : '–'}</b><span>글</span></div><div><b>${st ? st.gems : '–'}</b><span>보석</span></div>${ps ? `<div><b>${ps.karma}</b><span>내 판정 점수</span></div>` : ''}</div>
        <a class="btn gem block" href="#/judge" style="margin-bottom:8px">판정하기: 한 장씩 넘기며 판정</a>
      ${canWrite() ? '<div class="row"><a class="btn pri sm" href="#/submit">글쓰기</a><a class="btn sm" href="#/communities/new">커뮤니티 만들기</a></div>' : !api.me ? '<a class="btn block" href="#/login">로그인하고 참여하기</a>' : ''}</section>`)
    + `<section class="panel"><h2>판정 기준</h2><ul><li><b style="color:var(--gem)">▲ 보석</b>: 쓸모 있거나, 재미있거나, 영감을 줘요.</li><li><b style="color:var(--slop)">▼ 슬롭</b>: 시간이 아까웠어요.</li>
      <li>"가치 발견" 댓글로 어디가 좋은지 짚어 주면 다른 사람이 찾는 데 큰 도움이 돼요.</li><li>AI가 만들었다는 이유만으로 내리지 말아 주세요.</li><li>스팸, 악성 코드, 괴롭힘, 개인정보 노출은 "신고"해 주세요.</li></ul></section>
    ${st?.tools?.length ? `<section class="panel"><h2>만든 도구</h2><div class="chips">${st.tools.map((t) => `<button class="chip" data-act="tool" data-v="${esc(t.name)}" aria-pressed="${F.tool === t.name}">${esc(t.name)}<span class="mono">${t.n}</span></button>`).join('')}</div></section>` : ''}
    ${st?.tags?.length ? `<section class="panel"><h2>많이 쓰인 태그</h2><div class="chips">${st.tags.map((t) => `<button class="chip" data-act="tag" data-v="${esc(t.name)}" aria-pressed="${F.tag === t.name}">#${esc(t.name)}<span class="mono">${t.n}</span></button>`).join('')}</div></section>` : ''}
    ${!c ? '<section class="panel" id="discover"></section>' : ''}`;
  };
  draw(null, null, null);
  const [st, ps, mods, top] = await Promise.all([api.boardStats(c?.id).catch(() => null), !c && api.me ? api.profileStats(api.me.id).catch(() => null) : null,
    c ? api.communityMods(c.id).catch(() => []) : null, !c ? api.listCommunities({ limit: 8 }).catch(() => []) : null]);
  if (S.view !== v) return;
  draw(st, ps, mods);
  const d = $('#discover');
  if (d && top?.length) { top.forEach(remember); d.innerHTML = `<h2>인기 커뮤니티</h2><div style="display:flex;flex-direction:column;gap:8px">${top.map((x) => `<div class="row" style="flex-wrap:nowrap"><a href="#/c/${esc(x.slug)}" style="flex:1;min-width:0;text-decoration:none"><b>${esc(x.name)}</b><div class="hint"><span data-members="${x.id}">${x.members}</span>명 팔로우 · 글 ${x.posts}</div></a>${followBtn(x, true)}</div>`).join('')}</div><a class="btn sm ghost" href="#/communities" style="margin-top:8px">전체 보기</a>`; }
  else if (d) d.remove();
}
