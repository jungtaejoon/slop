// Hides people the signed-in user has blocked, for both backends: their posts drop out
// of every list, their comments come back marked `blocked` so the thread can fold them,
// and notifications from them are dropped (the server also stops creating new ones).
export function withBlocking(api) {
  api.blocked = new Set();
  api.loadBlocks = async () => { api.blocked = api.me ? new Set(await api.myBlocks().catch(() => [])) : new Set(); };
  api.isBlocked = (uid) => !!uid && api.blocked.has(uid);
  api.block = async (uid) => { await api.blockUser(uid); api.blocked.add(uid); };
  api.unblock = async (uid) => { await api.unblockUser(uid); api.blocked.delete(uid); };

  const keep = (p) => !api.blocked.has(p.authorId);
  const wrap = (name, f) => { const orig = api[name]; api[name] = async (...a) => f(await orig(...a)); };
  wrap('listPosts', (r) => ({ ...r, posts: r.posts.filter(keep) }));
  wrap('listRemixes', (ps) => ps.filter(keep));
  wrap('getPost', (p) => (p && api.blocked.has(p.authorId) ? { ...p, blockedAuthor: true } : p));
  wrap('listComments', (cs) => cs.map((c) => (api.blocked.has(c.authorId) ? { ...c, blocked: true, text: '' } : c)));
  wrap('notifications', (ns) => ns.filter((n) => !api.blocked.has(n.actor?.id)));
  return api;
}
