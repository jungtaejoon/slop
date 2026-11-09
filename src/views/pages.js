import { api, S, $, app, avatarHtml, toast, errMsg, go, replaceTo, loadMyVotes } from '../core.js';
import { esc, ago } from '../text.js';
import { postRow, setupPreviews } from './feed.js';

export function renderLogin() {
  if (api.me) { replaceTo('/'); return; }
  if (api.mode === 'demo') {
    app.innerHTML = `<form class="form narrow" id="demoForm"><h1>데모로 시작하기</h1>
      <p class="muted" style="margin:0">이 사이트는 지금 데모 모드예요. 서버 없이 이 브라우저에만 저장되고, 데모 계정은 운영자 권한이 있어서 신고 처리와 숨기기도 써 볼 수 있어요.</p>
      <div class="field"><label for="dName">표시 이름</label><input type="text" id="dName" maxlength="40" placeholder="예: 판정러" value="데모 사용자"></div>
      <button class="btn pri block" type="submit">데모 계정으로 시작</button></form>`;
    $('#demoForm').onsubmit = async (e) => { e.preventDefault(); await api.signInDemo($('#dName').value.trim()); toast('데모 계정으로 들어왔어요'); };
    return;
  }
  const oauth = (import.meta.env.VITE_OAUTH_PROVIDERS || '').split(',').map((x) => x.trim()).filter(Boolean);
  const NAMES = { google: 'Google', kakao: '카카오', github: 'GitHub' };
  const st = (S.login ??= { mode: 'signup', email: '' });
  app.innerHTML = `<form class="form narrow" id="loginForm" novalidate><h1>${st.mode === 'signup' ? '가입하기' : st.mode === 'login' ? '로그인' : st.mode === 'link' ? '메일 링크로 로그인' : '비밀번호 찾기'}</h1>
    ${st.mode === 'signup' || st.mode === 'login' ? '<p class="hint" style="margin:0">판정(▲/▼)은 가입하지 않아도 할 수 있어요. 글과 댓글을 쓰려면 가입해 주세요.</p>' : ''}
    ${oauth.length ? `<div style="display:flex;flex-direction:column;gap:8px">${oauth.map((o) => `<button type="button" class="btn block" data-oauth="${esc(o)}">${esc(NAMES[o] || o)}로 계속하기</button>`).join('')}</div><div class="row" style="justify-content:center"><span class="hint">또는 이메일로</span></div>` : ''}
    <div class="seg" role="tablist" style="align-self:flex-start">${[['signup', '가입'], ['login', '로그인']].map(([k, l]) => `<button type="button" data-mode="${k}" aria-pressed="${st.mode === k}">${l}</button>`).join('')}</div>
    <div class="field"><label for="email">이메일</label><input type="email" id="email" autocomplete="email" required placeholder="you@example.com" value="${esc(st.email)}"></div>
    ${st.mode === 'signup' || st.mode === 'login' ? `<div class="field"><label for="pw">비밀번호</label><input type="password" id="pw" autocomplete="${st.mode === 'signup' ? 'new-password' : 'current-password'}" minlength="8" required placeholder="8자 이상">${st.mode === 'signup' ? '<span class="hint">가입하면 확인 메일이 가요. 메일의 링크를 누르면 가입이 끝나요.</span>' : ''}</div>` : ''}
    <button class="btn pri block" type="submit" id="sendBtn">${st.mode === 'signup' ? '가입하기' : st.mode === 'login' ? '로그인' : st.mode === 'link' ? '로그인 링크 받기' : '재설정 메일 받기'}</button>
    <p class="hint" id="loginSt" role="status" style="margin:0"></p>
    <div class="row" style="justify-content:space-between">${st.mode !== 'link' ? '<button type="button" class="linkbtn" data-mode="link">비밀번호 없이 메일 링크로</button>' : '<button type="button" class="linkbtn" data-mode="login">비밀번호로 로그인</button>'}${st.mode === 'login' ? '<button type="button" class="linkbtn" data-mode="reset">비밀번호를 잊었어요</button>' : ''}</div></form>`;
  app.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => { st.email = $('#email').value.trim(); st.mode = b.dataset.mode; renderLogin(); }));
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault(); const email = $('#email').value.trim(), pw = $('#pw')?.value || '', out = $('#loginSt'), b = $('#sendBtn'); st.email = email;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { out.textContent = '이메일 주소를 확인해 주세요.'; return; }
    if ((st.mode === 'signup' || st.mode === 'login') && pw.length < 8) { out.textContent = '비밀번호는 8자 이상이어야 해요.'; return; }
    b.disabled = true; out.textContent = '잠시만요…';
    try {
      if (st.mode === 'signup') { const r = await api.signUpPassword(email, pw); out.textContent = r.needsConfirm ? `${email}로 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.` : ''; if (!r.needsConfirm) toast('가입했어요. 환영해요!'); }
      else if (st.mode === 'login') { await api.signInPassword(email, pw); toast('로그인했어요'); }
      else if (st.mode === 'link') { await api.signInEmail(email); out.textContent = `${email}로 로그인 링크를 보냈어요. 메일함을 확인해 주세요.`; }
      else { await api.resetPassword(email); out.textContent = `${email}로 비밀번호 재설정 메일을 보냈어요.`; }
    } catch (err) {
      const m = err.message || '';
      out.textContent = /already registered|already exists/i.test(m) ? '이미 가입된 이메일이에요. "로그인"을 눌러 주세요.'
        : /invalid login|invalid credentials/i.test(m) ? '이메일 또는 비밀번호가 맞지 않아요.'
        : /not confirmed/i.test(m) ? '아직 메일 확인이 안 됐어요. 메일함의 확인 링크를 눌러 주세요.'
        : /rate|seconds|too many/i.test(m) ? '요청이 많아요. 잠시 후 다시 시도해 주세요.'
        : /password/i.test(m) ? '더 안전한 비밀번호를 써 주세요(8자 이상, 흔하지 않은 것).'
        : '처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
    b.disabled = false;
  };
  app.querySelectorAll('[data-oauth]').forEach((b) => (b.onclick = async () => { try { await api.signInOAuth(b.dataset.oauth); } catch { toast('이 로그인 방법은 아직 설정되지 않았어요'); } }));
}

