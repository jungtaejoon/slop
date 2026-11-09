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
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
  grant usage on schema auth, storage, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);

const dir = 'supabase/migrations';
for (const f of readdirSync(dir).sort()) { await db.exec(readFileSync(`${dir}/${f}`, 'utf8')); ok(`migration ${f}`); }
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant select, insert, delete on storage.objects to authenticated;`);
if (existsSync('supabase/seed.sql')) {
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'));
  const { rows } = await db.query(`select cat, count(*)::int n from posts where is_example group by cat order by cat`);
  ok(`seed: ${rows.map((r) => `${r.cat}=${r.n}`).join(' ')}`);
}

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

const pid = (await as(U.a, `select create_post($1) id`, [JSON.stringify({ cat: 'web', kind: 'text', title: '테스트 글', body: '본문', tags: ['a', 'b'] })])).rows[0].id;
ok('member creates a post with v1');
await expectError('anonymous visitor cannot post', () => as(null, `select create_post('{"cat":"web","kind":"text","title":"x"}')`));
await expectError('bad board rejected', () => as(U.a, `select create_post('{"cat":"nope","kind":"text","title":"x"}')`));

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

const v2 = (await as(U.a, `select save_post_version($1, $2, $3) n`, [pid, JSON.stringify({ cat: 'web', title: '테스트 글 v2', body: '고침', note: '의견 반영' }), [c1]])).rows[0].n;
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
typeof stats.s.posts === 'number' && 'karma' in stats.p ? ok(`board_stats ${JSON.stringify(stats.s.boards)} / profile_stats ${JSON.stringify(stats.p)}`) : fail('stats');
(await as(U.a, `delete from posts where id = $1 returning id`, [pid])).rows.length === 1 ? ok('author deletes own post (cascade)') : fail('delete failed');

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
