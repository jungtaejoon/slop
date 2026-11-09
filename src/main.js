import './styles.css';
import { startTranslator, lang, setLang } from './i18n.js';
startTranslator();
{ const ls = document.getElementById('langSel'); ls.value = lang; ls.onchange = () => setLang(ls.value); }
import { api, S, $, icon, isMod, anyCommunityMod, go, currentHash, toAppUrl, countView, BASE_PATH, isStandalone, isNativeApp, openInstall, toggleBlock, vote, toggleSave, toggleFollow, report, share, openShare, avatarHtml, toast, loadMyCommunities } from './core.js';
import { esc } from './text.js';
import { renderFeed } from './views/feed.js';
import { renderPost, closePost } from './views/post.js';
import { renderCompose, closeCompose } from './views/compose.js';
import { renderLogin, renderSettings, renderProfile, renderInbox, renderLegal } from './views/pages.js';
import { renderMod, modAction } from './views/mod.js';
import { renderDirectory, renderCommunityForm } from './views/communities.js';
import { renderJudge } from './views/judge.js';
import { renderShorts, closeShorts } from './views/shorts.js';

/* ---------- router
   #/ (home: followed)  #/popular  #/gems  #/saved  #/c/<slug>  #/c/<slug>/settings  #/communities  #/communities/new
   #/p/<id>[/v/<n>]  #/submit[/<slug>]  #/edit/<id>  #/remix/<id>/<n>  #/u/<name>  #/login  #/settings  #/inbox  #/mod */
