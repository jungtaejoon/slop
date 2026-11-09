import { api, S, $, app, avatarHtml, toast, errMsg, go, loadMyVotes } from '../core.js';
import { esc, ago } from '../text.js';
import { postRow } from './feed.js';

export function renderLogin() {
  if (api.me) { go('/'); return; }
  if (api.mode === 'demo') {
    app.innerHTML = `<form class="form narrow" id="demoForm"><h1>데모로 시작하기</h1>
      <p class="muted" style="margin:0">이 사이트는 지금 데모 모드예요. 서버 없이 이 브라우저에만 저장되고, 데모 계정은 운영자 권한이 있어서 신고 처리와 숨기기도 써 볼 수 있어요.</p>
      <div class="field"><label for="dName">표시 이름</label><input type="text" id="dName" maxlength="40" placeholder="예: 판정러" value="데모 사용자"></div>
      <button class="btn pri block" type="submit">데모 계정으로 시작</button></form>`;
    $('#demoForm').onsubmit = async (e) => { e.preventDefault(); await api.signInDemo($('#dName').value.trim()); toast('데모 계정으로 들어왔어요'); };
    return;
  }
  app.innerHTML = `<form class="form narrow" id="loginForm"><h1>로그인</h1>
    <p class="muted" style="margin:0">이메일로 받은 링크를 누르면 바로 들어와요. 처음이면 계정이 자동으로 만들어져요.</p>
    <div class="field"><label for="email">이메일</label><input type="email" id="email" autocomplete="email" required placeholder="you@example.com"></div>
    <button class="btn pri block" type="submit" id="sendBtn">로그인 링크 받기</button><p class="hint" id="loginSt" role="status" style="margin:0"></p>
    <div class="row" style="justify-content:center"><span class="hint">또는</span></div>
    <div class="row"><button type="button" class="btn" style="flex:1;justify-content:center" data-oauth="github">GitHub로 계속</button><button type="button" class="btn" style="flex:1;justify-content:center" data-oauth="google">Google로 계속</button></div></form>`;
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault(); const email = $('#email').value.trim(), st = $('#loginSt'), b = $('#sendBtn'); if (!email) return; b.disabled = true; st.textContent = '보내는 중…';
    try { await api.signInEmail(email); st.textContent = `${email}로 로그인 링크를 보냈어요. 메일함을 확인해 주세요.`; }
    catch (err) { st.textContent = /rate|seconds/i.test(err.message) ? '잠시 후 다시 시도해 주세요. 메일은 1분에 한 번 보낼 수 있어요.' : '링크를 보내지 못했어요. 주소를 확인해 주세요.'; b.disabled = false; }
  };
  app.querySelectorAll('[data-oauth]').forEach((b) => (b.onclick = async () => { try { await api.signInOAuth(b.dataset.oauth); } catch { toast('이 로그인 방법은 아직 설정되지 않았어요'); } }));
}

export function renderSettings() {
  const m = api.me; if (!m) { go('/login'); return; }
  app.innerHTML = `<form class="form narrow" id="setForm"><h1>프로필 설정</h1>
    <div class="field"><label for="sUser">아이디</label><input type="text" id="sUser" value="${esc(m.username)}" maxlength="20" pattern="[a-z0-9_]{3,20}"><span class="hint">영문 소문자, 숫자, 밑줄로 3~20자. 프로필 주소에 쓰여요.</span></div>
    <div class="field"><label for="sName">표시 이름</label><input type="text" id="sName" value="${esc(m.displayName)}" maxlength="40"></div>
    <div class="field"><label for="sBio">소개</label><textarea id="sBio" rows="3" maxlength="300" placeholder="주로 어떤 AI 결과물을 만들거나 찾나요?">${esc(m.bio)}</textarea></div>
    <div class="row"><button class="btn pri" type="submit">저장</button><span class="hint" id="setSt" role="status"></span></div></form>`;
  $('#setForm').onsubmit = async (e) => {
    e.preventDefault(); const st = $('#setSt'), username = $('#sUser').value.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { st.textContent = '아이디는 영문 소문자, 숫자, 밑줄로 3~20자여야 해요.'; return; }
    try { await api.updateProfile({ username, displayName: $('#sName').value.trim(), bio: $('#sBio').value.trim() }); toast('저장했어요'); go('/u/' + username); }
    catch (err) { st.textContent = err.code === '23505' ? '이미 쓰이는 아이디예요.' : errMsg(err); }
  };
}

