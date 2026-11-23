import { api, S, $, app, KINDS, FLAIRS, voteBox, verdictInner, who, avatarHtml, sandboxFrame, savePrefs, loadMyVotes, canWrite, isMod, isCommunityMod, remember, commLink, requireLogin, toast, errMsg, go, vote, icon, kindPill, aiBadge } from '../core.js';
import { esc, md, safeUrl, safeImgs, domain, ago, diffHtml, ytId, readMins } from '../text.js';

export function closePost() { S.d?.unsub?.(); S.d = null; }

export async function renderPost(v) {
  if (S.d?.id === v.id) { S.d.sel = v.n; drawArticle(); drawSide(); return; }
  closePost();
  const d = S.d = { id: v.id, sel: v.n, versions: [], comments: [], loaded: false, tab: 'run', collapsed: new Set(), expanded: new Set(), replyTo: null, editing: null, drafts: {}, flair: 'opinion', delArm: false };
  const pre = app.querySelector('.article.prerender'); // static copy on /p/<id>/ pages: keep it until the post loads
  app.innerHTML = `<a class="crumb" href="#/" id="crumb">← 게시판으로</a><div class="layout"><div style="min-width:0"><div id="pArticle">${pre ? pre.outerHTML : '<div class="skel skel-load" style="height:320px" role="status"><span class="spin" aria-hidden="true"></span><span>글을 불러오는 중…</span></div>'}</div><div id="pThread"></div></div><aside class="side" id="pSide"></aside></div>`;
  try {
    const [post, versions, comments] = await Promise.all([api.getPost(v.id), api.getVersions(v.id), api.listComments(v.id)]);
    if (S.d !== d) return;
    if (!post) { $('#pArticle').innerHTML = '<div class="banner">글을 찾을 수 없어요. 삭제되었거나 운영자가 숨긴 글일 수 있어요.</div>'; return; }
    if (post.blockedAuthor) { $('#pArticle').innerHTML = `<div class="banner">차단한 사용자의 글이라 보이지 않아요. <button class="btn sm" data-act="block" data-id="${esc(post.authorId)}">차단 풀기</button></div>`; return; }
    S.cache.set(post.id, Object.assign(S.cache.get(post.id) || {}, post));
    d.post = S.cache.get(post.id); d.versions = versions; d.comments = comments; d.loaded = true;
    d.editions = post.langGroup ? await api.listEditions(post.langGroup).catch(() => []) : [];
    await loadMyVotes([post.id], comments.map((c) => c.id));
    if (S.d !== d) return;
    if (post.community) { remember(post.community); $('#crumb').href = '#/c/' + post.community.slug; $('#crumb').textContent = '← ' + post.community.name; }
    if (isMod()) api.listCommunities({ limit: 200 }).then((l) => { l.forEach(remember); if (S.d === d) drawArticle(); }).catch(() => {});
    document.title = `${post.title} · Slop`;
    drawArticle(); drawThread(); drawSide();
    voteFromLink(post.id);
    let t; d.unsub = api.subscribeComments(v.id, () => { clearTimeout(t); t = setTimeout(reloadComments, 400); });
    api.listRemixes(v.id).then((r) => { if (S.d === d) { d.remixes = r; drawSide(); } }).catch(() => {});
  } catch (e) { console.error(e); if (S.d === d) $('#pArticle').innerHTML = '<div class="banner warnb">글을 불러오지 못했어요. 새로고침해 주세요.</div>'; }
}

