import { api, S, $, app, avatarHtml, toast, errMsg, go, replaceTo, loadMyVotes, isNativeApp } from '../core.js';
import { esc, ago } from '../text.js';
import { postRow, setupPreviews } from './feed.js';
import { LEGAL, EFFECTIVE } from '../legal-content.js';
import { lang } from '../i18n.js';

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
  const oauth = isNativeApp ? [] : (import.meta.env.VITE_OAUTH_PROVIDERS || '').split(',').map((x) => x.trim()).filter(Boolean);
  const NAMES = { google: 'Google', kakao: '카카오', github: 'GitHub' };
  // returning visitors land on "log in", first-timers on "sign up"
  let seen = false; try { seen = !!localStorage.getItem('slop-had-login'); } catch { /* */ }
  const st = (S.login ??= { mode: seen ? 'login' : 'signup', email: '' });
  if (!['signup', 'login', 'reset'].includes(st.mode)) st.mode = 'login';
  const pwMode = st.mode !== 'reset', su = st.mode === 'signup';
  app.innerHTML = `<form class="form narrow" id="loginForm" novalidate><h1>${su ? '가입하기' : st.mode === 'login' ? '로그인' : '비밀번호 찾기'}</h1>
    ${pwMode ? '<p class="hint" id="guestHint" style="margin:0" hidden>판정(▲/▼)은 가입하지 않아도 할 수 있어요. 글과 댓글을 쓰려면 가입해 주세요.</p>' : '<p class="hint" style="margin:0">가입한 이메일을 적으면 비밀번호를 새로 정하는 링크를 보내 드려요.</p>'}
    ${oauth.length && pwMode ? `<div style="display:flex;flex-direction:column;gap:8px">${oauth.map((o) => `<button type="button" class="btn block" data-oauth="${esc(o)}">${esc(NAMES[o] || o)}로 계속하기</button>`).join('')}</div><div class="row" style="justify-content:center"><span class="hint">또는 이메일로</span></div>` : ''}
    ${pwMode ? `<div class="seg" role="tablist" style="align-self:flex-start">${[['login', '로그인'], ['signup', '가입']].map(([k, l]) => `<button type="button" data-mode="${k}" aria-pressed="${st.mode === k}">${l}</button>`).join('')}</div>` : ''}
    <div class="field"><label for="email">이메일</label><input type="email" id="email" autocomplete="${su ? 'email' : 'username'}" inputmode="email" autocapitalize="off" spellcheck="false" required placeholder="you@example.com" value="${esc(st.email)}"></div>
    ${pwMode ? `<div class="field"><div class="row" style="justify-content:space-between"><label for="pw">비밀번호</label>${st.mode === 'login' ? '<button type="button" class="linkbtn" data-mode="reset">비밀번호를 잊었어요</button>' : ''}</div>
      <div class="pwbox"><input type="password" id="pw" autocomplete="${su ? 'new-password' : 'current-password'}" minlength="8" maxlength="72" required placeholder="${su ? '8자 이상, 문장처럼 길게도 좋아요' : '비밀번호'}"><button type="button" class="pweye" id="pwEye" aria-label="비밀번호 보기" aria-pressed="false">보기</button></div>
      ${su ? '<div class="pwmeter" id="pwMeter" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="hint" id="pwHint">8자 이상. 숫자·기호를 섞거나 길게 쓸수록 안전해요.</span>' : ''}
      <span class="hint warn" id="capsHint" hidden>Caps Lock이 켜져 있어요.</span></div>` : ''}
    ${su ? '<p class="hint" style="margin:0">가입하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봐요. <a href="#/terms">이용약관</a> · <a href="#/privacy">개인정보 처리방침</a></p>' : ''}
    <button class="btn pri block" type="submit" id="sendBtn">${su ? '가입하기' : st.mode === 'login' ? '로그인' : '재설정 메일 받기'}</button>
    <p class="hint" id="loginSt" role="status" aria-live="polite" style="margin:0"></p>
    ${st.mode === 'reset' ? '<div class="row"><button type="button" class="linkbtn" data-mode="login">← 로그인으로 돌아가기</button></div>' : ''}</form>`;
  app.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => { st.email = $('#email').value.trim(); st.mode = b.dataset.mode; renderLogin(); (st.email ? $('#pw') || $('#email') : $('#email'))?.focus(); }));
  // hints follow the live Auth settings (email confirmation, guest votes)
  api.authSettings().then((s) => { const g = $('#guestHint'); if (g) g.hidden = !s.guests; st.autoConfirm = s.autoConfirm; });
  const pw = $('#pw');
  if (pw) {
    $('#pwEye').onclick = (e) => { const on = pw.type === 'password'; pw.type = on ? 'text' : 'password'; e.currentTarget.textContent = on ? '숨기기' : '보기';
      e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.setAttribute('aria-label', on ? '비밀번호 숨기기' : '비밀번호 보기'); pw.focus(); };
    const caps = (e) => { const c = $('#capsHint'); if (c && e.getModifierState) c.hidden = !e.getModifierState('CapsLock'); };
    pw.addEventListener('keydown', caps); pw.addEventListener('keyup', caps); pw.addEventListener('blur', () => ($('#capsHint').hidden = true));
    if (su) pw.oninput = () => { const sc = pwScore(pw.value, $('#email').value), m = $('#pwMeter');
      m.dataset.s = pw.value ? sc : ''; $('#pwHint').textContent = !pw.value ? '8자 이상. 숫자·기호를 섞거나 길게 쓸수록 안전해요.' : PW_WORDS[sc]; };
  }
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault(); const email = $('#email').value.trim(), pwv = pw?.value || '', out = $('#loginSt'), b = $('#sendBtn'); st.email = email;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { out.textContent = '이메일 주소를 확인해 주세요.'; $('#email').focus(); return; }
    if (pwMode && pwv.length < 8) { out.textContent = '비밀번호는 8자 이상이어야 해요.'; pw.focus(); return; }
    if (su && pwScore(pwv, email) < 1) { out.textContent = '너무 쉬운 비밀번호예요. 조금 더 길게, 흔하지 않게 써 주세요.'; pw.focus(); return; }
    b.disabled = true; out.textContent = '잠시만요…';
    try {
      if (su) { const r = await api.signUpPassword(email, pwv); remember(); out.textContent = r.needsConfirm ? `${email}로 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.` : ''; if (!r.needsConfirm) toast('가입했어요. 환영해요!'); }
      else if (st.mode === 'login') { await api.signInPassword(email, pwv); remember(); toast('로그인했어요'); }
      else { await api.resetPassword(email); out.textContent = `${email}로 비밀번호 재설정 메일을 보냈어요. 메일의 링크를 누르면 새 비밀번호를 정할 수 있어요.`; }
    } catch (err) {
      const m = err.message || '', c = err.code || '';
      if (/already registered|already exists/i.test(m) || c === 'user_already_exists') { st.mode = 'login'; renderLogin(); $('#loginSt').textContent = '이미 가입된 이메일이에요. 비밀번호를 넣고 로그인해 주세요.'; $('#pw').focus(); return; }
      out.textContent = /invalid login|invalid credentials/i.test(m) || c === 'invalid_credentials' ? '이메일 또는 비밀번호가 맞지 않아요. 기억나지 않으면 "비밀번호를 잊었어요"를 눌러 주세요.'
        : /not confirmed/i.test(m) ? '아직 메일 확인이 안 됐어요. 메일함의 확인 링크를 눌러 주세요.'
        : /rate|seconds|too many/i.test(m) || /rate_limit/.test(c) ? '요청이 많아요. 잠시 후 다시 시도해 주세요.'
        : /password/i.test(m) || c === 'weak_password' ? '더 안전한 비밀번호를 써 주세요(8자 이상, 흔하지 않은 것).'
        : /fetch|network/i.test(m) ? '연결이 불안정해요. 인터넷 연결을 확인하고 다시 시도해 주세요.'
        : '처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
    b.disabled = false;
  };
  app.querySelectorAll('[data-oauth]').forEach((b) => (b.onclick = async () => { try { remember(); await api.signInOAuth(b.dataset.oauth); } catch { toast('이 로그인 방법은 아직 설정되지 않았어요'); } }));
  (st.email && pw ? pw : $('#email')).focus();
}
const remember = () => { try { localStorage.setItem('slop-had-login', '1'); } catch { /* */ } };
// rough strength 0-4: length and variety, minus common patterns and the email itself
const PW_WORDS = ['너무 쉬워요. 더 길게, 흔하지 않게 써 주세요.', '조금 약해요. 숫자나 기호를 섞거나 더 길게 써 보세요.', '괜찮아요.', '좋아요.', '아주 좋아요.'];
export function pwScore(pw, email = '') {
  if (pw.length < 8) return 0;
  const low = pw.toLowerCase(), user = email.split('@')[0].toLowerCase();
  if (/^(.)\1+$/.test(pw) || /^(?:0?123456789?0?|abcdefgh\w{0,2}|qwer\w{0,6}|asdf\w{0,6}|passw(?:or)?d\W?\d{0,4}|slop\W?\d{0,6}|1q2w3e4r\w{0,4}|iloveyou\d{0,4}|\d{8,10})$/.test(low) || (user.length > 2 && low.includes(user))) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  let s = (pw.length >= 12 ? 2 : 1) + (kinds >= 3 ? 1 : 0) + (pw.length >= 16 || (kinds === 4 && pw.length >= 12) ? 1 : 0);
  if (kinds === 1 && pw.length < 12) s = Math.min(s, 1);
  return Math.min(4, s);
}

