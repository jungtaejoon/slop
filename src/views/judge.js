// Quick judge mode: one post at a time, ▲ gem / ▼ slop / skip, one tap each.
// The fastest way for a newcomer to take part, and it keeps the "waiting for a verdict" queue short.
import { api, S, $, app, KINDS, who, sandboxFrame, loadMyVotes, commLink, remember, vote, followIds, kindPill, judgeStats, recordVerdict, revealHtml } from '../core.js';
import { tt } from '../i18n.js';
import { esc, md, safeUrl, safeImgs, domain } from '../text.js';
import { getCode } from './feed.js';

let J = null;
const TRY_MS = 3000; // apps: look before you judge

export async function renderJudge() {
  const my = (J = { queue: [], i: 0, scope: J?.scope || 'all', token: Symbol() });
  app.innerHTML = '<div class="judge"><div class="skel" style="height:420px"></div></div>';
  try {
    const opts = { special: J.scope === 'mine' && followIds().length ? 'home' : null, followIds: followIds(), clang: S.prefs.clang, sort: 'pending', limit: 60 };
    const [pending, fresh] = await Promise.all([api.listPosts(opts), api.listPosts({ ...opts, sort: 'new', limit: 40 })]);
    if (J !== my || S.view.name !== 'judge') return;
    const seen = new Set(), all = [...pending.posts, ...fresh.posts].filter((p) => !seen.has(p.id) && seen.add(p.id));
    all.forEach((p) => { S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)); if (p.community) remember(p.community); });
    await loadMyVotes(all.map((p) => p.id));
    if (J !== my || S.view.name !== 'judge') return;
    // posts I haven't judged and didn't write, least-judged first
    my.queue = all.filter((p) => !S.votes.p[p.id] && p.authorId !== api.me?.id).sort((a, b) => (a.up + a.down) - (b.up + b.down) || b.createdAt - a.createdAt).map((p) => S.cache.get(p.id));
  } catch (e) { console.error(e); if (J === my && S.view.name === 'judge') app.innerHTML = '<div class="banner warnb">글을 불러오지 못했어요. 새로고침해 주세요.</div>'; return; }
  draw();
}