// collection pages (/ai-games/ …) link here with ?vote=1 or ?vote=-1: cast that verdict once, then drop it from the address
async function voteFromLink(id) {
  const m = location.search.match(/[?&]vote=(-?1)(?:&|$)/); if (!m) return;
  const q = location.search.replace(/[?&]vote=-?1/, '').replace(/^&/, '?');
  history.replaceState(history.state, '', location.pathname + (q === '?' ? '' : q) + location.hash);
  const ok = await vote('p', id, +m[1], { toggle: false });
  if (ok) { toast(+m[1] === 1 ? '▲ 보석으로 판정했어요. 직접 해 보고 바꿔도 돼요' : '▼ 슬롭으로 판정했어요. 직접 해 보고 바꿔도 돼요'); document.querySelector(`[data-verdict="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}

async function reloadComments() {
  const d = S.d; if (!d) return;
  try { const cs = await api.listComments(d.id); if (S.d !== d) return; const known = new Set(d.comments.map((c) => c.id)); d.comments = cs; await loadMyVotes([], cs.filter((c) => !known.has(c.id)).map((c) => c.id)); d.post.comments = cs.filter((c) => !c.deleted && !c.hidden).length; drawThread(); drawSide(); } catch { /* keep what we have */ }
}

export const LANG_NAMES = { ko: '한국어', en: 'English' };
// version picker, language editions, and (for the author) editions that fell behind this one
function editionBar(p, v, mine) {
  const d = S.d, eds = d.editions || [], vs = d.versions;
  const langs = eds.length > 1 ? `<div class="seg edseg" role="group" aria-label="언어판">${eds.map((e) => `<a href="#/p/${e.id}" aria-current="${e.id === p.id}" lang="${e.lang}">${LANG_NAMES[e.lang] || e.lang}</a>`).join('')}</div>` : '';
  const pick = vs.length > 1 ? `<label class="verpick"><span>버전</span><select id="verSel">${vs.slice().reverse().map((x) => `<option value="${x.n}"${x.n === v.n ? ' selected' : ''}>v${x.n}${x.n === vs[vs.length - 1].n ? ' (최신)' : ''}</option>`).join('')}</select></label>` : '';
  const behind = mine ? eds.filter((e) => e.id !== p.id && e.version < p.version) : [];
  return (langs || pick ? `<div class="edrow">${langs}${pick}</div>` : '')
    + behind.map((e) => `<div class="oldver">${LANG_NAMES[e.lang] || e.lang}판은 아직 v${e.version}이에요. 이 글은 v${p.version}이에요. <a href="#/edit/${e.id}">그 언어판도 새 버전 올리기</a></div>`).join('');
}

const curVer = () => { const vs = S.d.versions; if (!vs.length) return null; return vs.find((x) => x.n === S.d.sel) || vs[vs.length - 1]; };

function drawArticle() {
  const d = S.d, p = d?.post, el = $('#pArticle'); if (!p || !el) return;
  const v = curVer() || { n: p.version, title: p.title, body: p.body, url: p.url, images: p.images, code: p.code, prompt: p.prompt };
  const latest = d.versions.length ? d.versions[d.versions.length - 1].n : p.version, old = v.n !== latest, prev = d.versions.find((x) => x.n === v.n - 1);
  const mine = api.me && p.authorId === api.me.id, canMod = isCommunityMod(p.communityId);
  let main = '';
  if (p.kind === 'link' && safeUrl(v.url)) {
    const yt = ytId(v.url);
    if (yt) main += `<button type="button" class="ytbox" data-yt="${yt}" aria-label="영상 재생"><img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" referrerpolicy="no-referrer"><i>${icon('play')}</i></button>`;
    main += `<a class="linkcard" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer"><span class="lc-ic">${icon('ext')}</span><span class="lc-t"><span class="d">${esc(domain(v.url))}</span><span>${esc(v.url)}</span></span></a><p class="trustnote">${icon('ext')}<span>Slop 밖의 사이트예요. 새 탭에서 열려요.</span></p>`;
  }
  const imgs = safeImgs(v.images);
  if ((p.kind === 'image' || p.kind === 'link') && imgs.length) main += `<div class="gallery${imgs.length === 1 ? ' one' : imgs.length === 2 ? ' two' : ''}">${imgs.map((u, i) => `<a href="${esc(u)}" data-lb="${i}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="" loading="lazy"></a>`).join('')}</div>${imgs.length > 1 ? `<p class="trustnote"><span>이미지 ${imgs.length}장 · 눌러서 크게 보기</span></p>` : ''}`;
  if (p.kind === 'html' || p.kind === 'code') {
    const tabs = p.kind === 'html' ? [['run', '실행'], ['code', '코드']] : [['code', '코드']]; if (prev) tabs.push(['diff', `v${prev.n} 대비 변경점`]);
    if (!tabs.some((t) => t[0] === d.tab)) d.tab = tabs[0][0];
    main += `<div class="stage" id="pStage"><div class="stage-bar"><div class="seg">${tabs.map(([k, l]) => `<button data-ptab="${k}" aria-pressed="${d.tab === k}">${l}</button>`).join('')}</div><span class="sp"></span>
      ${p.codeLang ? `<span class="pill">${esc(p.codeLang)}</span>` : ''}${d.tab === 'run' ? '<button class="btn sm" id="rerun">다시 실행</button><button class="btn sm" id="fs">전체화면</button>' : ''}${d.tab === 'code' ? `<button class="btn sm" id="wrapBtn" aria-pressed="${!!d.wrap}">줄 바꿈</button><button class="btn sm" id="dl">${icon('download')}<span>내려받기</span></button>` : ''}${d.tab !== 'diff' ? `<button class="btn sm" id="copy">${icon('copy')}<span>코드 복사</span></button>` : ''}</div>
      <div id="stageBody"></div></div>${p.kind === 'html' ? `<p class="trustnote">${icon('shield')}<span>격리된 창에서 실행돼요. 이 실행물은 내 Slop 계정이나 저장된 정보에 접근할 수 없어요.</span></p>` : ''}`;
  }
  if (v.body) main += `<div class="md">${md(v.body)}</div>`;
  if ((p.kind === 'text' || p.kind === 'link' || p.kind === 'image') && prev && (prev.body || '') !== (v.body || '')) main += `<details class="prompt"><summary>v${prev.n} 대비 본문 변경점</summary>${diffHtml(prev.body || '', v.body || '')}</details>`;
  if (v.prompt) main += `<details class="prompt"${p.community?.slug === 'prompt' || p.kind === 'image' ? ' open' : ''}><summary>사용한 프롬프트</summary><pre>${esc(v.prompt)}</pre><button type="button" class="btn sm" id="copyPrompt">${icon('copy')}<span>프롬프트 복사</span></button></details>`;
  el.innerHTML = `<article class="article k-${p.kind}">${voteBox('p', p.id)}<div class="content">
    <div><div class="pmeta">${p.pinned ? '<span class="pill pin">고정</span>' : ''}${p.hidden ? '<span class="pill warn">숨김</span>' : ''}${p.locked ? '<span class="pill">댓글 잠김</span>' : ''}
      ${kindPill(p.kind)}${commLink(p.community)}
      ${p.tool ? `<button class="pill tool" data-act="tool" data-v="${esc(p.tool)}">${esc(p.tool)}</button>` : ''}<span class="pill gem" data-gembadge="${p.id}"${p.isGem ? '' : ' hidden'}>보석</span>${p.isExample ? '<span class="pill ex">예시</span>' : ''}
      ${who(p.author, p.isExample)}<span>${ago(p.createdAt)}</span>${p.version > 1 ? `<span>· 수정 ${ago(p.updatedAt)}</span>` : ''}${p.views ? `<span>· 조회 ${p.views}</span>` : ''}${p.kind === 'text' && (v.body || '').length > 400 ? `<span>· 읽는 데 ${readMins(v.body)}분</span>` : ''}</div>
    <h1 lang="${/[가-힣]/.test(v.title || p.title) ? 'ko' : 'en'}">${esc(v.title || p.title)}</h1>
    ${p.remixOf ? `<div class="muted" style="font-size:13px;margin:-4px 0 8px">↳ 리믹스 원본: <a href="#/p/${esc(p.remixOf)}${p.remixOfVersion ? '/v/' + p.remixOfVersion : ''}"><span${p.remixTitle ? ' data-ugc' : ''}>${esc(p.remixTitle || '원본 글')}</span>${p.remixOfVersion ? ` v${p.remixOfVersion}` : ''}</a></div>` : ''}
    ${p.hidden ? `<div class="banner warnb" style="margin:0 0 8px">운영자가 숨긴 글이에요${p.hiddenReason ? ` (사유: ${esc(p.hiddenReason)})` : ''}. 작성자와 운영자에게만 보여요.</div>` : ''}
    ${mine && Date.now() - p.createdAt < 3 * 864e5 && p.up + p.down < 3 && !p.hidden ? `<div class="nudge"><div><b>판정을 더 받아 보세요.</b> 친구나 단톡방, 관련 커뮤니티에 공유하면 보석인지 슬롭인지 금방 모여요.</div><button class="btn sm gem" data-act="share" data-id="${p.id}" data-title="${esc(p.title)}">공유하기</button></div>` : ''}
    ${editionBar(p, v, mine)}
    ${old ? `<div class="oldver">지금 v${v.n}을 보고 있어요. 최신은 v${latest}이에요. <a href="#/p/${p.id}">최신 보기</a></div>` : ''}</div>
    ${main}
    <div class="verdict mverdict" data-verdict="${p.id}">${verdictInner(p.id)}</div>
    ${p.tags.length ? `<div class="chips">${p.tags.map((t) => `<button class="chip" data-act="tag" data-v="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="pact"><button class="btn ghost" data-act="save" data-id="${p.id}">${S.saves.has(p.id) ? '저장됨' : '저장'}</button><button class="btn ghost" data-act="share" data-id="${p.id}" data-title="${esc(p.title)}">공유</button>
      ${canWrite() ? `<a class="btn ghost" href="#/remix/${p.id}/${v.n}">리믹스</a>` : ''}${(mine || isMod()) && canWrite() ? `<a class="btn ghost" href="#/edit/${p.id}">새 버전 올리기</a>` : ''}
      ${mine && canWrite() ? Object.keys(LANG_NAMES).filter((l) => l !== p.lang && !(d.editions || []).some((e) => e.lang === l)).map((l) => `<a class="btn ghost" href="#/translate/${p.id}/${l}">${LANG_NAMES[l]}판 올리기</a>`).join('') : ''}
      ${mine || canMod ? `<button class="btn ghost danger" id="delPost">${d.delArm ? '정말 삭제할까요? 한 번 더 누르세요' : '삭제'}</button>` : ''}
      ${api.me && !mine ? `<button class="btn ghost" data-act="report" data-t="p" data-id="${p.id}">${S.reports.has('p:' + p.id) ? '신고함' : '신고'}</button>` : ''}
      ${api.me && !mine && p.authorId ? `<button class="btn ghost" data-act="block" data-id="${esc(p.authorId)}" data-name="${esc(p.author?.name || '')}">작성자 차단</button>` : ''}</div>
    ${canMod ? modBar(p) : ''}
  </div></article>`;
  const vsel = $('#verSel'); if (vsel) vsel.onchange = () => go(`/p/${p.id}${+vsel.value === latest ? '' : '/v/' + vsel.value}`);
  const sb = $('#stageBody');
  if (sb) {
    if (d.tab === 'run') mountRunner(sb, v.code || '');
    else if (d.tab === 'code') sb.innerHTML = codeView(v.code || '', d.wrap);
    else sb.innerHTML = diffHtml(prev.code || '', v.code || '');
    el.querySelectorAll('[data-ptab]').forEach((b) => (b.onclick = () => { d.tab = b.dataset.ptab; drawArticle(); }));
    // restarting only swaps the frame, so fullscreen stays on
    const rr = $('#rerun'); if (rr) rr.onclick = () => { mountRunner(sb, v.code || ''); if (isFull($('#pStage'))) focusRunner($('#pStage')); };
    const fs = $('#fs'); if (fs) bindFullscreen($('#pStage'), fs);
    const wb = $('#wrapBtn'); if (wb) wb.onclick = () => { d.wrap = !d.wrap; drawArticle(); };
    const dl = $('#dl'); if (dl) dl.onclick = () => downloadCode(p, v);
    const cp = $('#copy'); if (cp) cp.onclick = () => navigator.clipboard?.writeText(v.code || '').then(() => toast('코드를 복사했어요'), () => toast('복사하지 못했어요. 코드 탭에서 직접 선택해 주세요'));
  }
  const cpp = $('#copyPrompt'); if (cpp) cpp.onclick = () => navigator.clipboard?.writeText(v.prompt || '').then(() => toast('프롬프트를 복사했어요'), () => toast('복사하지 못했어요'));
  el.querySelectorAll('[data-lb]').forEach((a) => (a.onclick = (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); openLightbox(imgs, +a.dataset.lb); }));
  const yb = el.querySelector('.ytbox'); if (yb) yb.onclick = () => { const f = document.createElement('iframe'); f.className = 'ytframe'; f.src = `https://www.youtube-nocookie.com/embed/${yb.dataset.yt}?autoplay=1`; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = 'YouTube'; f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin'); yb.replaceWith(f); };
  const del = $('#delPost');
  if (del) del.onclick = async () => {
    if (!d.delArm) { d.delArm = true; drawArticle(); return; }
    del.disabled = true;
    try { await api.deletePost(p.id); if (canMod && !mine) await api.log('delete', 'post', p.id, p.title, '', p.communityId); S.cache.delete(p.id); toast('삭제했어요'); go(p.community ? '/c/' + p.community.slug : '/'); }
    catch (e) { toast(errMsg(e, '삭제하지 못했어요')); del.disabled = false; }
  };
}

// code with line numbers; numbers are hidden while wrapping, where they would no longer line up
function codeView(code, wrap) {
  const n = code.split('\n').length;
  return `<div class="codeview${wrap ? ' wrap' : ''}"><pre class="gut" aria-hidden="true">${Array.from({ length: n }, (_, i) => i + 1).join('\n')}</pre><pre class="code">${esc(code)}</pre></div>`;
}
const EXT = { python: 'py', py: 'py', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', bash: 'sh', sh: 'sh', shell: 'sh', html: 'html', css: 'css', json: 'json', sql: 'sql', lua: 'lua', go: 'go', rust: 'rs', java: 'java', c: 'c', cpp: 'cpp', ruby: 'rb', php: 'php', swift: 'swift', kotlin: 'kt', markdown: 'md', yaml: 'yml' };
function downloadCode(p, v) {
  const ext = p.kind === 'html' ? 'html' : EXT[(p.codeLang || '').toLowerCase()] || 'txt';
  const name = ((v.title || p.title || 'slop').toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'slop') + '.' + ext;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([v.code || ''], { type: 'text/plain;charset=utf-8' })); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
// in-page image viewer: arrows or swipe-free buttons to move, Esc or the backdrop to close
function openLightbox(imgs, start) {
  let i = start; const back = document.activeElement, box = document.createElement('div');
  box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '이미지 크게 보기');
  const draw = () => { box.innerHTML = `<button class="lb-x" data-lbact="close" aria-label="닫기">${icon('x')}</button>${imgs.length > 1 ? `<button class="lb-nav prev" data-lbact="prev" aria-label="이전 이미지">${icon('left')}</button><button class="lb-nav next" data-lbact="next" aria-label="다음 이미지">${icon('right')}</button><span class="lb-count mono">${i + 1} / ${imgs.length}</span>` : ''}<img src="${esc(imgs[i])}" alt=""><a class="lb-open" href="${esc(imgs[i])}" target="_blank" rel="noopener">${icon('ext')}<span>원본 열기</span></a>`; box.querySelector('.lb-x').focus(); };
  const close = () => { box.remove(); document.removeEventListener('keydown', key, true); back?.focus?.(); };
  const move = (n) => { i = (i + n + imgs.length) % imgs.length; draw(); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1); };
  box.onclick = (e) => { const a = e.target.closest('[data-lbact]')?.dataset.lbact; if (a === 'prev') move(-1); else if (a === 'next') move(1); else if (a === 'close' || e.target === box) close(); };
  document.addEventListener('keydown', key, true); document.body.append(box); draw();
}

function modBar(p) {
  return `<div class="modbar"><span class="label">운영</span>
    <button class="btn sm" data-act="mod" data-op="pin" data-t="p" data-id="${p.id}">${p.pinned ? '고정 해제' : '게시판 상단 고정'}</button>
    <button class="btn sm" data-act="mod" data-op="${p.hidden ? 'unhide' : 'hide'}" data-t="p" data-id="${p.id}">${p.hidden ? '숨김 해제' : '숨기기'}</button>
    <button class="btn sm" data-act="mod" data-op="${p.locked ? 'unlock' : 'lock'}" data-t="p" data-id="${p.id}">${p.locked ? '댓글 잠금 해제' : '댓글 잠금'}</button>
    ${isMod() ? `<select class="inline" id="moveCat" aria-label="커뮤니티 이동">${[...S.comms.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((c) => `<option value="${c.id}"${c.id === p.communityId ? ' selected' : ''}>${c.id === p.communityId ? '커뮤니티: ' : ''}${esc(c.name)}${c.id === p.communityId ? '' : '로 이동'}</option>`).join('')}</select>` : ''}
    ${isMod() && p.authorId && p.authorId !== api.me?.id ? `<button class="btn sm danger" data-act="mod" data-op="ban" data-t="u" data-id="${p.authorId}" data-name="${esc(p.author?.name || '')}">작성자 제한</button>` : ''}</div>`;
}
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'moveCat' || !S.d?.post) return; const p = S.d.post, cid = e.target.value, c = S.comms.get(cid);
  try { await api.modUpdatePost(p.id, { community_id: cid }); p.communityId = cid; p.community = { id: cid, slug: c.slug, name: c.name }; await api.log('move', 'post', p.id, p.title, c.name, cid); toast(`${c.name}(으)로 옮겼어요`); drawArticle(); } catch (err) { toast(errMsg(err, '옮기지 못했어요')); }
});
/* ---------- the run tab: a loading cover until the frame is up, and fullscreen ---------- */
function mountRunner(sb, code) {
  const r = document.createElement('div'), f = sandboxFrame(code), cover = document.createElement('div');
  r.className = 'runner loading';
  cover.className = 'run-load'; cover.setAttribute('role', 'status');
  cover.innerHTML = '<span class="spin" aria-hidden="true"></span><span>실행물을 불러오는 중…</span>';
  // the frame's load event fires once its scripts have run; give it two frames (or 150 ms where frames
  // are paused, e.g. a hidden tab) to draw its first picture
  const show = () => r.classList.remove('loading');
  const ready = () => { requestAnimationFrame(() => requestAnimationFrame(show)); setTimeout(show, 150); };
  f.addEventListener('load', ready, { once: true });
  setTimeout(() => r.classList.remove('loading'), 20000); // never leave the cover up for good
  r.append(f, cover); sb.replaceChildren(r);
}
const nativeFull = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function isFull(stage) { return !!stage && (nativeFull() === stage || stage.classList.contains('pseudo-fs')); }
function focusRunner(stage) { setTimeout(() => stage.querySelector('iframe')?.focus(), 60); }
let pseudoEsc = null;
function bindFullscreen(stage, btn) {
  const sync = () => {
    const on = isFull(stage); btn.textContent = on ? '전체화면 끝내기' : '전체화면'; btn.setAttribute('aria-pressed', String(on));
  };
  const exitPseudo = () => { stage.classList.remove('pseudo-fs'); sync(); };
  btn.onclick = async () => {
    if (isFull(stage)) {
      if (stage.classList.contains('pseudo-fs')) exitPseudo();
      else await Promise.resolve((document.exitFullscreen || document.webkitExitFullscreen)?.call(document)).catch(() => {});
      return;
    }
    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    let ok = false;
    if (req) { try { await req.call(stage); ok = nativeFull() === stage; } catch { ok = false; } }
    // phones without the Fullscreen API (iPhone Safari): fill the window instead
    if (!ok) stage.classList.add('pseudo-fs');
    sync(); focusRunner(stage);
  };
  stage.onfullscreenchange = stage.onwebkitfullscreenchange = () => { sync(); if (isFull(stage)) focusRunner(stage); };
  if (pseudoEsc) removeEventListener('keydown', pseudoEsc);
  pseudoEsc = (e) => { if (e.key === 'Escape' && stage.isConnected && stage.classList.contains('pseudo-fs')) exitPseudo(); };
  addEventListener('keydown', pseudoEsc);
}

