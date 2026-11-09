// Demo backend: the same interface as supabase.js, kept in this browser's
// localStorage and seeded with the example posts. It lets the site run with no
// server at all. The demo account is an admin so moderation can be tried.
import EXAMPLES from '../examples.generated.json';
import * as shape from './shape.js';

const KEY = 'slop-lab-demo-v1';
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function seed() {
  const db = { profiles: {}, posts: {}, versions: [], comments: {}, votes: {}, saves: {}, reports: [], notifications: [], modlog: [], session: null };
  for (const e of EXAMPLES) {
    const t = new Date(Date.now() - e.hours_ago * 36e5).toISOString();
    db.posts[e.id] = { id: e.id, author_id: null, cat: e.cat, kind: e.kind, title: e.title, body: e.body, url: e.url, images: e.images, code: e.code, code_lang: e.code_lang, code_head: e.code_head,
      tool: e.tool, prompt: e.prompt, tags: e.tags, version: 1, remix_of: null, remix_of_version: null, pinned: false, hidden: false, hidden_reason: '', locked: false, is_example: true,
      up_count: 0, down_count: 0, comment_count: 0, created_at: t, updated_at: t };
    db.versions.push({ post_id: e.id, n: 1, title: e.title, body: e.body, url: e.url, images: e.images, code: e.code, prompt: e.prompt, note: '예시 게시물', author_id: null, created_at: t });
  }
  return db;
}
function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d?.posts) return d; } catch { /* fall through */ } return seed(); }

