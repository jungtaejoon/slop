import { api, S, $, app, CAT, KINDS, REPORT_REASONS, isMod, who, openDialog, toast, errMsg } from '../core.js';
import { esc, ago } from '../text.js';
import { redrawPost } from './post.js';

const ACT = { hide: '숨김', unhide: '숨김 해제', lock: '댓글 잠금', unlock: '잠금 해제', pin: '고정', unpin: '고정 해제', ban: '작성 제한', unban: '제한 해제', dismiss: '신고 기각', delete: '삭제', move: '게시판 이동' };
let armed = null;

// one entry point for every moderation button (data-act="mod")
export async function modAction(op, t, id, ds = {}) {
  if (!isMod()) return;
  const post = t === 'p' ? S.cache.get(id) : null, comment = t === 'c' ? S.d?.comments.find((c) => c.id === id) || S.modData?.comments.find((c) => c.id === id) : null;
  const label = post?.title || comment?.text?.slice(0, 60) || ds.name || '';
  const type = t === 'p' ? 'post' : t === 'c' ? 'comment' : 'user';
  const done = (msg) => { toast(msg); if (S.view.name === 'mod') renderMod(); else redrawPost(); };
  try {
    if (op === 'hide') return openDialog({ title: t === 'p' ? '글 숨기기' : '댓글 숨기기', desc: '숨긴 항목은 작성자와 운영자에게만 보여요. 언제든 되돌릴 수 있어요. 이 항목의 신고는 처리된 것으로 정리돼요.', reasons: REPORT_REASONS, submit: '숨기기',
      onSubmit: async (r, n) => { const reason = n ? `${r} · ${n}` : r;
        if (t === 'p') { await api.modUpdatePost(id, { hidden: true, hidden_reason: reason }); if (post) Object.assign(post, { hidden: true, hiddenReason: reason }); }
        else { await api.modHideComment(id, true, reason); if (comment) comment.hidden = true; }
        await api.resolveReports(t, id, 'hidden'); await api.log('hide', type, id, label, r); done('숨겼어요'); } });
    if (op === 'unhide') {
      if (t === 'p') { await api.modUpdatePost(id, { hidden: false, hidden_reason: '' }); if (post) post.hidden = false; } else { await api.modHideComment(id, false); if (comment) comment.hidden = false; }
      await api.log('unhide', type, id, label); return done('숨김을 풀었어요');
    }
    if (op === 'lock' || op === 'unlock') { await api.modUpdatePost(id, { locked: op === 'lock' }); if (post) post.locked = op === 'lock'; await api.log(op, type, id, label); return done(op === 'lock' ? '댓글을 잠갔어요' : '댓글 잠금을 풀었어요'); }
    if (op === 'pin') { const on = !post?.pinned; await api.modUpdatePost(id, { pinned: on }); if (post) post.pinned = on; await api.log(on ? 'pin' : 'unpin', type, id, label); return done(on ? '게시판 상단에 고정했어요' : '고정을 풀었어요'); }
    if (op === 'ban') return openDialog({ title: `작성자 제한${ds.name ? `: ${ds.name}` : ''}`, desc: '제한된 사람은 글, 댓글, 판정을 남길 수 없어요. 읽기는 계속할 수 있고, 이미 쓴 글은 그대로 남아요.', reasons: ['스팸·광고', '반복적인 규칙 위반', '혐오·괴롭힘', '악성 코드 유포', '기타'], submit: '제한하기',
      onSubmit: async (r, n) => { await api.ban(id, n ? `${r} · ${n}` : r); await api.log('ban', 'user', id, ds.name || '', r); done('작성을 제한했어요'); } });
    if (op === 'unban') { await api.unban(id); await api.log('unban', 'user', id, ds.name || ''); return done('작성 제한을 풀었어요'); }
    if (op === 'dismiss') { await api.resolveReports(t, id, 'dismissed'); await api.log('dismiss', type, id, label); return done('신고를 기각했어요'); }
    if (op === 'delete') {
      const key = `${t}:${id}`; if (armed !== key) { armed = key; return renderMod(); } armed = null;
      if (t === 'p') await api.deletePost(id); else await api.deleteComment(id, true);
      await api.resolveReports(t, id, 'deleted'); await api.log('delete', type, id, label); S.cache.delete(id); return done('삭제했어요');
    }
  } catch (e) { toast(errMsg(e, '운영 작업을 저장하지 못했어요')); }
}

