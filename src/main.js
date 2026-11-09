import './styles.css';
import { api, S, $, CAT, CATS, isMod, go, vote, toggleSave, report, share, avatarHtml, toast } from './core.js';
import { esc } from './text.js';
import { renderFeed } from './views/feed.js';
import { renderPost, closePost } from './views/post.js';
import { renderCompose, closeCompose } from './views/compose.js';
import { renderLogin, renderSettings, renderProfile, renderInbox } from './views/pages.js';
import { renderMod, modAction } from './views/mod.js';

/* ---------- router: #/  #/c/web  #/gems  #/saved  #/p/<id>[/v/<n>]  #/submit[/cat]  #/edit/<id>  #/remix/<id>/<n>  #/u/<name>  #/login  #/settings  #/inbox  #/mod */
function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b, c, d] = parts;
  if (!a) return { name: 'feed' };
  if (a === 'c' && CAT[b]) return { name: 'feed', cat: b };
  if (a === 'gems' || a === 'saved') return { name: 'feed', special: a };
  if (a === 'p' && b) return { name: 'post', id: b, n: c === 'v' && d ? +d : null };
  if (a === 'submit') return { name: 'compose', mode: 'new', cat: CAT[b] ? b : null };
  if (a === 'edit' && b) return { name: 'compose', mode: 'edit', id: b };
  if (a === 'remix' && b) return { name: 'compose', mode: 'remix', id: b, n: c ? +c : null };
  if (a === 'u' && b) return { name: 'profile', username: b };
  if (['login', 'settings', 'inbox', 'mod'].includes(a)) return { name: a };
  return { name: 'feed' };
}

async function route() {
  const v = parse(), prev = S.view;
  if (prev.name === 'post' && !(v.name === 'post' && v.id === prev.id)) closePost();
  if (prev.name === 'compose' && location.hash !== S.c?.hash) closeCompose();
  S.view = v; renderBoards();
  if (v.name !== 'post') document.title = 'Slop Lab';
  const samePage = prev.name === v.name && prev.id === v.id && prev.cat === v.cat && prev.special === v.special;
  if (!samePage) scrollTo(0, 0);
  if (v.name === 'feed') return renderFeed();
  if (v.name === 'post') return renderPost(v);
  if (v.name === 'compose') return renderCompose(v);
  if (v.name === 'login') return renderLogin();
  if (v.name === 'settings') return renderSettings();
  if (v.name === 'profile') return renderProfile(v);
  if (v.name === 'inbox') return renderInbox();
  if (v.name === 'mod') return renderMod();
}

export function renderBoards() {
  const v = S.view, cur = v.name === 'feed' ? v.special || v.cat || 'all' : v.name === 'post' ? S.cache.get(v.id)?.cat : v.name;
  const items = [['all', '전체', '#/'], ['gems', '보석함', '#/gems'], ...CATS.map(([k, l]) => [k, l, '#/c/' + k]),
    ...(api.me ? [['saved', '저장함', '#/saved']] : []), ...(isMod() ? [['mod', '운영', '#/mod']] : [])];
  $('#boards').innerHTML = items.map(([k, l, h]) => `<a href="${h}" aria-current="${cur === k}">${esc(l)}</a>`).join('');
}