function draw() {
  const p = J.queue[J.i], st = judgeStats(), n = st.n; J.reveal = null; clearInterval(J.lockT);
  if (!p) {
    app.innerHTML = `<div class="judge"><div class="empty" style="text-align:center"><h2>판정할 글을 다 봤어요 🎉</h2><p class="muted">오늘 ${n}개를 판정했어요. 새 글이 올라오면 다시 와 주세요.</p>${st.known ? `<p class="muted">다른 사람과 같은 판정 ${st.agree}번 · 다른 판정 ${st.known - st.agree}번</p>` : ''}
      <div class="row" style="justify-content:center"><a class="btn pri" href="#/gems">보석함 보기</a><a class="btn" href="#/submit">내가 만든 것 올리기</a></div></div></div>`;
    return;
  }
  let preview = '';
  if (p.kind === 'html') preview = '<div class="runner judge-run" id="jRun"><div class="ph muted" style="display:grid;place-items:center;height:100%">불러오는 중…</div></div>';
  else if (p.kind === 'image' && safeImgs(p.images).length) preview = `<div class="gallery${safeImgs(p.images).length === 1 ? ' one' : ''}">${safeImgs(p.images).slice(0, 4).map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</div>`;
  else if (p.kind === 'link' && safeUrl(p.url)) preview = `<a class="linkcard" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><span class="d">${esc(domain(p.url))} ↗</span><span>${esc(p.url)}</span></a>`;
  else if (p.kind === 'code' && p.codeHead) preview = `<pre class="code">${esc(p.codeHead)}</pre>`;
  app.innerHTML = `<div class="judge">
    <div class="row judge-top"><div><h1 style="font-size:24px">판정하기</h1><p class="muted" style="margin:2px 0 0">하나씩 보고 바로 판정해요. 오늘 <b class="mono">${n}</b>개 · 남은 글 <b class="mono">${J.queue.length - J.i}</b>개</p>${st.known ? `<p class="muted jstat">다른 사람과 같은 판정 ${st.agree}번 · 다른 판정 ${st.known - st.agree}번</p>` : ''}</div><span class="sp"></span>
      <div class="seg" role="group" aria-label="범위">${[['all', '전체'], ['mine', '팔로우한 곳']].map(([k, l]) => `<button data-scope="${k}" aria-pressed="${J.scope === k}"${k === 'mine' && !api.me ? ' disabled' : ''}>${l}</button>`).join('')}</div></div>
    <article class="judge-card">
      <div class="pmeta">${kindPill(p.kind)}${commLink(p.community)}${p.tool ? `<span class="pill tool">${esc(p.tool)}</span>` : ''}${p.isExample ? '<span class="pill ex">예시</span>' : ''}${who(p.author, p.isExample)}</div>
      <h2 class="judge-title"><a href="#/p/${p.id}">${esc(p.title)}</a></h2>
      ${preview}${p.excerpt ? `<div class="md judge-body">${md(p.excerpt)}</div>${p.excerpt.length >= 395 ? `<a class="judge-more" href="#/p/${p.id}">…더 보기</a>` : ''}` : ''}
    </article>
    <div id="jReveal"></div>
    <p class="jlock" id="jLock" hidden></p>
    <div class="judge-actions" id="jActions">
      <button class="jbtn s" data-j="-1" title="슬롭 (←)">▼ 슬롭이다<small>←</small></button>
      <button class="jbtn k" data-j="0" title="건너뛰기 (↓)">모르겠어요<small>↓</small></button>
      <button class="jbtn g" data-j="1" title="보석 (→)">▲ 보석이다<small>→</small></button>
    </div>
  </div>`;
  if (p.kind === 'html') getCode(p.id).then((code) => { const el = $('#jRun'); if (el && J.queue[J.i] === p) el.replaceChildren(sandboxFrame(code || `<p>${tt('실행할 코드가 없어요')}</p>`, p.title)); });
  // apps: the verdict buttons wake up after a moment with the thing itself
  if (p.kind === 'html') {
    const until = Date.now() + TRY_MS, lock = $('#jLock'), btns = () => app.querySelectorAll('[data-j="1"],[data-j="-1"]');
    J.lockUntil = until; btns().forEach((b) => (b.disabled = true)); lock.hidden = false;
    const tick = () => { const left = Math.ceil((until - Date.now()) / 1000); if (left <= 0 || J.queue[J.i] !== p) { clearInterval(J.lockT); if (J.queue[J.i] === p && !J.reveal) { btns().forEach((b) => (b.disabled = false)); lock.hidden = true; } return; } lock.textContent = tt('먼저 직접 해 보세요. 판정 버튼이 곧 켜져요') + ` (${left})`; };
    tick(); J.lockT = setInterval(tick, 250);
  } else J.lockUntil = 0;
  app.querySelectorAll('[data-scope]').forEach((b) => (b.onclick = () => { J.scope = b.dataset.scope; renderJudge(); }));
  app.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => judge(+b.dataset.j)));
}

// A verdict is answered right away with how everyone else judged the same post; the vote
// saves in the background (a failed save shows its own toast). Reasons are left on the
// post page, where the full comment thread is.
async function judge(d) {
  const p = J.queue[J.i]; if (!p || J.busy) return;
  if (J.reveal) return next();
  if (d === 0) return next();
  if (J.lockUntil > Date.now()) return;
  const up0 = p.up, down0 = p.down;
  // the very first vote may need a guest sign-in; wait for that one so it isn't lost
  if (!api.uid()) {
    J.busy = true; app.querySelectorAll('[data-j]').forEach((b) => (b.disabled = true));
    const saved = await vote('p', p.id, d, { toggle: false });
    J.busy = false;
    if (!saved) { app.querySelectorAll('[data-j]').forEach((b) => (b.disabled = false)); return; }
  } else vote('p', p.id, d, { toggle: false });
  recordVerdict(d, up0, down0); J.reveal = d;
  $('#jReveal').innerHTML = revealHtml(d, up0, down0);
  $('#jActions').innerHTML = `<a class="jbtn k" href="#/p/${p.id}">이유 남기기<small>글로 가기</small></a><span></span><button class="jbtn n" id="jNext">다음 글<small>→</small></button>`;
  $('#jNext').onclick = next; $('#jNext').focus({ preventScroll: true });
  $('#jReveal').scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function next() { J.i++; draw(); window.scrollTo(0, 0); }

document.addEventListener('keydown', (e) => {
  if (S.view.name !== 'judge' || !J || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (J.reveal && e.key === 'Enter') return; // the focused "next" button handles it
  const k = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 0 }[e.key];
  if (k === undefined) return;
  e.preventDefault(); judge(k);
});
