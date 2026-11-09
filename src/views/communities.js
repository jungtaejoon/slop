// Community directory, create form and settings (moderators).
import { api, S, $, app, KINDS, canWrite, isCommunityMod, remember, commBySlug, followBtn, who, toast, errMsg, go, requireLogin } from '../core.js';
import { esc, ago } from '../text.js';
import { t as tr } from '../i18n.js'; // not `t`: draw() has a timer variable named t

let dirToken = 0;
export async function renderDirectory() {
  const my = ++dirToken, st = (S.dir ??= { q: '', sort: 'members' });
  app.innerHTML = `<div class="layout"><div style="min-width:0">
    <div class="fhead"><div><h1>커뮤니티 찾기</h1><p>관심 있는 주제를 팔로우하면 홈에 그 글들이 모여요. 원하는 주제가 없으면 직접 만들어요.</p></div>
      ${canWrite() ? '<a class="btn pri" href="#/communities/new">커뮤니티 만들기</a>' : ''}</div>
    <div class="sortbar"><input type="search" id="cq" placeholder="커뮤니티 이름이나 주제로 검색" value="${esc(st.q)}" style="flex:1;min-width:180px;border:0;background:none">
      <div class="seg" role="group" aria-label="정렬">${[['members', '팔로워 많은 순'], ['new', '새로 생긴 순']].map(([k, l]) => `<button data-csort="${k}" aria-pressed="${st.sort === k}">${l}</button>`).join('')}</div></div>
    <div id="dirBody"><div class="skel"></div></div></div>
    <aside class="side"><section class="panel"><h2>커뮤니티는 이렇게 돌아가요</h2><ul>
      <li>누구나 커뮤니티를 만들 수 있어요(하루 2개까지).</li><li>만든 사람이 운영자가 돼서 규칙을 정하고, 글을 고정하거나 숨길 수 있어요.</li>
      <li>팔로우한 커뮤니티의 글이 홈에 모여요. "인기"에서는 모든 커뮤니티 글을 볼 수 있어요.</li></ul></section></aside></div>`;
  const draw = async () => {
    const body = $('#dirBody'); body.innerHTML = '<div class="skel"></div>';
    let list = []; try { list = await api.listCommunities({ q: st.q, sort: st.sort, limit: 100 }); } catch (e) { console.error(e); }
    if (my !== dirToken) return;
    list.forEach(remember);
    body.innerHTML = list.length ? `<div class="list">${list.map((c) => `<article class="post" style="grid-template-columns:minmax(0,1fr) auto;padding:12px 14px;align-items:center">
        <a href="#/c/${esc(c.slug)}" style="text-decoration:none;min-width:0"><div class="ptitle" style="margin:0">${esc(tr(c.name))} <span class="mono muted" style="font-size:12px;font-weight:400">c/${esc(c.slug)}</span></div>
          ${c.description ? `<div class="excerpt" style="-webkit-line-clamp:2;margin:2px 0 4px">${esc(tr(c.description))}</div>` : ''}
          <div class="pmeta"><span><span data-members="${c.id}">${c.members}</span>명 팔로우</span><span>글 ${c.posts}</span><span>${c.isDefault ? '기본 커뮤니티' : ago(c.createdAt) + ' 생김'}</span>${isCommunityMod(c.id) ? '<span class="pill">운영 중</span>' : ''}</div></a>
        ${followBtn(c, true)}</article>`).join('')}</div>`
      : `<div class="empty"><h2>${st.q ? `"${esc(st.q)}"에 맞는 커뮤니티가 없어요` : '아직 커뮤니티가 없어요'}</h2><p class="muted">첫 번째로 만들어 보세요.</p>${canWrite() ? `<a class="btn pri" href="#/communities/new">커뮤니티 만들기</a>` : ''}</div>`;
  };
  let t; $('#cq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value.trim(); draw(); }, 250); };
  app.querySelectorAll('[data-csort]').forEach((b) => (b.onclick = () => { st.sort = b.dataset.csort; app.querySelectorAll('[data-csort]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
  draw();
}

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);

export async function renderCommunityForm(v) {
  const editing = !!v.slug;
  if (!editing && !requireLogin('커뮤니티를 만들려면 로그인해 주세요')) return;
  let c = null;
  if (editing) {
    c = commBySlug(v.slug) || remember(await api.getCommunity(v.slug).catch(() => null));
    if (!c) { app.innerHTML = '<div class="banner">커뮤니티를 찾을 수 없어요.</div>'; return; }
    if (!isCommunityMod(c.id)) { app.innerHTML = `<div class="banner">이 커뮤니티의 운영자만 설정을 바꿀 수 있어요. <a href="#/c/${esc(c.slug)}">돌아가기</a></div>`; return; }
  }
  const f = c || { name: '', slug: '', description: '', rules: '', defaultKind: 'text' };
  app.innerHTML = `<a class="crumb" href="${editing ? '#/c/' + esc(c.slug) : '#/communities'}">← 돌아가기</a><div class="compose"><form class="form" id="cf" novalidate>
    <h1>${editing ? `${esc(c.name)} 설정` : '커뮤니티 만들기'}</h1>
    <div class="field"><label for="cName">이름</label><input type="text" id="cName" maxlength="40" value="${esc(f.name)}" placeholder="예: AI 보드게임 연구소"></div>
    <div class="field"><label for="cSlug">주소</label><div class="row" style="flex-wrap:nowrap"><span class="mono muted">c/</span><input type="text" id="cSlug" maxlength="30" value="${esc(f.slug)}" placeholder="ai-boardgame" ${editing ? 'disabled' : ''} style="font-family:var(--f-mono)"></div>
      <span class="hint">${editing ? '주소는 만든 뒤에는 바꿀 수 없어요.' : '영문 소문자, 숫자, 하이픈(-)으로 2~30자. 만든 뒤에는 바꿀 수 없어요.'}</span></div>
    <div class="field"><label for="cDesc">한 줄 소개</label><textarea id="cDesc" rows="2" maxlength="300" placeholder="어떤 AI 결과물을 모으는 곳인가요?">${esc(f.description)}</textarea></div>
    <div class="field"><label for="cRules">규칙 (선택)</label><textarea id="cRules" rows="5" maxlength="2000" placeholder="- 사용한 도구와 프롬프트를 적어 주세요&#10;- 직접 만든 것만 올려 주세요">${esc(f.rules)}</textarea><span class="hint">목록(- )과 **굵게**를 쓸 수 있어요. 커뮤니티 옆에 항상 보여요.</span></div>
    <div class="field"><span class="flabel">글쓰기 기본 형식</span><div class="kinds" role="group">${Object.entries(KINDS).map(([k, [l, d]]) => `<button type="button" data-kind="${k}" aria-pressed="${f.defaultKind === k}">${l}<small>${d}</small></button>`).join('')}</div></div>
    <div class="row"><button class="btn pri" type="submit" id="cfBtn">${editing ? '저장' : '만들기'}</button><span class="hint" id="cfSt" role="status"></span></div>
  </form>
  <aside class="side">${editing ? '<section class="panel" id="modPanel"><h2>운영자</h2><div class="skel" style="height:60px"></div></section>' : `<section class="panel"><h2>만들기 전에</h2><ul><li>비슷한 커뮤니티가 이미 있는지 <a href="#/communities">찾아보세요</a>.</li><li>만든 사람이 운영자가 되고, 나중에 다른 운영자를 추가할 수 있어요.</li><li>하루에 두 개까지 만들 수 있어요.</li></ul></section>`}</aside></div>`;
  let kind = f.defaultKind, slugTouched = editing;
  app.querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => { kind = b.dataset.kind; app.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  $('#cSlug').oninput = () => (slugTouched = true);
  $('#cName').oninput = () => { if (!slugTouched) { const g = slugify($('#cName').value); if (g.length >= 2) $('#cSlug').value = g; } };
  $('#cf').onsubmit = async (e) => {
    e.preventDefault(); const st = $('#cfSt'), btn = $('#cfBtn');
    const data = { name: $('#cName').value.trim(), slug: $('#cSlug').value.trim().toLowerCase(), description: $('#cDesc').value.trim(), rules: $('#cRules').value.trim(), defaultKind: kind };
    if (!data.name) { st.textContent = '이름을 적어 주세요.'; return; }
    if (!editing && !/^[a-z0-9][a-z0-9-]{1,29}$/.test(data.slug)) { st.textContent = '주소는 영문 소문자, 숫자, 하이픈으로 2~30자여야 해요.'; return; }
    btn.disabled = true; st.textContent = '저장 중…';
    try {
      if (editing) { await api.updateCommunity(c.id, data); Object.assign(c, data); toast('저장했어요'); go('/c/' + c.slug); }
      else {
        const id = await api.createCommunity(data);
        remember({ id, ...data, members: 1, posts: 0, isDefault: false, createdAt: Date.now() }); S.my.set(id, 'mod');
        window.dispatchEvent(new Event('slop:follows')); toast('커뮤니티를 만들었어요'); go('/c/' + data.slug);
      }
    } catch (err) { btn.disabled = false; st.textContent = err.code === '23505' ? '이미 쓰이는 주소예요. 다른 주소를 골라 주세요.' : errMsg(err); }
  };
  if (editing) drawMods(c);
}

async function drawMods(c) {
  const el = $('#modPanel'); if (!el) return;
  let mods = []; try { mods = await api.communityMods(c.id); } catch { /* */ }
  el.innerHTML = `<h2>운영자</h2><div style="display:flex;flex-direction:column;gap:8px">${mods.map((m) => `<div class="row" style="flex-wrap:nowrap"><span style="flex:1;min-width:0">${who(m)}</span>${mods.length > 1 ? `<button class="linkbtn" data-unmod="${esc(m.username)}">해제</button>` : ''}</div>`).join('')}</div>
    <form class="row" id="addMod" style="margin-top:10px;flex-wrap:nowrap"><input type="text" id="modName" placeholder="아이디로 운영자 추가" aria-label="운영자로 추가할 아이디"><button class="btn sm" type="submit">추가</button></form>
    <p class="hint" style="margin:6px 0 0">운영자는 이 커뮤니티의 글을 고정·숨기기·잠그고, 신고를 처리하고, 설정을 바꿀 수 있어요.</p>`;
  $('#addMod').onsubmit = async (e) => { e.preventDefault(); const u = $('#modName').value.trim().replace(/^@/, ''); if (!u) return;
    try { await api.setCommunityMod(c.id, u, true); await api.log('add_mod', 'user', null, u, '', c.id); toast(`@${u}님을 운영자로 추가했어요`); drawMods(c); } catch (err) { toast(err.code === 'P0002' ? '그런 아이디가 없어요' : errMsg(err)); } };
  el.querySelectorAll('[data-unmod]').forEach((b) => (b.onclick = async () => {
    try { await api.setCommunityMod(c.id, b.dataset.unmod, false); await api.log('remove_mod', 'user', null, b.dataset.unmod, '', c.id); toast('운영자에서 해제했어요'); drawMods(c); } catch (err) { toast(err.code === '23514' ? '운영자가 최소 한 명은 있어야 해요' : errMsg(err)); }
  }));
}