export function renderAuth() {
  const el = $('#authArea'), m = api.me;
  $('#newBtn').hidden = !!(m && m.banned);
  if (!m) { el.innerHTML = `<a class="btn" href="#/login">${api.mode === 'demo' ? '데모 시작' : '로그인'}</a>`; return; }
  el.innerHTML = `<a class="iconbtn" href="#/inbox" aria-label="알림${S.unread ? ` ${S.unread}개` : ''}" title="알림">🔔${S.unread ? `<span class="dot">${S.unread > 99 ? '99+' : S.unread}</span>` : ''}</a>
    <button class="authbtn" id="meBtn" aria-haspopup="menu" aria-expanded="false" style="border:0;background:none;padding:0;cursor:pointer">${avatarHtml(m, 34).replace('class="av', 'class="me av')}</button>
    <div class="menu" id="meMenu" role="menu" hidden><div class="who-line">${esc(m.name)} · @${esc(m.username)}${m.role !== 'member' ? ` · ${m.role === 'admin' ? '관리자' : '운영자'}` : ''}</div>
      <a href="#/u/${esc(m.username)}" role="menuitem">내 프로필</a><a href="#/saved" role="menuitem">저장함</a><a href="#/settings" role="menuitem">프로필 설정</a>
      ${isMod() ? '<a href="#/mod" role="menuitem">운영</a>' : ''}<button id="logout" role="menuitem">로그아웃</button></div>`;
  const btn = $('#meBtn'), menu = $('#meMenu');
  btn.onclick = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); };
  document.addEventListener('click', () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }, { once: true });
  $('#logout').onclick = async () => { await api.signOut(); toast('로그아웃했어요'); go('/'); };
  const ban = $('#banNote'); ban.hidden = !m.banned;
  if (m.banned) ban.firstElementChild.textContent = `운영자가 이 계정의 글쓰기·댓글·판정을 제한했어요${m.banReason ? ` (사유: ${m.banReason})` : ''}. 읽기는 계속할 수 있어요.`;
}

export async function refreshUnread() {
  try { S.unread = api.me ? await api.unreadCount() : 0; } catch { S.unread = 0; }
  renderAuth();
}

/* ---------- global actions (data-act) ---------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const { act, id } = t.dataset;
  if (act === 'vote') { e.preventDefault(); vote(t.dataset.t, id, +t.dataset.d); }
  else if (act === 'save') { e.preventDefault(); toggleSave(id); }
  else if (act === 'report') { e.preventDefault(); report(t.dataset.t, id); }
  else if (act === 'share') { e.preventDefault(); share(id, t.dataset.title || ''); }
  else if (act === 'tool') { e.preventDefault(); S.filters = { ...S.filters, tool: S.filters?.tool === t.dataset.v ? null : t.dataset.v }; S.view.name === 'feed' ? renderFeed() : go('/'); }
  else if (act === 'tag') { e.preventDefault(); S.filters = { ...S.filters, tag: t.dataset.v }; S.view.name === 'feed' ? renderFeed() : go('/'); }
  else if (act === 'mod') { e.preventDefault(); modAction(t.dataset.op, t.dataset.t, id, t.dataset); }
});
window.addEventListener('slop:unread', refreshUnread);
const gq = $('#gq'); let gqT;
gq.addEventListener('input', () => { clearTimeout(gqT); gqT = setTimeout(() => { S.q = gq.value.trim(); if (S.view.name !== 'feed') go('/'); else renderFeed(); }, 250); });
document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); gq.focus(); } });

/* ---------- boot ---------- */
async function boot() {
  if (api.mode === 'demo') {
    $('#modeBar').hidden = false;
    $('#modeBarText').innerHTML = '<b>데모 모드</b><span>서버 없이 이 브라우저에만 저장돼요. 데모 계정은 운영자 권한이 있어서 운영 기능도 써 볼 수 있어요.</span><button class="linkbtn" id="resetDemo">데모 초기화</button>';
    $('#resetDemo').onclick = async () => { await api.resetDemo(); S.cache.clear(); S.votes = { p: {}, c: {} }; S.saves = new Set(); toast('데모 데이터를 처음 상태로 되돌렸어요'); go('/'); renderAuth(); renderBoards(); };
  }
  try { await api.init(); } catch (e) { console.error(e); }
  // the PKCE login redirect lands with ?code=...; drop it and go back where the user was
  if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + (location.hash || '#/'));
  const after = sessionStorage.getItem('slop-after-login');
  if (api.me && after) { sessionStorage.removeItem('slop-after-login'); if (after !== location.hash) location.hash = after; }
  await afterAuth();
  api.onAuthChange(async () => { S.votes = { p: {}, c: {} }; await afterAuth(); route(); });
  window.addEventListener('hashchange', route);
  route();
}
async function afterAuth() {
  renderAuth(); renderBoards();
  const [saves, reports] = await Promise.all([api.mySaves().catch(() => new Set()), api.myReports().catch(() => new Set())]);
  S.saves = saves; S.reports = reports;
  await refreshUnread();
  S.unsubNotes?.(); S.unsubNotes = api.subscribeNotifications(refreshUnread);
}
boot();
