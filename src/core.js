// Shared state, taxonomy and the small UI pieces every view uses.
import { createSupabaseApi } from './api/supabase.js';
import { createDemoApi } from './api/demo.js';
import { esc } from './text.js';

const SB_URL = import.meta.env.VITE_SUPABASE_URL, SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const api = SB_URL && SB_KEY ? createSupabaseApi(SB_URL, SB_KEY) : createDemoApi();

export const CATS = [
  ['web', '웹·앱', 'AI로 만든 웹페이지, 앱, 도구. 실행물로 올리면 바로 돌려볼 수 있어요.', 'html'],
  ['game', '게임', 'AI가 만든 게임과 장난감. 플레이해 보고 판정해 주세요.', 'html'],
  ['art', '이미지·아트', '생성 이미지, 일러스트, 디자인 시안.', 'image'],
  ['writing', '글·이야기', '시, 소설, 에세이, 가사 같은 AI 글.', 'text'],
  ['music', '음악·오디오', '생성 음악과 사운드. 링크나 실행물로 공유해요.', 'link'],
  ['video', '영상', '생성 영상과 애니메이션. 링크나 실행물로 공유해요.', 'link'],
  ['code', '코드·자동화', '스크립트, 함수, 자동화 레시피.', 'code'],
  ['prompt', '프롬프트·대화', '쓸 만한 프롬프트와 인상적인 대화 기록.', 'text'],
  ['idea', '아이디어·기획', 'AI가 낸 사업·기획·연구 아이디어.', 'text'],
  ['etc', '기타', '어디에도 안 맞는 것들.', 'text'],
];
export const CAT = Object.fromEntries(CATS.map(([k, l, d, dk]) => [k, { k, l, d, dk }]));
export const KINDS = { text: ['글', '본문 중심'], link: ['링크', '외부 주소'], image: ['이미지', '사진 업로드'], html: ['실행물', 'HTML 바로 실행'], code: ['코드', '복사해서 쓰기'] };
export const FLAIRS = { opinion: '의견', gem: '가치 발견', improve: '개선 제안', question: '질문', info: '출처·정보' };
export const TOOLS = ['Claude', 'ChatGPT', 'Gemini', 'Midjourney', 'Stable Diffusion', 'DALL·E', 'Flux', 'Suno', 'Udio', 'Sora', 'Runway', 'Cursor', 'Copilot', 'v0', 'Lovable'];
export const REPORT_REASONS = ['스팸·광고', '악성 코드·위험한 실행물', '혐오·괴롭힘', '개인정보 노출', '저작권 침해', '잘못된 게시판', '기타'];
export const MAX_CODE = 200 * 1024, MAX_BODY = 40000;

export const S = {
  prefs: { sort: 'hot', win: 'week', layout: 'card', csort: 'best' },
  view: { name: 'boot' }, q: '',
  cache: new Map(),          // post id -> post object (counts are mutated in place on vote)
  votes: { p: {}, c: {} },   // my votes
  saves: new Set(), reports: new Set(), unread: 0,
  d: null, c: null,          // post-detail and compose state
};
try { Object.assign(S.prefs, JSON.parse(localStorage.getItem('slop-prefs') || '{}')); } catch { /* defaults */ }
export const savePrefs = () => { try { localStorage.setItem('slop-prefs', JSON.stringify(S.prefs)); } catch { /* ignore */ } };

export const $ = (s, r = document) => r.querySelector(s);
export const app = document.getElementById('app');
export const me = () => api.me;
export const isMod = () => ['mod', 'admin'].includes(api.me?.role);
export const canWrite = () => !!(api.me && !api.me.banned);
export const go = (h) => { if (location.hash === '#' + h) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = h; };

let toastT;
export function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800); }
export const errMsg = (e, fallback = '저장하지 못했어요. 다시 시도해 주세요.') =>
  e?.code === '42501' ? (api.me?.banned ? '작성이 제한된 계정이에요.' : '권한이 없어요.') : e?.code === '23505' ? '이미 쓰이고 있는 값이에요.' : e?.code === 'too_large' ? e.message : e?.code === 'demo' ? e.message : fallback;

export function requireLogin(msg = '로그인이 필요해요') {
  if (api.me) { if (api.me.banned) { toast('작성이 제한된 계정이에요'); return false; } return true; }
  toast(msg); try { sessionStorage.setItem('slop-after-login', location.hash); } catch { /* ignore */ }
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
export async function vote(t, id, d) {
  if (!requireLogin('판정하려면 로그인해 주세요')) return;
  const o = t === 'p' ? S.cache.get(id) : S.d?.comments.find((c) => c.id === id); if (!o) return;
  const cur = S.votes[t][id] || 0, next = cur === d ? 0 : d;
  const apply = (from, to) => { if (from === 1) o.up--; if (from === -1) o.down--; if (to === 1) o.up++; if (to === -1) o.down++; S.votes[t][id] = to; refreshVote(t, id); };
  apply(cur, next);
  try { await api.vote(t, id, next); } catch (e) { apply(next, cur); toast(errMsg(e, '판정을 저장하지 못했어요')); }
}
export async function loadMyVotes(postIds = [], commentIds = []) {
  if (!api.me) return;
  try { const v = await api.myVotes({ postIds, commentIds }); Object.assign(S.votes.p, v.p); Object.assign(S.votes.c, v.c); } catch { /* counts still show */ }
}

export async function toggleSave(id) {
  if (!requireLogin('저장하려면 로그인해 주세요')) return;
  const on = !S.saves.has(id); on ? S.saves.add(id) : S.saves.delete(id);
  document.querySelectorAll(`[data-act="save"][data-id="${id}"]`).forEach((b) => (b.textContent = on ? '저장됨' : '저장'));
  try { await api.toggleSave(id, on); toast(on ? '저장함에 넣었어요' : '저장함에서 뺐어요'); }
  catch (e) { on ? S.saves.delete(id) : S.saves.add(id); toast(errMsg(e)); }
}

export function report(t, id) {
  if (!api.me) { requireLogin('신고하려면 로그인해 주세요'); return; }
  if (S.reports.has(`${t}:${id}`)) { toast('이미 신고했어요. 운영자가 확인할 거예요'); return; }
  openDialog({ title: t === 'p' ? '글 신고' : '댓글 신고', desc: '신고 내용은 운영자만 볼 수 있어요. 그냥 별로라면 신고 대신 ▼슬롭으로 판정해 주세요.', reasons: REPORT_REASONS, submit: '신고하기',
    onSubmit: async (reason, note) => { await api.report(t, id, reason, note); S.reports.add(`${t}:${id}`); document.querySelectorAll(`[data-act="report"][data-t="${t}"][data-id="${id}"]`).forEach((b) => (b.textContent = '신고함')); toast('신고했어요. 운영자가 확인할 거예요'); } });
}

export async function share(id, title) {
  const url = `${location.origin}${location.pathname}#/p/${id}`;
  try { if (navigator.share && matchMedia('(pointer:coarse)').matches) { await navigator.share({ title, url }); return; } await navigator.clipboard.writeText(url); toast('링크를 복사했어요'); }
  catch { prompt?.('이 주소를 복사하세요', url); }
}
