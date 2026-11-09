// Quick judge mode: one post at a time, ▲ gem / ▼ slop / skip, with an
// optional one-line reason. The fastest way for a newcomer to take part,
// and it keeps the "waiting for a verdict" queue short.
import { api, S, $, app, KINDS, who, sandboxFrame, loadMyVotes, requireLogin, commLink, remember, toast, errMsg, vote, followIds } from '../core.js';
import { esc, md, safeUrl, domain } from '../text.js';
import { getCode } from './feed.js';

let J = null;
const todayKey = () => 'slop-judged-' + new Date().toISOString().slice(0, 10);
const judgedToday = () => { try { return +localStorage.getItem(todayKey()) || 0; } catch { return 0; } };
const bump = () => { try { localStorage.setItem(todayKey(), judgedToday() + 1); } catch { /* */ } };

export async function renderJudge() {
  const my = (J = { queue: [], i: 0, scope: J?.scope || 'all', token: Symbol() });
  app.innerHTML = '<div class="judge"><div class="skel" style="height:420px"></div></div>';
  try {
    const opts = { special: J.scope === 'mine' && followIds().length ? 'home' : null, followIds: followIds(), sort: 'pending', limit: 60 };
    const [pending, fresh] = await Promise.all([api.listPosts(opts), api.listPosts({ ...opts, sort: 'new', limit: 40 })]);
    if (J !== my) return;
    const seen = new Set(), all = [...pending.posts, ...fresh.posts].filter((p) => !seen.has(p.id) && seen.add(p.id));
    all.forEach((p) => { S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)); if (p.community) remember(p.community); });
    await loadMyVotes(all.map((p) => p.id));
    if (J !== my) return;
    // posts I haven't judged and didn't write, least-judged first
    my.queue = all.filter((p) => !S.votes.p[p.id] && p.authorId !== api.me?.id).sort((a, b) => (a.up + a.down) - (b.up + b.down) || b.createdAt - a.createdAt).map((p) => S.cache.get(p.id));
  } catch (e) { console.error(e); app.innerHTML = '<div class="banner warnb">글을 불러오지 못했어요. 새로고침해 주세요.</div>'; return; }
  draw();
}

function draw() {
  const p = J.queue[J.i], n = judgedToday();
  if (!p) {
    app.innerHTML = `<div class="judge"><div class="empty" style="text-align:center"><h2>판정할 글을 다 봤어요 🎉</h2><p class="muted">오늘 ${n}개를 판정했어요. 새 글이 올라오면 다시 와 주세요.</p>
      <div class="row" style="justify-content:center"><a class="btn pri" href="#/gems">보석함 보기</a><a class="btn" href="#/submit">내가 만든 것 올리기</a></div></div></div>`;
    return;
  }
  let preview = '';
  if (p.kind === 'html') preview = '<div class="runner judge-run" id="jRun"><div class="ph muted" style="display:grid;place-items:center;height:100%">불러오는 중…</div></div>';
  else if (p.kind === 'image' && p.images.length) preview = `<div class="gallery${p.images.length === 1 ? ' one' : ''}">${p.images.slice(0, 4).map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</div>`;
  else if (p.kind === 'link' && safeUrl(p.url)) preview = `<a class="linkcard" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><span class="d">${esc(domain(p.url))} ↗</span><span>${esc(p.url)}</span></a>`;
  else if (p.kind === 'code' && p.codeHead) preview = `<pre class="code">${esc(p.codeHead)}</pre>`;
  app.innerHTML = `<div class="judge">
    <div class="row judge-top"><div><h1 style="font-size:24px">판정하기</h1><p class="muted" style="margin:2px 0 0">하나씩 보고 바로 판정해요. 오늘 <b class="mono">${n}</b>개 · 남은 글 <b class="mono">${J.queue.length - J.i}</b>개</p></div><span class="sp"></span>
      <div class="seg" role="group" aria-label="범위">${[['all', '전체'], ['mine', '팔로우한 곳']].map(([k, l]) => `<button data-scope="${k}" aria-pressed="${J.scope === k}"${k === 'mine' && !api.me ? ' disabled' : ''}>${l}</button>`).join('')}</div></div>
    <article class="judge-card">
      <div class="pmeta">${commLink(p.community)}<span class="pill">${esc(KINDS[p.kind]?.[0] || '')}</span>${p.tool ? `<span class="pill tool">${esc(p.tool)}</span>` : ''}${p.isExample ? '<span class="pill ex">예시</span>' : ''}${who(p.author, p.isExample)}<span class="mono">보석 ${p.up} · 슬롭 ${p.down}</span></div>
      <h2 class="judge-title"><a href="#/p/${p.id}">${esc(p.title)}</a></h2>
      ${preview}${p.excerpt ? `<div class="md judge-body">${md(p.excerpt)}${p.excerpt.length >= 395 ? ' <a href="#/p/' + p.id + '">…더 보기</a>' : ''}</div>` : ''}
    </article>
    <div class="judge-actions">
      <button class="jbtn s" data-j="-1" title="슬롭 (←)">▼ 슬롭이다<small>←</small></button>
      <button class="jbtn k" data-j="0" title="건너뛰기 (↓)">모르겠어요<small>↓</small></button>
      <button class="jbtn g" data-j="1" title="보석 (→)">▲ 보석이다<small>→</small></button>
    </div>
    <form class="judge-why" id="why" hidden><label for="whyText" id="whyLabel"></label><div class="row" style="flex-wrap:nowrap"><input type="text" id="whyText" maxlength="300" placeholder="한 줄이면 충분해요 (선택)"><button class="btn sm pri" type="submit">남기기</button><button class="btn sm ghost" type="button" id="whySkip">다음 글</button></div></form>
  </div>`;
  if (p.kind === 'html') getCode(p.id).then((code) => { const el = $('#jRun'); if (el && J.queue[J.i] === p) el.replaceChildren(sandboxFrame(code || '<p>실행할 코드가 없어요</p>', p.title)); });
  app.querySelectorAll('[data-scope]').forEach((b) => (b.onclick = () => { J.scope = b.dataset.scope; renderJudge(); }));
  app.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => judge(+b.dataset.j)));
  $('#whySkip').onclick = next;
  $('#why').onsubmit = async (e) => {
    e.preventDefault(); const text = $('#whyText').value.trim(); if (!text) return next();
    try { await api.addComment({ postId: p.id, text, flair: J.last > 0 ? 'gem' : 'improve', version: p.version }); p.comments++; toast('이유를 남겼어요'); } catch (err) { toast(errMsg(err, '댓글을 남기지 못했어요')); }
    next();
  };
}

async function judge(d) {
  const p = J.queue[J.i]; if (!p) return;
  if (d === 0) return next();
  if (!requireLogin('판정하려면 로그인해 주세요')) return;
  J.last = d; await vote('p', p.id, d); bump();
  app.querySelectorAll('[data-j]').forEach((b) => (b.disabled = true));
  const w = $('#why'); w.hidden = false;
  $('#whyLabel').textContent = d > 0 ? '어디가 보석인가요? 이유를 남기면 "가치 발견" 댓글이 돼요.' : '무엇이 아쉬웠나요? 이유를 남기면 "개선 제안" 댓글이 돼요.';
  $('#whyText').focus();
}
function next() { J.i++; draw(); window.scrollTo(0, 0); }

document.addEventListener('keydown', (e) => {
  if (S.view.name !== 'judge' || !J || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 0 }[e.key];
  if (k === undefined || !$('#why')?.hidden) return;
  e.preventDefault(); judge(k);
});
