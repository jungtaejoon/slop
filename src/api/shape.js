// Row -> app object mappers shared by both backends, plus the ranking rules
// the demo backend uses (the Supabase backend gets the same numbers from the
// post_feed view).

export const isGemCounts = (up, down) => up >= 3 && up * 4 >= 3 * (up + down);

export function hotScore(up, down, createdAtMs) {
  const s = up - down;
  return Math.sign(s) * Math.log10(Math.max(Math.abs(s), 1)) + createdAtMs / 1000 / 45000;
}
export function controScore(up, down) {
  return up > 0 && down > 0 ? ((up + down) * Math.min(up, down)) / Math.max(up, down) : 0;
}

export const author = (a) => (a ? { id: a.id, username: a.username, name: a.display_name || a.username, avatar: a.avatar_url || '' } : null);

export function post(r) {
  const up = r.up_count ?? 0, down = r.down_count ?? 0;
  return {
    id: r.id, authorId: r.author_id,
    author: r.author ? author(r.author) : r.author_username ? { id: r.author_id, username: r.author_username, name: r.author_name || r.author_username, avatar: r.author_avatar || '' } : null,
    communityId: r.community_id,
    community: r.community ? community(r.community) : r.community_slug ? { id: r.community_id, slug: r.community_slug, name: r.community_name } : null,
    kind: r.kind, title: r.title, body: r.body ?? r.excerpt ?? '', excerpt: r.excerpt ?? (r.body || '').slice(0, 400),
    url: r.url || '', images: r.images || [], code: r.code, codeLang: r.code_lang || '', codeHead: r.code_head || '',
    tool: r.tool || '', prompt: r.prompt || '', tags: r.tags || [], version: r.version || 1,
    remixOf: r.remix_of || null, remixOfVersion: r.remix_of_version || null,
    pinned: !!r.pinned, hidden: !!r.hidden, hiddenReason: r.hidden_reason || '', locked: !!r.locked, isExample: !!r.is_example,
    up, down, score: up - down, isGem: isGemCounts(up, down), comments: r.comment_count ?? 0, views: r.view_count ?? 0,
    createdAt: Date.parse(r.created_at), updatedAt: Date.parse(r.updated_at || r.created_at),
  };
}

export function version(r) {
  return { n: r.n, title: r.title, body: r.body || '', url: r.url || '', images: r.images || [], code: r.code || '', prompt: r.prompt || '', note: r.note || '', authorId: r.author_id, createdAt: Date.parse(r.created_at) };
}

export function comment(r) {
  return {
    id: r.id, postId: r.post_id, parentId: r.parent_id, authorId: r.author_id, author: author(r.author),
    text: r.text, flair: r.flair, version: r.version, resolvedIn: r.resolved_in, hidden: !!r.hidden, hiddenReason: r.hidden_reason || '',
    deleted: !!r.deleted, up: r.up_count ?? 0, down: r.down_count ?? 0, createdAt: Date.parse(r.created_at), editedAt: r.edited_at ? Date.parse(r.edited_at) : null,
  };
}

export function profile(r) {
  return r ? { id: r.id, username: r.username, name: r.display_name || r.username, displayName: r.display_name || '', bio: r.bio || '', avatar: r.avatar_url || '', role: r.role, banned: !!r.banned_at, banReason: r.ban_reason || '', createdAt: Date.parse(r.created_at) } : null;
}

export const WINDOWS = { day: 864e5, week: 6048e5, month: 2592e6, all: Infinity };

export function community(r) {
  return r ? { id: r.id, slug: r.slug, name: r.name, description: r.description || '', rules: r.rules || '', defaultKind: r.default_kind || 'text',
    creatorId: r.creator_id || null, isDefault: !!r.is_default, members: r.member_count ?? 0, posts: r.post_count ?? 0, createdAt: r.created_at ? Date.parse(r.created_at) : 0 } : null;
}