function parse() {
  const parts = currentHash().replace(/^#\/?/, '').split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  const [a, b, c, d] = parts;
  if (!a) return { name: 'feed', special: 'home' };
  if (a === 'c' && b && c === 'settings') return { name: 'cform', slug: b };
  if (a === 'c' && b) return { name: 'feed', slug: b };
  if (a === 'communities') return b === 'new' ? { name: 'cform' } : { name: 'communities' };
  if (['popular', 'gems', 'saved'].includes(a)) return { name: 'feed', special: a };
  if (a === 'p' && b) return { name: 'post', id: b, n: c === 'v' && d ? +d : null };
  if (a === 'submit') return { name: 'compose', mode: 'new', slug: b || null };
  if (a === 'edit' && b) return { name: 'compose', mode: 'edit', id: b };
  if (a === 'remix' && b) return { name: 'compose', mode: 'remix', id: b, n: c ? +c : null };
  if (a === 'u' && b) return { name: 'profile', username: b };
  if (['login', 'settings', 'inbox', 'mod', 'judge'].includes(a)) return { name: a };
  if (a === 'terms' || a === 'privacy') return { name: 'legal', doc: a };
  if (a === 'shorts') return { name: 'shorts', id: b || null };
  return { name: 'feed', special: 'home' };
}

async function route() {
  const v = parse(), prev = S.view;
  S.lastHash = S.curHash; S.curHash = currentHash(); // swipe mode's back button returns here
  if (prev.name === 'shorts' && v.name !== 'shorts') closeShorts();
  if (prev.name === 'post' && !(v.name === 'post' && v.id === prev.id)) closePost();
  if (prev.name === 'compose' && location.hash !== S.c?.hash) closeCompose();
  S.view = v; renderBoards(); trackView(v);
  if (v.name !== 'post') document.title = 'Slop';
  const samePage = prev.name === v.name && prev.id === v.id && prev.slug === v.slug && prev.special === v.special;
  if (!samePage) scrollTo(0, 0);
  if (v.name === 'feed') return renderFeed();
  if (v.name === 'post') return renderPost(v);
  if (v.name === 'compose') return renderCompose(v);
  if (v.name === 'login') return renderLogin();
  if (v.name === 'settings') return renderSettings();
  if (v.name === 'profile') return renderProfile(v);
  if (v.name === 'inbox') return renderInbox();
  if (v.name === 'mod') return renderMod();
  if (v.name === 'communities') return renderDirectory();
  if (v.name === 'judge') return renderJudge();
  if (v.name === 'cform') return renderCommunityForm(v);
  if (v.name === 'legal') return renderLegal(v.doc);
  if (v.name === 'shorts') return renderShorts(v);
}

// privacy-friendly visit counts: one count per page per browser session, nothing about the visitor
function trackView(v) {
  const key = v.name === 'feed' ? (v.slug ? 'c/' + v.slug : v.special === 'home' ? 'home' : v.special)
    : v.name === 'post' ? 'p/' + v.id : v.name === 'profile' ? 'u/' + v.username
    : v.name === 'legal' ? v.doc : ['judge', 'communities'].includes(v.name) ? v.name : null;
  countView(key);
}

export function renderBoards() {
  const v = S.view;
  const cur = v.name === 'feed' ? (v.slug ? 'c:' + v.slug : v.special) : v.name === 'post' ? 'c:' + (S.cache.get(v.id)?.community?.slug || '') : v.name === 'cform' && v.slug ? 'c:' + v.slug : v.name;
  const followed = [...S.my.keys()].map((id) => S.comms.get(id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const items = [['home', '홈', '#/'], ['popular', '인기', '#/popular'], ['shorts', '넘겨보기', '#/shorts'], ['judge', '판정하기', '#/judge'], ['gems', '보석함', '#/gems'], ['communities', '커뮤니티 찾기', '#/communities'],
    ...followed.map((c) => ['c:' + c.slug, c.name, '#/c/' + c.slug]),
    ...(api.me ? [['saved', '저장함', '#/saved']] : []), ...(anyCommunityMod() ? [['mod', '운영', '#/mod']] : [])];
  $('#boards').innerHTML = items.map(([k, l, h]) => `<a href="${h}" aria-current="${cur === k}">${esc(l)}</a>`).join('');
  // installed app: there is no browser back button, so show our own away from home
  const hb = $('#hBack'); if (hb) hb.hidden = !(isStandalone() && S.lastHash && !(v.name === 'feed' && v.special === 'home'));
}

export function renderAuth() {
  const el = $('#authArea'), m = api.me;
  $('#newBtn').hidden = !!(m && m.banned);
  if (!m) { el.innerHTML = `<a class="btn" href="#/login">${api.mode === 'demo' ? '데모 시작' : '로그인'}</a>`; return; }
  el.innerHTML = `<a class="iconbtn" href="#/inbox" aria-label="알림${S.unread ? ` ${S.unread}개` : ''}" title="알림">${icon('bell')}${S.unread ? `<span class="dot">${S.unread > 99 ? '99+' : S.unread}</span>` : ''}</a>
    <button class="authbtn" id="meBtn" aria-haspopup="menu" aria-expanded="false" style="border:0;background:none;padding:0;cursor:pointer">${avatarHtml(m, 34).replace('class="av', 'class="me av')}</button>
    <div class="menu" id="meMenu" role="menu" hidden><div class="who-line">${esc(m.name)} · @${esc(m.username)}${m.role !== 'member' ? ` · ${m.role === 'admin' ? '관리자' : '운영자'}` : ''}</div>
      <a href="#/u/${esc(m.username)}" role="menuitem">내 프로필</a><a href="#/saved" role="menuitem">저장함</a><a href="#/settings" role="menuitem">프로필 설정</a>
      <a href="#/communities/new" role="menuitem">커뮤니티 만들기</a>${anyCommunityMod() ? '<a href="#/mod" role="menuitem">운영</a>' : ''}${isStandalone() ? '' : '<button data-act="install" role="menuitem">앱 설치</button>'}<button id="logout" role="menuitem">로그아웃</button></div>`;
  const btn = $('#meBtn'), menu = $('#meMenu');
  btn.onclick = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); };
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
  if (e.target.closest('a[href="#/login"]') && currentHash() !== '#/login') try { sessionStorage.setItem('slop-after-login', currentHash()); } catch { /* */ }
  const t = e.target.closest('[data-act]'); if (!t) return;
  const { act, id } = t.dataset;
  if (act === 'vote') { e.preventDefault(); vote(t.dataset.t, id, +t.dataset.d); }
  else if (act === 'save') { e.preventDefault(); toggleSave(id); }
  else if (act === 'report') { e.preventDefault(); report(t.dataset.t, id); }
  else if (act === 'share') { e.preventDefault(); share(id, t.dataset.title || ''); }
  else if (act === 'sharebest') { e.preventDefault(); openShare('best/', '이번 주 보석 TOP 10', '이번 주 가장 많이 보석 판정을 받은 글 모음이에요. 링크를 붙이면 순위가 미리보기로 나와요.'); }
  else if (act === 'sharec') { e.preventDefault(); openShare(`c/${t.dataset.slug}/`, t.dataset.title || '', '이 커뮤니티에 친구를 초대해 보세요. 링크를 붙이면 커뮤니티 소개가 미리보기로 나와요.'); }
  else if (act === 'tool') { e.preventDefault(); S.filters = { ...S.filters, tool: S.filters?.tool === t.dataset.v ? null : t.dataset.v }; S.view.name === 'feed' ? renderFeed() : go('/popular'); }
  else if (act === 'tag') { e.preventDefault(); S.filters = { ...S.filters, tag: t.dataset.v }; S.view.name === 'feed' ? renderFeed() : go('/popular'); }
  else if (act === 'follow') { e.preventDefault(); toggleFollow(id); }
  else if (act === 'mod') { e.preventDefault(); modAction(t.dataset.op, t.dataset.t, id, t.dataset); }
  else if (act === 'install') { e.preventDefault(); openInstall(); }
  else if (act === 'block') { e.preventDefault(); toggleBlock(id, t.dataset.name); }
});
// the account menu closes on any outside click, on Esc and on navigation
function closeMenu() { const m = $('#meMenu'); if (m && !m.hidden) { m.hidden = true; $('#meBtn')?.setAttribute('aria-expanded', 'false'); } }
document.addEventListener('click', (e) => { if (!e.target.closest('#meMenu, #meBtn')) closeMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('hashchange', closeMenu);
// after logging in, go back to the page that asked for it, replacing the login entry in history
function goAfterLogin() {
  let after = null; try { after = sessionStorage.getItem('slop-after-login'); } catch { /* */ }
  if (!api.me || !after) return false;
  try { sessionStorage.removeItem('slop-after-login'); } catch { /* */ }
  if (after === currentHash()) return false;
  toAppUrl();
  location.replace(location.pathname + location.search + after); return true;
}
// on a /p/<id>/ page, in-app links (#/...) must stay in this document: fix the address first (capture phase)
document.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) toAppUrl(); }, true);
window.addEventListener('slop:unread', refreshUnread);
window.addEventListener('slop:follows', () => renderBoards());
const gq = $('#gq'); let gqT;
gq.addEventListener('input', () => { clearTimeout(gqT); gqT = setTimeout(() => { S.q = gq.value.trim(); if (S.view.name !== 'feed') go('/popular'); else renderFeed(); }, 250); });
document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); gq.focus(); } });