export function redrawPost() { if (S.d) { drawArticle(); drawThread(); drawSide(); } }

/* ---------- comments ---------- */
function drawThread() {
  const d = S.d, p = d?.post, el = $('#pThread'); if (!p || !el) return;
  const focusKey = document.activeElement?.dataset?.draft, caret = document.activeElement?.selectionStart;
  const canMod = isCommunityMod(p.communityId), sortK = S.prefs.csort, all = d.comments, ids = new Set(all.map((c) => c.id));
  const kids = {}; all.forEach((c) => (kids[c.parentId && ids.has(c.parentId) ? c.parentId : 'root'] ??= []).push(c));
  const order = (arr) => arr.slice().sort(sortK === 'new' ? (a, b) => b.createdAt - a.createdAt : sortK === 'old' ? (a, b) => a.createdAt - b.createdAt
    : (a, b) => (b.up - b.down + (b.flair === 'gem' ? 0.5 : 0)) - (a.up - a.down + (a.flair === 'gem' ? 0.5 : 0)) || b.createdAt - a.createdAt);
  const count = (id) => (kids[id] || []).reduce((n, c) => n + 1 + count(c.id), 0);
  const box = (key, ph) => `<div class="cbox">${key === 'root' ? `<div class="flairs" role="group" aria-label="댓글 종류">${Object.entries(FLAIRS).map(([k, l]) => `<button data-flair="${k}" aria-pressed="${d.flair === k}">${l}</button>`).join('')}</div>` : ''}
    <textarea data-draft="${key}" rows="${key === 'root' ? 3 : 2}" maxlength="4000" placeholder="${ph}" aria-label="댓글"></textarea>
    <div class="row"><span class="hint">${key === 'root' ? '좋은 점을 짚을 땐 "가치 발견", 고칠 점은 "개선 제안"을 골라 주세요.' : ''}</span><span class="sp"></span>${key !== 'root' ? '<button class="btn sm ghost" data-cancel="1">취소</button>' : ''}<button class="btn sm pri" data-send="${key}">${key.startsWith('edit:') ? '수정 저장' : '댓글 달기'}</button></div></div>`;
  const node = (c, depth) => {
    const ch = order(kids[c.id] || []), mine = api.me && c.authorId === api.me.id, sc = c.up - c.down;
    const low = !c.deleted && sc <= -4 && !d.expanded.has(c.id), col = d.collapsed.has(c.id) || low;
    if (col) return `<button class="collapsed" data-expand="${c.id}">[+] ${c.deleted ? '삭제된 댓글' : low ? `점수가 낮아 접힌 댓글 (${sc}점)` : '접힌 댓글'} · 답글 ${count(c.id)}개</button>`;
    return `<div class="cmt${c.flair === 'gem' && !c.deleted ? ' gemc' : ''}" id="c-${c.id}"><button class="rail" data-collapse="${c.id}" title="접기" aria-label="이 스레드 접기"><i></i></button><div style="min-width:0">
      <div class="ch">${c.blocked ? '<span>차단한 사용자</span>' : c.deleted ? '<span>삭제됨</span>' : `${c.author ? `<a class="who nm" href="#/u/${esc(c.author.username)}">${avatarHtml(c.author, 22)}<span>${esc(c.author.name)}</span>${aiBadge(c.author)}</a>` : '<span>탈퇴한 사용자</span>'}${c.authorId && c.authorId === p.authorId ? '<span class="pill">작성자</span>' : ''}
        ${c.flair !== 'opinion' ? `<span class="flair ${esc(c.flair)}">${esc(FLAIRS[c.flair] || '')}</span>` : ''}`}<span class="pill">v${c.version}</span>${c.hidden ? '<span class="pill warn">숨김</span>' : ''}${c.resolvedIn ? `<a class="pill gem" href="#/p/${p.id}/v/${c.resolvedIn}" style="text-decoration:none">v${c.resolvedIn}에서 반영</a>` : ''}<span>${ago(c.createdAt)}</span>${c.editedAt ? '<span>· 수정됨</span>' : ''}</div>
      ${d.editing === c.id ? box('edit:' + c.id, '') : (c.blocked ? '<div class="muted">[차단한 사용자의 댓글]</div>' : c.deleted ? '<div class="muted">[삭제된 댓글]</div>' : `<div class="ctext">${esc(c.text)}</div>`)}
      ${c.deleted || c.blocked ? '' : `<div class="cact">${voteBox('c', c.id, true)}${canWrite() && !p.locked && depth < 8 ? `<button class="linkbtn" data-reply="${c.id}">답글</button>` : ''}
        ${mine && canWrite() ? `<button class="linkbtn" data-edit="${c.id}">수정</button>` : ''}${mine || canMod ? `<button class="linkbtn" data-delc="${c.id}">삭제</button>` : ''}
        ${api.me && !mine ? `<button class="linkbtn" data-act="report" data-t="c" data-id="${c.id}">${S.reports.has('c:' + c.id) ? '신고함' : '신고'}</button><button class="linkbtn" data-act="block" data-id="${esc(c.authorId || '')}" data-name="${esc(c.author?.name || '')}"${c.authorId ? '' : ' hidden'}>차단</button>` : ''}
        ${api.me && p.authorId === api.me.id && (c.flair === 'improve' || c.flair === 'question') && !c.resolvedIn ? `<button class="linkbtn" data-resolve="${c.id}">반영함 표시 (v${p.version})</button>` : ''}
        ${canMod ? `<button class="linkbtn" data-act="mod" data-op="${c.hidden ? 'unhide' : 'hide'}" data-t="c" data-id="${c.id}">${c.hidden ? '숨김 해제' : '숨기기'}</button>${isMod() && c.authorId && c.authorId !== api.me?.id ? `<button class="linkbtn" data-act="mod" data-op="ban" data-t="u" data-id="${c.authorId}" data-name="${esc(c.author?.name || '')}">작성자 제한</button>` : ''}` : ''}</div>`}
      ${d.replyTo === c.id ? box(c.id, '답글을 남겨 주세요') : ''}
      ${ch.map((x) => node(x, depth + 1)).join('')}</div></div>`;
  };
  const roots = order(kids.root || []), total = all.filter((c) => !c.deleted).length;
  el.innerHTML = `<section class="thread" id="comments"><div class="thread-head"><h2>의견 ${total}개</h2><span class="sp"></span>
    <div class="seg" role="group" aria-label="댓글 정렬">${[['best', '베스트'], ['new', '최신'], ['old', '오래된 순']].map(([k, l]) => `<button data-csort="${k}" aria-pressed="${sortK === k}">${l}</button>`).join('')}</div></div>
    ${p.locked ? '<p class="muted" style="font-size:13px">운영자가 이 글의 댓글을 잠갔어요. 기존 의견은 읽을 수 있어요.</p>'
      : canWrite() ? box('root', '이 결과물에서 가치 있는 점, 아쉬운 점, 고칠 점을 남겨 주세요')
      : api.me ? '<p class="muted" style="font-size:13px">작성이 제한된 계정이에요.</p>' : '<p class="muted" style="font-size:13px">의견을 남기려면 로그인해 주세요. <a class="btn sm" href="#/login">로그인</a></p>'}
    ${roots.length ? roots.map((c) => node(c, 0)).join('') : '<p class="muted" style="font-size:13px">아직 의견이 없어요. 첫 판정 이유를 남겨 주세요.</p>'}</section>`;
  el.querySelectorAll('textarea[data-draft]').forEach((t) => {
    const k = t.dataset.draft; t.value = d.drafts[k] ?? (k.startsWith('edit:') ? d.comments.find((c) => c.id === k.slice(5))?.text || '' : '');
    t.oninput = () => (d.drafts[k] = t.value);
    t.onkeydown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') el.querySelector(`[data-send="${k}"]`)?.click(); };
    if (k === focusKey) { t.focus(); try { t.setSelectionRange(caret, caret); } catch { /* */ } }
  });
  el.onclick = threadClick;
}

