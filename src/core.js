// Shared state, taxonomy and the small UI pieces every view uses.
import { createSupabaseApi } from './api/supabase.js';
import { createDemoApi } from './api/demo.js';
import { esc } from './text.js';
import { lang, tt } from './i18n.js';

const SB_URL = import.meta.env.VITE_SUPABASE_URL, SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const api = SB_URL && SB_KEY ? createSupabaseApi(SB_URL, SB_KEY) : createDemoApi();

export const KINDS = { text: ['글', '본문 중심'], link: ['링크', '외부 주소'], image: ['이미지', '사진 업로드'], html: ['실행물', 'HTML 바로 실행'], code: ['코드', '복사해서 쓰기'] };
export const FLAIRS = { opinion: '의견', gem: '가치 발견', improve: '개선 제안', question: '질문', info: '출처·정보' };
export const TOOLS = ['Claude', 'ChatGPT', 'Gemini', 'Midjourney', 'Stable Diffusion', 'DALL·E', 'Flux', 'Suno', 'Udio', 'Sora', 'Runway', 'Cursor', 'Copilot', 'v0', 'Lovable'];
export const REPORT_REASONS = ['스팸·광고', '악성 코드·위험한 실행물', '혐오·괴롭힘', '개인정보 노출', '저작권 침해', '잘못된 게시판', '기타'];
export const MAX_CODE = 200 * 1024, MAX_BODY = 40000;

export const S = {
  prefs: { sort: 'hot', win: 'week', layout: 'card', csort: 'best', clang: lang === 'en' ? 'en' : 'all' }, // English visitors start on English posts
  view: { name: 'boot' }, q: '',
  cache: new Map(),          // post id -> post object (counts are mutated in place on vote)
  votes: { p: {}, c: {} },   // my votes
  saves: new Set(), reports: new Set(), unread: 0,
  d: null, c: null,          // post-detail and compose state
  comms: new Map(),          // community id -> community
  my: new Map(),             // followed community id -> my role ('member' | 'mod')
};
try { Object.assign(S.prefs, JSON.parse(localStorage.getItem('slop-prefs') || '{}')); } catch { /* defaults */ }
export const savePrefs = () => { try { localStorage.setItem('slop-prefs', JSON.stringify(S.prefs)); } catch { /* ignore */ } };

export const $ = (s, r = document) => r.querySelector(s);
export const app = document.getElementById('app');
export const me = () => api.me;
export const isMod = () => ['mod', 'admin'].includes(api.me?.role);
export const canWrite = () => !!(api.me && !api.me.banned);
export const isCommunityMod = (cid) => isMod() || S.my.get(cid) === 'mod';
export const anyCommunityMod = () => isMod() || [...S.my.values()].includes('mod');
export const followIds = () => [...S.my.keys()];
export const remember = (c) => { if (c) S.comms.set(c.id, Object.assign(S.comms.get(c.id) || {}, c)); return c && S.comms.get(c.id); };
export const commBySlug = (slug) => [...S.comms.values()].find((c) => c.slug === slug) || null;
export const commLink = (c) => (c ? `<a class="cat" href="#/c/${esc(c.slug)}">${cav(c)}${esc(c.name)}</a>` : '<span class="cat">알 수 없는 커뮤니티</span>');

export async function loadMyCommunities() {
  S.my = new Map();
  if (!api.me) return;
  try { for (const { role, community } of await api.myCommunities()) { remember(community); S.my.set(community.id, role); } } catch (e) { console.error(e); }
}