export function renderSettings() {
  const m = api.me; if (!m) { replaceTo('/login'); return; }
  app.innerHTML = `<form class="form narrow" id="setForm"><h1>프로필 설정</h1>
    <div class="field"><label for="sUser">아이디</label><input type="text" id="sUser" value="${esc(m.username)}" maxlength="20" pattern="[a-z0-9_]{3,20}"><span class="hint">영문 소문자, 숫자, 밑줄로 3~20자. 프로필 주소에 쓰여요.</span></div>
    <div class="field"><label for="sName">표시 이름</label><input type="text" id="sName" value="${esc(m.displayName)}" maxlength="40"></div>
    <div class="field"><label for="sBio">소개</label><textarea id="sBio" rows="3" maxlength="300" placeholder="주로 어떤 AI 결과물을 만들거나 찾나요?">${esc(m.bio)}</textarea></div>
    <div class="row"><button class="btn pri" type="submit">저장</button><span class="hint" id="setSt" role="status"></span></div></form>
    ${api.mode === 'supabase' ? `<form class="form narrow" id="pwForm" style="margin-top:14px"><h2>${api.recovering ? '새 비밀번호 정하기' : '비밀번호 바꾸기'}</h2>
      <div class="field"><label for="newPw">새 비밀번호</label><input type="password" id="newPw" autocomplete="new-password" minlength="8" placeholder="8자 이상"></div>
      <div class="row"><button class="btn" type="submit">비밀번호 저장</button><span class="hint" id="pwSt" role="status"></span></div></form>` : ''}`;
  const pf = $('#pwForm');
  if (pf) { if (api.recovering) $('#newPw').focus(); pf.onsubmit = async (e) => { e.preventDefault(); const pw = $('#newPw').value, out = $('#pwSt'); if (pw.length < 8) { out.textContent = '8자 이상이어야 해요.'; return; }
    try { await api.updatePassword(pw); api.recovering = false; $('#newPw').value = ''; out.textContent = ''; toast('비밀번호를 바꿨어요'); } catch { out.textContent = '바꾸지 못했어요. 더 안전한 비밀번호를 써 보세요.'; } }; }
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
  app.innerHTML = `<div class="phead">${avatarHtml(p, 64)}<div class="t"><h1>${esc(p.name)}</h1><div class="muted"><span>@${esc(p.username)}</span> · <span>${ago(p.createdAt)} 가입</span>${p.role !== 'member' ? ` · <span>${p.role === 'admin' ? '관리자' : '운영자'}</span>` : ''}${p.banned ? ' · <span class="warn">작성 제한됨</span>' : ''}</div>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</div>
    ${stats ? `<div class="statrow"><div><b>${stats.karma}</b><span>판정 점수</span></div><div><b>${stats.gems}</b><span>보석</span></div><div><b>${stats.posts}</b><span>게시글</span></div><div><b>${stats.comments}</b><span>의견 수</span></div></div>` : ''}
    ${mine ? '<a class="btn" href="#/settings">프로필 설정</a>' : ''}</div>
    <h2 style="margin:0 0 10px">올린 글</h2>
    ${list.posts.length ? `<div class="list">${list.posts.map(postRow).join('')}</div>` : `<div class="banner">${mine ? '아직 올린 글이 없어요. <a href="#/submit">첫 글을 올려 보세요.</a>' : '아직 올린 글이 없어요.'}</div>`}`;
  document.title = `${p.name} · Slop Lab`;
  setupPreviews(app);
}

const NOTE_TEXT = { reply: '님이 내 댓글에 답글을 달았어요', comment: '님이 내 글에 의견을 남겼어요', resolved: '님이 내 제안을 새 버전에 반영했어요', gem: '' };
export async function renderInbox() {
  if (!api.me) { replaceTo('/login'); return; }
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
