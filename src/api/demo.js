// Demo backend: the same interface as supabase.js, kept in this browser's
// localStorage and seeded with the example posts. It lets the site run with no
// server at all. The demo account is an admin so moderation can be tried.
import EXAMPLES from '../examples.generated.json';
import * as shape from './shape.js';

const KEY = 'slop-lab-demo-v2';
const DEFAULT_COMMUNITIES = [
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
const RESERVED = ['all', 'popular', 'home', 'gems', 'saved', 'new', 'mod', 'admin', 'submit', 'settings', 'login', 'inbox', 'communities', 'edit', 'remix', 'api', 'help', 'about'];
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function seed() {
  const db = { profiles: {}, posts: {}, versions: [], comments: {}, votes: {}, saves: {}, reports: [], notifications: [], modlog: [], session: null, communities: {}, members: [] };
  const t0 = new Date(Date.now() - 30 * 864e5).toISOString();
  for (const [slug, name, description, kind] of DEFAULT_COMMUNITIES) db.communities['c-' + slug] = { id: 'c-' + slug, slug, name, description, rules: '', default_kind: kind, creator_id: null, is_default: true, member_count: 0, post_count: 0, created_at: t0 };
  for (const e of EXAMPLES) {
    const t = new Date(Date.now() - e.hours_ago * 36e5).toISOString();
    db.posts[e.id] = { id: e.id, author_id: null, community_id: 'c-' + e.cat, kind: e.kind, title: e.title, body: e.body, url: e.url, images: e.images, code: e.code, code_lang: e.code_lang, code_head: e.code_head,
      tool: e.tool, prompt: e.prompt, tags: e.tags, version: 1, remix_of: null, remix_of_version: null, pinned: false, hidden: false, hidden_reason: '', locked: false, is_example: true,
      up_count: 0, down_count: 0, comment_count: 0, created_at: t, updated_at: t };
    db.versions.push({ post_id: e.id, n: 1, title: e.title, body: e.body, url: e.url, images: e.images, code: e.code, prompt: e.prompt, note: '예시 게시물', author_id: null, created_at: t });
  }
  for (const c of Object.values(db.communities)) c.post_count = Object.values(db.posts).filter((p) => p.community_id === c.id).length;
  return db;
}
function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d?.posts) return d; } catch { /* fall through */ } return seed(); }