// follow / unfollow with an optimistic button update
export async function toggleFollow(cid) {
  if (!requireLogin('팔로우하려면 로그인해 주세요')) return;
  const on = !S.my.has(cid), c = S.comms.get(cid);
  if (!on && S.my.get(cid) === 'mod') { toast('운영 중인 커뮤니티는 팔로우를 끊을 수 없어요'); return; }
  on ? S.my.set(cid, 'member') : S.my.delete(cid);
  if (c) c.members += on ? 1 : -1;
  const sync = () => { document.querySelectorAll(`[data-act="follow"][data-id="${cid}"]`).forEach((b) => { b.textContent = S.my.has(cid) ? '팔로우 중' : '팔로우'; b.classList.toggle('pri', !S.my.has(cid)); }); document.querySelectorAll(`[data-members="${cid}"]`).forEach((el) => (el.textContent = c?.members ?? '')); window.dispatchEvent(new Event('slop:follows')); };
  sync();
  try { await (on ? api.follow(cid) : api.unfollow(cid)); toast(on ? `${c?.name || '커뮤니티'}를 팔로우했어요` : '팔로우를 끊었어요'); }
  catch (e) { on ? S.my.delete(cid) : S.my.set(cid, 'member'); if (c) c.members += on ? -1 : 1; sync(); toast(errMsg(e)); }
}
export const followBtn = (c, sm) => c ? `<button class="btn${sm ? ' sm' : ''}${S.my.has(c.id) ? '' : ' pri'}" data-act="follow" data-id="${c.id}">${S.my.has(c.id) ? '팔로우 중' : '팔로우'}</button>` : '';
// The app lives at BASE_PATH (e.g. /slop-lab/). Posts and communities also exist as real
// paths (/slop-lab/p/<id>/, /slop-lab/c/<slug>/), built for search engines and link previews.
// Those pages load this same app, which then takes the route from the path (no hash yet).
export const BASE_PATH = new URL(document.baseURI).pathname.replace(/[^/]*$/, '');
export function currentHash() {
  if (location.hash.replace(/^#\/?/, '')) return location.hash;
  const rest = location.pathname.startsWith(BASE_PATH) ? location.pathname.slice(BASE_PATH.length) : '';
  const m = rest.match(/^(p|c|u)\/([^/]+)\/?$/);
  return m ? `#/${m[1]}/${m[2]}` : location.hash || '#/';
}
// before navigating away from a path page, give the address the app's own form, so hash links stay in this page
export function toAppUrl() { if (location.pathname !== BASE_PATH) history.replaceState(history.state, '', BASE_PATH + location.search + currentHash()); }
export const go = (h) => { toAppUrl(); if (location.hash === '#' + h) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = h; };
// like go(), but replaces the current history entry (for redirects, so Back doesn't bounce)
export const replaceTo = (h) => { toAppUrl(); if (location.hash === '#' + h) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.replace(location.pathname + location.search + '#' + h); };

let toastT;
export function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800); }
export const errMsg = (e, fallback = '저장하지 못했어요. 다시 시도해 주세요.') =>
  e?.code === '42501' ? (api.me?.banned ? '작성이 제한된 계정이에요.' : '권한이 없어요.') : e?.code === '23505' ? '이미 쓰이고 있는 값이에요.' : e?.code === '54000' ? '커뮤니티는 하루에 두 개까지 만들 수 있어요.' : e?.code === 'SL429' ? '짧은 시간에 너무 많이 올렸어요. 잠시 후 다시 해 주세요.' : e?.code === 'too_large' ? e.message : e?.code === 'demo' ? e.message : fallback;

export function requireLogin(msg = '로그인이 필요해요') {
  if (api.me) { if (api.me.banned) { toast('작성이 제한된 계정이에요'); return false; } return true; }
  toast(msg); try { sessionStorage.setItem('slop-after-login', currentHash()); } catch { /* ignore */ }
  go('/login'); return false;
}

export function avatarHtml(a, size = 16) {
  if (a?.avatar) return `<img class="av" src="${esc(a.avatar)}" alt="" width="${size}" height="${size}" loading="lazy" referrerpolicy="no-referrer">`;
  const ch = (a?.name || 'S').trim().slice(0, 1).toUpperCase();
  return `<span class="av av-fallback" style="width:${size}px;height:${size}px">${esc(ch)}</span>`;
}
export function who(a, isExample) {
  if (!a) return `<span class="who">${avatarHtml({ name: 'S' })}<span>${isExample ? 'Slop Lab 예시' : '탈퇴한 사용자'}</span></span>`;
  return `<a class="who" href="#/u/${esc(a.username)}">${avatarHtml(a)}<span>${esc(a.name)}${api.me?.id === a.id ? ' (나)' : ''}</span></a>`;
}