/* ---------- boot ---------- */
// installable app: register the service worker (production only); ?nosw removes it again
if ('serviceWorker' in navigator && import.meta.env.PROD && !isNativeApp) {
  if (new URLSearchParams(location.search).has('nosw')) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  else window.addEventListener('load', () => navigator.serviceWorker.register(BASE_PATH + 'sw.js').catch(() => {}));
}
document.body.classList.toggle('standalone', isStandalone());
$('#hBack').onclick = () => (history.length > 1 ? history.back() : go('/'));

async function boot() {
  if (api.mode === 'demo') {
    $('#modeBar').hidden = false;
    $('#modeBarText').innerHTML = '<b>데모 모드</b><span>서버 없이 이 브라우저에만 저장돼요. 데모 계정은 운영자 권한이 있어서 운영 기능도 써 볼 수 있어요.</span><button class="linkbtn" id="resetDemo">데모 초기화</button>';
    $('#resetDemo').onclick = async () => { await api.resetDemo(); S.cache.clear(); S.votes = { p: {}, c: {} }; S.saves = new Set(); S.my = new Map(); S.comms.clear(); toast('데모 데이터를 처음 상태로 되돌렸어요'); go('/'); renderAuth(); renderBoards(); };
  }
  try { await api.init(); } catch (e) { console.error(e); }
  // the PKCE login redirect lands with ?code=...; drop it and go back where the user was
  if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + (location.hash || '#/'));
  goAfterLogin();
  await afterAuth();
  api.onAuthChange(async () => { S.votes = { p: {}, c: {} }; await afterAuth(); if (!goAfterLogin()) route(); });
  window.addEventListener('hashchange', route);
  route();
}
async function afterAuth() {
  renderAuth();
  const [saves, reports] = await Promise.all([api.mySaves().catch(() => new Set()), api.myReports().catch(() => new Set()), loadMyCommunities(), api.loadBlocks()]);
  renderBoards();
  S.saves = saves; S.reports = reports;
  await refreshUnread();
  S.unsubNotes?.(); S.unsubNotes = api.subscribeNotifications(refreshUnread);
}
boot();
