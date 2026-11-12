// Supabase backend. Access rules live in supabase/migrations (RLS + functions);
// this file only shapes queries and results.
import { createClient } from '@supabase/supabase-js';
import * as shape from './shape.js';
import { lang as uiLang } from '../i18n.js';

// explicit FK names: votes/saves tables also link posts and comments to profiles,
// so a bare profiles() embed is ambiguous for PostgREST
// where sign-in e-mails send people back to: the public site when running inside the iOS app
const authReturn = () => (/^https?:$/.test(location.protocol) ? location.origin + location.pathname : 'https://slop.ai.kr/');
const PCOLS = '(id,username,display_name,avatar_url)';
const POST_AUTHOR = 'author:profiles!posts_author_id_fkey' + PCOLS;
const COMMENT_AUTHOR = 'author:profiles!comments_author_id_fkey' + PCOLS;
const COMMUNITY = 'community:communities(id,slug,name)';
const FEED_COLS = 'id,author_id,community_id,community_slug,community_name,kind,title,excerpt,url,images,code_lang,code_head,tool,tags,version,remix_of,remix_of_version,pinned,hidden,hidden_reason,locked,is_example,up_count,down_count,comment_count,created_at,updated_at,author_username,author_name,author_avatar';

export function createSupabaseApi(url, key) {
  const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  const check = ({ data, error }) => { if (error) throw Object.assign(new Error(error.message), { code: error.code }); return data; };
  const api = { mode: 'supabase', me: null, guest: null, aiAvailable: !!import.meta.env.VITE_AI_ENABLED };
  const listeners = new Set();

  // Guests are anonymous Supabase users who can only vote. For the UI they are
  // not logged in (api.me stays null); api.guest holds their id.
  const identityOf = (s) => (s?.user ? (s.user.is_anonymous ? 'g:' : 'u:') + s.user.id : null);
  let identity = null;
  async function loadMe(session) {
    api.guest = session?.user?.is_anonymous ? { id: session.user.id } : null;
    if (!session?.user || session.user.is_anonymous) { api.me = null; return null; }
    const row = check(await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle());
    api.me = row ? { ...shape.profile(row), email: session.user.email, providers: session.user.app_metadata?.providers || [] } : null;
    return api.me;
  }

  api.init = async () => {
    const { data } = await sb.auth.getSession();
    identity = identityOf(data.session);
    await loadMe(data.session);
    sb.auth.onAuthStateChange((evt, session) => {
      if (evt === 'PASSWORD_RECOVERY') api.recovering = true;
      const next = identityOf(session);
      // supabase-js re-announces the same session on tab focus and token refresh: nothing changed
      if (next === identity) return;
      const member = (x) => !!x && x.startsWith('u:'), wasMember = member(identity);
      identity = next;
      // signed out <-> guest (a visitor's first vote) changes nothing on screen
      if (!wasMember && !member(next)) { api.guest = next ? { id: session.user.id } : null; return; }
      // run outside the callback: supabase-js asks not to await its own calls in here
      setTimeout(() => loadMe(session).then(() => listeners.forEach((f) => f(api.me)), (e) => console.error(e)), 0);
    });
    return api.me;
  };
  api.uid = () => api.me?.id || api.guest?.id || null;
  // public Auth settings: is email confirmation off (autoConfirm)? are guest (anonymous) sign-ins on?
  let authSettingsP = null;
  api.authSettings = () => (authSettingsP ??= fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
    .then((r) => r.json()).then((s) => ({ autoConfirm: !!s.mailer_autoconfirm, guests: !!s.external?.anonymous_users,
      social: ['kakao', 'google', 'github', 'apple'].filter((k) => s.external?.[k]) }))
    .catch(() => ({ autoConfirm: false, guests: false, social: [] })));
  // a visitor's first vote creates a guest session (Supabase Auth: anonymous sign-ins)
  api.signInGuest = async () => {
    if (api.me || api.guest) return true;
    if (!(await api.authSettings()).guests) return false;
    try {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data?.user) return false;
      api.guest = { id: data.user.id }; identity = 'g:' + data.user.id;
      return true;
    } catch { return false; }
  };
  api.onAuthChange = (f) => listeners.add(f);
  api.refreshMe = async () => { const { data } = await sb.auth.getSession(); await loadMe(data.session); listeners.forEach((f) => f(api.me)); return api.me; };
  api.signUpPassword = async (email, password) => {
    const data = check(await sb.auth.signUp({ email, password, options: { emailRedirectTo: authReturn() } }));
    return { needsConfirm: !data.session };
  };
  api.signInPassword = async (email, password) => { check(await sb.auth.signInWithPassword({ email, password })); };
  api.resetPassword = async (email) => { check(await sb.auth.resetPasswordForEmail(email, { redirectTo: authReturn() + '#/settings' })); };
  api.updatePassword = async (password) => { check(await sb.auth.updateUser({ password })); };
  // re-check the current password before a change (a left-open tab should not be enough)
  api.verifyPassword = async (password) => { check(await sb.auth.signInWithPassword({ email: api.me.email, password })); };
  api.signOutOthers = async () => { check(await sb.auth.signOut({ scope: 'others' })); };
  api.signInOAuth = async (provider) => check(await sb.auth.signInWithOAuth({ provider, options: { redirectTo: authReturn() } }));
  api.signOut = async () => { identity = null; api.me = null; api.guest = null; await sb.auth.signOut(); listeners.forEach((f) => f(null)); };

  api.updateProfile = async ({ username, displayName, bio }) => {
    check(await sb.from('profiles').update({ username, display_name: displayName, bio }).eq('id', api.me.id));
    return api.refreshMe();
  };
  api.getProfileByUsername = async (u) => shape.profile(check(await sb.from('profiles').select('*').eq('username', u).maybeSingle()));
  api.profileStats = async (id) => check(await sb.rpc('profile_stats', { uid: id }));

  // personalized order from recommend_posts(); plain filters (search, tag, tool, author, saved) use "hot" instead
  const recOk = (o) => o.sort === 'rec' && !o.q && !o.tag && !o.tool && !o.authorId && !['saved', 'gems'].includes(o.special);
  async function recommend(o) {
    const limit = o.limit || 30, offset = o.offset || 0;
    if (o.special === 'home' && !o.followIds?.length) return { posts: [], hasMore: false };
    const ranked = check(await sb.rpc('recommend_posts', { p_lang: o.clang || 'all', p_community: o.communityId || null, p_follow_only: o.special === 'home',
      p_seen: (o.seen || []).slice(-200), p_seed: o.seed || 0, p_offset: offset, p_limit: limit + 1, p_pref: uiLang }));
    const ids = ranked.slice(0, limit).map((r) => r.post_id);
    if (!ids.length) return { posts: [], hasMore: false };
    const rows = check(await sb.from('post_feed').select(FEED_COLS).in('id', ids)), byId = new Map(rows.map((r) => [r.id, r]));
    const why = new Map(ranked.map((r) => [r.post_id, r.reason]));
    let posts = ids.map((id) => byId.get(id)).filter(Boolean).map((r) => Object.assign(shape.post(r), { recReason: why.get(r.id) }));
    if (o.communityId) posts = [...posts.filter((p) => p.pinned), ...posts.filter((p) => !p.pinned)];
    return { posts, hasMore: ranked.length > limit };
  }
  api.listPosts = async (o) => {
    if (recOk(o)) { try { return await recommend(o); } catch (e) { console.warn('recommend_posts unavailable, using hot', e); } o = { ...o, sort: 'hot' }; }
    else if (o.sort === 'rec') o = { ...o, sort: 'hot' };
    const limit = o.limit || 30, offset = o.offset || 0;
    let q = sb.from('post_feed').select(FEED_COLS);
    if (o.communityId) q = q.eq('community_id', o.communityId);
    if (o.special === 'home') { if (!o.followIds?.length) return { posts: [], hasMore: false }; q = q.in('community_id', o.followIds); }
    q = q.eq('hidden', false);
    if (o.authorId) q = q.eq('author_id', o.authorId);
    if (o.tool) q = q.eq('tool', o.tool);
    // content language is inferred from the title: Hangul means Korean
    if (o.clang === 'ko') q = q.filter('title', 'match', '[가-힣]'); else if (o.clang === 'en') q = q.not('title', 'match', '[가-힣]');
    // one card per language group: with every language shown, prefer the edition in the interface language
    if ((o.clang || 'all') === 'all' && o.special !== 'saved') q = q.eq(uiLang === 'ko' ? 'alt_ko' : 'alt_en', false);
    if (o.tag) q = q.contains('tags', [o.tag]);
    if (o.q) { const t = o.q.replace(/[%,()*\\]/g, ' ').trim(); if (t) q = q.or(`title.ilike.*${t}*,excerpt.ilike.*${t}*,tool.ilike.*${t}*`); }
    if (o.special === 'saved') { const ids = [...(await api.mySaves())]; if (!ids.length) return { posts: [], hasMore: false }; q = q.in('id', ids); }
    let sort = o.special === 'gems' ? 'top' : o.sort;
    if (o.special === 'gems') q = q.eq('is_gem', true);
    if (o.communityId && sort !== 'pending') q = q.order('pinned', { ascending: false });
    if (sort === 'new') q = q.order('created_at', { ascending: false });
    else if (sort === 'top') { if (o.win && o.win !== 'all' && o.special !== 'gems') q = q.gte('created_at', new Date(Date.now() - shape.WINDOWS[o.win]).toISOString()); q = q.order('score', { ascending: false }).order('created_at', { ascending: false }); }
    else if (sort === 'contro') q = q.gt('contro', 0).order('contro', { ascending: false });
    else if (sort === 'pending') q = q.lt('vote_total', 5).order('vote_total', { ascending: true }).order('created_at', { ascending: false });
    else q = q.order('hot', { ascending: false });
    const rows = check(await q.range(offset, offset + limit));
    return { posts: rows.slice(0, limit).map(shape.post), hasMore: rows.length > limit };
  };

  api.getPost = async (id) => {
    const row = check(await sb.from('posts').select(`*, ${POST_AUTHOR}, ${COMMUNITY}`).eq('id', id).maybeSingle());
    if (!row) return null;
    const p = shape.post(row);
    if (p.remixOf) { const r = check(await sb.from('posts').select('id,title').eq('id', p.remixOf).maybeSingle()); p.remixTitle = r?.title || null; }
    return p;
  };
  api.getPostCodes = async (ids) => (ids.length ? Object.fromEntries(check(await sb.from('posts').select('id,code').in('id', ids)).map((r) => [r.id, r.code || ''])) : {});
  api.getPostCode = async (id) => check(await sb.from('posts').select('code').eq('id', id).maybeSingle())?.code || '';
  // other language editions of a post (the post itself included), oldest first
  api.listEditions = async (group) => (group ? check(await sb.from('posts').select('id,lang,title,version,hidden').eq('lang_group', group).eq('hidden', false).order('created_at')) : []);
  api.getVersions = async (id) => check(await sb.from('post_versions').select('*').eq('post_id', id).order('n')).map(shape.version);
  api.listRemixes = async (id) => check(await sb.from('post_feed').select(FEED_COLS).eq('remix_of', id).eq('hidden', false).order('score', { ascending: false }).limit(5)).map(shape.post);
  api.createPost = async (f) => check(await sb.rpc('create_post', { p: toRow(f) }));
  api.saveVersion = async (id, f, note, resolved) => check(await sb.rpc('save_post_version', { pid: id, p: { ...toRow(f), note }, resolved }));
  api.deletePost = async (id) => { check(await sb.from('posts').delete().eq('id', id)); };

  api.listComments = async (postId) => check(await sb.from('comments').select(`*, ${COMMENT_AUTHOR}`).eq('post_id', postId).order('created_at')).map(shape.comment);
  api.addComment = async ({ postId, parentId, text, flair, version }) =>
    shape.comment(check(await sb.from('comments').insert({ post_id: postId, parent_id: parentId || null, text, flair, version, author_id: api.me.id }).select(`*, ${COMMENT_AUTHOR}`).single()));
  api.editComment = async (id, text) => { check(await sb.from('comments').update({ text }).eq('id', id)); };
  api.deleteComment = async (id, hasChildren) => {
    if (hasChildren) check(await sb.from('comments').update({ deleted: true, text: '' }).eq('id', id));
    else check(await sb.from('comments').delete().eq('id', id));
  };
  api.resolveComment = async (id, n) => { check(await sb.from('comments').update({ resolved_in: n }).eq('id', id)); };

  api.myVotes = async ({ postIds = [], commentIds = [] }) => {
    const out = { p: {}, c: {} }; if (!api.uid()) return out;
    if (postIds.length) check(await sb.from('post_votes').select('post_id,value').in('post_id', postIds)).forEach((r) => (out.p[r.post_id] = r.value));
    if (commentIds.length) check(await sb.from('comment_votes').select('comment_id,value').in('comment_id', commentIds)).forEach((r) => (out.c[r.comment_id] = r.value));
    return out;
  };
  api.vote = async (type, id, value) => {
    const [table, col] = type === 'p' ? ['post_votes', 'post_id'] : ['comment_votes', 'comment_id'];
    if (!value) check(await sb.from(table).delete().eq(col, id).eq('user_id', api.uid()));
    else check(await sb.from(table).upsert({ [col]: id, user_id: api.uid(), value }, { onConflict: `${col},user_id` }));
  };
  api.mySaves = async () => (api.me ? new Set(check(await sb.from('saves').select('post_id')).map((r) => r.post_id)) : new Set());
  api.toggleSave = async (id, on) => {
    if (on) check(await sb.from('saves').upsert({ post_id: id, user_id: api.me.id }, { onConflict: 'user_id,post_id' }));
    else check(await sb.from('saves').delete().eq('post_id', id).eq('user_id', api.me.id));
  };

  api.uploadImage = async (file) => {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${api.me.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    check(await sb.storage.from('post-images').upload(path, file, { contentType: file.type, upsert: false }));
    return sb.storage.from('post-images').getPublicUrl(path).data.publicUrl;
  };

  api.report = async (type, id, reason, note) => { check(await sb.from('reports').insert({ target_type: type === 'p' ? 'post' : 'comment', target_id: id, reason, note, reporter_id: api.me.id })); };
  api.myReports = async () => (api.me ? new Set(check(await sb.from('reports').select('target_type,target_id').eq('reporter_id', api.me.id).is('resolved_at', null)).map((r) => `${r.target_type[0]}:${r.target_id}`)) : new Set());
  api.boardStats = async (cid, clang = 'all') => {
    const r = await sb.rpc('board_stats', { cid: cid || null, clang });
    return r.error ? check(await sb.rpc('board_stats', { cid: cid || null })) : r.data; // older DB without the language parameter
  };

  // communities
  const CCOLS = 'id,slug,name,description,rules,default_kind,creator_id,is_default,member_count,post_count,created_at';
  api.listCommunities = async ({ q, sort = 'members', limit = 100 } = {}) => {
    let qq = sb.from('communities').select(CCOLS);
    if (q) { const t = q.replace(/[%,()*\\]/g, ' ').trim(); if (t) qq = qq.or(`name.ilike.*${t}*,slug.ilike.*${t}*,description.ilike.*${t}*`); }
    qq = sort === 'new' ? qq.order('created_at', { ascending: false }) : qq.order('member_count', { ascending: false }).order('post_count', { ascending: false });
    return check(await qq.limit(limit)).map(shape.community);
  };
  api.getCommunity = async (slug) => shape.community(check(await sb.from('communities').select(CCOLS).eq('slug', slug).maybeSingle()));
  api.myCommunities = async () => (api.me ? check(await sb.from('community_members').select(`role, community:communities(${CCOLS})`).eq('user_id', api.me.id))
    .filter((r) => r.community).map((r) => ({ role: r.role, community: shape.community(r.community) })) : []);
  api.follow = async (cid) => { check(await sb.from('community_members').insert({ community_id: cid, user_id: api.me.id })); };
  api.unfollow = async (cid) => { check(await sb.from('community_members').delete().eq('community_id', cid).eq('user_id', api.me.id)); };
  api.createCommunity = async (f) => check(await sb.rpc('create_community', { p: { slug: f.slug, name: f.name, description: f.description, rules: f.rules, default_kind: f.defaultKind } }));
  api.updateCommunity = async (id, f) => { check(await sb.from('communities').update({ name: f.name, description: f.description, rules: f.rules, default_kind: f.defaultKind }).eq('id', id)); };
  api.communityMods = async (cid) => check(await sb.from('community_members').select('user:profiles(id,username,display_name,avatar_url)').eq('community_id', cid).eq('role', 'mod')).map((r) => shape.author(r.user)).filter(Boolean);
  api.setCommunityMod = async (cid, username, on) => { check(await sb.rpc('set_community_mod', { cid, uname: username, make_mod: on })); };

  api.myBlocks = async () => (api.me ? check(await sb.from('blocks').select('blocked_id')).map((r) => r.blocked_id) : []);
  api.listBlocked = async () => check(await sb.from('blocks').select('created_at, user:profiles!blocks_blocked_id_fkey(id,username,display_name,avatar_url)').order('created_at', { ascending: false })).map((r) => shape.author(r.user)).filter(Boolean);
  api.blockUser = async (uid) => { check(await sb.from('blocks').upsert({ blocker_id: api.me.id, blocked_id: uid }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true })); };
  api.unblockUser = async (uid) => { check(await sb.from('blocks').delete().eq('blocker_id', api.me.id).eq('blocked_id', uid)); };

  api.notifications = async () => check(await sb.from('notifications')
    .select('id,kind,created_at,read_at,post_id,comment_id,actor:profiles!notifications_actor_id_fkey(id,username,display_name,avatar_url),post:posts!notifications_post_id_fkey(title),comment:comments!notifications_comment_id_fkey(text)')
    .order('created_at', { ascending: false }).limit(50))
    .map((r) => ({ id: r.id, kind: r.kind, createdAt: Date.parse(r.created_at), read: !!r.read_at, postId: r.post_id, commentId: r.comment_id, actor: shape.author(r.actor), postTitle: r.post?.title || '', commentText: r.comment?.text || '' }));
  api.unreadCount = async () => { if (!api.me) return 0; const { count } = await sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null); return count || 0; };
  api.markAllRead = async () => { check(await sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)); };

  api.subscribeComments = (postId, cb) => {
    const ch = sb.channel('comments-' + postId).on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => cb()).subscribe();
    return () => sb.removeChannel(ch);
  };
  api.subscribeNotifications = (cb) => {
    if (!api.me) return () => {};
    const ch = sb.channel('notes-' + api.me.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${api.me.id}` }, () => cb()).subscribe();
    return () => sb.removeChannel(ch);
  };

  // moderation (RLS lets only mods/admins through)
  api.listReports = async () => {
    const rows = check(await sb.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(id,username,display_name,avatar_url)').is('resolved_at', null).order('created_at', { ascending: false }).limit(500));
    const postIds = [...new Set(rows.filter((r) => r.target_type === 'post').map((r) => r.target_id))];
    const commentIds = [...new Set(rows.filter((r) => r.target_type === 'comment').map((r) => r.target_id))];
    const posts = postIds.length ? check(await sb.from('post_feed').select(FEED_COLS).in('id', postIds)).map(shape.post) : [];
    const comments = commentIds.length ? check(await sb.from('comments').select(`*, ${COMMENT_AUTHOR}`).in('id', commentIds)).map(shape.comment) : [];
    return { reports: rows.map((r) => ({ id: r.id, type: r.target_type[0], targetId: r.target_id, reason: r.reason, note: r.note, createdAt: Date.parse(r.created_at), reporter: shape.author(r.reporter) })), posts, comments };
  };
  api.resolveReports = async (type, id, resolution) => {
    check(await sb.from('reports').update({ resolved_at: new Date().toISOString(), resolved_by: api.me.id, resolution }).eq('target_type', type === 'p' ? 'post' : 'comment').eq('target_id', id).is('resolved_at', null));
  };
  api.modUpdatePost = async (id, patch) => { check(await sb.from('posts').update(patch).eq('id', id)); };
  api.modHideComment = async (id, hidden, reason = '') => { check(await sb.from('comments').update({ hidden, hidden_reason: reason }).eq('id', id)); };
  api.ban = async (uid, reason) => { check(await sb.from('profiles').update({ banned_at: new Date().toISOString(), ban_reason: reason }).eq('id', uid)); };
  api.unban = async (uid) => { check(await sb.from('profiles').update({ banned_at: null, ban_reason: '' }).eq('id', uid)); };
  api.listBanned = async () => check(await sb.from('profiles').select('*').not('banned_at', 'is', null).order('banned_at', { ascending: false })).map(shape.profile);
  api.listHidden = async () => ({
    posts: check(await sb.from('post_feed').select(FEED_COLS).eq('hidden', true).order('updated_at', { ascending: false }).limit(100)).map(shape.post),
    comments: check(await sb.from('comments').select(`*, ${COMMENT_AUTHOR}`).eq('hidden', true).order('created_at', { ascending: false }).limit(100)).map(shape.comment),
  });
  api.log = async (action, type, id, label = '', reason = '', communityId = null) => { try { check(await sb.from('mod_log').insert({ action, target_type: type, target_id: id, label, reason, actor_id: api.me.id, community_id: communityId })); } catch { /* logging must not block the action */ } };
  api.listModLog = async () => check(await sb.from('mod_log').select('*, actor:profiles!mod_log_actor_id_fkey(id,username,display_name,avatar_url)').order('created_at', { ascending: false }).limit(60))
    .map((r) => ({ id: r.id, action: r.action, type: r.target_type, targetId: r.target_id, label: r.label, reason: r.reason, createdAt: Date.parse(r.created_at), actor: shape.author(r.actor) }));

  // visit counts: one call per page per browser session (see main.js); failures are ignored
  api.trackView = (path) => { sb.rpc('track_view', { p_path: path }).then(() => {}, () => {}); };
  api.viewStats = async () => check(await sb.from('page_views').select('day,path,views')
    .gte('day', new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10)).order('day'));
  // deletes the signed-in member's account (and optionally their posts, comments and images)
  api.deleteAccount = async (deleteContent) => {
    const uid = api.me?.id; if (!uid) return;
    if (deleteContent) {
      try { const { data } = await sb.storage.from('post-images').list(uid, { limit: 1000 }); if (data?.length) await sb.storage.from('post-images').remove(data.map((f) => `${uid}/${f.name}`)); } catch { /* best effort */ }
    }
    check(await sb.rpc('delete_my_account', { delete_content: !!deleteContent }));
    identity = null; api.me = null; api.guest = null;
    try { await sb.auth.signOut({ scope: 'local' }); } catch { /* the session is gone with the account */ }
    listeners.forEach((f) => f(null));
  };

  api.ai = async (task, payload) => {
    const { data, error } = await sb.functions.invoke('ai', { body: { task, ...payload } });
    if (error) { const ctx = await error.context?.json?.().catch(() => null); throw Object.assign(new Error(ctx?.error || error.message), { code: ctx?.code || 'ai_failed' }); }
    return data;
  };
  return api;
}

function toRow(f) {
  return { community_id: f.communityId, kind: f.kind, title: f.title, body: f.body, url: f.url, images: f.images, code: f.code, code_lang: f.codeLang, code_head: f.codeHead,
    tool: f.tool, prompt: f.prompt, tags: f.tags, remix_of: f.remixOf || '', remix_of_version: f.remixOfVersion || '', lang: f.lang || '', translation_of: f.translationOf || '', note: f.note || '' };
}