export function sandboxFrame(code, title = '실행물') {
  const f = document.createElement('iframe');
  f.setAttribute('sandbox', 'allow-scripts allow-pointer-lock allow-modals');
  f.setAttribute('referrerpolicy', 'no-referrer');
  f.title = title; f.srcdoc = code; return f;
}

/* ---------- dialog ---------- */
export function openDialog({ title, desc, reasons, submit, onSubmit, noteLabel = '자세한 내용 (선택)' }) {
  const d = $('#dlg'), f = $('#dlgForm'), back = document.activeElement;
  f.innerHTML = `<h2>${esc(title)}</h2>${desc ? `<p class="muted" style="margin:0;font-size:13px">${esc(desc)}</p>` : ''}
    ${reasons ? `<div class="reasons" role="radiogroup">${reasons.map((r, i) => `<label><input type="radio" name="rsn" value="${esc(r)}"${i ? '' : ' checked'}> ${esc(r)}</label>`).join('')}</div>` : ''}
    <textarea id="dlgNote" rows="3" maxlength="500" placeholder="${esc(noteLabel)}"></textarea>
    <div class="row"><span class="hint" id="dlgSt"></span><span class="sp"></span><button type="button" class="btn sm" id="dlgCancel">취소</button><button type="submit" class="btn sm pri">${esc(submit)}</button></div>`;
  d.hidden = false; (f.querySelector('input') || f.querySelector('textarea'))?.focus();
  const close = () => { d.hidden = true; f.innerHTML = ''; back?.focus?.(); };
  $('#dlgCancel').onclick = close; d.onclick = (e) => { if (e.target === d) close(); }; f.onkeydown = (e) => { if (e.key === 'Escape') close(); };
  f.onsubmit = async (e) => {
    e.preventDefault(); const reason = f.querySelector('input[name=rsn]:checked')?.value || '', note = $('#dlgNote').value.trim(), b = f.querySelector('[type=submit]'); b.disabled = true;
    try { await onSubmit(reason, note); close(); } catch (err) { b.disabled = false; $('#dlgSt').textContent = errMsg(err); }
  };
}

