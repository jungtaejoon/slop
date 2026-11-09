// Runs the Supabase migration and the seed in an in-memory Postgres (PGlite)
// against small stand-ins for Supabase's auth and storage schemas, then plays
// through the access rules as different users. Usage: npm run check:sql
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const db = new PGlite();
const ok = (m) => console.log('  ✓ ' + m);
let failures = 0;
const fail = (m) => { failures++; console.log('  ✗ ' + m); };

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', is_anonymous boolean not null default false);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, created_at timestamptz default now());
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
  grant usage on schema auth, storage, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);

// Apply migrations one by one. Between the first and the rest, insert a legacy
// post (old `cat` column) to prove the community migration carries data over.
const dir = 'supabase/migrations', files = readdirSync(dir).sort();
for (const [i, f] of files.entries()) {
  await db.exec(readFileSync(`${dir}/${f}`, 'utf8')); ok(`migration ${f}`);
  if (i === 0) await db.exec(`insert into posts (id, cat, kind, title, is_example) values ('11111111-1111-1111-1111-111111111111', 'game', 'text', 'legacy', true);`);
}
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant select, insert, delete on storage.objects to authenticated;`);
const legacy = (await db.query(`select c.slug from posts p join communities c on c.id = p.community_id where p.id = '11111111-1111-1111-1111-111111111111'`)).rows[0];
legacy?.slug === 'game' ? ok('legacy post moved into the "game" community') : fail('legacy post not migrated');
if (existsSync('supabase/seed.sql')) {
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'));
  const { rows } = await db.query(`select c.slug, count(*)::int n from posts p join communities c on c.id = p.community_id where p.is_example group by c.slug order by c.slug`);
  ok(`seed: ${rows.map((r) => `${r.slug}=${r.n}`).join(' ')}`);
}
const CID = Object.fromEntries((await db.query(`select slug, id from communities`)).rows.map((r) => [r.slug, r.id]));

const U = { a: '00000000-0000-0000-0000-00000000000a', b: '00000000-0000-0000-0000-00000000000b', m: '00000000-0000-0000-0000-00000000000c' };
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
  ('${U.a}', 'alice.kim@example.com', '{"full_name":"Alice"}'), ('${U.b}', 'b@example.com', '{}'), ('${U.m}', 'mod@example.com', '{}');
  update profiles set role = 'admin' where id = '${U.m}';`);
const names = (await db.query(`select username from profiles order by username`)).rows.map((r) => r.username);
names.includes('alicekim') && names.includes('userb') ? ok(`profiles created: ${names.join(', ')}`) : fail(`usernames ${names}`);