async function threadClick(e) {
  const t = e.target.closest('button'); if (!t || !S.d) return; const d = S.d, p = d.post, D = t.dataset;
  if (D.flair) { d.flair = D.flair; drawThread(); }
  else if (D.csort) { S.prefs.csort = D.csort; savePrefs(); drawThread(); }
  else if (D.collapse) { d.collapsed.add(D.collapse); drawThread(); }
  else if (D.expand) { d.collapsed.delete(D.expand); d.expanded.add(D.expand); drawThread(); }
  else if (D.reply) { if (!requireLogin()) return; d.replyTo = D.reply; d.editing = null; drawThread(); $(`textarea[data-draft="${D.reply}"]`)?.focus(); }
  else if (D.edit) { d.editing = D.edit; d.replyTo = null; drawThread(); $(`textarea[data-draft="edit:${D.edit}"]`)?.focus(); }
  else if (D.cancel) { d.replyTo = null; d.editing = null; drawThread(); }
  else if (D.send) {
    const k = D.send, text = (d.drafts[k] || '').trim(); if (!text) return; t.disabled = true;
    try {
      if (k.startsWith('edit:')) { const id = k.slice(5); await api.editComment(id, text); Object.assign(d.comments.find((c) => c.id === id), { text, editedAt: Date.now() }); d.editing = null; }
      else {
        const c = await api.addComment({ postId: p.id, parentId: k === 'root' ? null : k, text, flair: k === 'root' ? d.flair : 'opinion', version: curVer()?.n || p.version });
        if (!d.comments.some((x) => x.id === c.id)) d.comments.push(c); p.comments++;
        if (k !== 'root') d.replyTo = null; else d.flair = 'opinion';
      }
      delete d.drafts[k]; drawThread(); drawSide();
    } catch (err) { t.disabled = false; toast(errMsg(err, '댓글을 저장하지 못했어요. 다시 시도해 주세요')); }
  } else if (D.delc) {
    const hasKids = d.comments.some((c) => c.parentId === D.delc), c = d.comments.find((x) => x.id === D.delc); t.disabled = true;
    try { await api.deleteComment(D.delc, hasKids); if (hasKids) Object.assign(c, { deleted: true, text: '' }); else d.comments = d.comments.filter((x) => x.id !== D.delc); if (isCommunityMod(p.communityId) && c.authorId !== api.me.id) await api.log('delete', 'comment', c.id, c.text.slice(0, 60), '', p.communityId); drawThread(); }
    catch (err) { toast(errMsg(err, '삭제하지 못했어요')); t.disabled = false; }
  } else if (D.resolve) {
    t.disabled = true; try { await api.resolveComment(D.resolve, p.version); d.comments.find((c) => c.id === D.resolve).resolvedIn = p.version; drawThread(); toast('반영함으로 표시했어요'); } catch (err) { toast(errMsg(err)); t.disabled = false; }
  }
}