/* ---------- votes ---------- */
const scoreOf = (o) => (o ? o.up - o.down : 0);
export function voteInner(t, id) {
  const o = t === 'p' ? S.cache.get(id) : S.d?.comments.find((c) => c.id === id), mine = S.votes[t][id] || 0;
  return `<button class="up" data-act="vote" data-t="${t}" data-id="${id}" data-d="1" aria-pressed="${mine === 1}" aria-label="보석: 가치 있음" title="보석: 가치 있음">▲</button><span class="sc mono">${scoreOf(o)}</span><button class="dn" data-act="vote" data-t="${t}" data-id="${id}" data-d="-1" aria-pressed="${mine === -1}" aria-label="슬롭: 가치 없음" title="슬롭: 가치 없음">▼</button>`;
}
export const voteBox = (t, id, h) => `<div class="vote${h ? ' h' : ''}" data-vs="${t}:${id}">${voteInner(t, id)}</div>`;
export function verdictInner(id) {
  const p = S.cache.get(id), up = p?.up || 0, down = p?.down || 0, tot = up + down, pct = tot ? Math.round((up / tot) * 100) : 0, mine = S.votes.p[id] || 0;
  return `<div class="vbar" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <div class="vnums"><span class="g">보석 <b class="mono">${up}</b></span><span class="muted">${tot ? `${pct}% 보석 판정 · ${tot}표` : '아직 판정 없음'}</span><span class="s">슬롭 <b class="mono">${down}</b></span></div>
    <div class="verbtns"><button class="g" data-act="vote" data-t="p" data-id="${id}" data-d="1" aria-pressed="${mine === 1}">▲ 보석이다</button><button class="s" data-act="vote" data-t="p" data-id="${id}" data-d="-1" aria-pressed="${mine === -1}">▼ 슬롭이다</button></div>`;
}
function refreshVote(t, id) {
  document.querySelectorAll(`[data-vs="${t}:${id}"]`).forEach((el) => (el.innerHTML = voteInner(t, id)));
  if (t === 'p') {
    document.querySelectorAll(`[data-verdict="${id}"]`).forEach((el) => (el.innerHTML = verdictInner(id)));
    const p = S.cache.get(id); if (p) { p.isGem = p.up >= 3 && p.up * 4 >= 3 * (p.up + p.down); document.querySelectorAll(`[data-gembadge="${id}"]`).forEach((el) => (el.hidden = !p.isGem)); }
  }
}
const voting = new Set();
// Saves a verdict and returns true on success. Visitors vote as guests (no sign-up).
// Pressing the same button again takes the vote back, except with { toggle: false }
// (Judge mode), so a double tap can't undo a verdict.
export async function vote(t, id, d, { toggle = true } = {}) {
  if (api.me?.banned) { toast('작성이 제한된 계정이에요'); return false; }
  const key = t + id; if (voting.has(key)) return false;
  const o = t === 'p' ? S.cache.get(id) : S.d?.comments.find((c) => c.id === id); if (!o) return false;
  voting.add(key);
  try {
    if (!api.me && !(await api.signInGuest())) { requireLogin('판정하려면 로그인해 주세요'); return false; }
    const cur = S.votes[t][id] || 0, next = toggle && cur === d ? 0 : d;
    if (next === cur) return true;
    const apply = (from, to) => { if (from === 1) o.up--; if (from === -1) o.down--; if (to === 1) o.up++; if (to === -1) o.down++; S.votes[t][id] = to; refreshVote(t, id); };
    apply(cur, next);
    try { await api.vote(t, id, next); } catch (e) { apply(next, cur); toast(errMsg(e, '판정을 저장하지 못했어요')); return false; }
    if (!api.me) { let seen = true; try { seen = !!sessionStorage.getItem('slop-guest-hint'); sessionStorage.setItem('slop-guest-hint', '1'); } catch { /* */ } if (!seen) toast('판정했어요. 이유를 남기거나 글을 올리려면 가입해 주세요'); }
    return true;
  } finally { voting.delete(key); }
}
export async function loadMyVotes(postIds = [], commentIds = []) {
  if (!api.uid()) return;
  try { const v = await api.myVotes({ postIds, commentIds }); Object.assign(S.votes.p, v.p); Object.assign(S.votes.c, v.c); } catch { /* counts still show */ }
}

export async function toggleSave(id) {
  if (!requireLogin('저장하려면 로그인해 주세요')) return;
  const on = !S.saves.has(id); on ? S.saves.add(id) : S.saves.delete(id);
  document.querySelectorAll(`[data-act="save"][data-id="${id}"]`).forEach((b) => { const l = b.querySelector('[data-save-label]'); if (l) { l.textContent = on ? '저장됨' : '저장'; b.querySelector('svg').outerHTML = icon(on ? 'bookmarked' : 'bookmark'); } else b.textContent = on ? '저장됨' : '저장'; });
  try { await api.toggleSave(id, on); toast(on ? '저장함에 넣었어요' : '저장함에서 뺐어요'); }
  catch (e) { on ? S.saves.delete(id) : S.saves.add(id); toast(errMsg(e)); }
}

export function report(t, id) {
  if (!api.me) { requireLogin('신고하려면 로그인해 주세요'); return; }
  if (S.reports.has(`${t}:${id}`)) { toast('이미 신고했어요. 운영자가 확인할 거예요'); return; }
  openDialog({ title: t === 'p' ? '글 신고' : '댓글 신고', desc: '신고 내용은 운영자만 볼 수 있어요. 그냥 별로라면 신고 대신 ▼슬롭으로 판정해 주세요.', reasons: REPORT_REASONS, submit: '신고하기',
    onSubmit: async (reason, note) => { await api.report(t, id, reason, note); S.reports.add(`${t}:${id}`); document.querySelectorAll(`[data-act="report"][data-t="${t}"][data-id="${id}"]`).forEach((b) => (b.textContent = '신고함')); toast('신고했어요. 운영자가 확인할 거예요'); } });
}