export function createDemoApi() {
  let db = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full or blocked: keep in memory */ } };
  const listeners = new Set();
  const api = { mode: 'demo', me: null, aiAvailable: false };
  const prof = (id) => db.profiles[id] || null;
  const isMod = () => ['mod', 'admin'].includes(api.me?.role);
  const need = () => { if (!api.me) throw Object.assign(new Error('로그인이 필요해요'), { code: '42501' }); if (api.me.banned) throw Object.assign(new Error('작성이 제한된 계정이에요'), { code: '42501' }); };
  const withAuthor = (r) => ({ ...r, author: prof(r.author_id) });
  const visible = (p) => p && (!p.hidden || p.author_id === api.me?.id || isMod());
  const recount = (pid) => {
    const p = db.posts[pid]; if (!p) return;
    const vs = Object.values(db.votes).map((v) => v.p?.[pid]).filter(Boolean);
    p.up_count = vs.filter((v) => v > 0).length; p.down_count = vs.filter((v) => v < 0).length;
    p.comment_count = Object.values(db.comments).filter((c) => c.post_id === pid && !c.deleted && !c.hidden).length;
  };
  const recountC = (cid) => { const c = db.comments[cid]; if (!c) return; const vs = Object.values(db.votes).map((v) => v.c?.[cid]).filter(Boolean); c.up_count = vs.filter((v) => v > 0).length; c.down_count = vs.filter((v) => v < 0).length; };
  const notify = (user_id, kind, extra) => { if (user_id && user_id !== api.me?.id) db.notifications.push({ id: uid(), user_id, kind, actor_id: api.me?.id || null, created_at: now(), read_at: null, ...extra }); };

  api.init = async () => { api.me = db.session ? shape.profile(prof(db.session)) : null; return api.me; };
  api.onAuthChange = (f) => listeners.add(f);
  const emit = () => listeners.forEach((f) => f(api.me));
  api.refreshMe = async () => { api.me = db.session ? shape.profile(prof(db.session)) : null; emit(); return api.me; };
  api.signInDemo = async (name) => {
    let p = Object.values(db.profiles).find((x) => x.role === 'admin');
    if (!p) { const id = uid(); p = db.profiles[id] = { id, username: 'demo_' + id.slice(0, 4), display_name: (name || '데모 사용자').slice(0, 40), bio: '', avatar_url: '', role: 'admin', banned_at: null, ban_reason: '', created_at: now() }; }
    db.session = p.id; save(); return api.refreshMe();
  };
  api.signInEmail = async () => { throw Object.assign(new Error('데모 모드에서는 이메일 로그인이 없어요'), { code: 'demo' }); };
  api.signInOAuth = api.signInEmail;
  api.signOut = async () => { db.session = null; save(); api.me = null; emit(); };
  api.resetDemo = async () => { db = seed(); save(); api.me = null; emit(); };

  api.updateProfile = async ({ username, displayName, bio }) => {
    need(); if (!/^[a-z0-9_]{3,20}$/.test(username)) throw Object.assign(new Error('username'), { code: '23514' });
    if (Object.values(db.profiles).some((x) => x.username === username && x.id !== api.me.id)) throw Object.assign(new Error('taken'), { code: '23505' });
    Object.assign(db.profiles[api.me.id], { username, display_name: displayName.slice(0, 40), bio: bio.slice(0, 300) }); save(); return api.refreshMe();
  };
  api.getProfileByUsername = async (u) => shape.profile(Object.values(db.profiles).find((x) => x.username === u));
  api.profileStats = async (id) => {
    const ps = Object.values(db.posts).filter((p) => p.author_id === id), cs = Object.values(db.comments).filter((c) => c.author_id === id);
    return { posts: ps.length, comments: cs.filter((c) => !c.deleted).length, karma: ps.reduce((a, p) => a + p.up_count - p.down_count, 0) + cs.reduce((a, c) => a + c.up_count - c.down_count, 0), gems: ps.filter((p) => shape.isGemCounts(p.up_count, p.down_count)).length };
  };

  api.listPosts = async (o) => {
    const limit = o.limit || 30, offset = o.offset || 0;
    let list = Object.values(db.posts).filter((p) => !p.hidden);
    if (o.cat) list = list.filter((p) => p.cat === o.cat);
    if (o.authorId) list = list.filter((p) => p.author_id === o.authorId);
    if (o.tool) list = list.filter((p) => p.tool === o.tool);
    if (o.tag) list = list.filter((p) => p.tags.includes(o.tag));
    if (o.q) { const t = o.q.toLowerCase(); list = list.filter((p) => [p.title, p.body, p.tool].join(' ').toLowerCase().includes(t)); }
    if (o.special === 'saved') { const s = db.saves[api.me?.id] || {}; list = list.filter((p) => s[p.id]); }
    const sort = o.special === 'gems' ? 'top' : o.sort, t = (p) => Date.parse(p.created_at);
    if (o.special === 'gems') list = list.filter((p) => shape.isGemCounts(p.up_count, p.down_count));
    if (sort === 'new') list.sort((a, b) => t(b) - t(a));
    else if (sort === 'top') { const w = o.special === 'gems' ? Infinity : shape.WINDOWS[o.win || 'all']; list = list.filter((p) => Date.now() - t(p) <= w).sort((a, b) => (b.up_count - b.down_count) - (a.up_count - a.down_count) || t(b) - t(a)); }
    else if (sort === 'contro') list = list.filter((p) => shape.controScore(p.up_count, p.down_count) > 0).sort((a, b) => shape.controScore(b.up_count, b.down_count) - shape.controScore(a.up_count, a.down_count));
    else if (sort === 'pending') list = list.filter((p) => p.up_count + p.down_count < 5).sort((a, b) => (a.up_count + a.down_count) - (b.up_count + b.down_count) || t(b) - t(a));
    else list.sort((a, b) => shape.hotScore(b.up_count, b.down_count, t(b)) - shape.hotScore(a.up_count, a.down_count, t(a)));
    if (!o.special && !o.authorId && sort !== 'pending') list.sort((a, b) => b.pinned - a.pinned);
    return { posts: list.slice(offset, offset + limit).map((p) => shape.post(withAuthor({ ...p, code: undefined }))), hasMore: list.length > offset + limit };
  };
  api.getPost = async (id) => { const p = db.posts[id]; if (!visible(p)) return null; const r = shape.post(withAuthor(p)); if (p.remix_of) r.remixTitle = db.posts[p.remix_of]?.title || null; return r; };
  api.getPostCode = async (id) => (visible(db.posts[id]) ? db.posts[id].code : '');
  api.getVersions = async (id) => (visible(db.posts[id]) ? db.versions.filter((v) => v.post_id === id).sort((a, b) => a.n - b.n).map(shape.version) : []);
  api.listRemixes = async (id) => Object.values(db.posts).filter((p) => p.remix_of === id && !p.hidden).map((p) => shape.post(withAuthor({ ...p, code: undefined })));
  const fields = (f) => ({ cat: f.cat, kind: f.kind, title: f.title.trim(), body: f.body || '', url: f.url || '', images: f.images || [], code: f.code || '', code_lang: f.codeLang || '', code_head: f.codeHead || '', tool: f.tool || '', prompt: f.prompt || '', tags: f.tags || [] });
  api.createPost = async (f) => {
    need(); const id = uid(), t = now();
    db.posts[id] = { id, author_id: api.me.id, ...fields(f), version: 1, remix_of: f.remixOf || null, remix_of_version: f.remixOfVersion || null, pinned: false, hidden: false, hidden_reason: '', locked: false, is_example: false, up_count: 0, down_count: 0, comment_count: 0, created_at: t, updated_at: t };
    const p = db.posts[id]; db.versions.push({ post_id: id, n: 1, title: p.title, body: p.body, url: p.url, images: p.images, code: p.code, prompt: p.prompt, note: '첫 버전', author_id: api.me.id, created_at: t });
    save(); return id;
  };
  api.saveVersion = async (id, f, note, resolved = []) => {
    need(); const p = db.posts[id]; if (!p || (p.author_id !== api.me.id && !isMod())) throw Object.assign(new Error('not allowed'), { code: '42501' });
    const n = p.version + 1, t = now(); Object.assign(p, fields(f), { version: n, updated_at: t });
    db.versions.push({ post_id: id, n, title: p.title, body: p.body, url: p.url, images: p.images, code: p.code, prompt: p.prompt, note: note || '수정', author_id: api.me.id, created_at: t });
    for (const cid of resolved) { const c = db.comments[cid]; if (c && c.post_id === id && !c.resolved_in) { c.resolved_in = n; notify(c.author_id, 'resolved', { post_id: id, comment_id: cid }); } }
    save(); return n;
  };
  api.deletePost = async (id) => {
    const p = db.posts[id]; if (!p || (p.author_id !== api.me?.id && !isMod())) throw Object.assign(new Error('not allowed'), { code: '42501' });
    delete db.posts[id]; db.versions = db.versions.filter((v) => v.post_id !== id);
    for (const c of Object.values(db.comments)) if (c.post_id === id) delete db.comments[c.id];
    db.notifications = db.notifications.filter((n) => n.post_id !== id); save();
  };

  api.listComments = async (postId) => (visible(db.posts[postId]) ? Object.values(db.comments).filter((c) => c.post_id === postId && (!c.hidden || c.author_id === api.me?.id || isMod())).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)).map((c) => shape.comment(withAuthor(c))) : []);
  api.addComment = async ({ postId, parentId, text, flair, version }) => {
    need(); const p = db.posts[postId]; if (!p || p.locked) throw Object.assign(new Error('locked'), { code: '42501' });
    const c = { id: uid(), post_id: postId, parent_id: parentId || null, author_id: api.me.id, text, flair, version, resolved_in: null, hidden: false, hidden_reason: '', deleted: false, up_count: 0, down_count: 0, created_at: now(), edited_at: null };
    db.comments[c.id] = c; recount(postId);
    if (parentId) notify(db.comments[parentId]?.author_id, 'reply', { post_id: postId, comment_id: c.id }); else notify(p.author_id, 'comment', { post_id: postId, comment_id: c.id });
    save(); return shape.comment(withAuthor(c));
  };
  api.editComment = async (id, text) => { const c = db.comments[id]; if (c?.author_id !== api.me?.id) throw new Error('not allowed'); c.text = text; c.edited_at = now(); save(); };
  api.deleteComment = async (id, hasChildren) => {
    const c = db.comments[id]; if (!c || (c.author_id !== api.me?.id && !isMod())) throw new Error('not allowed');
    if (hasChildren) Object.assign(c, { deleted: true, text: '' }); else delete db.comments[id];
    recount(c.post_id); save();
  };
  api.resolveComment = async (id, n) => { const c = db.comments[id]; c.resolved_in = n; notify(c.author_id, 'resolved', { post_id: c.post_id, comment_id: id }); save(); };

  api.myVotes = async () => { const v = db.votes[api.me?.id] || {}; return { p: { ...(v.p || {}) }, c: { ...(v.c || {}) } }; };
  api.vote = async (type, id, value) => {
    need(); const v = (db.votes[api.me.id] ??= { p: {}, c: {} }); v[type] ??= {};
    if (value) v[type][id] = value; else delete v[type][id];
    if (type === 'p') { const p = db.posts[id], wasGem = p && shape.isGemCounts(p.up_count, p.down_count); recount(id); if (p && !wasGem && shape.isGemCounts(p.up_count, p.down_count)) notify(p.author_id, 'gem', { post_id: id }); }
    else recountC(id);
    save();
  };
  api.mySaves = async () => new Set(Object.keys(db.saves[api.me?.id] || {}));
  api.toggleSave = async (id, on) => { need(); const s = (db.saves[api.me.id] ??= {}); if (on) s[id] = Date.now(); else delete s[id]; save(); };
  api.uploadImage = (file) => new Promise((res, rej) => {
    if (file.size > 1.5e6) return rej(Object.assign(new Error('데모 모드에서는 1.5MB 이하 이미지만 올릴 수 있어요'), { code: 'too_large' }));
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('read failed')); r.readAsDataURL(file);
  });

  api.report = async (type, id, reason, note) => { if (!api.me) throw new Error('login'); db.reports.push({ id: uid(), reporter_id: api.me.id, type, target_id: id, reason, note, created_at: now(), resolved_at: null }); save(); };
  api.myReports = async () => new Set(db.reports.filter((r) => r.reporter_id === api.me?.id && !r.resolved_at).map((r) => `${r.type}:${r.target_id}`));
  api.boardStats = async (cat) => {
    const all = Object.values(db.posts).filter((p) => !p.hidden), s = all.filter((p) => !cat || p.cat === cat);
    const count = (arr) => Object.entries(arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
    return { posts: s.length, gems: s.filter((p) => shape.isGemCounts(p.up_count, p.down_count)).length, tools: count(s.map((p) => p.tool).filter(Boolean)).slice(0, 12), tags: count(s.flatMap((p) => p.tags)).slice(0, 14), boards: all.reduce((m, p) => ((m[p.cat] = (m[p.cat] || 0) + 1), m), {}) };
  };

  api.notifications = async () => db.notifications.filter((n) => n.user_id === api.me?.id).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 50)
    .map((n) => ({ id: n.id, kind: n.kind, createdAt: Date.parse(n.created_at), read: !!n.read_at, postId: n.post_id, commentId: n.comment_id, actor: shape.author(prof(n.actor_id)), postTitle: db.posts[n.post_id]?.title || '', commentText: db.comments[n.comment_id]?.text || '' }));
  api.unreadCount = async () => db.notifications.filter((n) => n.user_id === api.me?.id && !n.read_at).length;
  api.markAllRead = async () => { db.notifications.forEach((n) => { if (n.user_id === api.me?.id) n.read_at ??= now(); }); save(); };
  api.subscribeComments = () => () => {};
  api.subscribeNotifications = () => () => {};

  api.listReports = async () => {
    const open = db.reports.filter((r) => !r.resolved_at);
    return { reports: open.map((r) => ({ id: r.id, type: r.type, targetId: r.target_id, reason: r.reason, note: r.note, createdAt: Date.parse(r.created_at), reporter: shape.author(prof(r.reporter_id)) })),
      posts: open.filter((r) => r.type === 'p' && db.posts[r.target_id]).map((r) => shape.post(withAuthor(db.posts[r.target_id]))),
      comments: open.filter((r) => r.type === 'c' && db.comments[r.target_id]).map((r) => shape.comment(withAuthor(db.comments[r.target_id]))) };
  };
  api.resolveReports = async (type, id, resolution) => { db.reports.forEach((r) => { if (r.type === type && r.target_id === id && !r.resolved_at) Object.assign(r, { resolved_at: now(), resolution }); }); save(); };
  api.modUpdatePost = async (id, patch) => { if (!isMod()) throw new Error('not allowed'); Object.assign(db.posts[id], patch); save(); };
  api.modHideComment = async (id, hidden, reason = '') => { if (!isMod()) throw new Error('not allowed'); Object.assign(db.comments[id], { hidden, hidden_reason: reason }); recount(db.comments[id].post_id); save(); };
  api.ban = async (u, reason) => { Object.assign(db.profiles[u], { banned_at: now(), ban_reason: reason }); save(); };
  api.unban = async (u) => { Object.assign(db.profiles[u], { banned_at: null, ban_reason: '' }); save(); };
  api.listBanned = async () => Object.values(db.profiles).filter((p) => p.banned_at).map(shape.profile);
  api.listHidden = async () => ({ posts: Object.values(db.posts).filter((p) => p.hidden).map((p) => shape.post(withAuthor(p))), comments: Object.values(db.comments).filter((c) => c.hidden).map((c) => shape.comment(withAuthor(c))) });
  api.log = async (action, type, id, label = '', reason = '') => { db.modlog.unshift({ id: uid(), action, type, target_id: id, label, reason, actor_id: api.me?.id, created_at: now() }); db.modlog = db.modlog.slice(0, 200); save(); };
  api.listModLog = async () => db.modlog.slice(0, 60).map((l) => ({ id: l.id, action: l.action, type: l.type, targetId: l.target_id, label: l.label, reason: l.reason, createdAt: Date.parse(l.created_at), actor: shape.author(prof(l.actor_id)) }));
  api.ai = async () => { throw Object.assign(new Error('데모 모드에서는 Claude 기능을 쓸 수 없어요'), { code: 'demo' }); };
  return api;
}