export function createDemoApi() {
  let db = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full or blocked: keep in memory */ } };
  const listeners = new Set();
  const api = { mode: 'demo', me: null, aiAvailable: false };
  api.uid = () => api.me?.id || null;
  api.signInGuest = async () => false; // the demo has no guest mode
  api.authSettings = async () => ({ autoConfirm: true, guests: false });
  api.trackView = () => {};
  api.viewStats = async () => [];
  api.deleteAccount = async () => { throw Object.assign(new Error('데모에서는 계정을 지울 수 없어요'), { code: 'demo' }); };
  const prof = (id) => db.profiles[id] || null;
  const isMod = () => ['mod', 'admin'].includes(api.me?.role);
  const need = () => { if (!api.me) throw Object.assign(new Error('로그인이 필요해요'), { code: '42501' }); if (api.me.banned) throw Object.assign(new Error('작성이 제한된 계정이에요'), { code: '42501' }); };
  const withAuthor = (r) => ({ ...r, author: prof(r.author_id), community: r.community_id ? db.communities[r.community_id] : undefined });
  const cmod = (cid) => isMod() || db.members.some((m) => m.community_id === cid && m.user_id === api.me?.id && m.role === 'mod');
  const recountCommunity = (cid) => { const c = db.communities[cid]; if (!c) return; c.member_count = db.members.filter((m) => m.community_id === cid).length; c.post_count = Object.values(db.posts).filter((p) => p.community_id === cid).length; };
  const visible = (p) => p && (!p.hidden || p.author_id === api.me?.id || isMod());
  const recount = (pid) => {
    const p = db.posts[pid]; if (!p) return;
    const vs = Object.values(db.votes).map((v) => v.p?.[pid]).filter(Boolean);
    p.up_count = vs.filter((v) => v > 0).length; p.down_count = vs.filter((v) => v < 0).length;
    p.comment_count = Object.values(db.comments).filter((c) => c.post_id === pid && !c.deleted && !c.hidden).length;
  };
  const recountC = (cid) => { const c = db.comments[cid]; if (!c) return; const vs = Object.values(db.votes).map((v) => v.c?.[cid]).filter(Boolean); c.up_count = vs.filter((v) => v > 0).length; c.down_count = vs.filter((v) => v < 0).length; };
  const notify = (user_id, kind, extra) => { if (user_id && user_id !== api.me?.id && !db.blocks?.[user_id]?.[api.me?.id]) db.notifications.push({ id: uid(), user_id, kind, actor_id: api.me?.id || null, created_at: now(), read_at: null, ...extra }); };

  api.init = async () => { api.me = db.session ? shape.profile(prof(db.session)) : null; return api.me; };
  api.onAuthChange = (f) => listeners.add(f);
  const emit = () => listeners.forEach((f) => f(api.me));
  api.refreshMe = async () => { api.me = db.session ? shape.profile(prof(db.session)) : null; emit(); return api.me; };
  api.signInDemo = async (name) => {
    let p = Object.values(db.profiles).find((x) => x.role === 'admin');
    if (!p) { const id = uid(); p = db.profiles[id] = { id, username: 'demo_' + id.slice(0, 4), display_name: (name || '데모 사용자').slice(0, 40), bio: '', avatar_url: '', role: 'admin', banned_at: null, ban_reason: '', created_at: now() };
      for (const c of Object.values(db.communities)) if (c.is_default) { db.members.push({ community_id: c.id, user_id: id, role: 'member', created_at: now() }); recountCommunity(c.id); } }
    db.session = p.id; save(); return api.refreshMe();
  };
  api.signInEmail = async () => { throw Object.assign(new Error('데모 모드에서는 이메일 로그인이 없어요'), { code: 'demo' }); };
  api.signInOAuth = api.signInEmail; api.signUpPassword = api.signInEmail; api.signInPassword = api.signInEmail; api.resetPassword = api.signInEmail; api.updatePassword = api.signInEmail;
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
    if (o.communityId) list = list.filter((p) => p.community_id === o.communityId);
    if (o.special === 'home') list = list.filter((p) => (o.followIds || []).includes(p.community_id));
    if (o.authorId) list = list.filter((p) => p.author_id === o.authorId);
    if (o.tool) list = list.filter((p) => p.tool === o.tool);
    if (o.clang === 'ko') list = list.filter((p) => /[가-힣]/.test(p.title)); else if (o.clang === 'en') list = list.filter((p) => !/[가-힣]/.test(p.title));
    if (o.tag) list = list.filter((p) => p.tags.includes(o.tag));
    if (o.q) { const t = o.q.toLowerCase(); list = list.filter((p) => [p.title, p.body, p.tool].join(' ').toLowerCase().includes(t)); }
    if (o.special === 'saved') { const s = db.saves[api.me?.id] || {}; list = list.filter((p) => s[p.id]); }
    const sort = o.special === 'gems' ? 'top' : o.sort, t = (p) => Date.parse(p.created_at), why = new Map();
    if (o.special === 'gems') list = list.filter((p) => shape.isGemCounts(p.up_count, p.down_count));
    if (sort === 'new') list.sort((a, b) => t(b) - t(a));
    else if (sort === 'top') { const w = o.special === 'gems' ? Infinity : shape.WINDOWS[o.win || 'all']; list = list.filter((p) => Date.now() - t(p) <= w).sort((a, b) => (b.up_count - b.down_count) - (a.up_count - a.down_count) || t(b) - t(a)); }
    else if (sort === 'contro') list = list.filter((p) => shape.controScore(p.up_count, p.down_count) > 0).sort((a, b) => shape.controScore(b.up_count, b.down_count) - shape.controScore(a.up_count, a.down_count));
    else if (sort === 'rec') {
      const me = api.me?.id, votes = (me && db.votes[me]?.p) || {}, saves = (me && db.saves[me]) || {}, seen = new Set(o.seen || []);
      const follows = new Set(db.members.filter((m) => m.user_id === me).map((m) => m.community_id));
      const likes = [...Object.entries(votes).map(([id, v]) => [db.posts[id], v]), ...Object.keys(saves).map((id) => [db.posts[id], 1])].filter(([p]) => p);
      const aff = (key) => { const m = {}; likes.forEach(([p, w]) => [].concat(key(p)).forEach((k) => { (m[k] ??= [0, 0])[0] += w; m[k][1]++; })); return (k) => (m[k] ? m[k][0] / (m[k][1] + 2) : 0); };
      const comm = aff((p) => p.community_id), tag = aff((p) => p.tags), kind = aff((p) => p.kind);
      const rnd = (id) => { let h = (o.seed || 0) >>> 0; for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761) >>> 0; return h / 4294967296; };
      const score = (p) => {
        const n = p.up_count + p.down_count, ageH = (Date.now() - t(p)) / 36e5, tags = p.tags || [];
        const taste = comm(p.community_id) * 1.2 + (tags.length ? tags.reduce((a, x) => a + tag(x), 0) / tags.length : 0) * 0.8 + kind(p.kind) * 0.5;
        let s = 0.9 * ((p.up_count + 2) / (n + 4) - 0.5) * 2 + 0.35 * Math.log(1 + p.comment_count * 3 + p.up_count) + 1.1 / Math.pow(1 + ageH / 36, 0.7)
          + taste + 0.6 * rnd(p.id) / Math.sqrt(1 + n) + (follows.has(p.community_id) ? 0.3 : 0) - (p.is_example ? 0.15 : 0);
        if (votes[p.id]) s = s * 0.3 - 1; else if (saves[p.id] || seen.has(p.id)) s = s * 0.4 - 0.6;
        why.set(p.id, votes[p.id] ? 'judged' : taste >= 0.25 ? 'taste' : n < 3 && ageH < 72 ? 'new' : p.up_count >= 3 && shape.isGemCounts(p.up_count, p.down_count) ? 'gem' : follows.has(p.community_id) ? 'follow' : 'explore');
        return s;
      };
      if (me) list = list.filter((p) => p.author_id !== me);
      const sc = new Map(list.map((p) => [p.id, score(p)])); list.sort((a, b) => sc.get(b.id) - sc.get(a.id));
    }
    else if (sort === 'pending') list = list.filter((p) => p.up_count + p.down_count < 5).sort((a, b) => (a.up_count + a.down_count) - (b.up_count + b.down_count) || t(b) - t(a));
    else list.sort((a, b) => shape.hotScore(b.up_count, b.down_count, t(b)) - shape.hotScore(a.up_count, a.down_count, t(a)));
    if (o.communityId && sort !== 'pending') list.sort((a, b) => b.pinned - a.pinned);
    return { posts: list.slice(offset, offset + limit).map((p) => Object.assign(shape.post(withAuthor({ ...p, code: undefined })), why.has(p.id) ? { recReason: why.get(p.id) } : {})), hasMore: list.length > offset + limit };
  };
  api.getPost = async (id) => { const p = db.posts[id]; if (!visible(p)) return null; const r = shape.post(withAuthor(p)); if (p.remix_of) r.remixTitle = db.posts[p.remix_of]?.title || null; return r; };
  api.getPostCode = async (id) => (visible(db.posts[id]) ? db.posts[id].code : '');
  api.getVersions = async (id) => (visible(db.posts[id]) ? db.versions.filter((v) => v.post_id === id).sort((a, b) => a.n - b.n).map(shape.version) : []);
  api.listRemixes = async (id) => Object.values(db.posts).filter((p) => p.remix_of === id && !p.hidden).map((p) => shape.post(withAuthor({ ...p, code: undefined })));
  const fields = (f) => ({ kind: f.kind, title: f.title.trim(), body: f.body || '', url: f.url || '', images: f.images || [], code: f.code || '', code_lang: f.codeLang || '', code_head: f.codeHead || '', tool: f.tool || '', prompt: f.prompt || '', tags: f.tags || [] });
  api.createPost = async (f) => {
    need(); const id = uid(), t = now();
    if (!db.communities[f.communityId]) throw Object.assign(new Error('community'), { code: '23503' });
    db.posts[id] = { id, author_id: api.me.id, community_id: f.communityId, ...fields(f), version: 1, remix_of: f.remixOf || null, remix_of_version: f.remixOfVersion || null, pinned: false, hidden: false, hidden_reason: '', locked: false, is_example: false, up_count: 0, down_count: 0, comment_count: 0, created_at: t, updated_at: t };
    const p = db.posts[id]; db.versions.push({ post_id: id, n: 1, title: p.title, body: p.body, url: p.url, images: p.images, code: p.code, prompt: p.prompt, note: '첫 버전', author_id: api.me.id, created_at: t });
    recountCommunity(f.communityId); save(); return id;
  };
  api.saveVersion = async (id, f, note, resolved = []) => {
    need(); const p = db.posts[id]; if (!p || (p.author_id !== api.me.id && !isMod())) throw Object.assign(new Error('not allowed'), { code: '42501' });
    const n = p.version + 1, t = now(); Object.assign(p, fields(f), { version: n, updated_at: t });
    db.versions.push({ post_id: id, n, title: p.title, body: p.body, url: p.url, images: p.images, code: p.code, prompt: p.prompt, note: note || '수정', author_id: api.me.id, created_at: t });
    for (const cid of resolved) { const c = db.comments[cid]; if (c && c.post_id === id && !c.resolved_in) { c.resolved_in = n; notify(c.author_id, 'resolved', { post_id: id, comment_id: cid }); } }
    save(); return n;
  };
  api.deletePost = async (id) => {
    const p = db.posts[id]; if (!p || (p.author_id !== api.me?.id && !cmod(p.community_id))) throw Object.assign(new Error('not allowed'), { code: '42501' });
    delete db.posts[id]; recountCommunity(p.community_id); db.versions = db.versions.filter((v) => v.post_id !== id);
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
  api.boardStats = async (cid) => {
    const all = Object.values(db.posts).filter((p) => !p.hidden), s = all.filter((p) => !cid || p.community_id === cid);
    const count = (arr) => Object.entries(arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
    return { posts: s.length, gems: s.filter((p) => shape.isGemCounts(p.up_count, p.down_count)).length, tools: count(s.map((p) => p.tool).filter(Boolean)).slice(0, 12), tags: count(s.flatMap((p) => p.tags)).slice(0, 14) };
  };

  api.myBlocks = async () => Object.keys(db.blocks?.[api.me?.id] || {});
  api.listBlocked = async () => Object.keys(db.blocks?.[api.me?.id] || {}).map((id) => shape.author(prof(id))).filter(Boolean);
  api.blockUser = async (id) => { need(); if (id === api.me.id) throw new Error('자기 자신은 차단할 수 없어요'); ((db.blocks ??= {})[api.me.id] ??= {})[id] = Date.now(); save(); };
  api.unblockUser = async (id) => { need(); delete db.blocks?.[api.me.id]?.[id]; save(); };

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
  api.modUpdatePost = async (id, patch) => { const p = db.posts[id]; if (!cmod(p.community_id)) throw new Error('not allowed'); const old = p.community_id; Object.assign(p, patch); recountCommunity(old); recountCommunity(p.community_id); save(); };
  api.modHideComment = async (id, hidden, reason = '') => { if (!cmod(db.posts[db.comments[id].post_id]?.community_id)) throw new Error('not allowed'); Object.assign(db.comments[id], { hidden, hidden_reason: reason }); recount(db.comments[id].post_id); save(); };
  api.ban = async (u, reason) => { Object.assign(db.profiles[u], { banned_at: now(), ban_reason: reason }); save(); };
  api.unban = async (u) => { Object.assign(db.profiles[u], { banned_at: null, ban_reason: '' }); save(); };
  api.listBanned = async () => Object.values(db.profiles).filter((p) => p.banned_at).map(shape.profile);
  api.listHidden = async () => ({ posts: Object.values(db.posts).filter((p) => p.hidden).map((p) => shape.post(withAuthor(p))), comments: Object.values(db.comments).filter((c) => c.hidden).map((c) => shape.comment(withAuthor(c))) });
  api.log = async (action, type, id, label = '', reason = '', communityId = null) => { db.modlog.unshift({ id: uid(), action, type, target_id: id, label, reason, community_id: communityId, actor_id: api.me?.id, created_at: now() }); db.modlog = db.modlog.slice(0, 200); save(); };
  api.listModLog = async () => db.modlog.slice(0, 60).map((l) => ({ id: l.id, action: l.action, type: l.type, targetId: l.target_id, label: l.label, reason: l.reason, createdAt: Date.parse(l.created_at), actor: shape.author(prof(l.actor_id)) }));
  // communities
  const C = (c) => shape.community(c);
  api.listCommunities = async ({ q, sort = 'members', limit = 100 } = {}) => {
    let list = Object.values(db.communities);
    if (q) { const t = q.toLowerCase(); list = list.filter((c) => [c.name, c.slug, c.description].join(' ').toLowerCase().includes(t)); }
    list.sort(sort === 'new' ? (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) : (a, b) => b.member_count - a.member_count || b.post_count - a.post_count);
    return list.slice(0, limit).map(C);
  };
  api.getCommunity = async (slug) => C(Object.values(db.communities).find((c) => c.slug === slug));
  api.myCommunities = async () => db.members.filter((m) => m.user_id === api.me?.id && db.communities[m.community_id]).map((m) => ({ role: m.role, community: C(db.communities[m.community_id]) }));
  api.follow = async (cid) => { need(); if (!db.members.some((m) => m.community_id === cid && m.user_id === api.me.id)) db.members.push({ community_id: cid, user_id: api.me.id, role: 'member', created_at: now() }); recountCommunity(cid); save(); };
  api.unfollow = async (cid) => { db.members = db.members.filter((m) => !(m.community_id === cid && m.user_id === api.me?.id)); recountCommunity(cid); save(); };
  api.createCommunity = async (f) => {
    need(); const slug = (f.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(slug)) throw Object.assign(new Error('slug'), { code: '23514' });
    if (RESERVED.includes(slug) || Object.values(db.communities).some((c) => c.slug === slug)) throw Object.assign(new Error('taken'), { code: '23505' });
    const id = 'c-' + uid().slice(0, 8);
    db.communities[id] = { id, slug, name: f.name.trim().slice(0, 40), description: (f.description || '').slice(0, 300), rules: (f.rules || '').slice(0, 2000), default_kind: f.defaultKind || 'text', creator_id: api.me.id, is_default: false, member_count: 0, post_count: 0, created_at: now() };
    db.members.push({ community_id: id, user_id: api.me.id, role: 'mod', created_at: now() }); recountCommunity(id); save(); return id;
  };
  api.updateCommunity = async (id, f) => { if (!cmod(id)) throw Object.assign(new Error('not allowed'), { code: '42501' }); Object.assign(db.communities[id], { name: f.name, description: f.description, rules: f.rules, default_kind: f.defaultKind }); save(); };
  api.communityMods = async (cid) => db.members.filter((m) => m.community_id === cid && m.role === 'mod').map((m) => shape.author(prof(m.user_id))).filter(Boolean);
  api.setCommunityMod = async (cid, username, on) => {
    if (!cmod(cid)) throw Object.assign(new Error('not allowed'), { code: '42501' });
    const u = Object.values(db.profiles).find((x) => x.username === username.toLowerCase()); if (!u) throw Object.assign(new Error('user not found'), { code: 'P0002' });
    let m = db.members.find((x) => x.community_id === cid && x.user_id === u.id);
    if (!m) { m = { community_id: cid, user_id: u.id, role: 'member', created_at: now() }; db.members.push(m); }
    if (!on && db.members.filter((x) => x.community_id === cid && x.role === 'mod').length <= 1) throw Object.assign(new Error('last mod'), { code: '23514' });
    m.role = on ? 'mod' : 'member'; recountCommunity(cid); save();
  };
  api.ai = async () => { throw Object.assign(new Error('데모 모드에서는 Claude 기능을 쓸 수 없어요'), { code: 'demo' }); };
  return api;
}