export async function renderProfile(v) {
  app.innerHTML = '<div class="skel" style="height:120px"></div>';
  let p; try { p = await api.getProfileByUsername(v.username); } catch { /* */ }
  if (S.view !== v) return;
  if (!p) { app.innerHTML = '<div class="banner">이 사용자를 찾을 수 없어요.</div>'; return; }
  const [stats, list] = await Promise.all([api.profileStats(p.id).catch(() => null), api.listPosts({ authorId: p.id, sort: 'new', limit: 50 }).catch(() => ({ posts: [] }))]);
  if (S.view !== v) return;
  list.posts.forEach((x) => S.cache.set(x.id, Object.assign(S.cache.get(x.id) || {}, x)));
  await loadMyVotes(list.posts.map((x) => x.id));
  const mine = api.me?.id === p.id;
  app.innerHTML = `<div class="phead">${avatarHtml(p, 64)}<div class="t"><h1>${esc(p.name)}</h1><div class="muted">@${esc(p.username)} · ${ago(p.createdAt)} 가입${p.role !== 'member' ? ` · ${p.role === 'admin' ? '관리자' : '운영자'}` : ''}${p.banned ? ' · <span class="warn">작성 제한됨</span>' : ''}</div>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</div>
    ${stats ? `<div class="statrow"><div><b>${stats.karma}</b><span>판정 점수</span></div><div><b>${stats.gems}</b><span>보석</span></div><div><b>${stats.posts}</b><span>글</span></div><div><b>${stats.comments}</b><span>의견</span></div></div>` : ''}
    ${mine ? '<a class="btn" href="#/settings">프로필 설정</a>' : ''}</div>
    <h2 style="margin:0 0 10px">올린 글</h2>
    ${list.posts.length ? `<div class="list">${list.posts.map(postRow).join('')}</div>` : `<div class="banner">${mine ? '아직 올린 글이 없어요. <a href="#/submit">첫 글을 올려 보세요.</a>' : '아직 올린 글이 없어요.'}</div>`}`;
  document.title = `${p.name} · Slop Lab`;
}

const NOTE_TEXT = { reply: '님이 내 댓글에 답글을 달았어요', comment: '님이 내 글에 의견을 남겼어요', resolved: '님이 내 제안을 새 버전에 반영했어요', gem: '' };
export async function renderInbox() {
  if (!api.me) { go('/login'); return; }
  app.innerHTML = '<h1 style="margin-bottom:14px">알림</h1><div class="skel"></div>';
  let list = []; try { list = await api.notifications(); } catch { /* */ }
  if (S.view.name !== 'inbox') return;
  app.innerHTML = `<div class="row" style="margin-bottom:14px"><h1>알림</h1><span class="sp"></span></div>
    ${list.length ? `<div class="notes">${list.map((n) => `<a class="note${n.read ? '' : ' unread'}" href="#/p/${n.postId}"><i></i><div style="min-width:0">
      <div>${n.kind === 'gem' ? `<b>내 글이 보석이 됐어요!</b>` : `<b>${esc(n.actor?.name || '누군가')}</b>${NOTE_TEXT[n.kind]}`} <span class="hint">${ago(n.createdAt)}</span></div>
      <div class="q">${esc(n.postTitle)}${n.commentText ? ` · “${esc(n.commentText.slice(0, 80))}”` : ''}</div></div></a>`).join('')}</div>`
      : '<div class="banner">아직 알림이 없어요. 누군가 내 글에 의견을 남기거나, 내 댓글에 답하거나, 내 제안이 반영되면 여기에 떠요.</div>'}`;
  if (list.some((n) => !n.read)) { try { await api.markAllRead(); } catch { /* */ } window.dispatchEvent(new Event('slop:unread')); }
}