/* ---------- side rail ---------- */
function drawSide() {
  const d = S.d, p = d?.post, el = $('#pSide'); if (!p || !el) return; const v = curVer();
  el.innerHTML = `<section class="panel"><h2>커뮤니티 판정</h2><div class="verdict" data-verdict="${p.id}">${verdictInner(p.id)}</div></section>
    ${api.aiAvailable ? `<section class="panel"><h2>토론 요약</h2><p>댓글과 판정을 Claude가 정리해 줘요. 어디가 보석이고 어디가 슬롭인지 한눈에 봐요.</p>
      <div id="sumOut">${d.sum ? `<div class="ai-sum"><div class="md">${md(d.sum)}</div></div>` : ''}</div>
      <button class="btn sm" id="sumGo" ${d.comments.filter((c) => !c.deleted).length ? '' : 'disabled title="댓글이 생기면 요약할 수 있어요"'}>${d.sum ? '다시 요약' : '요약하기'}</button></section>` : ''}
    ${d.versions.length > 1 ? `<section class="panel"><h2>수정 이력</h2><div class="hist">${d.versions.slice().reverse().map((x) => `<a href="#/p/${p.id}/v/${x.n}" aria-current="${x.n === v?.n}"><b class="mono">v${x.n}</b><div><div${x.note ? ' data-ugc' : ''}>${esc(x.note || '메모 없음')}</div><div class="m">${ago(x.createdAt)} · 이 버전에 단 의견 ${d.comments.filter((c) => c.version === x.n).length}</div></div></a>`).join('')}</div></section>` : ''}
    ${d.remixes?.length ? `<section class="panel"><h2>이 글의 리믹스</h2><div class="hist">${d.remixes.map((x) => `<a href="#/p/${x.id}"><b class="mono">${x.score}</b><div><span data-ugc>${esc(x.title)}</span><div class="m">${ago(x.createdAt)}</div></div></a>`).join('')}</div></section>` : ''}
    <section class="panel"><h2>작성 정보</h2><p>${who(p.author, p.isExample)}</p><p>${p.community ? `<span>${esc(p.community.name)}</span> · ` : ''}<span>${esc(KINDS[p.kind]?.[0] || '')}</span>${p.tool ? ` · <span data-ugc>${esc(p.tool)}</span>` : ''}</p>
      ${p.isExample ? '<p>Slop이 게시판 사용법을 보여 주려고 Claude로 만들어 올린 예시예요. 판정과 의견은 실제로 남길 수 있어요.</p>' : ''}</section>`;
  const sg = $('#sumGo'); if (sg) sg.onclick = () => summarize(sg);
}

async function summarize(btn) {
  const d = S.d; if (!requireLogin('요약하려면 로그인해 주세요')) return;
  btn.disabled = true; const out = $('#sumOut'); out.innerHTML = '<p class="muted">정리하는 중…</p>';
  try { const r = await api.ai('summary', { postId: d.id }); if (S.d !== d) return; d.sum = r.text; drawSide(); }
  catch (e) { if (S.d === d) { out.innerHTML = `<p class="muted">${esc(e.code === 'not_configured' ? '이 사이트에는 아직 Claude 연결이 설정되지 않았어요.' : e.code === 'rate_limited' ? '요청이 많아요. 잠시 후 다시 시도해 주세요.' : '요약하지 못했어요.')}</p>`; btn.disabled = false; } }
}