// shareable URL: the static preview page (link previews), which redirects into the app
export const shareUrl = (path) => `${location.origin}${BASE_PATH}${path}`;

export function openShare(path, title, lead = '') {
  const url = shareUrl(path), text = lang === 'en' ? `${tt(title)} | Gem or slop? Judge it on Slop Lab` : `${title} | Slop Lab에서 보석인지 슬롭인지 판정해 주세요`;
  title = lang === 'en' ? tt(title) : title;
  if (navigator.share && matchMedia('(pointer:coarse)').matches) { navigator.share({ title, text, url }).catch(() => {}); return; }
  const e = encodeURIComponent, d = $('#dlg'), f = $('#dlgForm'), back = document.activeElement;
  f.innerHTML = `<h2>공유하기</h2>${lead ? `<p class="muted" style="margin:0;font-size:13px">${esc(lead)}</p>` : ''}
    <div class="row" style="flex-wrap:nowrap"><input type="text" id="shUrl" readonly value="${esc(url)}" aria-label="공유 주소"><button type="button" class="btn sm pri" id="shCopy">복사</button></div>
    <div class="row"><a class="btn sm" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}">X</a>
      <a class="btn sm" target="_blank" rel="noopener" href="https://www.threads.net/intent/post?text=${e(text + ' ' + url)}">스레드</a>
      <a class="btn sm" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${e(url)}">페이스북</a>
      <a class="btn sm" target="_blank" rel="noopener" href="https://www.reddit.com/submit?url=${e(url)}&title=${e(title)}">레딧</a></div>
    <p class="hint" style="margin:0">카카오톡·슬랙·디스코드에는 주소를 복사해 붙여 넣으면 제목과 그림이 미리보기로 나와요. 새 글은 미리보기가 나오기까지 최대 3시간쯤 걸릴 수 있어요.</p>
    <div class="row"><span class="sp"></span><button type="button" class="btn sm" id="dlgCancel">닫기</button></div>`;
  d.hidden = false; $('#shUrl').select();
  const close = () => { d.hidden = true; f.innerHTML = ''; back?.focus?.(); };
  $('#dlgCancel').onclick = close; d.onclick = (ev) => { if (ev.target === d) close(); }; f.onkeydown = (ev) => { if (ev.key === 'Escape') close(); }; f.onsubmit = (ev) => ev.preventDefault();
  $('#shCopy').onclick = () => navigator.clipboard?.writeText(url).then(() => toast('링크를 복사했어요'), () => { $('#shUrl').select(); toast('선택해 두었어요. ⌘C로 복사해 주세요'); });
}
export const share = (id, title) => openShare(`p/${id}/`, title);

/* ---------- icons (lucide-style, stroke) ---------- */
const P = {
  comment: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>', bookmarked: '<path d="M6 3h12v18l-6-4-6 4Z" fill="currentColor"/>',
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  play: '<path d="M7 4v16l13-8Z" fill="currentColor"/>', text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  flag: '<path d="M5 21V4h11l-1 4 4 0v9H9l1-4H5"/>',
};
export const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
const GRADS = ['linear-gradient(135deg,#0E9F96,#3B82C4)', 'linear-gradient(135deg,#6D5BD0,#C2418F)', 'linear-gradient(135deg,#E2702A,#D9466F)', 'linear-gradient(135deg,#1F9D55,#0E9F96)',
  'linear-gradient(135deg,#3B5BDB,#6D5BD0)', 'linear-gradient(135deg,#D97706,#E2702A)', 'linear-gradient(135deg,#0F766E,#155E75)', 'linear-gradient(135deg,#BE185D,#7C3AED)'];
export const gradFor = (key = '') => GRADS[[...String(key)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % GRADS.length];
export const cav = (c, lg) => (c ? `<span class="cav${lg ? ' lg' : ''}" style="--cv:${gradFor(c.slug)}" aria-hidden="true">${esc([...(c.slug || c.name || '?')][0].toUpperCase())}</span>` : '');