export function renderSettings() {
  const m = api.me; if (!m) { replaceTo('/login'); return; }
  app.innerHTML = `<form class="form narrow" id="setForm"><h1>프로필 설정</h1>
    <div class="field"><label for="sUser">아이디</label><input type="text" id="sUser" value="${esc(m.username)}" maxlength="20" pattern="[a-z0-9_]{3,20}"><span class="hint">영문 소문자, 숫자, 밑줄로 3~20자. 프로필 주소에 쓰여요.</span></div>
    <div class="field"><label for="sName">표시 이름</label><input type="text" id="sName" value="${esc(m.displayName)}" maxlength="40"></div>
    <div class="field"><label for="sBio">소개</label><textarea id="sBio" rows="3" maxlength="300" placeholder="주로 어떤 AI 결과물을 만들거나 찾나요?">${esc(m.bio)}</textarea></div>
    <div class="row"><button class="btn pri" type="submit">저장</button><span class="hint" id="setSt" role="status"></span></div></form>
    <section class="form narrow" id="blockList" style="margin-top:14px"><h2>차단한 사용자</h2><p class="hint" style="margin:0">불러오는 중…</p></section>
    ${api.mode === 'supabase' ? `<form class="form narrow" id="pwForm" style="margin-top:14px"><h2>${api.recovering ? '새 비밀번호 정하기' : '로그인과 보안'}</h2>
      ${m.email ? `<p class="hint" style="margin:0">로그인 이메일: <b>${esc(m.email)}</b></p>` : ''}
      <input type="email" autocomplete="username" value="${esc(m.email || '')}" hidden>
      ${api.recovering ? '<p class="hint" style="margin:0">메일 링크로 들어왔어요. 앞으로 쓸 새 비밀번호를 정해 주세요.</p>' : '<div class="field"><label for="curPw">지금 비밀번호</label><input type="password" id="curPw" autocomplete="current-password" maxlength="72"></div>'}
      <div class="field"><label for="newPw">새 비밀번호</label><div class="pwbox"><input type="password" id="newPw" autocomplete="new-password" minlength="8" maxlength="72" placeholder="8자 이상"><button type="button" class="pweye" data-eye="newPw" aria-label="비밀번호 보기" aria-pressed="false">보기</button></div>
        <div class="pwmeter" id="pwMeter" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="hint" id="pwHint">8자 이상. 숫자·기호를 섞거나 길게 쓸수록 안전해요.</span></div>
      <div class="row"><button class="btn" type="submit">비밀번호 저장</button><span class="hint" id="pwSt" role="status"></span></div>
      <div class="row" style="border-top:1px solid var(--line);padding-top:12px;margin-top:4px"><span class="hint" style="flex:1">다른 기기나 브라우저에 남아 있는 로그인을 모두 끝내요. 이 기기는 그대로예요.</span><button class="btn sm" type="button" id="outOthers">다른 기기 로그아웃</button></div></form>
    <form class="form narrow danger-zone" id="delForm" style="margin-top:14px"><h2>계정 삭제</h2>
      <p class="hint" style="margin:0">계정을 지우면 프로필, 판정, 저장한 글, 알림, 팔로우가 바로 사라지고 되돌릴 수 없어요.</p>
      <label class="check"><input type="checkbox" id="delContent"> <span>내가 쓴 글과 댓글도 모두 지우기</span></label>
      <p class="hint" style="margin:0">고르지 않으면 글과 댓글은 "탈퇴한 사용자"가 쓴 것으로 남아요.</p>
      <div class="field"><label for="delConfirm">확인을 위해 아이디를 입력해 주세요</label><input type="text" id="delConfirm" autocomplete="off" spellcheck="false" placeholder="${esc(m.username)}"></div>
      <div class="row"><button class="btn danger" type="submit" id="delBtn" disabled>계정 삭제</button><span class="hint" id="delSt" role="status"></span></div></form>` : ''}`;
  const pf = $('#pwForm');
  if (pf) {
    const np = $('#newPw');
    if (api.recovering) np.focus();
    pf.querySelector('[data-eye]').onclick = (e) => { const on = np.type === 'password'; np.type = on ? 'text' : 'password'; e.currentTarget.textContent = on ? '숨기기' : '보기'; e.currentTarget.setAttribute('aria-pressed', on); np.focus(); };
    np.oninput = () => { const sc = pwScore(np.value, m.email || ''); $('#pwMeter').dataset.s = np.value ? sc : ''; $('#pwHint').textContent = np.value ? PW_WORDS[sc] : '8자 이상. 숫자·기호를 섞거나 길게 쓸수록 안전해요.'; };
    pf.onsubmit = async (e) => {
      e.preventDefault(); const pw = np.value, out = $('#pwSt'), cur = $('#curPw');
      if (cur && !cur.value) { out.textContent = '지금 비밀번호를 넣어 주세요.'; cur.focus(); return; }
      if (pw.length < 8) { out.textContent = '8자 이상이어야 해요.'; np.focus(); return; }
      if (pwScore(pw, m.email || '') < 1) { out.textContent = '너무 쉬운 비밀번호예요.'; np.focus(); return; }
      if (cur && cur.value === pw) { out.textContent = '지금 비밀번호와 다르게 정해 주세요.'; np.focus(); return; }
      out.textContent = '잠시만요…';
      try { if (cur) { try { await api.verifyPassword(cur.value); } catch { out.textContent = '지금 비밀번호가 맞지 않아요.'; cur.focus(); return; } }
        await api.updatePassword(pw); api.recovering = false; renderSettings(); toast('비밀번호를 바꿨어요'); }
      catch (err) { out.textContent = /different|same/i.test(err.message || '') ? '지금 비밀번호와 다르게 정해 주세요.' : '바꾸지 못했어요. 더 안전한 비밀번호를 써 보세요.'; }
    };
    $('#outOthers').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await api.signOutOthers(); toast('다른 기기의 로그인을 모두 끝냈어요'); } catch { toast('처리하지 못했어요. 잠시 후 다시 시도해 주세요.'); } b.disabled = false; };
  }
  const bl = $('#blockList');
  if (bl) api.listBlocked().then((us) => {
    if (!bl.isConnected) return;
    bl.innerHTML = `<h2>차단한 사용자</h2>${us.length ? us.map((u) => `<div class="row"><a class="who nm" href="#/u/${esc(u.username)}">${avatarHtml(u, 22)}<span>${esc(u.name)}</span></a><span class="sp"></span><button class="btn sm" data-act="block" data-id="${esc(u.id)}">차단 풀기</button></div>`).join('')
      : '<p class="hint" style="margin:0">차단한 사용자가 없어요. 글이나 댓글, 프로필의 "차단" 버튼으로 차단할 수 있어요.</p>'}`;
  }).catch(() => { if (bl.isConnected) bl.remove(); });
  const df = $('#delForm');
  if (df) {
    const inp = $('#delConfirm'), btn = $('#delBtn');
    inp.oninput = () => (btn.disabled = inp.value.trim().toLowerCase() !== m.username);
    df.onsubmit = async (e) => {
      e.preventDefault(); if (btn.disabled) return; btn.disabled = true; $('#delSt').textContent = '지우는 중…';
      try { await api.deleteAccount($('#delContent').checked); toast('계정을 삭제했어요'); replaceTo('/'); }
      catch (err) { btn.disabled = false; $('#delSt').textContent = err.code === 'SL409' ? '사이트의 마지막 관리자는 계정을 지울 수 없어요.' : errMsg(err, '계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
    };
  }
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
  const blocked = api.isBlocked(p.id);
  const [stats, list] = await Promise.all([api.profileStats(p.id).catch(() => null), api.listPosts({ authorId: p.id, sort: 'new', limit: 50 }).catch(() => ({ posts: [] }))]);
  if (S.view !== v) return;
  list.posts.forEach((x) => S.cache.set(x.id, Object.assign(S.cache.get(x.id) || {}, x)));
  await loadMyVotes(list.posts.map((x) => x.id));
  const mine = api.me?.id === p.id;
  app.innerHTML = `<div class="phead">${avatarHtml(p, 64)}<div class="t"><h1>${esc(p.name)}</h1><div class="muted"><span>@${esc(p.username)}</span> · <span>${ago(p.createdAt)} 가입</span>${p.role !== 'member' ? ` · <span>${p.role === 'admin' ? '관리자' : '운영자'}</span>` : ''}${p.banned ? ' · <span class="warn">작성 제한됨</span>' : ''}</div>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</div>
    ${stats ? `<div class="statrow"><div><b>${stats.karma}</b><span>판정 점수</span></div><div><b>${stats.gems}</b><span>보석</span></div><div><b>${stats.posts}</b><span>게시글</span></div><div><b>${stats.comments}</b><span>의견 수</span></div></div>` : ''}
    ${mine ? '<a class="btn" href="#/settings">프로필 설정</a>' : api.me ? `<button class="btn ghost" data-act="block" data-id="${esc(p.id)}" data-name="${esc(p.name)}">${blocked ? '차단 풀기' : '차단'}</button>` : ''}</div>
    <h2 style="margin:0 0 10px">올린 글</h2>
    ${blocked ? '<div class="banner">차단한 사용자라 글을 보여 주지 않아요.</div>' : list.posts.length ? `<div class="list">${list.posts.map(postRow).join('')}</div>` : `<div class="banner">${mine ? '아직 올린 글이 없어요. <a href="#/submit">첫 글을 올려 보세요.</a>' : '아직 올린 글이 없어요.'}</div>`}`;
  document.title = `${p.name} · Slop`;
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

// Terms of Service / Privacy Policy, in the interface language (text lives in legal-content.js)
export function renderLegal(doc) {
  const L = lang === 'ko' ? 'ko' : 'en', d = LEGAL[doc]?.[L], other = doc === 'terms' ? 'privacy' : 'terms';
  if (!d) { replaceTo('/'); return; }
  app.innerHTML = `<article class="legal" data-ugc lang="${L}"><h1>${d.title}</h1><p class="muted">${L === 'ko' ? '시행일' : 'Effective'}: ${EFFECTIVE[L]}</p>${d.body}
    <p class="muted" style="margin-top:28px"><a href="#/${other}">${LEGAL[other][L].title} →</a></p></article>`;
  document.title = `${d.title} · Slop`;
}