export async function renderMod() {
  if (!isMod()) { app.innerHTML = `<div class="banner">${api.me ? '운영자만 볼 수 있는 화면이에요.' : '운영자로 <a href="#/login">로그인</a>해 주세요.'}</div>`; return; }
  if (!$('#modRoot')) app.innerHTML = '<div id="modRoot"><div class="skel"></div></div>';
  let rep, hid, bans, log;
  try { [rep, hid, bans, log] = await Promise.all([api.listReports(), api.listHidden(), api.listBanned(), api.listModLog()]); }
  catch (e) { console.error(e); $('#modRoot').innerHTML = '<div class="banner warnb">운영 정보를 불러오지 못했어요.</div>'; return; }
  if (S.view.name !== 'mod') return;
  S.modData = { comments: [...rep.comments, ...hid.comments] };
  [...rep.posts, ...hid.posts].forEach((p) => S.cache.set(p.id, Object.assign(S.cache.get(p.id) || {}, p)));
  const groups = new Map(); rep.reports.forEach((r) => { const k = `${r.type}:${r.targetId}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  const q = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || b[1][0].createdAt - a[1][0].createdAt);
  const target = (t, id) => {
    if (t === 'p') { const p = S.cache.get(id); return p ? { author: p.author, html: `<a class="ptitle" href="#/p/${id}">${esc(p.title)}</a><div class="pmeta"><span>${esc(CAT[p.cat]?.l || '')}</span><span class="pill">${esc(KINDS[p.kind]?.[0] || '')}</span>${who(p.author, p.isExample)}<span>${ago(p.createdAt)}</span>${p.hidden ? '<span class="pill warn">숨김</span>' : ''}</div>`, hidden: p.hidden } : { html: '<span class="muted">삭제된 글</span>' }; }
    const c = S.modData.comments.find((x) => x.id === id);
    return c ? { author: c.author, html: `<div class="ctext" style="margin:0">${c.deleted ? '<span class="muted">[삭제된 댓글]</span>' : esc(c.text.slice(0, 400))}</div><div class="pmeta"><span class="pill">댓글</span>${who(c.author)}<span>${ago(c.createdAt)}</span><a href="#/p/${c.postId}">글로 가기</a>${c.hidden ? '<span class="pill warn">숨김</span>' : ''}</div>`, hidden: c.hidden } : { html: '<span class="muted">삭제된 댓글</span>' };
  };
  const actions = (t, id, x, extra = '') => `<div class="row">${x.hidden ? `<button class="btn sm" data-act="mod" data-op="unhide" data-t="${t}" data-id="${id}">숨김 해제</button>` : `<button class="btn sm" data-act="mod" data-op="hide" data-t="${t}" data-id="${id}">숨기기</button>`}
    <button class="btn sm danger" data-act="mod" data-op="delete" data-t="${t}" data-id="${id}">${armed === `${t}:${id}` ? '정말 삭제할까요? 한 번 더 누르세요' : '삭제'}</button>${extra}
    ${x.author && x.author.id !== api.me.id ? `<button class="btn sm danger" data-act="mod" data-op="ban" data-t="u" data-id="${x.author.id}" data-name="${esc(x.author.name)}">작성자 제한</button>` : ''}</div>`;
  $('#modRoot').innerHTML = `<div class="layout"><div style="min-width:0;display:flex;flex-direction:column;gap:14px">
    <div><h1>운영</h1><p class="muted" style="margin:4px 0 0;max-width:62ch">신고를 처리하고, 숨긴 항목과 작성 제한을 관리해요. 이 화면과 신고 내용, 운영 기록은 운영자에게만 보여요.</p></div>
    <section class="panel"><h2>신고 대기 <span class="mono muted">${q.length}</span></h2>${q.length ? q.map(([k, rs]) => { const [t, id] = k.split(':'), x = target(t, id), by = {}; rs.forEach((r) => (by[r.reason] = (by[r.reason] || 0) + 1));
      return `<div class="mq"><div class="mq-h"><span class="pill warn">신고 ${rs.length}</span>${Object.entries(by).map(([r, n]) => `<span class="pill">${esc(r)}${n > 1 ? ' ' + n : ''}</span>`).join('')}<span class="hint">최근 ${ago(rs[0].createdAt)}</span></div>
        ${x.html}${rs.filter((r) => r.note).map((r) => `<div class="hint">“${esc(r.note)}” · ${esc(r.reporter?.name || '')}</div>`).join('')}
        ${actions(t, id, x, `<button class="btn sm" data-act="mod" data-op="dismiss" data-t="${t}" data-id="${id}">문제없음 (기각)</button>`)}</div>`; }).join('') : '<p>처리할 신고가 없어요.</p>'}</section>
    <section class="panel"><h2>숨긴 항목 <span class="mono muted">${hid.posts.length + hid.comments.length}</span></h2>${hid.posts.length + hid.comments.length ? [...hid.posts.map((p) => ['p', p.id, p.hiddenReason]), ...hid.comments.map((c) => ['c', c.id, c.hiddenReason])].map(([t, id, reason]) => { const x = target(t, id); return `<div class="mq">${x.html}<div class="hint">사유: ${esc(reason || '없음')}</div>${actions(t, id, x)}</div>`; }).join('') : '<p>숨긴 항목이 없어요.</p>'}</section>
  </div><aside class="side">
    <section class="panel"><h2>작성 제한 <span class="mono muted">${bans.length}</span></h2>${bans.length ? bans.map((b) => `<div class="mq">${who(b)}<div class="hint">${esc(b.banReason || '')}</div><div class="row"><button class="btn sm" data-act="mod" data-op="unban" data-t="u" data-id="${b.id}" data-name="${esc(b.name)}">제한 해제</button></div></div>`).join('') : '<p>제한된 사람이 없어요.</p>'}</section>
    <section class="panel"><h2>운영 기록</h2>${log.length ? log.slice(0, 40).map((l) => `<div class="logrow"><b>${esc(ACT[l.action] || l.action)}</b> ${l.type === 'post' && l.action !== 'delete' ? `<a href="#/p/${l.targetId}">${esc(l.label || '글')}</a>` : `<span class="muted">${esc(l.label || (l.type === 'comment' ? '댓글' : l.type === 'user' ? '사용자' : '글'))}</span>`}${l.reason ? ` <span class="muted">· ${esc(l.reason)}</span>` : ''}<div class="hint">${esc(l.actor?.name || '')} · ${ago(l.createdAt)}</div></div>`).join('') : '<p>아직 기록이 없어요.</p>'}</section>
    <section class="panel"><h2>운영자 추가</h2><p>${api.mode === 'demo' ? '데모 모드에서는 데모 계정이 관리자예요.' : 'Supabase SQL 편집기에서 <code>update profiles set role = \'mod\' where username = \'아이디\';</code>로 운영자를 지정해요. 관리자(admin)만 역할을 바꿀 수 있어요.'}</p></section>
  </aside></div>`;
}