async function as(uid, sql, params) {
  await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`
                    : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
}
async function expectError(label, fn) { try { await fn(); fail(label + ' (was allowed)'); } catch { ok(label); } }

const pid = (await as(U.a, `select create_post($1) id`, [JSON.stringify({ community_id: CID.web, kind: 'text', title: '테스트 글', body: '본문', tags: ['a', 'b'] })])).rows[0].id;
ok('member creates a post with v1');
await expectError('anonymous visitor cannot post', () => as(null, `select create_post($1)`, [JSON.stringify({ community_id: CID.web, kind: 'text', title: 'x' })]));
await expectError('unknown community rejected', () => as(U.a, `select create_post('{"community_id":"00000000-0000-0000-0000-000000000099","kind":"text","title":"x"}')`));

const up = await as(U.b, `update posts set title = 'hijack' where id = $1 returning id`, [pid]);
up.rows.length === 0 ? ok("others can't edit a post directly") : fail('direct edit allowed');
await expectError("others can't save a version", () => as(U.b, `select save_post_version($1, '{"title":"x"}')`, [pid]));

const c1 = (await as(U.b, `insert into comments (post_id, text, flair) values ($1, '좋아요', 'improve') returning id`, [pid])).rows[0].id;
const c2 = (await as(U.a, `insert into comments (post_id, parent_id, text) values ($1, $2, '고마워요') returning id`, [pid, c1])).rows[0].id;
await as(U.b, `insert into post_votes (post_id, value) values ($1, 1)`, [pid]);
await as(U.a, `insert into comment_votes (comment_id, value) values ($1, -1)`, [c1]);
let p = (await db.query(`select up_count, down_count, comment_count from posts where id = $1`, [pid])).rows[0];
p.up_count === 1 && p.comment_count === 2 ? ok('vote and comment counters update') : fail(JSON.stringify(p));
const cc = (await db.query(`select down_count from comments where id = $1`, [c1])).rows[0];
cc.down_count === 1 ? ok('comment vote counter updates') : fail(JSON.stringify(cc));
const n = (await db.query(`select user_id, kind from notifications order by created_at`)).rows;
n.length === 2 && n[0].kind === 'comment' && n[1].kind === 'reply' ? ok('comment and reply notifications') : fail(JSON.stringify(n));
const votesSeen = (await as(U.a, `select * from post_votes`)).rows.length;
votesSeen === 0 ? ok("members can't see who voted") : fail('votes visible');

await as(U.a, `update comments set text = 'edited' where id = $1`, [c1]);
(await db.query(`select text from comments where id = $1`, [c1])).rows[0].text === '좋아요' ? ok("others' comment text is protected") : fail('comment text changed');
await as(U.b, `update comments set up_count = 99, hidden = true where id = $1`, [c1]);
const c1r = (await db.query(`select up_count, hidden from comments where id = $1`, [c1])).rows[0];
c1r.up_count === 0 && !c1r.hidden ? ok('counters and hidden flag are protected') : fail(JSON.stringify(c1r));

const v2 = (await as(U.a, `select save_post_version($1, $2, $3) n`, [pid, JSON.stringify({ title: '테스트 글 v2', body: '고침', note: '의견 반영' }), [c1]])).rows[0].n;
const res = (await db.query(`select resolved_in from comments where id = $1`, [c1])).rows[0].resolved_in;
v2 === 2 && res === 2 ? ok('author saves v2 and marks feedback resolved') : fail(`v2=${v2} resolved=${res}`);
(await db.query(`select count(*)::int n from notifications where kind = 'resolved'`)).rows[0].n === 1 ? ok('resolved notification') : fail('no resolved notification');

await as(U.b, `insert into reports (target_type, target_id, reason) values ('post', $1, '스팸·광고')`, [pid]);
(await as(U.a, `select * from reports`)).rows.length === 0 ? ok("members can't read others' reports") : fail('reports leaked');
(await as(U.m, `select * from reports`)).rows.length === 1 ? ok('moderator reads reports') : fail('mod cannot read reports');

await as(U.m, `update posts set hidden = true, hidden_reason = '스팸' where id = $1`, [pid]);
(await as(U.b, `select id from post_feed where id = $1`, [pid])).rows.length === 0 ? ok('hidden post invisible to others') : fail('hidden post visible');
(await as(U.a, `select id from post_feed where id = $1`, [pid])).rows.length === 1 ? ok('author still sees own hidden post') : fail('author lost post');
await as(U.m, `update posts set hidden = false, locked = true where id = $1`, [pid]);
await expectError('locked post refuses new comments', () => as(U.b, `insert into comments (post_id, text) values ($1, 'x')`, [pid]));

await as(U.m, `update profiles set banned_at = now(), ban_reason = '스팸' where id = $1`, [U.b]);
await expectError('banned member cannot vote', () => as(U.b, `insert into comment_votes (comment_id, value) values ($1, 1)`, [c2]));
await as(U.b, `update profiles set banned_at = null, role = 'admin' where id = $1`, [U.b]);
const pb = (await db.query(`select role, banned_at from profiles where id = $1`, [U.b])).rows[0];
pb.role === 'member' && pb.banned_at ? ok("members can't unban themselves or change role") : fail(JSON.stringify(pb));
await as(U.a, `update profiles set bio = '안녕' , role = 'admin' where id = $1`, [U.a]);
const pa = (await db.query(`select role, bio from profiles where id = $1`, [U.a])).rows[0];
pa.bio === '안녕' && pa.role === 'member' ? ok('members edit own bio only') : fail(JSON.stringify(pa));

await as(U.m, `update comments set deleted = true, text = '' where id = $1`, [c2]);
(await db.query(`select text, deleted from comments where id = $1`, [c2])).rows[0].deleted ? ok('moderator soft-deletes a comment') : fail('mod delete failed');
const stats = (await as(U.a, `select board_stats() s, profile_stats($1) p`, [U.a])).rows[0];
typeof stats.s.posts === 'number' && 'karma' in stats.p ? ok(`board_stats posts=${stats.s.posts} / profile_stats ${JSON.stringify(stats.p)}`) : fail('stats');
(await as(U.a, `delete from posts where id = $1 returning id`, [pid])).rows.length === 1 ? ok('author deletes own post (cascade)') : fail('delete failed');


// ---------------------------------------------------------------- communities
await db.exec(`update profiles set banned_at = null, ban_reason = '' where id = '${U.b}'`);
const follows = (await db.query(`select count(*)::int n from community_members where user_id = $1`, [U.a])).rows[0].n;
follows === 10 ? ok('new members follow the 10 default communities') : fail(`follows=${follows}`);
const aiId = (await as(U.a, `select create_community($1) id`, [JSON.stringify({ slug: 'ai-boardgame', name: 'AI 보드게임', description: 'AI가 만든 보드게임 규칙' })])).rows[0].id;
const cm = (await db.query(`select role from community_members where community_id = $1 and user_id = $2`, [aiId, U.a])).rows[0];
cm?.role === 'mod' ? ok('creator becomes the community moderator') : fail(JSON.stringify(cm));
await as(U.a, `select create_community($1)`, [JSON.stringify({ slug: 'second-one', name: '둘째' })]);
await expectError('third community in a day is refused', () => as(U.a, `select create_community($1)`, [JSON.stringify({ slug: 'third-one', name: '셋째' })]));
await expectError('reserved slug refused', () => as(U.b, `select create_community($1)`, [JSON.stringify({ slug: 'popular', name: 'x' })]));
await expectError('duplicate slug refused', () => as(U.b, `select create_community($1)`, [JSON.stringify({ slug: 'ai-boardgame', name: 'x' })]));
await as(U.b, `insert into community_members (community_id) values ($1)`, [aiId]);
(await db.query(`select member_count from communities where id = $1`, [aiId])).rows[0].member_count === 2 ? ok('follow updates member count') : fail('member count');
await expectError("members can't self-promote to mod", () => as(U.b, `insert into community_members (community_id, role) values ($1, 'mod')`, [CID.art]));
(await as(U.a, `select user_id from community_members where community_id = $1`, [CID.web])).rows.every((r) => r.user_id === U.a) ? ok("who follows what stays private") : fail('memberships leaked');

const bp = (await as(U.b, `select create_post($1) id`, [JSON.stringify({ community_id: aiId, kind: 'text', title: '룰북', body: 'x' })])).rows[0].id;
const otherP = (await as(U.b, `select create_post($1) id`, [JSON.stringify({ community_id: CID.idea, kind: 'text', title: '다른 곳', body: 'x' })])).rows[0].id;
(await db.query(`select post_count from communities where id = $1`, [aiId])).rows[0].post_count === 1 ? ok('post count follows posts') : fail('post count');
await as(U.a, `update posts set hidden = true, hidden_reason = '테스트', title = 'hacked' where id = $1`, [bp]);
const hp = (await db.query(`select hidden, title from posts where id = $1`, [bp])).rows[0];
hp.hidden && hp.title === '룰북' ? ok('community mod hides a post but cannot edit its content') : fail(JSON.stringify(hp));
await as(U.a, `update posts set hidden = true where id = $1`, [otherP]);
!(await db.query(`select hidden from posts where id = $1`, [otherP])).rows[0].hidden ? ok("community mod can't touch other communities") : fail('cross-community moderation');
await as(U.b, `insert into post_votes (post_id, value) values ($1, 1)`, [otherP]);
(await db.query(`select up_count from posts where id = $1`, [otherP])).rows[0].up_count === 1 ? ok('vote counters still work under the post guard') : fail('counter blocked');
await as(U.b, `insert into reports (target_type, target_id, reason) values ('post', $1, '스팸·광고')`, [otherP]);
await as(U.a, `insert into reports (target_type, target_id, reason) values ('post', $1, '스팸·광고')`, [otherP]);
(await as(U.a, `select id from reports where reporter_id <> $1`, [U.a])).rows.length === 0 ? ok("community mod doesn't see reports from other communities") : fail('report leak');
await as(U.a, `update communities set description = '새 설명', slug = 'renamed', member_count = 999 where id = $1`, [aiId]);
const cc2 = (await db.query(`select slug, description, member_count from communities where id = $1`, [aiId])).rows[0];
cc2.description === '새 설명' && cc2.slug === 'ai-boardgame' && cc2.member_count === 2 ? ok('community mod edits description only') : fail(JSON.stringify(cc2));
await as(U.b, `update communities set description = 'x' where id = $1`, [aiId]);
(await db.query(`select description from communities where id = $1`, [aiId])).rows[0].description === '새 설명' ? ok("non-mods can't edit a community") : fail('non-mod edit');
await as(U.a, `select set_community_mod($1, 'userb', true)`, [aiId]);
(await db.query(`select role from community_members where community_id = $1 and user_id = $2`, [aiId, U.b])).rows[0].role === 'mod' ? ok('mod adds a co-moderator') : fail('add mod');
const feed = (await as(U.b, `select id from post_feed where community_id in (select community_id from community_members where user_id = $1)`, [U.b])).rows.length;
feed > 0 ? ok(`home feed query returns ${feed} posts`) : fail('home feed empty');

// ---------------------------------------------------------------- guests (anonymous sign-in)
const G = '00000000-0000-0000-0000-0000000000e1';
await db.exec(`insert into auth.users (id, is_anonymous) values ('${G}', true)`);
const gp = (await db.query(`select username, is_guest, (select count(*)::int from community_members where user_id = $1) follows from profiles where id = $1`, [G])).rows[0];
gp?.is_guest && /^guest_[0-9a-f]{6}$/.test(gp.username) && gp.follows === 0 ? ok(`guest profile ${gp.username}, no default follows`) : fail(JSON.stringify(gp));
await as(G, `insert into post_votes (post_id, value) values ($1, 1)`, [otherP]);
(await db.query(`select up_count from posts where id = $1`, [otherP])).rows[0].up_count === 2 ? ok('guest can judge (vote)') : fail('guest vote not counted');
await expectError('guest cannot post', () => as(G, `select create_post($1)`, [JSON.stringify({ community_id: CID.web, kind: 'text', title: 'x' })]));
await expectError('guest cannot comment', () => as(G, `insert into comments (post_id, text) values ($1, 'x')`, [otherP]));
await expectError('guest cannot report', () => as(G, `insert into reports (target_type, target_id, reason) values ('post', $1, '기타')`, [otherP]));
await expectError('guest cannot follow', () => as(G, `insert into community_members (community_id) values ($1)`, [CID.art]));
await expectError('guest cannot create a community', () => as(G, `select create_community($1)`, [JSON.stringify({ slug: 'guest-made', name: 'x' })]));
await as(G, `update profiles set is_guest = false where id = $1`, [G]);
(await db.query(`select is_guest from profiles where id = $1`, [G])).rows[0].is_guest ? ok("guest can't clear their own guest flag") : fail('guest flag cleared by client');
await db.exec(`update auth.users set is_anonymous = false, email = 'g@example.com' where id = '${G}'`);
const gu = (await db.query(`select is_guest, (select count(*)::int from community_members where user_id = $1) follows from profiles where id = $1`, [G])).rows[0];
!gu.is_guest && gu.follows === 10 ? ok('guest who links an email becomes a member and follows the defaults') : fail(JSON.stringify(gu));

// ---------------------------------------------------------------- image URLs
await expectError('javascript: image URL refused', () => as(U.b, `select create_post($1)`, [JSON.stringify({ community_id: CID.art, kind: 'image', title: 'x', images: ['javascript:alert(1)'] })]));
await expectError('data: image URL refused on edit', () => as(U.b, `select save_post_version($1, $2)`, [otherP, JSON.stringify({ title: 'x', images: ['data:text/html,x'] })]));
await as(U.b, `select create_post($1)`, [JSON.stringify({ community_id: CID.art, kind: 'image', title: 'imgs', images: ['https://x.supabase.co/a.png', 'examples/art.svg'] })]);
ok('https and same-site image paths accepted');

// ---------------------------------------------------------------- rate limits
let made = 0;
try { for (let i = 0; i < 12; i++) { await as(U.a, `select create_post($1)`, [JSON.stringify({ community_id: CID.web, kind: 'text', title: 'burst ' + i })]); made++; } } catch { /* limit reached */ }
const aRecent = (await db.query(`select count(*)::int n from posts where author_id = $1 and created_at > now() - interval '1 hour'`, [U.a])).rows[0].n;
aRecent === 10 ? ok(`post limit: stops at 10 per hour (made ${made} in the burst)`) : fail(`posts in the last hour: ${aRecent}`);
let cmade = 0;
try { for (let i = 0; i < 25; i++) { await as(U.b, `insert into comments (post_id, text) values ($1, $2)`, [otherP, 'c' + i]); cmade++; } } catch { /* limit */ }
const bRecent = (await db.query(`select count(*)::int n from comments where author_id = $1 and created_at > now() - interval '10 minutes'`, [U.b])).rows[0].n;
bRecent === 20 ? ok(`comment limit: stops at 20 per 10 minutes`) : fail(`comments in 10 min: ${bRecent}`);
const modBurst = (await as(U.m, `select create_post($1) id`, [JSON.stringify({ community_id: CID.web, kind: 'text', title: 'mod post' })])).rows.length;
modBurst === 1 ? ok('moderators are not post-limited') : fail('mod limited');

// ---------------------------------------------------------------- sidebar stats per language
const ls = (await as(null, `select (board_stats(null, 'ko')->>'posts')::int ko, (board_stats(null, 'en')->>'posts')::int en, (board_stats()->>'posts')::int total`)).rows[0];
ls.ko + ls.en === ls.total && ls.ko > 0 && ls.en > 0 ? ok(`board_stats by language: ko=${ls.ko} en=${ls.en} total=${ls.total}`) : fail(JSON.stringify(ls));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
